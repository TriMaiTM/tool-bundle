import { useState, useMemo, useCallback } from "preact/hooks";

type Gender = "male" | "female";
type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ftin";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";

interface ActivityOption {
  value: ActivityLevel;
  label: string;
  multiplier: number;
}

const ACTIVITY_LEVELS: ActivityOption[] = [
  { value: "sedentary", label: "Sedentary (little or no exercise)", multiplier: 1.2 },
  { value: "light", label: "Lightly Active (1–3 days/week)", multiplier: 1.375 },
  { value: "moderate", label: "Moderately Active (3–5 days/week)", multiplier: 1.55 },
  { value: "very", label: "Very Active (6–7 days/week)", multiplier: 1.725 },
  { value: "extra", label: "Extra Active (physical job + exercise)", multiplier: 1.9 },
];

function getMultiplier(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((a) => a.value === level)?.multiplier ?? 1.2;
}

export default function CalorieCalculator() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [height, setHeight] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  const handleWeightUnitChange = useCallback(
    (unit: WeightUnit) => {
      const current = parseFloat(weight);
      if (!isNaN(current) && weight.trim() !== "") {
        if (unit === "lb" && weightUnit === "kg") {
          setWeight((current * 2.20462).toFixed(1));
        } else if (unit === "kg" && weightUnit === "lb") {
          setWeight((current / 2.20462).toFixed(1));
        }
      }
      setWeightUnit(unit);
    },
    [weight, weightUnit]
  );

  const handleHeightUnitChange = useCallback(
    (unit: HeightUnit) => {
      if (unit === "ftin" && heightUnit === "cm") {
        const hCm = parseFloat(height);
        if (!isNaN(hCm) && hCm > 0) {
          const totalInches = hCm / 2.54;
          setFeet(Math.floor(totalInches / 12).toString());
          setInches(Math.round(totalInches % 12).toString());
        }
      } else if (unit === "cm" && heightUnit === "ftin") {
        const f = parseFloat(feet);
        const i = parseFloat(inches);
        const totalInches = (isNaN(f) ? 0 : f * 12) + (isNaN(i) ? 0 : i);
        if (totalInches > 0) {
          setHeight((totalInches * 2.54).toFixed(1));
        }
      }
      setHeightUnit(unit);
    },
    [height, feet, inches, heightUnit]
  );

  const result = useMemo(() => {
    const a = parseFloat(age);
    const w = parseFloat(weight);
    let hCm: number | null = null;

    if (heightUnit === "cm") {
      const h = parseFloat(height);
      if (!isNaN(h) && h > 0) hCm = h;
    } else {
      const f = parseFloat(feet);
      const i = parseFloat(inches);
      const totalInches = (isNaN(f) ? 0 : f * 12) + (isNaN(i) ? 0 : i);
      if (totalInches > 0) hCm = totalInches * 2.54;
    }

    if (isNaN(a) || a <= 0 || isNaN(w) || w <= 0 || hCm === null || hCm <= 0) {
      return null;
    }

    const wKg = weightUnit === "lb" ? w * 0.453592 : w;
    const multiplier = getMultiplier(activityLevel);

    // Mifflin-St Jeor
    const bmr =
      gender === "male"
        ? 10 * wKg + 6.25 * hCm - 5 * a + 5
        : 10 * wKg + 6.25 * hCm - 5 * a - 161;

    const tdee = bmr * multiplier;
    const weightLoss = tdee - 500;
    const weightGain = tdee + 500;

    // Macros (30% protein / 25% fat / 45% carbs)
    const proteinCal = tdee * 0.3;
    const fatCal = tdee * 0.25;
    const carbCal = tdee * 0.45;

    const proteinGrams = proteinCal / 4; // 4 cal/g
    const fatGrams = fatCal / 9; // 9 cal/g
    const carbGrams = carbCal / 4; // 4 cal/g

    // Fun equivalents
    const pizzaSlices = Math.round(tdee / 285); // ~285 cal per slice
    const bananas = Math.round(tdee / 105); // ~105 cal per banana

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      weightLoss: Math.round(weightLoss),
      weightGain: Math.round(weightGain),
      protein: { grams: Math.round(proteinGrams), cal: Math.round(proteinCal), pct: 30 },
      fat: { grams: Math.round(fatGrams), cal: Math.round(fatCal), pct: 25 },
      carbs: { grams: Math.round(carbGrams), cal: Math.round(carbCal), pct: 45 },
      pizzaSlices,
      bananas,
    };
  }, [age, gender, weight, weightUnit, height, feet, inches, heightUnit, activityLevel]);

  return (
    <div class="space-y-6">
      {/* Input Section */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Age */}
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Age</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 30"
              value={age}
              onInput={(e) => setAge((e.target as HTMLInputElement).value)}
            />
          </div>

          {/* Gender */}
          <div>
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

        {/* Activity Level */}
        <div class="mt-6">
          <label class="text-caption-uppercase text-muted block mb-2">Activity Level</label>
          <select
            class="input w-full"
            value={activityLevel}
            onChange={(e) => setActivityLevel((e.target as HTMLSelectElement).value as ActivityLevel)}
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div class="space-y-4">
          {/* Main calorie numbers */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{result.bmr.toLocaleString()}</div>
              <div class="text-caption text-muted mt-1">BMR (cal/day)</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{result.tdee.toLocaleString()}</div>
              <div class="text-caption text-muted mt-1">Maintenance (TDEE)</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-emerald">{result.weightLoss.toLocaleString()}</div>
              <div class="text-caption text-muted mt-1">Weight Loss (−500)</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-rose">{result.weightGain.toLocaleString()}</div>
              <div class="text-caption text-muted mt-1">Weight Gain (+500)</div>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">Macronutrient Breakdown (at maintenance)</h3>

            {/* Visual bar */}
            <div class="flex h-6 rounded-full overflow-hidden mb-4">
              <div class="bg-accent-blue" style="flex: 30" title="Protein 30%"></div>
              <div class="bg-warning" style="flex: 25" title="Fat 25%"></div>
              <div class="bg-accent-emerald" style="flex: 45" title="Carbs 45%"></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3 rounded-lg bg-surface-soft">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-3 h-3 rounded-full bg-accent-blue"></div>
                  <span class="text-body-sm text-body-strong">Protein ({result.protein.pct}%)</span>
                </div>
                <div class="text-title-lg text-primary">{result.protein.grams}g</div>
                <div class="text-caption text-muted">{result.protein.cal.toLocaleString()} cal</div>
              </div>
              <div class="p-3 rounded-lg bg-surface-soft">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-3 h-3 rounded-full bg-warning"></div>
                  <span class="text-body-sm text-body-strong">Fat ({result.fat.pct}%)</span>
                </div>
                <div class="text-title-lg text-primary">{result.fat.grams}g</div>
                <div class="text-caption text-muted">{result.fat.cal.toLocaleString()} cal</div>
              </div>
              <div class="p-3 rounded-lg bg-surface-soft">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-3 h-3 rounded-full bg-accent-emerald"></div>
                  <span class="text-body-sm text-body-strong">Carbs ({result.carbs.pct}%)</span>
                </div>
                <div class="text-title-lg text-primary">{result.carbs.grams}g</div>
                <div class="text-caption text-muted">{result.carbs.cal.toLocaleString()} cal</div>
              </div>
            </div>
          </div>

          {/* Fun Equivalents */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-3">That's about...</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex items-center justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm">🍕 Slices of pizza</span>
                <span class="badge badge-yellow">{result.pizzaSlices} slices</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm">🍌 Bananas</span>
                <span class="badge badge-yellow">{result.bananas} bananas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div class="text-center py-8">
          <p class="text-muted">Enter your details to calculate your daily calorie needs.</p>
        </div>
      )}
    </div>
  );
}
