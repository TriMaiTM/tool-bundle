import { useCallback, useMemo, useState } from "preact/hooks";

const GAMES = [
	"Valorant",
	"CS2",
	"Apex Legends",
	"Fortnite",
	"Overwatch 2",
	"Call of Duty",
	"Rainbow Six Siege",
	"PUBG",
	"Destiny 2",
	"Halo Infinite",
	"The Finals",
	"XDefiant",
] as const;

// Sensitivity multiplier per game — used to compute a normalized "base sensitivity"
// base_sensitivity = game_sensitivity * game_multiplier
// Conversion: target_sens = (source_sens * source_multiplier) / target_multiplier
const GAME_MULTIPLIERS: Record<string, number> = {
	Valorant: 0.07,
	CS2: 0.022,
	"Apex Legends": 0.022,
	Fortnite: 0.0066,
	"Overwatch 2": 0.0066,
	"Call of Duty": 0.0066,
	"Rainbow Six Siege": 0.00565,
	PUBG: 0.00555,
	"Destiny 2": 0.0066,
	"Halo Infinite": 0.0066,
	"The Finals": 0.0066,
	XDefiant: 0.0066,
};

export default function SensitivityConverter() {
	const [sourceGame, setSourceGame] = useState<string>("Valorant");
	const [targetGame, setTargetGame] = useState<string>("CS2");
	const [sourceSens, setSourceSens] = useState(0.5);
	const [dpi, setDpi] = useState(800);
	const [copied, setCopied] = useState(false);

	const sourceMultiplier = GAME_MULTIPLIERS[sourceGame] ?? 0.07;
	const targetMultiplier = GAME_MULTIPLIERS[targetGame] ?? 0.022;

	const targetSens = useMemo(() => {
		const result = (sourceSens * sourceMultiplier) / targetMultiplier;
		return Math.round(result * 10000) / 10000;
	}, [sourceSens, sourceMultiplier, targetMultiplier]);

	const sourceEdpi = useMemo(() => Math.round(dpi * sourceSens * 100) / 100, [dpi, sourceSens]);
	const targetEdpi = useMemo(() => Math.round(dpi * targetSens * 100) / 100, [dpi, targetSens]);

	// cm/360 using a simplified formula: 2.54 * 360 / (DPI * sens * multiplier_factor)
	// More precisely: cm/360 = (360 / (DPI * game_sens * game_multiplier_degrees_per_count))
	const sourceCm360 = useMemo(() => {
		if (dpi <= 0 || sourceSens <= 0) return 0;
		return Math.round(((2.54 * 360) / (dpi * sourceSens * sourceMultiplier * 1000)) * 100) / 100;
	}, [dpi, sourceSens, sourceMultiplier]);

	const targetCm360 = useMemo(() => {
		if (dpi <= 0 || targetSens <= 0) return 0;
		return Math.round(((2.54 * 360) / (dpi * targetSens * targetMultiplier * 1000)) * 100) / 100;
	}, [dpi, targetSens, targetMultiplier]);

	const conversionRatio = useMemo(() => {
		return Math.round((targetSens / sourceSens) * 10000) / 10000;
	}, [sourceSens, targetSens]);

	const swapGames = useCallback(() => {
		setSourceGame(targetGame);
		setTargetGame(sourceGame);
	}, [sourceGame, targetGame]);

	const handleCopy = useCallback(async () => {
		const text = [
			`${sourceGame} Sensitivity: ${sourceSens}`,
			`DPI: ${dpi}`,
			`${targetGame} Sensitivity: ${targetSens}`,
			`Source eDPI: ${sourceEdpi}`,
			`Target eDPI: ${targetEdpi}`,
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [sourceGame, targetGame, sourceSens, dpi, targetSens, sourceEdpi, targetEdpi]);

	return (
		<div>
			{/* Inputs */}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div class="bg-surface-elevated rounded-lg p-4">
					<div class="text-caption-uppercase text-muted mb-3">Source</div>
					<div class="space-y-3">
						<div>
							<label class="text-caption text-muted block mb-1">Game</label>
							<select
								class="input w-full"
								value={sourceGame}
								onChange={(e) => setSourceGame((e.target as HTMLSelectElement).value)}
							>
								{GAMES.map((g) => (
									<option value={g} key={g}>
										{g}
									</option>
								))}
							</select>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Sensitivity</label>
							<input
								type="number"
								class="input w-full"
								value={sourceSens}
								min={0.001}
								max={100}
								step={0.01}
								onInput={(e) =>
									setSourceSens(
										Math.max(
											0.001,
											Number.parseFloat((e.target as HTMLInputElement).value) || 0.001,
										),
									)
								}
							/>
						</div>
					</div>
				</div>

				<div class="bg-surface-elevated rounded-lg p-4">
					<div class="text-caption-uppercase text-muted mb-3">Target</div>
					<div class="space-y-3">
						<div>
							<label class="text-caption text-muted block mb-1">Game</label>
							<select
								class="input w-full"
								value={targetGame}
								onChange={(e) => setTargetGame((e.target as HTMLSelectElement).value)}
							>
								{GAMES.map((g) => (
									<option value={g} key={g}>
										{g}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3 mb-4">
				<div class="flex-1">
					<label class="text-caption-uppercase text-muted block mb-2">DPI</label>
					<input
						type="number"
						class="input w-full"
						value={dpi}
						min={1}
						max={32000}
						onInput={(e) =>
							setDpi(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
						}
					/>
				</div>
				<div class="flex items-end pb-1">
					<button class="btn-secondary" onClick={swapGames} title="Swap source and target">
						⇄ Swap
					</button>
				</div>
			</div>

			{/* Results */}
			<div class="bg-surface-elevated rounded-lg p-6 mb-6">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="text-center">
						<div class="text-caption-uppercase text-muted mb-1">{targetGame} Sensitivity</div>
						<div class="text-display-sm text-primary">{targetSens}</div>
					</div>
					<div class="text-center">
						<div class="text-caption-uppercase text-muted mb-1">Source eDPI</div>
						<div class="text-display-sm text-primary">{sourceEdpi}</div>
					</div>
					<div class="text-center">
						<div class="text-caption-uppercase text-muted mb-1">Target eDPI</div>
						<div class="text-display-sm text-primary">{targetEdpi}</div>
					</div>
				</div>

				<div class="border-t border-hairline mt-4 pt-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="text-center">
							<div class="text-caption-uppercase text-muted mb-1">Source cm/360°</div>
							<div class="text-body-lg text-body-strong">{sourceCm360}</div>
						</div>
						<div class="text-center">
							<div class="text-caption-uppercase text-muted mb-1">Target cm/360°</div>
							<div class="text-body-lg text-body-strong">{targetCm360}</div>
						</div>
						<div class="text-center">
							<div class="text-caption-uppercase text-muted mb-1">Conversion Ratio</div>
							<div class="text-body-lg text-body-strong">×{conversionRatio}</div>
						</div>
					</div>
				</div>

				<div class="flex justify-center mt-4">
					<button class="btn-secondary text-body-sm" onClick={handleCopy}>
						{copied ? "Copied!" : "Copy Results"}
					</button>
				</div>
			</div>

			{/* Formula */}
			<div class="bg-surface-elevated rounded-lg p-4">
				<div class="text-caption-uppercase text-muted mb-2">Conversion Formula</div>
				<p class="text-body-sm font-mono">
					{targetGame} sens = {sourceGame} sens ({sourceSens}) × ({sourceMultiplier} /{" "}
					{targetMultiplier}) = {targetSens}
				</p>
			</div>
		</div>
	);
}
