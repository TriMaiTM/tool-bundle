import { useCallback, useMemo, useState } from "preact/hooks";
import { calculateBMI } from "../../utils/math";

type Gender = "male" | "female";
type CircUnit = "cm" | "in";

interface BodyFatCategory {
	label: string;
	maleRange: string;
	femaleRange: string;
	color: string;
}

const BODY_FAT_CATEGORIES: BodyFatCategory[] = [
	{
		label: "Essential Fat",
		maleRange: "2–5%",
		femaleRange: "10–13%",
		color: "text-accent-blue",
	},
	{
		label: "Athletes",
		maleRange: "6–13%",
		femaleRange: "14–20%",
		color: "text-accent-emerald",
	},
	{
		label: "Fitness",
		maleRange: "14–17%",
		femaleRange: "21–24%",
		color: "text-accent-emerald",
	},
	{
		label: "Average",
		maleRange: "18–24%",
		femaleRange: "25–31%",
		color: "text-warning",
	},
	{
		label: "Obese",
		maleRange: "25%+",
		femaleRange: "32%+",
		color: "text-accent-rose",
	},
];

const IDEAL_RANGES: { age: string; male: string; female: string }[] = [
	{ age: "20–29", male: "7–17%", female: "16–24%" },
	{ age: "30–39", male: "12–21%", female: "17–25%" },
	{ age: "40–49", male: "14–23%", female: "19–28%" },
	{ age: "50–59", male: "16–24%", female: "22–31%" },
	{ age: "60+", male: "17–25%", female: "22–33%" },
];

function getCategory(bfPct: number, gender: Gender): BodyFatCategory {
	const thresholds =
		gender === "male"
			? [5, 13, 17, 24, Number.POSITIVE_INFINITY]
			: [13, 20, 24, 31, Number.POSITIVE_INFINITY];

	for (let i = 0; i < thresholds.length; i++) {
		if (bfPct <= thresholds[i]) return BODY_FAT_CATEGORIES[i];
	}
	return BODY_FAT_CATEGORIES[BODY_FAT_CATEGORIES.length - 1];
}

export default function BodyFatCalculator() {
	const [gender, setGender] = useState<Gender>("male");
	const [height, setHeight] = useState("");
	const [heightUnit, setHeightUnit] = useState<CircUnit>("cm");
	const [waist, setWaist] = useState("");
	const [neck, setNeck] = useState("");
	const [hip, setHip] = useState("");
	const [circUnit, setCircUnit] = useState<CircUnit>("cm");
	const [weight, setWeight] = useState("");
	const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");

	const convertToCm = useCallback((value: string, unit: CircUnit): number => {
		const v = Number.parseFloat(value);
		if (Number.isNaN(v) || v <= 0) return 0;
		return unit === "in" ? v * 2.54 : v;
	}, []);

	const result = useMemo(() => {
		const hCm =
			heightUnit === "in"
				? (() => {
						const v = Number.parseFloat(height);
						return Number.isNaN(v) || v <= 0 ? 0 : v * 2.54;
					})()
				: Number.parseFloat(height) || 0;

		const waistCm = convertToCm(waist, circUnit);
		const neckCm = convertToCm(neck, circUnit);
		const hipCm = gender === "female" ? convertToCm(hip, circUnit) : 0;

		if (hCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;
		if (gender === "female" && hipCm <= 0) return null;

		// US Navy Method
		let bfPct: number;
		if (gender === "male") {
			if (waistCm <= neckCm) return null;
			bfPct = 86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(hCm) + 36.76;
		} else {
			bfPct = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(hCm) - 78.387;
		}

		if (Number.isNaN(bfPct) || bfPct < 0 || bfPct > 70) return null;

		const category = getCategory(bfPct, gender);

		// Calculate fat/lean mass if weight is provided
		const w = Number.parseFloat(weight);
		let fatMass: number | null = null;
		let leanMass: number | null = null;
		let bmiResult: ReturnType<typeof calculateBMI> | null = null;

		if (!Number.isNaN(w) && w > 0) {
			const wKg = weightUnit === "lb" ? w * 0.453592 : w;
			fatMass = (bfPct / 100) * wKg;
			leanMass = wKg - fatMass;
			bmiResult = calculateBMI(wKg, hCm);
		}

		return {
			bfPct: Math.round(bfPct * 10) / 10,
			category,
			fatMass: fatMass !== null ? Math.round(fatMass * 10) / 10 : null,
			leanMass: leanMass !== null ? Math.round(leanMass * 10) / 10 : null,
			bmi: bmiResult,
		};
	}, [gender, height, heightUnit, waist, neck, hip, circUnit, weight, weightUnit, convertToCm]);

	const handleCircUnitChange = useCallback(
		(unit: CircUnit) => {
			const convert = (val: string) => {
				const v = Number.parseFloat(val);
				if (Number.isNaN(v) || val.trim() === "") return val;
				return unit === "in" ? (v / 2.54).toFixed(1) : (v * 2.54).toFixed(1);
			};
			setWaist(convert(waist));
			setNeck(convert(neck));
			if (gender === "female") setHip(convert(hip));
			setCircUnit(unit);
		},
		[waist, neck, hip, gender],
	);

	return (
		<div class="space-y-6">
			{/* Inputs */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					{/* Gender */}
					<div class="sm:col-span-2">
						<label class="text-caption-uppercase text-muted block mb-2">Gender</label>
						<div class="flex rounded-md overflow-hidden border border-hairline">
							<button
								class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
									gender === "male"
										? "bg-primary text-on-primary"
										: "bg-surface-elevated text-body hover:text-on-dark"
								}`}
								onClick={() => setGender("male")}
							>
								Male
							</button>
							<button
								class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
									gender === "female"
										? "bg-primary text-on-primary"
										: "bg-surface-elevated text-body hover:text-on-dark"
								}`}
								onClick={() => setGender("female")}
							>
								Female
							</button>
						</div>
					</div>

					{/* Height */}
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">Height</label>
							<div class="flex rounded-md overflow-hidden border border-hairline">
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										heightUnit === "cm"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => setHeightUnit("cm")}
								>
									cm
								</button>
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										heightUnit === "in"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => setHeightUnit("in")}
								>
									in
								</button>
							</div>
						</div>
						<input
							type="number"
							class="input w-full"
							placeholder={heightUnit === "cm" ? "e.g. 175" : "e.g. 69"}
							value={height}
							onInput={(e) => setHeight((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Weight (optional, for fat/lean mass) */}
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">
								Weight <span class="text-body-sm font-normal">(optional)</span>
							</label>
							<div class="flex rounded-md overflow-hidden border border-hairline">
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										weightUnit === "kg"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => setWeightUnit("kg")}
								>
									kg
								</button>
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										weightUnit === "lb"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => setWeightUnit("lb")}
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

					{/* Circumference unit toggle */}
					<div class="sm:col-span-2">
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">Circumference Unit</label>
							<div class="flex rounded-md overflow-hidden border border-hairline">
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										circUnit === "cm"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => handleCircUnitChange("cm")}
								>
									cm
								</button>
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										circUnit === "in"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => handleCircUnitChange("in")}
								>
									in
								</button>
							</div>
						</div>
					</div>

					{/* Waist */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Waist Circumference</label>
						<input
							type="number"
							class="input w-full"
							placeholder={circUnit === "cm" ? "e.g. 82" : "e.g. 32"}
							value={waist}
							onInput={(e) => setWaist((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Neck */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Neck Circumference</label>
						<input
							type="number"
							class="input w-full"
							placeholder={circUnit === "cm" ? "e.g. 37" : "e.g. 14.5"}
							value={neck}
							onInput={(e) => setNeck((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Hip (female only) */}
					{gender === "female" && (
						<div class="sm:col-span-2">
							<label class="text-caption-uppercase text-muted block mb-2">Hip Circumference</label>
							<input
								type="number"
								class="input w-full sm:w-1/2"
								placeholder={circUnit === "cm" ? "e.g. 95" : "e.g. 37"}
								value={hip}
								onInput={(e) => setHip((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Results */}
			{result && (
				<div class="space-y-4">
					{/* Main results */}
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class={`text-title-lg ${result.category.color}`}>{result.bfPct}%</div>
							<div class="text-caption text-muted mt-1">Body Fat</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{result.category.label}</div>
							<div class="text-caption text-muted mt-1">Category</div>
						</div>
						{result.fatMass !== null && (
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-accent-rose">{result.fatMass} kg</div>
								<div class="text-caption text-muted mt-1">Fat Mass</div>
							</div>
						)}
						{result.leanMass !== null && (
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-accent-emerald">{result.leanMass} kg</div>
								<div class="text-caption text-muted mt-1">Lean Mass</div>
							</div>
						)}
					</div>

					{/* Body silhouette visualization */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Body Fat Level</h3>
						<div class="flex items-center justify-center gap-6">
							<div class="relative flex flex-col items-center">
								{/* Simple body shape */}
								<div class="relative" style="width: 100px; height: 180px">
									{/* Head */}
									<div
										class="absolute rounded-full border-2"
										style={`width: 36px; height: 36px; top: 0; left: 32px;
                      border-color: var(--color-primary);
                      background: ${
												result.bfPct > 25
													? "var(--color-accent-rose)"
													: result.bfPct > 17
														? "var(--color-warning)"
														: "var(--color-accent-emerald)"
											}40`}
									/>
									{/* Torso */}
									<div
										class="absolute rounded-lg border-2"
										style={`width: 44px; height: 70px; top: 40px; left: 28px;
                      border-color: var(--color-primary);
                      background: ${
												result.bfPct > 25
													? "var(--color-accent-rose)"
													: result.bfPct > 17
														? "var(--color-warning)"
														: "var(--color-accent-emerald)"
											}; opacity: ${Math.min(0.5, result.bfPct / 50)}`}
									/>
									{/* Legs */}
									<div
										class="absolute rounded-lg border-2"
										style={`width: 18px; height: 65px; top: 114px; left: 30px;
                      border-color: var(--color-primary);
                      background: ${
												result.bfPct > 25
													? "var(--color-accent-rose)"
													: result.bfPct > 17
														? "var(--color-warning)"
														: "var(--color-accent-emerald)"
											}; opacity: ${Math.min(0.4, result.bfPct / 60)}`}
									/>
									<div
										class="absolute rounded-lg border-2"
										style={`width: 18px; height: 65px; top: 114px; left: 52px;
                      border-color: var(--color-primary);
                      background: ${
												result.bfPct > 25
													? "var(--color-accent-rose)"
													: result.bfPct > 17
														? "var(--color-warning)"
														: "var(--color-accent-emerald)"
											}; opacity: ${Math.min(0.4, result.bfPct / 60)}`}
									/>
								</div>
								<div class={`text-title-lg mt-3 ${result.category.color}`}>{result.bfPct}%</div>
								<div class="text-caption text-muted">{result.category.label}</div>
							</div>

							{/* Category bar */}
							<div class="flex-1 space-y-2">
								{BODY_FAT_CATEGORIES.map((cat) => {
									const isActive = cat.label === result.category.label;
									return (
										<div
											key={cat.label}
											class={`p-3 rounded-lg transition-colors ${
												isActive ? "border border-hairline bg-surface-soft" : ""
											}`}
										>
											<div class="flex items-center justify-between">
												<span
													class={`text-body-sm ${isActive ? "text-body-strong" : "text-muted"}`}
												>
													{cat.label}
												</span>
												<span class="text-body-sm text-muted">
													{gender === "male" ? cat.maleRange : cat.femaleRange}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* BMI Comparison */}
					{result.bmi && (
						<div class="bg-surface-elevated rounded-lg p-6">
							<h3 class="text-title-sm text-body-strong mb-3">BMI Comparison</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="p-3 rounded-lg bg-surface-soft text-center">
									<div class="text-title-lg text-primary">{result.bmi.bmi}</div>
									<div class="text-caption text-muted mt-1">BMI</div>
								</div>
								<div class="p-3 rounded-lg bg-surface-soft text-center">
									<div class="text-title-lg text-primary">{result.bmi.category}</div>
									<div class="text-caption text-muted mt-1">BMI Category</div>
								</div>
							</div>
							<p class="text-body-sm text-muted mt-3">
								BMI doesn't distinguish between muscle and fat. Body fat percentage gives a more
								accurate picture of your body composition.
							</p>
						</div>
					)}

					{/* Ideal ranges by age */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-3">Ideal Body Fat by Age</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-body-sm">
								<thead>
									<tr class="border-b border-hairline">
										<th class="text-left text-caption-uppercase text-muted py-2 px-3">Age Range</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">Male</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">Female</th>
									</tr>
								</thead>
								<tbody>
									{IDEAL_RANGES.map((range) => (
										<tr key={range.age} class="border-b border-hairline/50">
											<td class="py-2 px-3 text-muted">{range.age}</td>
											<td class="py-2 px-3 text-right text-primary">{range.male}</td>
											<td class="py-2 px-3 text-right text-primary">{range.female}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{!result && (
				<div class="text-center py-8">
					<p class="text-muted">
						Enter your measurements to calculate body fat percentage using the US Navy method.
					</p>
				</div>
			)}
		</div>
	);
}
