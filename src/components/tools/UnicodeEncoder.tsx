import { useState } from "preact/hooks";

const BS = String.fromCharCode(92); // backslash character

export default function UnicodeEncoder() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");
	const [format, setFormat] = useState<"unicode" | "hex" | "decimal">("unicode");

	const result = (() => {
		if (!input) return "";
		if (mode === "encode") {
			return Array.from(input)
				.map((char) => {
					const code = char.codePointAt(0)!;
					const hex = code.toString(16).toUpperCase();
					if (format === "hex") return `${BS}u{${hex}}`;
					if (format === "decimal") return `&#${code};`;
					return `${BS}u${hex.padStart(4, "0")}`;
				})
				.join("");
		}
		try {
			return input
				.replace(/\\u\{?([0-9a-fA-F]+)\}?/g, (_, hex) =>
					String.fromCodePoint(Number.parseInt(hex, 16)),
				)
				.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
		} catch {
			return "Invalid input";
		}
	})();

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result) {
			setInput(result);
			setMode(mode === "encode" ? "decode" : "encode");
		}
	};

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
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
				{mode === "encode" && (
					<select
						class="input"
						style="width: auto"
						value={format}
						onChange={(e) =>
							setFormat((e.target as HTMLSelectElement).value as "unicode" | "hex" | "decimal")
						}
					>
						<option value="unicode">{BS}uXXXX</option>
						<option value="hex">
							{BS}u{"{"}XXXX{"}"}
						</option>
						<option value="decimal">&#DDDD;</option>
					</select>
				)}
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "encode" ? "Text Input" : "Unicode Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={
							mode === "encode"
								? "Enter text..."
								: `${BS}u0048${BS}u0065${BS}u006C${BS}u006C${BS}u006F`
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
		</div>
	);
}
