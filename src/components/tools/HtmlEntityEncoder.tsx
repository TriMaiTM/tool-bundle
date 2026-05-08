import { useState, useCallback } from "preact/hooks";

export default function HtmlEntityEncoder() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");

	const result = (() => {
		if (!input) return "";
		if (mode === "encode") {
			return input
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;")
				.replace(/[\u0080-\uFFFF]/g, (c) => `&#${c.charCodeAt(0)};`);
		}
		const textarea = document.createElement("textarea");
		textarea.innerHTML = input;
		return textarea.value;
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
						{mode === "encode" ? "Text Input" : "HTML Entity Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={
							mode === "encode" ? "Enter text to encode..." : "Enter &amp; &lt; &#39; etc..."
						}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">
							{mode === "encode" ? "Encoded Output" : "Decoded Output"}
						</label>
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
