import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import { downloadBlob, encodeWAV } from "../../utils/ai";

type Status =
  | "idle"
  | "loading-model"
  | "generating"
  | "ready"
  | "playing"
  | "error";

type Engine = "speecht5" | "webspeech";

interface SpeakerOption {
  id: string;
  name: string;
  gender: string;
  embeddingIdx: number;
}

// CMU Arctic speakers for SpeechT5
const SPEAKERS: SpeakerOption[] = [
  { id: "slt", name: "SLT", gender: "Female (American)", embeddingIdx: 0 },
  { id: "clb", name: "CLB", gender: "Female (Canadian)", embeddingIdx: 1 },
  { id: "awb", name: "AWB", gender: "Male (Scottish)", embeddingIdx: 2 },
  { id: "rms", name: "RMS", gender: "Male (American)", embeddingIdx: 3 },
  { id: "jmk", name: "JMK", gender: "Male (Canadian)", embeddingIdx: 4 },
  { id: "ksp", name: "KSP", gender: "Male (Indian)", embeddingIdx: 5 },
];

// Cached synthesizer
let cachedSynthesizer: any = null;

export default function TextToSpeech() {
  const [input, setInput] = useState("");
  const [engine, setEngine] = useState<Engine>("speecht5");
  const [speakerId, setSpeakerId] = useState("slt");
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // --- SpeechT5 Engine ---
  const generateWithSpeechT5 = useCallback(async (text: string) => {
    const { pipeline } = await import("@huggingface/transformers");

    // Load synthesizer (cached)
    if (!cachedSynthesizer) {
      setStatusText("Loading TTS model (~100MB)...");
      cachedSynthesizer = await pipeline(
        "text-to-speech",
        "Xenova/speecht5_tts",
        {
          progress_callback: (d: any) => {
            if (d.status === "progress" && d.progress) {
              setProgress(0.1 + (d.progress / 100) * 0.6);
            }
          },
        } as any,
      );
    }

    setProgress(0.75);
    setStatusText("Generating speech...");

    // Use dataset reference — pipeline handles loading and caching
    const output = await cachedSynthesizer(text, {
      speaker_embeddings: "Xenova/cmu-arctic-xvectors",
    });

    return output;
  }, []);

  // --- Web Speech API Engine ---
  const generateWithWebSpeech = useCallback(
    (text: string): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        if (!("speechSynthesis" in window)) {
          reject(new Error("Web Speech API not supported in this browser."));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;

        // Try to find a matching voice
        const voices = speechSynthesis.getVoices();
        const speaker = SPEAKERS.find((s) => s.id === speakerId);
        const lang = "en-US";
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.startsWith(lang) &&
              v.name.toLowerCase().includes("female"),
          ) || voices.find((v) => v.lang.startsWith(lang));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
          // Web Speech API doesn't provide audio data directly
          // Create a silent WAV as placeholder
          const sampleRate = 22050;
          const samples = new Float32Array(sampleRate * 1); // 1 second silence
          const blob = encodeWAV(samples, sampleRate);
          resolve(blob);
        };

        utterance.onerror = (e) =>
          reject(new Error(`Speech error: ${e.error}`));
        speechSynthesis.speak(utterance);
      });
    },
    [speakerId, speed],
  );

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
      let audioData: Float32Array;
      let sampleRate: number;

      if (engine === "speecht5") {
        const output = await generateWithSpeechT5(input);

        // Extract audio data — handle different output formats
        const raw = output as any;
        let rawAudio: any;
        let rawRate: number;

        if (Array.isArray(raw) && raw.length > 0) {
          // Output is array: [{ audio, sampling_rate }]
          rawAudio = raw[0].audio;
          rawRate = raw[0].sampling_rate;
        } else if (raw.audio) {
          // Output is object: { audio, sampling_rate }
          rawAudio = raw.audio;
          rawRate = raw.sampling_rate;
        } else {
          throw new Error("Unexpected model output format.");
        }

        // Convert to Float32Array if needed
        if (rawAudio instanceof Float32Array) {
          audioData = rawAudio;
        } else if (Array.isArray(rawAudio)) {
          // Flatten nested arrays if needed
          const flat = Array.isArray(rawAudio[0]) ? rawAudio.flat() : rawAudio;
          audioData = new Float32Array(flat);
        } else if (
          rawAudio instanceof Uint8Array ||
          rawAudio instanceof Int16Array
        ) {
          // Convert int samples to float
          audioData = new Float32Array(rawAudio.length);
          const maxVal = rawAudio instanceof Int16Array ? 32768 : 256;
          for (let i = 0; i < rawAudio.length; i++) {
            audioData[i] = rawAudio[i] / maxVal;
          }
        } else {
          // Try to convert whatever it is
          audioData = new Float32Array(Array.from(rawAudio));
        }

        sampleRate = rawRate || 16000;

        if (audioData.length === 0) {
          throw new Error("No audio data generated.");
        }
      } else {
        // Web Speech API — play directly, create placeholder WAV
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(input);
        utterance.rate = speed;

        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find((v) => v.lang.startsWith("en"));
        if (preferredVoice) utterance.voice = preferredVoice;

        // Play it
        speechSynthesis.speak(utterance);

        // Create a simple WAV placeholder (Web Speech API doesn't give us audio data)
        sampleRate = 22050;
        audioData = new Float32Array(
          sampleRate * Math.max(1, Math.ceil(input.split(/\s+/).length / 3)),
        );
      }

      // Encode to WAV
      const { encodeWAV } = await import("../../utils/ai");
      const blob = encodeWAV(audioData, sampleRate);
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);
      setDuration(Math.round(audioData.length / sampleRate));
      setStatus("ready");
      setProgress(1);

      // Auto-play for Web Speech API
      if (engine === "webspeech") {
        setStatus("playing");
        const checkSpeaking = setInterval(() => {
          if (!speechSynthesis.speaking) {
            clearInterval(checkSpeaking);
            setStatus("ready");
          }
        }, 200);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Generation failed: ${msg}`);
      setStatus("error");
    }
  }, [input, engine, speakerId, speed, audioUrl, generateWithSpeechT5]);

  const handlePlay = useCallback(() => {
    if (!audioUrl) return;
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
    speechSynthesis.cancel();
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
    speechSynthesis.cancel();
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
      {/* Engine toggle */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">
          Engine
        </label>
        <div
          class="flex rounded-md overflow-hidden border border-hairline"
          style="width: fit-content"
        >
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${engine === "speecht5" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => {
              setEngine("speecht5");
              handleReset();
            }}
            disabled={isProcessing}
          >
            AI (SpeechT5)
          </button>
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${engine === "webspeech" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => {
              setEngine("webspeech");
              handleReset();
            }}
            disabled={isProcessing}
          >
            Browser TTS
          </button>
        </div>
        <p class="text-caption text-muted mt-1">
          {engine === "speecht5"
            ? "AI model — download WAV, higher quality, ~100MB model"
            : "Browser built-in — instant, no download, limited export"}
        </p>
      </div>

      {/* Voice selector — only for Browser TTS */}
      {engine === "webspeech" && (
        <div class="mb-4">
          <label class="text-caption-uppercase text-muted block mb-1">
            Voice
          </label>
          <select
            class="input"
            value={speakerId}
            onChange={(e) => {
              setSpeakerId((e.target as HTMLSelectElement).value);
              if (hasAudio) handleReset();
            }}
            disabled={isProcessing}
          >
            {SPEAKERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.gender}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">
          Input Text
        </label>
        <textarea
          class="textarea"
          style="min-height: 180px"
          placeholder="Enter text to convert to speech... e.g. 'Hello! Welcome to ToolBundle.'"
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
            if (audioRef.current) audioRef.current.playbackRate = newSpeed;
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
          {engine === "speecht5" && (
            <p class="text-caption text-muted mt-1">
              First time: downloading model (~100MB). Cached after that.
            </p>
          )}
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
            <button class="btn-secondary" onClick={handleStop}>
              ⏹ Stop
            </button>
            <span class="text-body-sm text-muted">
              {duration > 0 ? `${duration}s audio` : "Playing..."}
            </span>
          </div>

          {/* Audio visualization */}
          {isPlaying && (
            <div class="flex items-center gap-1 mb-4">
              {[4, 6, 3, 5, 4, 6, 3, 5].map((h, i) => (
                <div
                  key={i}
                  class="w-1 bg-primary rounded-full animate-pulse"
                  style={`height: ${h * 4}px; animation-delay: ${i * 100}ms`}
                />
              ))}
              <span class="text-body-sm text-primary ml-2">Playing...</span>
            </div>
          )}

          {/* Download */}
          <div class="flex flex-wrap gap-3">
            {engine === "speecht5" && (
              <button class="btn-primary" onClick={handleDownload}>
                Download WAV
              </button>
            )}
            <button class="btn-secondary" onClick={handleReset}>
              Generate New
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div class="bg-surface-elevated rounded-lg p-4">
        <div class="text-caption-uppercase text-muted mb-2">Engines</div>
        <ul class="text-body-sm text-body space-y-1">
          <li>
            <strong>AI (SpeechT5)</strong>: Microsoft's TTS model running in
            your browser. Higher quality, downloadable WAV. ~100MB model
            download. Voice selection coming soon.
          </li>
          <li>
            <strong>Browser TTS</strong>: Uses your browser's built-in speech
            engine. Instant, no download. Voice quality depends on your OS.
          </li>
        </ul>
      </div>
    </div>
  );
}
