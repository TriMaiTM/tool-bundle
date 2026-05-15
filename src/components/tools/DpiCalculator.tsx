import { useCallback, useMemo, useState } from "preact/hooks";

const GAMES = [
	"Valorant",
	"CS2",
	"Apex Legends",
	"Fortnite",
	"Overwatch 2",
	"Call of Duty",
	"Rainbow Six Siege",
] as const;

// Multiplier to convert in-game sens to a normalized value (cm/360 at 1 DPI)
// cm/360 = (360 / (DPI * sens * gameMultiplier)) * 2.54 * screen_width_pixels
// Simplified: cm/360 = multiplier / (DPI * sens)
const GAME_MULTIPLIERS: Record<string, number> = {
	Valorant: 28.6,
	CS2: 9.0,
	"Apex Legends": 9.0,
	Fortnite: 5.5,
	"Overwatch 2": 3.8,
	"Call of Duty": 3.8,
	"Rainbow Six Siege": 12.0,
};

interface ProPreset {
	name: string;
	game: string;
	dpi: number;
	sensitivity: number;
}

const PRO_PRESETS: ProPreset[] = [
	{ name: "TenZ (Valorant)", game: "Valorant", dpi: 800, sensitivity: 0.25 },
	{ name: "s1mple (CS2)", game: "CS2", dpi: 400, sensitivity: 3.09 },
	{ name: "Shroud (Apex)", game: "Apex Legends", dpi: 450, sensitivity: 1.8 },
	{ name: "Bugha (Fortnite)", game: "Fortnite", dpi: 800, sensitivity: 8.0 },
	{ name: "Pro OW2 Average", game: "Overwatch 2", dpi: 800, sensitivity: 4.5 },
	{ name: "Scump (COD)", game: "Call of Duty", dpi: 800, sensitivity: 6.0 },
	{ name: "Beaulo (R6)", game: "Rainbow Six Siege", dpi: 400, sensitivity: 12 },
];

function getSensitivityTier(edpi: number): string {
	if (edpi < 200) return "Very Low";
	if (edpi < 400) return "Low";
	if (edpi < 800) return "Medium";
	if (edpi < 1600) return "High";
	return "Very High";
}

function getTierColor(tier: string): string {
	switch (tier) {
		case "Very Low":
			return "var(--color-info)";
		case "Low":
			return "var(--color-success)";
		case "Medium":
			return "var(--color-warning)";
		case "High":
			return "var(--color-error)";
		case "Very High":
			return "var(--color-error)";
		default:
			return "var(--color-text)";
	}
}

export default function DpiCalculator() {
	const [dpi, setDpi] = useState(800);
	const [sensitivity, setSensitivity] = useState(0.5);
	const [game, setGame] = useState<string>("Valorant");
	const [copied, setCopied] = useState(false);

	const multiplier = GAME_MULTIPLIERS[game] ?? 28.6;

	const edpi = useMemo(() => Math.round(dpi * sensitivity), [dpi, sensitivity]);
	const cm360 = useMemo(() => {
		if (dpi <= 0 || sensitivity <= 0) return 0;
		return Math.round((multiplier / (dpi * sensitivity)) * 100) / 100;
	}, [dpi, sensitivity, multiplier]);
	const inches360 = useMemo(() => Math.round((cm360 / 2.54) * 100) / 100, [cm360]);
	const tier = useMemo(() => getSensitivityTier(edpi), [edpi]);

	const applyPreset = useCallback((preset: ProPreset) => {
		setDpi(preset.dpi);
		setSensitivity(preset.sensitivity);
		setGame(preset.game);
	}, []);

	const handleCopy = useCallback(async () => {
		const text = [
			`Game: ${game}`,
			`DPI: ${dpi}`,
			`Sensitivity: ${sensitivity}`,
			`eDPI: ${edpi}`,
			`cm/360°: ${cm360}`,
			`inches/360°: ${inches360}`,
			`Tier: ${tier}`,
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [game, dpi, sensitivity, edpi, cm360, inches360, tier]);

	return (
		<div>
			{/* Inputs */}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Game</label>
					<select
						class="input w-full"
						value={game}
						onChange={(e) => setGame((e.target as HTMLSelectElement).value)}
					>
						{GAMES.map((g) => (
							<option value={g} key={g}>
								{g}
							</option>
						))}
					</select>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Mouse DPI</label>
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
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">In-Game Sensitivity</label>
					<input
						type="number"
						class="input w-full"
						value={sensitivity}
						min={0.01}
						max={100}
						step={0.01}
						onInput={(e) =>
							setSensitivity(
								Math.max(0.01, Number.parseFloat((e.target as HTMLInputElement).value) || 0.01),
							)
						}
					/>
				</div>
			</div>

			{/* Results */}
			<div class="bg-surface-elevated rounded-lg p-6 mb-6">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="text-center">
						<div class="text-display-sm text-primary">{edpi}</div>
						<div class="text-caption-uppercase text-muted mt-1">eDPI</div>
					</div>
					<div class="text-center">
						<div class="text-display-sm text-primary">{cm360}</div>
						<div class="text-caption-uppercase text-muted mt-1">cm/360°</div>
					</div>
					<div class="text-center">
						<div class="text-display-sm text-primary">{inches360}</div>
						<div class="text-caption-uppercase text-muted mt-1">inches/360°</div>
					</div>
					<div class="text-center">
						<div class="text-display-sm" style={`color: ${getTierColor(tier)}`}>
							{tier}
						</div>
						<div class="text-caption-uppercase text-muted mt-1">Sensitivity Tier</div>
					</div>
				</div>
				<div class="flex justify-center mt-4">
					<button class="btn-secondary text-body-sm" onClick={handleCopy}>
						{copied ? "Copied!" : "Copy Results"}
					</button>
				</div>
			</div>

			{/* Pro Presets */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="text-caption-uppercase text-muted mb-3">Pro Player Presets</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
					{PRO_PRESETS.map((preset) => (
						<button
							key={preset.name}
							class="btn-secondary text-body-sm text-left"
							onClick={() => applyPreset(preset)}
						>
							<span class="text-body-strong">{preset.name}</span>
							<span class="text-muted ml-1">
								({preset.dpi} DPI / {preset.sensitivity} sens)
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
