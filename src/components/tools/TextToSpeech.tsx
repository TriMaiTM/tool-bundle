import { useCallback, useEffect, useRef, useState } from "preact/hooks";

interface VoiceOption {
	id: string;
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
	const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
	const [currentWord, setCurrentWord] = useState(-1);
	const [error, setError] = useState<string | null>(null);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	// Load available voices
	useEffect(() => {
		const loadVoices = () => {
			const available = speechSynthesis.getVoices();
			if (available.length === 0) return;

			const mapped = available.map((v, i) => ({
				id: `${v.name}-${v.lang}-${i}`,
				name: v.name,
				lang: v.lang,
				voice: v,
			}));
			setVoices(mapped);

			// Default to first English voice
			const enIdx = mapped.findIndex((v) => v.lang.startsWith("en"));
			if (enIdx >= 0) setSelectedVoiceIdx(enIdx);
		};

		loadVoices();
		speechSynthesis.onvoiceschanged = loadVoices;
		return () => {
			speechSynthesis.onvoiceschanged = null;
		};
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			speechSynthesis.cancel();
		};
	}, []);

	const handlePlay = useCallback(() => {
		if (!input.trim()) return;
		speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(input);
		const voice = voices[selectedVoiceIdx]?.voice;
		if (voice) utterance.voice = voice;
		utterance.rate = rate;
		utterance.pitch = pitch;
		utterance.volume = volume;

		// Word highlighting via boundary events
		utterance.onboundary = (e) => {
			if (e.name === "word") {
				const textBefore = input.substring(0, e.charIndex);
				const wordIndex = textBefore.split(/\s+/).filter(Boolean).length;
				setCurrentWord(wordIndex);
			}
		};

		utterance.onstart = () => {
			setStatus("playing");
			setError(null);
		};
		utterance.onend = () => {
			setStatus("idle");
			setCurrentWord(-1);
		};
		utterance.onerror = (e) => {
			if (e.error !== "canceled") {
				setError(`Speech error: ${e.error}`);
			}
			setStatus("idle");
		};

		utteranceRef.current = utterance;
		speechSynthesis.speak(utterance);
	}, [input, voices, selectedVoiceIdx, rate, pitch, volume]);

	const handlePause = useCallback(() => {
		if (speechSynthesis.speaking) {
			if (speechSynthesis.paused) {
				speechSynthesis.resume();
				setStatus("playing");
			} else {
				speechSynthesis.pause();
				setStatus("paused");
			}
		}
	}, []);

	const handleStop = useCallback(() => {
		speechSynthesis.cancel();
		setStatus("idle");
		setCurrentWord(-1);
	}, []);

	const wordCount = input.trim() ? input.trim().split(/\s+/).filter(Boolean).length : 0;
	const estimatedTime = wordCount > 0 ? Math.ceil(wordCount / (150 * rate)) : 0;

	// Build highlighted text
	const words = input.split(/(\s+)/);

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Enter Text</label>
				<textarea
					class="textarea"
					style="min-height: 180px"
					placeholder="Type or paste text here... e.g. 'Hello! Welcome to ToolBundle, the best free online tool collection.'"
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
				<div class="flex items-center gap-3 mt-1">
					<span class="text-caption text-muted">{input.length} characters</span>
					{estimatedTime > 0 && (
						<span class="text-caption text-muted">Est. duration: {estimatedTime}s</span>
					)}
				</div>
			</div>

			{/* Voice selector */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-1">Voice</label>
				<select
					class="input"
					value={selectedVoiceIdx}
					onChange={(e) => setSelectedVoiceIdx(Number((e.target as HTMLSelectElement).value))}
					disabled={voices.length === 0}
				>
					{voices.length === 0 && <option>Loading voices...</option>}
					{voices.map((v, i) => (
						<option key={v.id} value={i}>
							{v.name} ({v.lang})
						</option>
					))}
				</select>
				<p class="text-caption text-muted mt-1">{voices.length} voices available</p>
			</div>

			{/* Controls: Speed, Pitch, Volume */}
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
						<span>4.0x</span>
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
			<div class="flex flex-wrap gap-3 mb-6">
				{status === "playing" ? (
					<>
						<button class="btn-primary" onClick={handlePause}>
							Pause
						</button>
						<button class="btn-secondary" onClick={handleStop}>
							Stop
						</button>
					</>
				) : status === "paused" ? (
					<>
						<button class="btn-primary" onClick={handlePause}>
							Resume
						</button>
						<button class="btn-secondary" onClick={handleStop}>
							Stop
						</button>
					</>
				) : (
					<button
						class="btn-primary"
						onClick={handlePlay}
						disabled={!input.trim() || voices.length === 0}
					>
						Play
					</button>
				)}
			</div>

			{/* Word highlighting */}
			{status !== "idle" && input.trim() && (
				<div class="card mb-4">
					<div class="text-caption-uppercase text-muted mb-2">Now Speaking</div>
					<p class="text-body-md text-on-dark leading-relaxed">
						{words.map((word, i) => {
							if (/^\s+$/.test(word)) return <span key={i}>{word}</span>;
							const wordIdx = Math.floor(i / 2);
							const isActive = wordIdx === currentWord;
							return (
								<span
									key={i}
									class={`transition-colors duration-150 ${
										isActive ? "bg-primary text-on-primary px-0.5 rounded" : "text-body"
									}`}
								>
									{word}
								</span>
							);
						})}
					</p>
				</div>
			)}

			{/* Status */}
			<div class="bg-surface-elevated rounded-lg p-4">
				<div class="text-body-sm text-muted">
					{status === "playing" && "Speaking..."}
					{status === "paused" && "Paused"}
					{status === "idle" && !input.trim() && "Ready — enter text and press Play"}
					{status === "idle" && input.trim() && "Ready — press Play to hear your text"}
				</div>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mt-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* Info */}
			<div class="bg-surface-elevated rounded-lg p-4 mt-4">
				<div class="text-caption-uppercase text-muted mb-2">How it works</div>
				<ul class="text-body-sm text-body space-y-1">
					<li>• Uses your browser's built-in Text-to-Speech engine (Web Speech API)</li>
					<li>• No model download needed — instant processing</li>
					<li>• Voice quality depends on your OS and browser</li>
					<li>
						• Chrome offers ~20 voices, Safari has Siri voices, Edge has Microsoft neural voices
					</li>
					<li>• Works best on Windows 11 and macOS Ventura+</li>
				</ul>
			</div>
		</div>
	);
}
