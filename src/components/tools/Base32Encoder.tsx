import { useState, useMemo } from "preact/hooks";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encodeBase32(input: string): string {
	const bytes = new TextEncoder().encode(input);
	let bits = "";
	for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
	let result = "";
	for (let i = 0; i < bits.length; i += 5) {
		const chunk = bits.slice(i, i + 5).padEnd(5, "0");
		result += BASE32_CHARS[Number.parseInt(chunk, 2)];
	}
	const padLen = (8 - (result.length % 8)) % 8;
	return result + "=".repeat(padLen);
}

function decodeBase32(input: string): string {
	const clean = input
		.toUpperCase()
		.replace(/=+$/, "")
		.replace(/[^A-Z2-7]/g, "");
	let bits = "";
	for (const char of clean) {
		const index = BASE32_CHARS.indexOf(char);
		if (index === -1) throw new Error(`Invalid Base32 character: ${char}`);
		bits += index.toString(2).padStart(5, "0");
	}
	const bytes: number[] = [];
	for (let i = 0; i + 8 <= bits.length; i += 8)
		bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
	return new TextDecoder().decode(new Uint8Array(bytes));
}

export default function Base32Encoder() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");

	const result = useMemo(() => {
		if (!input) return "";
		try {
			return mode === "encode" ? encodeBase32(input) : decodeBase32(input);
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
						{mode === "encode" ? "Text Input" : "Base32 Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={mode === "encode" ? "Enter text to encode..." : "JBSWY3DPEHPK3PXP..."}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
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
