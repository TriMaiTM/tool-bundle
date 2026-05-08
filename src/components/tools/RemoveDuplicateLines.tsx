import { useCallback, useMemo, useState } from "preact/hooks";

export default function RemoveDuplicateLines() {
	const [input, setInput] = useState("");
	const [caseSensitive, setCaseSensitive] = useState(true);
	const [trimWhitespace, setTrimWhitespace] = useState(false);
	const [keepEmptyLines, setKeepEmptyLines] = useState(false);

	const result = useMemo(() => {
		if (!input) return { text: "", original: 0, duplicates: 0, remaining: 0 };

		const lines = input.split("\n");
		const original = lines.length;
		const seen = new Set<string>();
		const output: string[] = [];
		let duplicates = 0;

		for (const line of lines) {
			const isEmpty = line.trim() === "";
			if (isEmpty && !keepEmptyLines) {
				duplicates++;
				continue;
			}

			const key = trimWhitespace
				? caseSensitive
					? line.trim()
					: line.trim().toLowerCase()
				: caseSensitive
					? line
					: line.toLowerCase();

			if (seen.has(key)) {
				duplicates++;
			} else {
				seen.add(key);
				output.push(line);
			}
		}

		return {
			text: output.join("\n"),
			original,
			duplicates,
			remaining: output.length,
		};
	}, [input, caseSensitive, trimWhitespace, keepEmptyLines]);

	const handleCopy = useCallback(async () => {
		if (result.text) await navigator.clipboard.writeText(result.text);
	}, [result.text]);

	return (
		<div>
			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{result.original}</div>
					<div class="text-caption-uppercase text-muted mt-1">Original Lines</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{result.duplicates}</div>
					<div class="text-caption-uppercase text-muted mt-1">Duplicates Removed</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{result.remaining}</div>
					<div class="text-caption-uppercase text-muted mt-1">Remaining Lines</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 mb-4">
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={caseSensitive}
						onChange={(e) => setCaseSensitive((e.target as HTMLInputElement).checked)}
					/>
					Case sensitive
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={trimWhitespace}
						onChange={(e) => setTrimWhitespace((e.target as HTMLInputElement).checked)}
					/>
					Trim whitespace
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={keepEmptyLines}
						onChange={(e) => setKeepEmptyLines((e.target as HTMLInputElement).checked)}
					/>
					Keep empty lines
				</label>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your text with duplicate lines here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Output</label>
						{result.text && (
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
						value={result.text}
						readOnly
						placeholder="Deduplicated text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
