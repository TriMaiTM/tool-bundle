import { useState, useMemo } from "preact/hooks";

const ROMAN_VALUES: [number, string][] = [
	[1000, "M"],
	[900, "CM"],
	[500, "D"],
	[400, "CD"],
	[100, "C"],
	[90, "XC"],
	[50, "L"],
	[40, "XL"],
	[10, "X"],
	[9, "IX"],
	[5, "V"],
	[4, "IV"],
	[1, "I"],
];

function toRoman(num: number): string {
	if (num < 1 || num > 3999) return "Out of range (1-3999)";
	let result = "";
	for (const [value, numeral] of ROMAN_VALUES) {
		while (num >= value) {
			result += numeral;
			num -= value;
		}
	}
	return result;
}

function fromRoman(roman: string): number {
	const s = roman.toUpperCase().trim();
	if (!/^[IVXLCDM]+$/.test(s)) return -1;
	let result = 0;
	let i = 0;
	while (i < s.length) {
		const twoChar = ROMAN_VALUES.find(([_, n]) => s.startsWith(n, i) && n.length === 2);
		if (twoChar) {
			result += twoChar[0];
			i += 2;
		} else {
			const oneChar = ROMAN_VALUES.find(([_, n]) => s[i] === n && n.length === 1);
			if (oneChar) {
				result += oneChar[0];
				i++;
			} else return -1;
		}
	}
	return result;
}

export default function RomanNumeralConverter() {
	const [mode, setMode] = useState<"number-to-roman" | "roman-to-number">("number-to-roman");
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		if (mode === "number-to-roman") {
			const num = Number.parseInt(input, 10);
			return isNaN(num) ? "Invalid number" : toRoman(num);
		}
		const num = fromRoman(input);
		return num === -1 ? "Invalid Roman numeral" : num.toString();
	}, [input, mode]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid") && !result.startsWith("Out"))
			await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="flex items-center gap-3 mb-4">
				<button
					class={mode === "number-to-roman" ? "btn-primary" : "btn-secondary"}
					onClick={() => {
						setMode("number-to-roman");
						setInput("");
					}}
				>
					Number → Roman
				</button>
				<button
					class={mode === "roman-to-number" ? "btn-primary" : "btn-secondary"}
					onClick={() => {
						setMode("roman-to-number");
						setInput("");
					}}
				>
					Roman → Number
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "number-to-roman" ? "Number (1-3999)" : "Roman Numeral"}
					</label>
					<input
						class="input"
						style="font-family: var(--font-mono); font-size: 24px; text-align: center;"
						placeholder={mode === "number-to-roman" ? "2024" : "MMXXIV"}
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
						{result && !result.startsWith("Invalid") && !result.startsWith("Out") && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<div
						class="bg-surface-card rounded-lg p-4 text-center"
						style="min-height: 56px; display: flex; align-items: center; justify-content: center;"
					>
						<span class="text-title-lg" style="font-family: var(--font-mono)">
							{result || "—"}
						</span>
					</div>
				</div>
			</div>
			<details>
				<summary class="text-body-sm text-muted cursor-pointer">Quick Reference</summary>
				<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-2">
					{[1, 5, 10, 50, 100, 500, 1000, 4, 9, 40, 90, 400, 900].map((n) => (
						<div class="text-caption text-muted">
							{n} = <span class="text-body-sm text-on-dark">{toRoman(n)}</span>
						</div>
					))}
				</div>
			</details>
		</div>
	);
}
