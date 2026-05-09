import { useState, useMemo } from "preact/hooks";

function encodeQuotedPrintable(input: string): string {
	const lines = input.split("\n");
	return lines
		.map((line) => {
			let encoded = "";
			for (let i = 0; i < line.length; i++) {
				const code = line.charCodeAt(i);
				if (code > 126 || code === 61 || code < 32) {
					const bytes = new TextEncoder().encode(line[i]);
					for (const byte of bytes)
						encoded += `=${byte.toString(16).toUpperCase().padStart(2, "0")}`;
				} else {
					encoded += line[i];
				}
			}
			// Soft line breaks for lines > 76 chars
			if (encoded.length > 76) {
				const chunks: string[] = [];
				for (let i = 0; i < encoded.length; i += 75) chunks.push(encoded.slice(i, i + 75));
				return chunks.join("=\n");
			}
			return encoded;
		})
		.join("\n");
}

function decodeQuotedPrintable(input: string): string {
	return input
		.replace(/=\r?\n/g, "")
		.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

export default function QuotedPrintableEncoder() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");

	const result = useMemo(() => {
		if (!input) return "";
		try {
			return mode === "encode" ? encodeQuotedPrintable(input) : decodeQuotedPrintable(input);
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
						{mode === "encode" ? "Text Input" : "Quoted-Printable Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={
							mode === "encode" ? "Enter text (supports UTF-8)..." : "=C3=A9=C3=A0=C3=BC..."
						}
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
