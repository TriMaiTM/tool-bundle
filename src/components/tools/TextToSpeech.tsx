import { useState, useCallback, useEffect, useRef } from "preact/hooks";

interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

export default function TextToSpeech() {
  const [input, setInput] = useState("");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length === 0) return;
      const mapped = available.map((v) => ({
        name: v.name,
        lang: v.lang,
        voice: v,
      }));
      setVoices(mapped);
      // Default to English voice
      const enIdx = mapped.findIndex((v) => v.lang.startsWith("en"));
      if (enIdx >= 0) setSelectedVoiceIdx(enIdx);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = useCallback(() => {
    if (!input.trim()) return;
    speechSynthesis.cancel();
    setError(null);

    const utterance = new SpeechSynthesisUtterance(input);
    const voice = voices[selectedVoiceIdx]?.voice;
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = (e) => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (e.error !== "canceled") setError(`Speech error: ${e.error}`);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [input, voices, selectedVoiceIdx, rate, pitch, volume]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    } else {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleStop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const estimatedTime = wordCount > 0 ? Math.ceil(wordCount / (150 * rate)) : 0;

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
          placeholder="Enter text to speak... e.g. 'Hello! Welcome to ToolBundle, the best free online tool collection.'"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
        <div class="flex items-center gap-3 mt-1">
          <span class="text-caption text-muted">{wordCount} words</span>
          {estimatedTime > 0 && (
            <span class="text-caption text-muted">≈ {estimatedTime}s estimated</span>
          )}
        </div>
      </div>

      {/* Voice selector */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-1">
          Voice
        </label>
        <select
          class="input"
          value={selectedVoiceIdx}
          onChange={(e) => setSelectedVoiceIdx(Number((e.target as HTMLSelectElement).value))}
          disabled={voices.length === 0}
        >
          {voices.length === 0 && <option>Loading voices...</option>}
          {voices.map((v, i) => (
            <option key={i} value={i}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Controls: Rate, Pitch, Volume */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">
            Speed: {rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={rate}
            onInput={(e) => setRate(Number((e.target as HTMLInputElement).value))}
            class="w-full"
          />
          <div class="flex justify-between text-caption text-muted">
            <span>0.25x</span>
            <span>4x</span>
          </div>
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">
            Pitch: {pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={pitch}
            onInput={(e) => setPitch(Number((e.target as HTMLInputElement).value))}
            class="w-full"
          />
          <div class="flex justify-between text-caption text-muted">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onInput={(e) => setVolume(Number((e.target as HTMLInputElement).value))}
            class="w-full"
          />
          <div class="flex justify-between text-caption text-muted">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div class="flex flex-wrap gap-3 mb-4">
        {!isSpeaking ? (
          <button
            class="btn-primary"
            onClick={handleSpeak}
            disabled={!input.trim() || voices.length === 0}
          >
            ▶ Speak
          </button>
        ) : (
          <>
            <button class="btn-secondary" onClick={handlePause}>
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button class="btn-secondary" onClick={handleStop}>
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div class="bg-surface-elevated rounded-lg p-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="flex gap-1">
              <div class="w-1 h-4 bg-primary rounded-full animate-pulse" style="animation-delay: 0ms" />
              <div class="w-1 h-6 bg-primary rounded-full animate-pulse" style="animation-delay: 150ms" />
              <div class="w-1 h-3 bg-primary rounded-full animate-pulse" style="animation-delay: 300ms" />
              <div class="w-1 h-5 bg-primary rounded-full animate-pulse" style="animation-delay: 450ms" />
              <div class="w-1 h-4 bg-primary rounded-full animate-pulse" style="animation-delay: 600ms" />
            </div>
            <span class="text-body-sm text-body">
              {isPaused ? "Paused" : "Speaking..."}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
          <p class="text-body-sm text-accent-rose">{error}</p>
        </div>
      )}

      {/* Info */}
      <div class="bg-surface-elevated rounded-lg p-4">
        <div class="text-caption-uppercase text-muted mb-2">How it works</div>
        <ul class="text-body-sm text-body space-y-1">
          <li>• Uses your browser's built-in Text-to-Speech engine</li>
          <li>• No model download needed — instant processing</li>
          <li>• Available voices depend on your OS and browser</li>
          <li>• Works best with English voices on Chrome, Edge, and Safari</li>
        </ul>
      </div>
    </div>
  );
}
