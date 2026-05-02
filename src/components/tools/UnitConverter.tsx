import { useState, useCallback, useMemo } from "preact/hooks";

type Category = "length" | "weight" | "temperature" | "speed" | "data";

interface UnitDef {
  name: string;
  abbr: string;
}

const CATEGORIES: Record<Category, { label: string; units: UnitDef[] }> = {
  length: {
    label: "Length",
    units: [
      { name: "Millimeters", abbr: "mm" },
      { name: "Centimeters", abbr: "cm" },
      { name: "Meters", abbr: "m" },
      { name: "Kilometers", abbr: "km" },
      { name: "Inches", abbr: "in" },
      { name: "Feet", abbr: "ft" },
      { name: "Yards", abbr: "yd" },
      { name: "Miles", abbr: "mi" },
    ],
  },
  weight: {
    label: "Weight",
    units: [
      { name: "Milligrams", abbr: "mg" },
      { name: "Grams", abbr: "g" },
      { name: "Kilograms", abbr: "kg" },
      { name: "Pounds", abbr: "lb" },
      { name: "Ounces", abbr: "oz" },
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { name: "Celsius", abbr: "°C" },
      { name: "Fahrenheit", abbr: "°F" },
      { name: "Kelvin", abbr: "K" },
    ],
  },
  speed: {
    label: "Speed",
    units: [
      { name: "km/h", abbr: "km/h" },
      { name: "mph", abbr: "mph" },
      { name: "m/s", abbr: "m/s" },
    ],
  },
  data: {
    label: "Data",
    units: [
      { name: "Bytes", abbr: "B" },
      { name: "Kilobytes", abbr: "KB" },
      { name: "Megabytes", abbr: "MB" },
      { name: "Gigabytes", abbr: "GB" },
      { name: "Terabytes", abbr: "TB" },
    ],
  },
};

// Conversion factors to base unit for each category
// Length: base = meters
const LENGTH_TO_M: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

// Weight: base = grams
const WEIGHT_TO_G: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
};

// Speed: base = m/s
const SPEED_TO_MS: Record<string, number> = {
  "km/h": 1 / 3.6,
  mph: 0.44704,
  "m/s": 1,
};

// Data: base = bytes
const DATA_TO_B: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

function convertTemperature(value: number, from: string, to: string): number {
  if (from === to) return value;
  // Convert to Celsius first
  let celsius: number;
  if (from === "°C") celsius = value;
  else if (from === "°F") celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15; // Kelvin

  // Convert from Celsius to target
  if (to === "°C") return celsius;
  if (to === "°F") return celsius * (9 / 5) + 32;
  return celsius + 273.15; // Kelvin
}

function convert(category: Category, value: number, from: string, to: string): number {
  if (from === to) return value;

  if (category === "temperature") {
    return convertTemperature(value, from, to);
  }

  let factors: Record<string, number>;
  switch (category) {
    case "length":
      factors = LENGTH_TO_M;
      break;
    case "weight":
      factors = WEIGHT_TO_G;
      break;
    case "speed":
      factors = SPEED_TO_MS;
      break;
    case "data":
      factors = DATA_TO_B;
      break;
    default:
      return value;
  }

  const baseValue = value * factors[from];
  return baseValue / factors[to];
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>("length");
  const [inputValue, setInputValue] = useState("");
  const [fromUnit, setFromUnit] = useState(0);
  const [toUnit, setToUnit] = useState(1);

  const units = CATEGORIES[category].units;

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    setFromUnit(0);
    setToUnit(1);
    setInputValue("");
  }, []);

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return null;
    const from = units[fromUnit].abbr;
    const to = units[toUnit].abbr;
    return convert(category, val, from, to);
  }, [inputValue, category, fromUnit, toUnit, units]);

  const handleSwap = useCallback(() => {
    const tmp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tmp);
  }, [fromUnit, toUnit]);

  const formatResult = (n: number): string => {
    if (Number.isInteger(n)) return n.toLocaleString();
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(6);
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  const categoryKeys = Object.keys(CATEGORIES) as Category[];

  return (
    <div>
      {/* Category tabs */}
      <div class="flex flex-wrap gap-2 mb-6">
        {categoryKeys.map((cat) => (
          <button
            key={cat}
            class={`px-4 py-2 text-body-sm font-medium rounded-lg transition-colors ${
              category === cat
                ? "bg-primary text-on-primary"
                : "bg-surface-elevated text-body hover:text-on-dark"
            }`}
            onClick={() => handleCategoryChange(cat)}
          >
            {CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* From */}
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">From</label>
            <select
              class="input w-full mb-3"
              value={fromUnit}
              onChange={(e) => setFromUnit(parseInt((e.target as HTMLSelectElement).value))}
            >
              {units.map((u, i) => (
                <option key={u.abbr} value={i}>
                  {u.name} ({u.abbr})
                </option>
              ))}
            </select>
            <input
              type="number"
              class="input w-full"
              placeholder="Enter value"
              value={inputValue}
              onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            />
          </div>

          {/* Swap button */}
          <div class="flex justify-center pb-1">
            <button
              class="btn-secondary p-2 rounded-full"
              onClick={handleSwap}
              title="Swap units"
              style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center"
            >
              ⇄
            </button>
          </div>

          {/* To */}
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">To</label>
            <select
              class="input w-full mb-3"
              value={toUnit}
              onChange={(e) => setToUnit(parseInt((e.target as HTMLSelectElement).value))}
            >
              {units.map((u, i) => (
                <option key={u.abbr} value={i}>
                  {u.name} ({u.abbr})
                </option>
              ))}
            </select>
            <div class="input w-full flex items-center" style="min-height: 40px; cursor: default; opacity: 0.85">
              {result !== null ? formatResult(result) : "—"}
            </div>
          </div>
        </div>

        {/* Result stat box */}
        {result !== null && inputValue.trim() !== "" && (
          <div class="mt-6 bg-surface-elevated rounded-lg p-3 text-center border border-hairline">
            <div class="text-title-lg text-primary">
              {formatResult(parseFloat(inputValue))} {units[fromUnit].abbr} = {formatResult(result)} {units[toUnit].abbr}
            </div>
          </div>
        )}
      </div>

      {/* Quick reference table */}
      {result !== null && inputValue.trim() !== "" && (
        <div class="mt-6">
          <h3 class="text-title-sm text-body-strong mb-3">Quick Reference</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-body-sm">
              <thead>
                <tr class="border-b border-hairline">
                  <th class="text-left text-caption-uppercase text-muted py-2 px-3">{units[fromUnit].abbr}</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">{units[toUnit].abbr}</th>
                </tr>
              </thead>
              <tbody>
                {[1, 5, 10, 25, 50, 100, 1000].map((val) => (
                  <tr key={val} class="border-b border-hairline/50">
                    <td class="py-2 px-3 text-body">{val.toLocaleString()}</td>
                    <td class="py-2 px-3 text-right text-primary">
                      {formatResult(convert(category, val, units[fromUnit].abbr, units[toUnit].abbr))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
