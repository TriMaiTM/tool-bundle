import { useCallback, useMemo, useState } from "preact/hooks";

type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ftin";

interface BmiCategory {
	label: string;
	range: string;
	color: string;
	bgColor: string;
}

const BMI_CATEGORIES: BmiCategory[] = [
	{
		label: "Underweight",
		range: "< 18.5",
		color: "text-accent-blue",
		bgColor: "bg-accent-blue",
	},
	{
		label: "Normal",
		range: "18.5 – 24.9",
		color: "text-accent-emerald",
		bgColor: "bg-accent-emerald",
	},
	{
		label: "Overweight",
		range: "25 – 29.9",
		color: "text-warning",
		bgColor: "bg-warning",
	},
	{
		label: "Obese",
		range: "≥ 30",
		color: "text-accent-rose",
		bgColor: "bg-accent-rose",
	},
];

function getBmiCategory(bmi: number): BmiCategory {
	if (bmi < 18.5) return BMI_CATEGORIES[0];
	if (bmi < 25) return BMI_CATEGORIES[1];
	if (bmi < 30) return BMI_CATEGORIES[2];
	return BMI_CATEGORIES[3];
}

function getBmiPosition(bmi: number): number {
	// Map BMI 10-40 to 0-100%
	const clamped = Math.max(10, Math.min(40, bmi));
	return ((clamped - 10) / 30) * 100;
}

export default function BmiCalculator() {
	const [weight, setWeight] = useState("");
	const [height, setHeight] = useState("");
	const [feet, setFeet] = useState("");
	const [inches, setInches] = useState("");
	const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
	const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

	const bmi = useMemo(() => {
		const w = Number.parseFloat(weight);
		let hCm: number | null = null;

		if (heightUnit === "cm") {
			const h = Number.parseFloat(height);
			if (!Number.isNaN(h) && h > 0) hCm = h;
		} else {
			const f = Number.parseFloat(feet);
			const i = Number.parseFloat(inches);
			const totalInches = (Number.isNaN(f) ? 0 : f * 12) + (Number.isNaN(i) ? 0 : i);
			if (totalInches > 0) hCm = totalInches * 2.54;
		}

		if (Number.isNaN(w) || w <= 0 || hCm === null || hCm <= 0) return null;

		// Convert weight to kg if needed
		const wKg = weightUnit === "lb" ? w * 0.453592 : w;
		const hM = hCm / 100;

		return wKg / (hM * hM);
	}, [weight, height, feet, inches, weightUnit, heightUnit]);

	const category = bmi !== null ? getBmiCategory(bmi) : null;
	const position = bmi !== null ? getBmiPosition(bmi) : null;

	const handleWeightUnitChange = useCallback(
		(unit: WeightUnit) => {
			const currentWeight = Number.parseFloat(weight);
			if (!Number.isNaN(currentWeight) && weight.trim() !== "") {
				if (unit === "lb" && weightUnit === "kg") {
					setWeight((currentWeight * 2.20462).toFixed(2));
				} else if (unit === "kg" && weightUnit === "lb") {
					setWeight((currentWeight / 2.20462).toFixed(2));
				}
			}
			setWeightUnit(unit);
		},
		[weight, weightUnit],
	);

	const handleHeightUnitChange = useCallback(
		(unit: HeightUnit) => {
			setHeightUnit(unit);
			if (unit === "ftin" && heightUnit === "cm") {
				const hCm = Number.parseFloat(height);
				if (!Number.isNaN(hCm) && hCm > 0) {
					const totalInches = hCm / 2.54;
					setFeet(Math.floor(totalInches / 12).toString());
					setInches(Math.round(totalInches % 12).toString());
				}
			} else if (unit === "cm" && heightUnit === "ftin") {
				const f = Number.parseFloat(feet);
				const i = Number.parseFloat(inches);
				const totalInches = (Number.isNaN(f) ? 0 : f * 12) + (Number.isNaN(i) ? 0 : i);
				if (totalInches > 0) {
					setHeight((totalInches * 2.54).toFixed(1));
				}
			}
		},
		[height, feet, inches, heightUnit],
	);

	return (
		<div class="space-y-6">
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					{/* Weight input */}
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

					{/* Height input */}
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
									onClick={() => handleHeightUnitChange("cm")}
								>
									cm
								</button>
								<button
									class={`px-3 py-1 text-body-sm font-medium transition-colors ${
										heightUnit === "ftin"
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => handleHeightUnitChange("ftin")}
								>
									ft/in
								</button>
							</div>
						</div>
						{heightUnit === "cm" ? (
							<input
								type="number"
								class="input w-full"
								placeholder="e.g. 175"
								value={height}
								onInput={(e) => setHeight((e.target as HTMLInputElement).value)}
							/>
						) : (
							<div class="grid grid-cols-2 gap-2">
								<input
									type="number"
									class="input w-full"
									placeholder="Feet"
									value={feet}
									onInput={(e) => setFeet((e.target as HTMLInputElement).value)}
								/>
								<input
									type="number"
									class="input w-full"
									placeholder="Inches"
									value={inches}
									onInput={(e) => setInches((e.target as HTMLInputElement).value)}
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Results */}
			{bmi !== null && category && (
				<div class="space-y-4">
					{/* BMI Value */}
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class={`text-title-lg ${category.color}`}>{bmi.toFixed(1)}</div>
							<div class="text-caption text-muted mt-1">BMI</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class={`text-title-lg ${category.color}`}>{category.label}</div>
							<div class="text-caption text-muted mt-1">Category</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">
								{bmi < 18.5
									? (18.5 - bmi).toFixed(1)
									: bmi > 24.9
										? (bmi - 24.9).toFixed(1)
										: "0.0"}
							</div>
							<div class="text-caption text-muted mt-1">
								{bmi < 18.5
									? "kg/m² to Normal"
									: bmi > 24.9
										? "kg/m² above Normal"
										: "Within Range"}
							</div>
						</div>
					</div>

					{/* Visual BMI Scale */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">BMI Scale</h3>
						<div class="relative mt-8 mb-4">
							{/* Color bar */}
							<div class="flex h-4 rounded-full overflow-hidden">
								<div class="bg-accent-blue" style="flex: 8.5" />
								<div class="bg-accent-emerald" style="flex: 6.4" />
								<div class="bg-warning" style="flex: 5" />
								<div class="bg-accent-rose" style="flex: 10.1" />
							</div>
							{/* Indicator */}
							{position !== null && (
								<div class="absolute top-0 -translate-x-1/2" style={`left: ${position}%`}>
									<div class="w-0.5 h-4 bg-white" style="margin: 0 auto" />
									<div
										class="bg-surface-card border border-hairline rounded px-2 py-1 text-body-sm text-primary text-center -mt-0.5"
										style="transform: translateX(-50%); min-width: 50px; margin-left: 0; position: relative; left: 50%;"
									>
										{bmi.toFixed(1)}
									</div>
								</div>
							)}
						</div>
						{/* Labels */}
						<div class="flex text-caption text-muted mt-2">
							<div style="flex: 8.5" class="text-center">
								Underweight
							</div>
							<div style="flex: 6.4" class="text-center">
								Normal
							</div>
							<div style="flex: 5" class="text-center">
								Overweight
							</div>
							<div style="flex: 10.1" class="text-center">
								Obese
							</div>
						</div>
					</div>

					{/* Category reference */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-3">BMI Categories</h3>
						<div class="space-y-2">
							{BMI_CATEGORIES.map((cat) => (
								<div
									key={cat.label}
									class={`flex items-center justify-between p-3 rounded-lg ${
										cat.label === category.label ? "border border-hairline bg-surface-soft" : ""
									}`}
								>
									<div class="flex items-center gap-3">
										<div class={`w-3 h-3 rounded-full ${cat.bgColor}`} />
										<span class="text-body-sm text-body-strong">{cat.label}</span>
									</div>
									<span class="text-body-sm text-muted">{cat.range}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
