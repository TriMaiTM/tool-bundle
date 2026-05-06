import { useState, useCallback, useEffect, useRef } from "preact/hooks";

type Status =
  | "idle"
  | "loading-model"
  | "generating"
  | "ready"
  | "playing"
  | "error";

import { downloadBlob } from "../../utils/ai";

export default function TextToSpeech() {
  const [input, setInput] = useState("");
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [audioUrl]);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setStatus("loading-model");
    setProgress(0);

    try {
      const { pipeline } = await import("@huggingface/transformers");

      setStatus("loading-model");
      setProgress(0.1);
      setStatusText("Loading TTS model (~100MB)...");

      const synthesizer = await pipeline(
        "text-to-speech",
        "Xenova/speecht5_tts",
        {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.1 + (progressData.progress / 100) * 0.6);
            } else if (progressData.status === "done") {
              setProgress(0.7);
            }
          },
        } as any,
      );

      setStatus("generating");
      setProgress(0.75);
      setStatusText("Generating speech...");

      // Speaker embeddings from CMU Arctic dataset
      const speakerEmbeddings = "Xenova/cmu-arctic-xvectors";

      const output = await synthesizer(input, {
        speaker_embeddings: speakerEmbeddings,
      });

      const audioData = (output as any).audio as Float32Array;
      const sampleRate = (output as any).sampling_rate as number;

      if (!audioData || audioData.length === 0) {
        throw new Error("No audio data generated.");
      }

      // Convert to WAV blob
      const { encodeWAV } = await import("../../utils/ai");
      const blob = encodeWAV(audioData, sampleRate);
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);
      setDuration(Math.round(audioData.length / sampleRate));
      setStatus("ready");
      setProgress(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Generation failed: ${msg}`);
      setStatus("error");
    }
  }, [input]);

  const handlePlay = useCallback(() => {
    if (!audioUrl) return;
    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = speed;

    audio.onplay = () => setStatus("playing");
    audio.onended = () => setStatus("ready");
    audio.onerror = () => {
      setStatus("ready");
      setError("Playback error.");
    };

    audio.play();
  }, [audioUrl, speed]);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setStatus("playing");
      } else {
        audioRef.current.pause();
        setStatus("ready");
      }
    }
  }, []);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setStatus("ready");
  }, []);

  const handleDownload = useCallback(() => {
    if (!audioBlob) return;
    downloadBlob(audioBlob, "speech.wav");
  }, [audioBlob]);

  const handleReset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setStatus("idle");
    setProgress(0);
  }, [audioUrl]);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const isProcessing = status === "loading-model" || status === "generating";
  const isPlaying = status === "playing";
  const hasAudio = status === "ready" || status === "playing";

  return (
    <div>
      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">
          Input Text
        </label>
        <textarea
          class="textarea"
          style="min-height: 180px"
          placeholder="Enter text to convert to speech... e.g. 'Hello! Welcome to ToolBundle, the best free online tool collection.'"
          value={input}
          onInput={(e) => {
            setInput((e.target as HTMLTextAreaElement).value);
            if (hasAudio) handleReset();
          }}
          disabled={isProcessing}
        />
        <div class="text-caption text-muted mt-1">{wordCount} words</div>
      </div>

      {/* Speed control */}
      <div class="mb-6">
        <label class="text-caption-uppercase text-muted block mb-1">
          Speed: {speed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onInput={(e) => {
            const newSpeed = Number((e.target as HTMLInputElement).value);
            setSpeed(newSpeed);
            if (audioRef.current) {
              audioRef.current.playbackRate = newSpeed;
            }
          }}
          class="w-full"
          style="max-width: 300px"
        />
        <div
          class="flex justify-between text-caption text-muted"
          style="max-width: 300px"
        >
          <span>0.5x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Generate button */}
      {!hasAudio && (
        <div class="mb-4">
          <button
            class="btn-primary"
            onClick={handleGenerate}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? "Generating..." : "Generate Speech"}
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
            First time: downloading TTS model (~100MB). Cached after that.
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

      {/* Audio player */}
      {hasAudio && (
        <div class="card mb-4">
          <div class="flex items-center gap-4 mb-4">
            {/* Play/Pause button */}
            {!isPlaying ? (
              <button
                class="btn-primary"
                onClick={handlePlay}
                style="min-width: 100px"
              >
                ▶ Play
              </button>
            ) : (
              <button
                class="btn-secondary"
                onClick={handlePause}
                style="min-width: 100px"
              >
                ⏸ Pause
              </button>
            )}

            {/* Stop button */}
            <button class="btn-secondary" onClick={handleStop}>
              ⏹ Stop
            </button>

            {/* Duration */}
            <span class="text-body-sm text-muted">
              {duration}s audio generated
            </span>
          </div>

          {/* Audio visualization */}
          {isPlaying && (
            <div class="flex items-center gap-1 mb-4">
              <div
                class="w-1 h-4 bg-primary rounded-full animate-pulse"
                style="animation-delay: 0ms"
              />
              <div
                class="w-1 h-6 bg-primary rounded-full animate-pulse"
                style="animation-delay: 100ms"
              />
              <div
                class="w-1 h-3 bg-primary rounded-full animate-pulse"
                style="animation-delay: 200ms"
              />
              <div
                class="w-1 h-5 bg-primary rounded-full animate-pulse"
                style="animation-delay: 300ms"
              />
              <div
                class="w-1 h-4 bg-primary rounded-full animate-pulse"
                style="animation-delay: 400ms"
              />
              <div
                class="w-1 h-6 bg-primary rounded-full animate-pulse"
                style="animation-delay: 500ms"
              />
              <div
                class="w-1 h-3 bg-primary rounded-full animate-pulse"
                style="animation-delay: 600ms"
              />
              <div
                class="w-1 h-5 bg-primary rounded-full animate-pulse"
                style="animation-delay: 700ms"
              />
              <span class="text-body-sm text-primary ml-2">Playing...</span>
            </div>
          )}

          {/* Download */}
          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleDownload}>
              Download WAV
            </button>
            <button class="btn-secondary" onClick={handleReset}>
              Generate New
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div class="bg-surface-elevated rounded-lg p-4">
        <div class="text-caption-uppercase text-muted mb-2">How it works</div>
        <ul class="text-body-sm text-body space-y-1">
          <li>
            • Uses Microsoft SpeechT5 AI model running 100% in your browser
          </li>
          <li>
            • Downloads ~100MB model on first use, cached in IndexedDB after
            that
          </li>
          <li>
            • Generates high-quality WAV audio that you can download and use
            anywhere
          </li>
          <li>
            • Supports English text — for best results, use natural sentences
          </li>
        </ul>
      </div>
    </div>
  );
}
