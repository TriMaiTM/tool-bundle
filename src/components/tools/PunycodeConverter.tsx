import { useState, useMemo } from "preact/hooks";

const PUNYCODE_BASE = 36;
const PUNYCODE_TMIN = 1;
const PUNYCODE_TMAX = 26;
const PUNYCODE_SKEW = 38;
const PUNYCODE_DAMP = 700;
const PUNYCODE_INITIAL_BIAS = 72;
const PUNYCODE_INITIAL_N = 128;
const PUNYCODE_DELIMITER = "-";

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
	delta = firstTime ? Math.floor(delta / PUNYCODE_DAMP) : delta >> 1;
	delta += Math.floor(delta / numPoints);
	let k = 0;
	while (delta > ((PUNYCODE_BASE - PUNYCODE_TMIN) * PUNYCODE_TMAX) >> 1) {
		delta = Math.floor(delta / (PUNYCODE_BASE - PUNYCODE_TMIN));
		k += PUNYCODE_BASE;
	}
	return k + Math.floor(((PUNYCODE_BASE - PUNYCODE_TMIN + 1) * delta) / (delta + PUNYCODE_SKEW));
}

function encodePunycode(input: string): string {
	const n = PUNYCODE_INITIAL_N;
	let delta = 0;
	let bias = PUNYCODE_INITIAL_BIAS;
	let output = "";
	const basic = Array.from(input)
		.filter((c) => c.codePointAt(0)! < 128)
		.join("");
	const nonBasic = Array.from(input).filter((c) => c.codePointAt(0)! >= 128);
	const b = basic.length;
	if (b > 0) output = basic + PUNYCODE_DELIMITER;
	let h = b;
	for (const m of nonBasic.sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)) {
		const mCode = m.codePointAt(0)!;
		delta += (mCode - n) * (h + 1);
		for (let q = mCode; q > n; q--) {
			let k = PUNYCODE_BASE;
			const t = Math.max(PUNYCODE_TMIN, Math.min(PUNYCODE_TMAX, k - bias));
			if (delta < t) break;
			const code = t + ((delta - t) % (PUNYCODE_BASE - t));
			output += String.fromCodePoint(code < 26 ? code + 97 : code + 22);
			delta = Math.floor((delta - t) / (PUNYCODE_BASE - t));
			k += PUNYCODE_BASE;
		}
		output += String.fromCodePoint(delta < 26 ? delta + 97 : delta + 22);
		bias = adapt(delta, h + 1, h === b);
		delta = 0;
		h++;
	}
	return `xn--${output}`;
}

function decodePunycode(input: string): string {
	const str = input.startsWith("xn--") ? input.slice(4) : input;
	let n = PUNYCODE_INITIAL_N;
	let i = 0;
	let bias = PUNYCODE_INITIAL_BIAS;
	const output: string[] = [];
	const delimiterIndex = str.lastIndexOf(PUNYCODE_DELIMITER);
	if (delimiterIndex >= 0) {
		output.push(...str.slice(0, delimiterIndex).split(""));
	}
	let inputIndex = delimiterIndex >= 0 ? delimiterIndex + 1 : 0;
	while (inputIndex < str.length) {
		const oldI = i;
		let w = 1;
		let k = PUNYCODE_BASE;
		for (;;) {
			const digit = str.charCodeAt(inputIndex++) - 97;
			i += digit * w;
			const t = Math.max(PUNYCODE_TMIN, Math.min(PUNYCODE_TMAX, k - bias));
			if (digit < t) break;
			w *= PUNYCODE_BASE - t;
			k += PUNYCODE_BASE;
		}
		bias = adapt(i - oldI, output.length + 1, oldI === 0);
		n += Math.floor(i / (output.length + 1));
		i %= output.length + 1;
		output.splice(i++, 0, String.fromCodePoint(n));
	}
	return output.join("");
}

export default function PunycodeConverter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			return mode === "encode" ? encodePunycode(input.trim()) : decodePunycode(input.trim());
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input, mode]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Error")) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result && !result.startsWith("Error")) {
			setInput(result);
			setMode(mode === "encode" ? "decode" : "encode");
		}
	};

	return (
		<div>
			<div class="flex items-center gap-3 mb-4">
				<button
					class={mode === "encode" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("encode")}
				>
					Encode
				</button>
				<button
					class={mode === "decode" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("decode")}
				>
					Decode
				</button>
				<button class="btn-secondary" onClick={handleSwap}>
					⇄ Swap
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "encode" ? "Unicode Domain" : "Punycode Domain"}
					</label>
					<input
						class="input"
						placeholder={mode === "encode" ? "e.g. münchen.de" : "e.g. xn--mnchen-3ya.de"}
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
						{result && !result.startsWith("Error") && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<input class="input" value={result} readOnly placeholder="Result..." />
				</div>
			</div>
		</div>
	);
}
