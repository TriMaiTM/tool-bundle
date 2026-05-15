import { useCallback, useMemo, useState } from "preact/hooks";

const PRESETS = [40, 60, 80, 100, 120];

export default function TextWrap() {
	const [input, setInput] = useState("");
	const [wrapAt, setWrapAt] = useState(80);
	const [wordBoundary, setWordBoundary] = useState(true);
	const [indentPrefix, setIndentPrefix] = useState("");
	const [unwrap, setUnwrap] = useState(false);

	const result = useMemo(() => {
		if (!input) return "";

		if (unwrap) {
			return input
				.split("\n")
				.map((line) => line.trim())
				.join(" ");
		}

		const lines = input.split("\n");
		const wrappedLines: string[] = [];

		for (const line of lines) {
			if (line.length <= wrapAt) {
				wrappedLines.push(`${indentPrefix}${line}`);
				continue;
			}

			if (wordBoundary) {
				let remaining = line;
				while (remaining.length > wrapAt) {
					let breakPoint = remaining.lastIndexOf(" ", wrapAt);
					if (breakPoint <= 0) breakPoint = wrapAt;
					wrappedLines.push(`${indentPrefix}${remaining.slice(0, breakPoint)}`);
					remaining = remaining.slice(breakPoint).trimStart();
				}
				if (remaining) wrappedLines.push(`${indentPrefix}${remaining}`);
			} else {
				let pos = 0;
				while (pos < line.length) {
					wrappedLines.push(`${indentPrefix}${line.slice(pos, pos + wrapAt)}`);
					pos += wrapAt;
				}
			}
		}

		return wrappedLines.join("\n");
	}, [input, wrapAt, wordBoundary, indentPrefix, unwrap]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	return (
		<div>
			<div class="flex flex-wrap items-end gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Wrap At</label>
					<div class="flex items-center gap-2">
						<input
							type="number"
							class="input"
							style="width: 80px"
							min={1}
							max={9999}
							value={wrapAt}
							onInput={(e) =>
								setWrapAt(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
							}
						/>
						<span class="text-body-sm text-muted">chars</span>
					</div>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Presets</label>
					<div class="flex gap-1">
						{PRESETS.map((p) => (
							<button
								key={p}
								class={`px-2 py-1.5 rounded text-body-sm font-medium transition-colors ${
									wrapAt === p
										? "bg-primary text-on-primary"
										: "bg-surface-elevated text-body hover:text-on-dark"
								}`}
								onClick={() => setWrapAt(p)}
							>
								{p}
							</button>
						))}
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-x-6 gap-y-3 mb-4">
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={wordBoundary}
						onChange={(e) => setWordBoundary((e.target as HTMLInputElement).checked)}
					/>
					Wrap at word boundary
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={unwrap}
						onChange={(e) => setUnwrap((e.target as HTMLInputElement).checked)}
					/>
					Unwrap (join lines)
				</label>
				<label class="flex items-center gap-2 text-body-sm">
					<span class="text-muted">Indent:</span>
					<input
						type="text"
						class="input"
						style="width: 100px"
						placeholder="e.g. 4 spaces"
						value={indentPrefix}
						onInput={(e) => setIndentPrefix((e.target as HTMLInputElement).value)}
					/>
				</label>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Type or paste your text here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Wrapped Output</label>
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
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						value={result}
						readOnly
						placeholder="Wrapped text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
