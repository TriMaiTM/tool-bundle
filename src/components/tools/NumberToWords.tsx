import { useState, useMemo } from "preact/hooks";

const ONES = [
	"",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
	"thirteen",
	"fourteen",
	"fifteen",
	"sixteen",
	"seventeen",
	"eighteen",
	"nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

function numberToWords(num: number): string {
	if (num === 0) return "zero";
	if (num < 0) return `minus ${numberToWords(-num)}`;

	const intPart = Math.floor(Math.abs(num));
	const decPart = Math.round((Math.abs(num) - intPart) * 100);

	let result = "";
	let scaleIndex = 0;
	let n = intPart;

	while (n > 0) {
		const chunk = n % 1000;
		if (chunk > 0) {
			let chunkStr = "";
			if (chunk >= 100) {
				chunkStr += `${ONES[Math.floor(chunk / 100)]} hundred `;
			}
			const remainder = chunk % 100;
			if (remainder >= 20) {
				chunkStr += TENS[Math.floor(remainder / 10)];
				if (remainder % 10 > 0) chunkStr += `-${ONES[remainder % 10]}`;
			} else if (remainder > 0) {
				chunkStr += ONES[remainder];
			}
			result =
				chunkStr.trim() +
				(SCALES[scaleIndex] ? ` ${SCALES[scaleIndex]}` : "") +
				(result ? ` ${result}` : "");
		}
		n = Math.floor(n / 1000);
		scaleIndex++;
	}

	if (decPart > 0) {
		result += " point";
		if (decPart < 10) result += ` ${ONES[decPart]} zero`;
		else {
			const tens = Math.floor(decPart / 10);
			const ones = decPart % 10;
			if (tens >= 2) {
				result += ` ${TENS[tens]}`;
				if (ones > 0) result += ` ${ONES[ones]}`;
			} else result += ` ${ONES[decPart]}`;
		}
	}

	return result.trim();
}

export default function NumberToWords() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const num = Number.parseFloat(input.trim().replace(/,/g, ""));
		if (isNaN(num)) return "Invalid number";
		return numberToWords(num);
	}, [input]);

	const handleCopy = async () => {
		if (result && result !== "Invalid number") await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Number Input</label>
				<input
					class="input"
					style="font-size: 24px; text-align: center;"
					type="text"
					placeholder="Enter a number (e.g. 12345)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
				/>
			</div>
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">In Words</label>
					{result && result !== "Invalid number" && (
						<button
							class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
							onClick={handleCopy}
						>
							Copy
						</button>
					)}
				</div>
				<div
					class="bg-surface-card rounded-lg p-6 text-center"
					style="min-height: 80px; display: flex; align-items: center; justify-content: center;"
				>
					<p class="text-title-md" style="text-transform: capitalize;">
						{result || "\u2014"}
					</p>
				</div>
			</div>
			<div class="text-caption text-muted mt-2">
				Supports integers and decimals up to trillions.
			</div>
		</div>
	);
}
