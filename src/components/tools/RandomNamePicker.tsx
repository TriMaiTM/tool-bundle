import { useCallback, useRef, useState } from "preact/hooks";

export default function RandomNamePicker() {
	const [namesText, setNamesText] = useState("");
	const [quickName, setQuickName] = useState("");
	const [names, setNames] = useState<string[]>([]);
	const [winnerCount, setWinnerCount] = useState(1);
	const [removePicked, setRemovePicked] = useState(false);
	const [winners, setWinners] = useState<string[]>([]);
	const [picking, setPicking] = useState(false);
	const [displayedName, setDisplayedName] = useState("");
	const [history, setHistory] = useState<{ winners: string[]; timestamp: number }[]>([]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const importFromText = useCallback(() => {
		const parsed = namesText
			.split("\n")
			.map((n) => n.trim())
			.filter((n) => n.length > 0);
		const unique = [...new Set([...names, ...parsed])];
		setNames(unique);
		setNamesText("");
	}, [namesText, names]);

	const addName = useCallback(() => {
		const trimmed = quickName.trim();
		if (trimmed && !names.includes(trimmed)) {
			setNames((prev) => [...prev, trimmed]);
			setQuickName("");
		}
	}, [quickName, names]);

	const removeName = useCallback((name: string) => {
		setNames((prev) => prev.filter((n) => n !== name));
	}, []);

	const shuffleList = useCallback(() => {
		setNames((prev) => {
			const arr = [...prev];
			for (let i = arr.length - 1; i > 0; i--) {
				const rarr = new Uint32Array(1);
				crypto.getRandomValues(rarr);
				const j = rarr[0] % (i + 1);
				[arr[i], arr[j]] = [arr[j], arr[i]];
			}
			return arr;
		});
	}, []);

	const clearAll = useCallback(() => {
		setNames([]);
		setWinners([]);
		setDisplayedName("");
	}, []);

	const pick = useCallback(() => {
		if (names.length === 0) return;
		const actualCount = Math.min(winnerCount, names.length);
		setPicking(true);
		setWinners([]);
		setDisplayedName("");

		let tick = 0;
		const totalTicks = 20;
		intervalRef.current = setInterval(() => {
			tick++;
			const rarr = new Uint32Array(1);
			crypto.getRandomValues(rarr);
			const randomName = names[rarr[0] % names.length];
			setDisplayedName(randomName);

			if (tick >= totalTicks) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				setPicking(false);

				const picked: string[] = [];
				const available = [...names];
				for (let i = 0; i < actualCount; i++) {
					const arr = new Uint32Array(1);
					crypto.getRandomValues(arr);
					const idx = arr[0] % available.length;
					picked.push(available[idx]);
					available.splice(idx, 1);
				}

				setWinners(picked);
				setHistory((prev) => [{ winners: picked, timestamp: Date.now() }, ...prev].slice(0, 20));

				if (removePicked) {
					setNames((prev) => prev.filter((n) => !picked.includes(n)));
				}
			}
		}, 80);
	}, [names, winnerCount, removePicked]);

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">
					Paste Names (one per line)
				</label>
				<textarea
					class="textarea w-full"
					rows={4}
					placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
					value={namesText}
					onInput={(e) => setNamesText((e.target as HTMLTextAreaElement).value)}
				/>
				<button class="btn-secondary mt-2" onClick={importFromText}>
					Import Names
				</button>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Quick Add</label>
				<div class="flex gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="Enter a name..."
						value={quickName}
						onInput={(e) => setQuickName((e.target as HTMLInputElement).value)}
						onKeyDown={(e: KeyboardEvent) => {
							if (e.key === "Enter") addName();
						}}
					/>
					<button class="btn-secondary" onClick={addName}>
						Add
					</button>
				</div>
			</div>

			{names.length > 0 && (
				<div class="mb-6">
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">Current List ({names.length})</span>
						<div class="flex gap-2">
							<button class="btn-secondary text-body-sm" onClick={shuffleList}>
								Shuffle
							</button>
							<button class="btn-secondary text-body-sm" onClick={clearAll}>
								Clear All
							</button>
						</div>
					</div>
					<div class="flex flex-wrap gap-2">
						{names.map((name) => (
							<span class="badge" key={name}>
								{name}
								<button
									class="ml-1 text-body-sm"
									onClick={() => removeName(name)}
									style="cursor: pointer; opacity: 0.7;"
								>
									×
								</button>
							</span>
						))}
					</div>
				</div>
			)}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Winners to Pick (1–10)</label>
					<input
						type="number"
						class="input w-full"
						value={winnerCount}
						min={1}
						max={10}
						onInput={(e) =>
							setWinnerCount(
								Math.min(
									10,
									Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
								),
							)
						}
					/>
				</div>
				<div class="flex items-end">
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							checked={removePicked}
							onChange={(e) => setRemovePicked((e.target as HTMLInputElement).checked)}
							class="rounded border-hairline"
						/>
						<span class="text-body-sm text-body">Remove picked names from list</span>
					</label>
				</div>
			</div>

			<button class="btn-primary mb-6" onClick={pick} disabled={picking || names.length === 0}>
				{picking ? "Picking..." : "Pick Random Name"}
			</button>

			{picking && (
				<div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
					<div
						class="text-title-lg text-primary"
						style="font-size: 2rem; animation: pulse 0.2s ease-in-out infinite alternate;"
					>
						{displayedName}
					</div>
					<style>{`
            @keyframes pulse {
              from { opacity: 0.5; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
				</div>
			)}

			{winners.length > 0 && !picking && (
				<div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
					<span class="text-caption-uppercase text-muted block mb-3">
						🎉 Winner{winners.length > 1 ? "s" : ""}!
					</span>
					{winners.map((w, i) => (
						<div class="text-title-lg text-primary" style="font-size: 2rem;" key={i}>
							{w}
						</div>
					))}
				</div>
			)}

			{history.length > 0 && (
				<div>
					<span class="text-caption-uppercase text-muted block mb-3">History</span>
					<div class="space-y-2">
						{history.map((entry, i) => (
							<div class="bg-surface-elevated rounded-lg p-3" key={i}>
								<div class="flex items-center justify-between">
									<div class="flex flex-wrap gap-1">
										{entry.winners.map((w, j) => (
											<span class="badge-yellow" key={j}>
												{w}
											</span>
										))}
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
		</div>
	);
}
