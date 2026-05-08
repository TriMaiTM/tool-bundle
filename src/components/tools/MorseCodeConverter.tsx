import { useState, useMemo } from "preact/hooks";

const MORSE_MAP: Record<string, string> = {
	A: ".-",
	B: "-...",
	C: "-.-.",
	D: "-..",
	E: ".",
	F: "..-.",
	G: "--.",
	H: "....",
	I: "..",
	J: ".---",
	K: "-.-",
	L: ".-..",
	M: "--",
	N: "-.",
	O: "---",
	P: ".--.",
	Q: "--.-",
	R: ".-.",
	S: "...",
	T: "-",
	U: "..-",
	V: "...-",
	W: ".--",
	X: "-..-",
	Y: "-.--",
	Z: "--..",
	"0": "-----",
	"1": ".----",
	"2": "..---",
	"3": "...--",
	"4": "....-",
	"5": ".....",
	"6": "-....",
	"7": "--...",
	"8": "---..",
	"9": "----.",
	".": ".-.-.-",
	",": "--..--",
	"?": "..--..",
	"!": "-.-.--",
	"/": "-..-.",
	"(": "-.--.",
	")": "-.--.-",
	"&": ".-...",
	":": "---...",
	";": "-.-.-.",
	"=": "-...-",
	"+": ".-.-.",
	"-": "-....-",
	_: "..--.-",
	'"': ".-..-.",
	$: "...-..-",
	"@": ".--.-.",
};

const REVERSE_MAP = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

export default function MorseCodeConverter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"text-to-morse" | "morse-to-text">("text-to-morse");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		if (mode === "text-to-morse") {
			return input
				.toUpperCase()
				.split("")
				.map((c) => (c === " " ? "/" : MORSE_MAP[c] || ""))
				.filter(Boolean)
				.join(" ");
		}
		return input
			.trim()
			.split(/\s*\/\s*/)
			.map((word) =>
				word
					.split(/\s+/)
					.map((code) => REVERSE_MAP[code] || "?")
					.join(""),
			)
			.join(" ");
	}, [input, mode]);

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result) {
			setInput(result);
			setMode(mode === "text-to-morse" ? "morse-to-text" : "text-to-morse");
		}
	};

	return (
		<div>
			<div class="flex items-center gap-3 mb-4">
				<button
					class={mode === "text-to-morse" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("text-to-morse")}
				>
					Text → Morse
				</button>
				<button
					class={mode === "morse-to-text" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("morse-to-text")}
				>
					Morse → Text
				</button>
				<button class="btn-secondary" onClick={handleSwap}>
					⇄ Swap
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "text-to-morse"
							? "Text Input"
							: "Morse Input (space-separated, / for word break)"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={
							mode === "text-to-morse" ? "Enter text..." : ".-.. --- ...- . / -... --- -"
						}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
						{result && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="Result..."
					/>
				</div>
			</div>
			<details class="mt-4">
				<summary class="text-body-sm text-muted cursor-pointer">Morse Code Reference</summary>
				<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
					{Object.entries(MORSE_MAP)
						.slice(0, 36)
						.map(([char, morse]) => (
							<div class="text-caption text-muted">
								<span class="text-body-sm text-on-dark">{char}</span> {morse}
							</div>
						))}
				</div>
			</details>
		</div>
	);
}
