import { useCallback, useMemo, useState } from "preact/hooks";

type WeightUnit = "kg" | "lb";
type ActivityLevel = "low" | "moderate" | "high";
type Climate = "cool" | "moderate" | "hot";

const GLASS_ML = 240;
const TIPS = [
	"Drink a glass of water as soon as you wake up to kickstart your metabolism.",
	"Drink a glass of water 30 minutes before each meal.",
	"Carry a reusable water bottle with you throughout the day.",
	"Set reminders on your phone to drink water every hour.",
	"If plain water is boring, add slices of lemon, cucumber, or mint.",
	"Drink water before, during, and after exercise.",
	"Replace one sugary drink per day with water.",
	"Eat water-rich foods like watermelon, cucumbers, and oranges.",
];

export default function WaterIntakeCalculator() {
	const [weight, setWeight] = useState("");
	const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
	const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
	const [climate, setClimate] = useState<Climate>("moderate");
	const [glassesDrunk, setGlassesDrunk] = useState(0);

	const handleWeightUnitChange = useCallback(
		(unit: WeightUnit) => {
			const current = Number.parseFloat(weight);
			if (!Number.isNaN(current) && weight.trim() !== "") {
				if (unit === "lb" && weightUnit === "kg") {
					setWeight((current * 2.20462).toFixed(1));
				} else if (unit === "kg" && weightUnit === "lb") {
					setWeight((current / 2.20462).toFixed(1));
				}
			}
			setWeightUnit(unit);
		},
		[weight, weightUnit],
	);

	const result = useMemo(() => {
		const w = Number.parseFloat(weight);
		if (Number.isNaN(w) || w <= 0) return null;

		const wKg = weightUnit === "lb" ? w * 0.453592 : w;

		// Base: weight(kg) × 33ml (midpoint of 30-35)
		let baseMl = wKg * 33;

		// Activity adjustments
		if (activityLevel === "moderate") baseMl += 500;
		if (activityLevel === "high") baseMl += 1000;

		// Climate adjustments
		if (climate === "hot") baseMl += 500;

		const totalMl = Math.round(baseMl);
		const totalLiters = (totalMl / 1000).toFixed(1);
		const totalCups = Math.round(totalMl / GLASS_ML);
		const totalOz = Math.round(totalMl / 29.5735);

		return { totalMl, totalLiters, totalCups, totalOz };
	}, [weight, weightUnit, activityLevel, climate]);

	const progress = useMemo(() => {
		if (!result) return 0;
		return Math.min(100, Math.round((glassesDrunk / result.totalCups) * 100));
	}, [glassesDrunk, result]);

	const addGlass = useCallback(() => {
		if (result && glassesDrunk < result.totalCups + 5) {
			setGlassesDrunk((prev) => prev + 1);
		}
	}, [glassesDrunk, result]);

	const removeGlass = useCallback(() => {
		setGlassesDrunk((prev) => Math.max(0, prev - 1));
	}, []);

	const resetTracker = useCallback(() => {
		setGlassesDrunk(0);
	}, []);

	return (
		<div class="space-y-6">
			{/* Inputs */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					{/* Weight */}
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">Weight</label>
							<div class="flex rounded-md overflow-hidden border border-hairline">
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										weightUnit === "kg"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => handleWeightUnitChange("kg")}
								>
									kg
								</button>
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										weightUnit === "lb"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => handleWeightUnitChange("lb")}
								>
									lb
								</button>
							</div>
						</div>
						<input
							type="number"
							class="input w-full"
							placeholder={weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
							value={weight}
							onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Activity Level */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Activity Level</label>
						<select
							class="input w-full"
							value={activityLevel}
							onChange={(e) =>
								setActivityLevel((e.target as HTMLSelectElement).value as ActivityLevel)
							}
						>
							<option value="low">Low (sedentary / desk job)</option>
							<option value="moderate">Moderate (some exercise)</option>
							<option value="high">High (intense exercise / physical job)</option>
						</select>
					</div>

					{/* Climate */}
					<div class="sm:col-span-2">
						<label class="text-caption-uppercase text-muted block mb-2">Climate</label>
						<div class="flex rounded-md overflow-hidden border border-hairline">
							{(["cool", "moderate", "hot"] as Climate[]).map((c) => (
								<button
									key={c}
									class={`flex-1 px-3 py-2 text-body-sm font-medium capitalize transition-colors ${
										climate === c
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => setClimate(c)}
								>
									{c}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Results */}
			{result && (
				<div class="space-y-4">
					{/* Main numbers */}
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{result.totalLiters}L</div>
							<div class="text-caption text-muted mt-1">Liters / Day</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{result.totalCups}</div>
							<div class="text-caption text-muted mt-1">Glasses (240ml)</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{result.totalOz}</div>
							<div class="text-caption text-muted mt-1">Ounces</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{result.totalMl.toLocaleString()}</div>
							<div class="text-caption text-muted mt-1">Milliliters</div>
						</div>
					</div>

					{/* Water Glass Visual */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Recommended Daily Intake</h3>
						<div class="flex items-center justify-center gap-8">
							{/* Glass visualization */}
							<div class="flex flex-col items-center">
								<div
									class="relative border-2 border-hairline rounded-b-xl rounded-t-sm overflow-hidden"
									style="width: 80px; height: 140px"
								>
									<div
										class="absolute bottom-0 left-0 right-0 bg-accent-blue/40 transition-all duration-300"
										style={`height: ${Math.min(100, (result.totalMl / 4000) * 100)}%`}
									/>
									<div class="absolute inset-0 flex items-center justify-center">
										<span class="text-title-lg text-primary font-bold">{result.totalLiters}L</span>
									</div>
								</div>
								<div class="text-caption text-muted mt-2">Daily Goal</div>
							</div>
						</div>
					</div>

					{/* Daily Tracker */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-title-sm text-body-strong">Water Tracker</h3>
							<button class="btn-secondary text-body-sm" onClick={resetTracker}>
								Reset
							</button>
						</div>

						{/* Progress bar */}
						<div class="mb-4">
							<div class="flex justify-between text-body-sm mb-2">
								<span class="text-muted">
									{glassesDrunk} of {result.totalCups} glasses
								</span>
								<span class={progress >= 100 ? "text-accent-emerald" : "text-primary"}>
									{progress}%
								</span>
							</div>
							<div class="w-full h-4 bg-surface-soft rounded-full overflow-hidden">
								<div
									class={`h-full rounded-full transition-all duration-300 ${
										progress >= 100 ? "bg-accent-emerald" : "bg-accent-blue"
									}`}
									style={`width: ${Math.min(100, progress)}%`}
								/>
							</div>
						</div>

						{/* Add / Remove buttons */}
						<div class="flex items-center justify-center gap-4">
							<button
								class="btn-secondary text-title-sm px-4 py-2"
								onClick={removeGlass}
								disabled={glassesDrunk <= 0}
							>
								−
							</button>
							<div class="text-center" style="min-width: 80px">
								<div class="text-title-lg text-primary">{glassesDrunk}</div>
								<div class="text-caption text-muted">glasses</div>
							</div>
							<button class="btn-primary text-title-sm px-4 py-2" onClick={addGlass}>
								+
							</button>
						</div>

						{/* Glass icons */}
						<div class="flex flex-wrap justify-center gap-2 mt-4">
							{Array.from({ length: Math.min(result.totalCups, 20) }).map((_, i) => (
								<div
									key={i}
									class={`w-8 h-10 rounded-b-lg rounded-t-sm border-2 flex items-center justify-center text-caption transition-colors ${
										i < glassesDrunk
											? "bg-accent-blue/30 border-accent-blue text-accent-blue"
											: "border-hairline text-muted"
									}`}
								>
									💧
								</div>
							))}
							{result.totalCups > 20 && (
								<div class="text-body-sm text-muted self-center">+{result.totalCups - 20} more</div>
							)}
						</div>
					</div>

					{/* Tips */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-3">Hydration Tips</h3>
						<div class="space-y-2">
							{TIPS.map((tip, i) => (
								<div key={i} class="flex items-start gap-3 p-2 rounded-lg">
									<span class="text-accent-blue mt-0.5">💧</span>
									<span class="text-body-sm text-muted">{tip}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{!result && (
				<div class="text-center py-8">
					<p class="text-muted">
						Enter your weight to calculate your recommended daily water intake.
					</p>
				</div>
			)}
		</div>
	);
}
