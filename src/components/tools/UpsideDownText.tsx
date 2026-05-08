import { useState, useMemo } from "preact/hooks";

const FLIP_MAP: Record<string, string> = {
	a: "ɐ",
	b: "q",
	c: "ɔ",
	d: "p",
	e: "ǝ",
	f: "ɟ",
	g: "ƃ",
	h: "ɥ",
	i: "ᴉ",
	j: "ɾ",
	k: "ʞ",
	l: "l",
	m: "ɯ",
	n: "u",
	o: "o",
	p: "d",
	q: "b",
	r: "ɹ",
	s: "s",
	t: "ʇ",
	u: "n",
	v: "ʌ",
	w: "ʍ",
	x: "x",
	y: "ʎ",
	z: "z",
	A: "∀",
	B: "q",
	C: "Ɔ",
	D: "p",
	E: "Ǝ",
	F: "Ⅎ",
	G: "⅁",
	H: "H",
	I: "I",
	J: "ſ",
	K: "ʞ",
	L: "˥",
	M: "W",
	N: "N",
	O: "O",
	P: "Ԁ",
	Q: "Q",
	R: "ɹ",
	S: "S",
	T: "⊥",
	U: "∩",
	V: "Λ",
	W: "M",
	X: "X",
	Y: "⅄",
	Z: "Z",
	"0": "0",
	"1": "Ɩ",
	"2": "ᄅ",
	"3": "Ɛ",
	"4": "ㄣ",
	"5": "ϛ",
	"6": "9",
	"7": "Ɫ",
	"8": "8",
	"9": "6",
	".": "˙",
	",": "'",
	"?": "¿",
	"!": "¡",
	"'": ",",
	'"': ",,",
	"(": ")",
	")": "(",
	"[": "]",
	"]": "[",
	"{": "}",
	"}": "{",
	"<": ">",
	">": "<",
	"&": "⅋",
	_: "‾",
	"^": "∨",
};

export default function UpsideDownText() {
	const [input, setInput] = useState("");
	const [flip, setFlip] = useState(true);

	const result = useMemo(() => {
		if (!input) return "";
		if (!flip) return input;
		return Array.from(input)
			.reverse()
			.map((c) => FLIP_MAP[c] || c)
			.join("");
	}, [input, flip]);

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Text Input</label>
				<textarea
					class="textarea"
					placeholder="Enter text to flip upside down..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>
			<div class="flex items-center gap-3 mb-4">
				<button class={flip ? "btn-primary" : "btn-secondary"} onClick={() => setFlip(!flip)}>
					{flip ? "🔄 Flipped" : "Normal"}
				</button>
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
					style="font-size: 24px; text-align: center;"
					value={result}
					readOnly
					placeholder="Flipped text..."
				/>
			</div>
		</div>
	);
}
