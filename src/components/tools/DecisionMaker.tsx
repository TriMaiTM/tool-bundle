import { useCallback, useRef, useState } from "preact/hooks";

type Mode = "wheel" | "random" | "elimination" | "yesnomaybe";

const PRESETS: Record<string, string[]> = {
	"Yes or No": ["Yes", "No"],
	"What to Eat": ["Pizza", "Sushi", "Burger", "Tacos", "Pasta", "Salad", "Steak", "Ramen"],
	"What to Watch": ["Movie", "TV Show", "YouTube", "Documentary", "Anime"],
	"Number 1-10": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
};

const COLORS = [
	"#4f46e5",
	"#e11d48",
	"#059669",
	"#d97706",
	"#7c3aed",
	"#0891b2",
	"#be185d",
	"#65a30d",
];

export default function DecisionMaker() {
	const [options, setOptions] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [mode, setMode] = useState<Mode>("random");
	const [result, setResult] = useState<string | null>(null);
	const [deciding, setDeciding] = useState(false);
	const [displayedOption, setDisplayedOption] = useState("");
	const [eliminated, setEliminated] = useState<string[]>([]);
	const [eliminationRound, setEliminationRound] = useState(0);
	const [history, setHistory] = useState<{ result: string; mode: Mode; timestamp: number }[]>([]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const addOption = useCallback(() => {
		const trimmed = inputValue.trim();
		if (trimmed && !options.includes(trimmed)) {
			setOptions((prev) => [...prev, trimmed]);
			setInputValue("");
		}
	}, [inputValue, options]);

	const removeOption = useCallback((idx: number) => {
		setOptions((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const loadPreset = useCallback((preset: string) => {
		setOptions(PRESETS[preset] || []);
		setResult(null);
		setEliminated([]);
		setEliminationRound(0);
	}, []);

	const playRevealSound = useCallback(() => {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.setValueAtTime(800, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.3);
		} catch {}
	}, []);

	const drawWheel = useCallback((opts: string[], currentRotation: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const size = 250;
		canvas.width = size;
		canvas.height = size;
		const cx = size / 2;
		const cy = size / 2;
		const radius = size / 2 - 10;

		ctx.clearRect(0, 0, size, size);
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate((currentRotation * Math.PI) / 180);

		const segAngle = (2 * Math.PI) / opts.length;
		opts.forEach((opt, i) => {
			const startAngle = i * segAngle;
			const endAngle = startAngle + segAngle;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, radius, startAngle, endAngle);
			ctx.closePath();
			ctx.fillStyle = COLORS[i % COLORS.length];
			ctx.fill();
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.save();
			ctx.rotate(startAngle + segAngle / 2);
			ctx.textAlign = "right";
			ctx.fillStyle = "#fff";
			ctx.font = "bold 13px sans-serif";
			const text = opt.length > 10 ? `${opt.slice(0, 10)}…` : opt;
			ctx.fillText(text, radius - 12, 5);
			ctx.restore();
		});

		ctx.restore();

		ctx.beginPath();
		ctx.moveTo(cx - 10, 8);
		ctx.lineTo(cx + 10, 8);
		ctx.lineTo(cx, 22);
		ctx.closePath();
		ctx.fillStyle = "#fff";
		ctx.fill();
		ctx.strokeStyle = "#333";
		ctx.lineWidth = 2;
		ctx.stroke();
	}, []);

	const decide = useCallback(() => {
		if (options.length === 0) return;
		setResult(null);
		setEliminated([]);
		setEliminationRound(0);
		setDeciding(true);

		if (mode === "random" || mode === "yesnomaybe") {
			let tick = 0;
			intervalRef.current = setInterval(() => {
				tick++;
				const arr = new Uint32Array(1);
				crypto.getRandomValues(arr);
				setDisplayedOption(options[arr[0] % options.length]);
				if (tick >= 20) {
					if (intervalRef.current) clearInterval(intervalRef.current);
					const finalArr = new Uint32Array(1);
					crypto.getRandomValues(finalArr);
					const chosen = options[finalArr[0] % options.length];
					setResult(chosen);
					setDisplayedOption(chosen);
					setDeciding(false);
					playRevealSound();
					setHistory((prev) =>
						[{ result: chosen, mode, timestamp: Date.now() }, ...prev].slice(0, 20),
					);
				}
			}, 80);
		} else if (mode === "wheel") {
			const arr = new Uint32Array(1);
			crypto.getRandomValues(arr);
			const winnerIndex = arr[0] % options.length;
			const segAngle = 360 / options.length;
			const targetAngle = 360 - (winnerIndex * segAngle + segAngle / 2);
			const totalRotation = 5 * 360 + targetAngle;
			const duration = 4000;
			const startTime = Date.now();
			let currentRot = 0;

			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const eased = 1 - (1 - progress) ** 3;
				currentRot = totalRotation * eased;
				drawWheel(options, currentRot);

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					const finalAngle = currentRot % 360;
					const normalized = (360 - finalAngle + 360) % 360;
					const idx = Math.floor(normalized / segAngle) % options.length;
					const selected = options[idx];
					setResult(selected);
					setDeciding(false);
					playRevealSound();
					setHistory((prev) =>
						[{ result: selected, mode, timestamp: Date.now() }, ...prev].slice(0, 20),
					);
				}
			};
			requestAnimationFrame(animate);
		} else if (mode === "elimination") {
			const available = [...options];
			const elim: string[] = [];
			setEliminated([]);

			let round = 0;
			const eliminateNext = () => {
				if (available.length <= 1) {
					setResult(available[0]);
					setDeciding(false);
					playRevealSound();
					setHistory((prev) =>
						[{ result: available[0], mode, timestamp: Date.now() }, ...prev].slice(0, 20),
					);
					return;
				}
				const arr = new Uint32Array(1);
				crypto.getRandomValues(arr);
				const idx = arr[0] % available.length;
				const removed = available.splice(idx, 1)[0];
				elim.push(removed);
				setEliminated([...elim]);
				setEliminationRound(++round);
				setDisplayedOption(available[arr[0] % available.length]);
				setTimeout(eliminateNext, 800);
			};
			setTimeout(eliminateNext, 500);
		}
	}, [options, mode, playRevealSound, drawWheel]);

	const modes: { key: Mode; label: string }[] = [
		{ key: "random", label: "Random Pick" },
		{ key: "wheel", label: "Spin Wheel" },
		{ key: "elimination", label: "Elimination" },
		{ key: "yesnomaybe", label: "Yes/No/Maybe" },
	];

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Decision Mode</label>
				<div class="flex flex-wrap gap-2">
					{modes.map((m) => (
						<button
							key={m.key}
							class={mode === m.key ? "btn-primary text-body-sm" : "btn-secondary text-body-sm"}
							onClick={() => {
								setMode(m.key);
								setResult(null);
								setEliminated([]);
							}}
						>
							{m.label}
						</button>
					))}
				</div>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Presets</label>
				<div class="flex flex-wrap gap-2">
					{Object.keys(PRESETS).map((name) => (
						<button class="btn-secondary text-body-sm" key={name} onClick={() => loadPreset(name)}>
							{name}
						</button>
					))}
				</div>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Add Option</label>
				<div class="flex gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="Enter an option..."
						value={inputValue}
						onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
						onKeyDown={(e: KeyboardEvent) => {
							if (e.key === "Enter") addOption();
						}}
					/>
					<button class="btn-secondary" onClick={addOption}>
						Add
					</button>
				</div>
			</div>

			{options.length > 0 && (
				<div class="mb-6">
					<span class="text-caption-uppercase text-muted block mb-3">
						Options ({options.length})
					</span>
					<div class="flex flex-wrap gap-2">
						{options.map((opt, i) => (
							<span class={eliminated.includes(opt) ? "badge" : "badge-yellow"} key={i}>
								{opt}
								{eliminated.includes(opt) && " ❌"}
								<button
									class="ml-1 text-body-sm"
									onClick={() => removeOption(i)}
									style="cursor: pointer; opacity: 0.7;"
								>
									×
								</button>
							</span>
						))}
					</div>
				</div>
			)}

			{mode === "wheel" && options.length >= 2 && (
				<div class="text-center mb-6">
					<canvas
						ref={canvasRef}
						style="border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
					/>
				</div>
			)}

			<button class="btn-primary mb-6" onClick={decide} disabled={deciding || options.length < 2}>
				{deciding ? "Deciding..." : "Decide!"}
			</button>

			{deciding && mode !== "elimination" && mode !== "wheel" && (
				<div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
					<div class="text-title-lg text-primary" style="font-size: 2rem;">
						{displayedOption || "..."}
					</div>
				</div>
			)}

			{mode === "elimination" && eliminated.length > 0 && deciding && (
				<div class="bg-surface-elevated rounded-lg p-4 mb-6">
					<span class="text-caption-uppercase text-muted block mb-2">
						Elimination Round {eliminationRound}
					</span>
					<div class="text-body-sm text-accent-rose mb-2">
						Eliminated: {eliminated[eliminated.length - 1]}
					</div>
					<div class="text-body-strong text-primary">
						Remaining: {options.filter((o) => !eliminated.includes(o)).join(", ")}
					</div>
				</div>
			)}

			{result && !deciding && (
				<div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
					<span class="text-caption-uppercase text-muted block mb-2">🎉 Decision</span>
					<div class="text-title-lg text-primary" style="font-size: 2.5rem;">
						{result}
					</div>
				</div>
			)}

			{history.length > 0 && (
				<div>
					<span class="text-caption-uppercase text-muted block mb-3">History</span>
					<div class="space-y-2">
						{history.map((entry, i) => (
							<div class="bg-surface-elevated rounded-lg p-3" key={i}>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="badge-yellow">{entry.result}</span>
										<span class="text-body-sm text-muted-soft capitalize">
											via {entry.mode === "yesnomaybe" ? "Yes/No/Maybe" : entry.mode}
										</span>
									</div>
									<span class="text-body-sm text-muted-soft">
										{new Date(entry.timestamp).toLocaleTimeString()}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{options.length < 2 && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
					Add at least 2 options to make a decision.
				</div>
			)}
		</div>
	);
}
