import { useState, useCallback, useRef, useEffect } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";
type InputMode = "file" | "microphone";

export default function SpeechToText() {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleFileSelect = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      setFile(input.files[0]);
      setResult("");
      setError(null);
      setStatus("idle");
      setRecordedBlob(null);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setResult("");
      setError(null);
      setStatus("idle");
      setFile(null);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleTranscribe = useCallback(async () => {
    const audioSource = mode === "file" ? file : recordedBlob;
    if (!audioSource) return;

    setStatus("loading-model");
    setProgress(0);
    setError(null);
    setResult("");
    setCopied(false);

    try {
      const { pipeline } = await import("@huggingface/transformers");

      setStatus("loading-model");
      setProgress(0.1);
      setStatusText("Loading Whisper model (~75MB)...");

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
        {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.1 + (progressData.progress / 100) * 0.7);
            } else if (progressData.status === "done") {
              setProgress(0.8);
            }
          },
        } as any,
      );

      setStatus("processing");
      setProgress(0.85);
      setStatusText("Transcribing audio...");

      // Convert blob/file to audio buffer
      const arrayBuffer = await audioSource.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Get mono channel data (Whisper expects 16kHz mono)
      let audioData: Float32Array;
      if (audioBuffer.numberOfChannels === 1) {
        audioData = audioBuffer.getChannelData(0);
      } else {
        // Mix down to mono
        const ch0 = audioBuffer.getChannelData(0);
        const ch1 = audioBuffer.getChannelData(1);
        audioData = new Float32Array(ch0.length);
        for (let i = 0; i < ch0.length; i++) {
          audioData[i] = (ch0[i] + ch1[i]) / 2;
        }
      }

      // Resample to 16kHz if needed
      if (audioBuffer.sampleRate !== 16000) {
        const ratio = 16000 / audioBuffer.sampleRate;
        const newLength = Math.round(audioData.length * ratio);
        const resampled = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          const srcIdx = i / ratio;
          const lo = Math.floor(srcIdx);
          const hi = Math.min(lo + 1, audioData.length - 1);
          const frac = srcIdx - lo;
          resampled[i] = audioData[lo] * (1 - frac) + audioData[hi] * frac;
        }
        audioData = resampled;
      }

      const output = await transcriber(audioData);
      const text = (output as any).text || "";
      setResult(text || "(No speech detected)");
      setStatus("done");
      setProgress(1);
      audioCtx.close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Transcription failed: ${msg}`);
      setStatus("error");
    }
  }, [mode, file, recordedBlob]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [result]);

  const handleReset = useCallback(() => {
    setFile(null);
    setRecordedBlob(null);
    setResult("");
    setError(null);
    setStatus("idle");
    setProgress(0);
    setCopied(false);
    setRecordingTime(0);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isProcessing = status === "loading-model" || status === "processing";
  const hasAudio = mode === "file" ? !!file : !!recordedBlob;

  return (
    <div>
      {/* Mode toggle */}
      <div class="flex rounded-md overflow-hidden border border-hairline mb-6" style="width: fit-content">
        <button
          class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "file" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
          onClick={() => { setMode("file"); handleReset(); }}
          disabled={isProcessing}
        >
          Upload File
        </button>
        <button
          class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "microphone" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
          onClick={() => { setMode("microphone"); handleReset(); }}
          disabled={isProcessing}
        >
          Record Microphone
        </button>
      </div>

      {/* File upload mode */}
      {mode === "file" && (
        <div class="mb-4">
          <label class="text-caption-uppercase text-muted block mb-2">
            Audio File
          </label>
          <div class="drop-zone" style="padding: 24px">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
              onChange={handleFileSelect}
              class="hidden"
              id="audio-file-input"
            />
            <label for="audio-file-input" class="cursor-pointer text-body-sm text-primary hover:text-primary-active">
              Click to select audio file
            </label>
            <p class="text-caption text-muted mt-1">MP3, WAV, M4A, OGG, WebM — up to 100MB</p>
          </div>
          {file && (
            <div class="mt-3 bg-surface-elevated rounded-lg p-3 flex items-center gap-3">
              <span class="text-body-sm text-on-dark flex-1 truncate">{file.name}</span>
              <span class="text-caption text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button class="text-body-sm text-accent-rose" onClick={handleReset}>Remove</button>
            </div>
          )}
        </div>
      )}

      {/* Microphone mode */}
      {mode === "microphone" && (
        <div class="mb-4">
          <label class="text-caption-uppercase text-muted block mb-2">
            Record Audio
          </label>
          <div class="bg-surface-elevated rounded-lg p-6 text-center">
            {!isRecording && !recordedBlob && (
              <div>
                <button
                  class="btn-primary"
                  onClick={startRecording}
                  disabled={isProcessing}
                >
                  🎙 Start Recording
                </button>
                <p class="text-caption text-muted mt-2">Click to start recording from your microphone</p>
              </div>
            )}
            {isRecording && (
              <div>
                <div class="text-display-sm text-accent-rose mb-2" style="font-variant-numeric: tabular-nums">
                  {formatTime(recordingTime)}
                </div>
                <div class="flex items-center justify-center gap-2 mb-3">
                  <div class="w-3 h-3 rounded-full bg-accent-rose animate-pulse" />
                  <span class="text-body-sm text-accent-rose">Recording...</span>
                </div>
                <button class="btn-secondary" onClick={stopRecording}>
                  ⏹ Stop Recording
                </button>
              </div>
            )}
            {!isRecording && recordedBlob && (
              <div>
                <div class="text-body-sm text-muted mb-2">
                  Recorded: {formatTime(recordingTime)} — {(recordedBlob.size / 1024).toFixed(0)} KB
                </div>
                <div class="flex justify-center gap-3">
                  <button class="btn-secondary" onClick={startRecording}>
                    🔄 Re-record
                  </button>
                  <button class="btn-secondary text-accent-rose" onClick={handleReset}>
                    ✕ Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action */}
      {hasAudio && status !== "done" && (
        <div class="mb-4">
          <button
            class="btn-primary"
            onClick={handleTranscribe}
            disabled={isProcessing}
          >
            {isProcessing ? "Transcribing..." : "Transcribe Audio"}
          </button>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-body-sm text-body">{statusText}</span>
            <span class="text-body-sm text-primary font-mono">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
            <div
              class="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p class="text-caption text-muted mt-1">
            First time: downloading Whisper model (~75MB). Cached after that.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
          <p class="text-body-sm text-accent-rose">{error}</p>
          <button
            class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
            onClick={handleReset}
          >
            Try again
          </button>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-caption-uppercase text-muted">Transcription</span>
            <span class="badge badge-yellow">
              {result.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-caption-uppercase text-muted">Output</label>
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              class="textarea"
              style="min-height: 200px"
              value={result}
              readOnly
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button class="btn-secondary" onClick={() => {
              const blob = new Blob([result], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "transcription.txt";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
              Download as .txt
            </button>
            <button class="btn-secondary" onClick={handleReset}>
              Transcribe Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
