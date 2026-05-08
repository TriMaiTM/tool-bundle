import { useCallback, useMemo, useState } from "preact/hooks";

type Mode = "characters" | "words" | "lines";

export default function TextReverser() {
	const [text, setText] = useState("");
	const [mode, setMode] = useState<Mode>("characters");

	const result = useMemo(() => {
		if (!text) return "";
		if (mode === "characters") return text.split("").reverse().join("");
		if (mode === "words") return text.split(/\s+/).reverse().join(" ");
		return text.split("\n").reverse().join("\n");
	}, [text, mode]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	return (
		<div>
			<div
				class="flex rounded-md overflow-hidden border border-hairline mb-6"
				style="width: fit-content"
			>
				{(["characters", "words", "lines"] as Mode[]).map((m) => (
					<button
						key={m}
						class={`px-4 py-2 text-body-sm font-medium transition-colors capitalize ${mode === m ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode(m)}
					>
						Reverse {m}
					</button>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px"
						placeholder="Type or paste your text here..."
						value={text}
						onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Reversed</label>
						{result && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 250px"
						value={result}
						readOnly
						placeholder="Reversed text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
