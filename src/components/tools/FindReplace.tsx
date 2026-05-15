import { useCallback, useMemo, useState } from "preact/hooks";

export default function FindReplace() {
	const [input, setInput] = useState("");
	const [findText, setFindText] = useState("");
	const [replaceText, setReplaceText] = useState("");
	const [caseSensitive, setCaseSensitive] = useState(false);
	const [wholeWord, setWholeWord] = useState(false);
	const [useRegex, setUseRegex] = useState(false);

	const { result, count, error } = useMemo(() => {
		if (!input || !findText) return { result: input, count: 0, error: "" };

		try {
			let pattern: RegExp;
			if (useRegex) {
				const flags = caseSensitive ? "g" : "gi";
				pattern = new RegExp(findText, flags);
			} else {
				let escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				if (wholeWord) escaped = `\\b${escaped}\\b`;
				const flags = caseSensitive ? "g" : "gi";
				pattern = new RegExp(escaped, flags);
			}

			let matchCount = 0;
			const replaced = input.replace(pattern, (match) => {
				matchCount++;
				return replaceText;
			});

			return { result: replaced, count: matchCount, error: "" };
		} catch (e) {
			return { result: input, count: 0, error: "Invalid regex pattern" };
		}
	}, [input, findText, replaceText, caseSensitive, wholeWord, useRegex]);

	const highlightedPreview = useMemo(() => {
		if (!input || !findText) return input;

		try {
			let pattern: RegExp;
			if (useRegex) {
				const flags = caseSensitive ? "g" : "gi";
				pattern = new RegExp(findText, flags);
			} else {
				let escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				if (wholeWord) escaped = `\\b${escaped}\\b`;
				const flags = caseSensitive ? "g" : "gi";
				pattern = new RegExp(escaped, flags);
			}

			return input.replace(pattern, (match) => `«${match}»`);
		} catch {
			return input;
		}
	}, [input, findText, caseSensitive, wholeWord, useRegex]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	return (
		<div>
			<div class="flex flex-wrap gap-4 mb-4">
				<div class="flex-1" style="min-width: 200px">
					<label class="text-caption-uppercase text-muted block mb-2">Find</label>
					<input
						type="text"
						class="input"
						style="width: 100%"
						placeholder="Text to find..."
						value={findText}
						onInput={(e) => setFindText((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div class="flex-1" style="min-width: 200px">
					<label class="text-caption-uppercase text-muted block mb-2">Replace With</label>
					<input
						type="text"
						class="input"
						style="width: 100%"
						placeholder="Replacement text..."
						value={replaceText}
						onInput={(e) => setReplaceText((e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 mb-4">
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={caseSensitive}
						onChange={(e) => setCaseSensitive((e.target as HTMLInputElement).checked)}
					/>
					Case Sensitive
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={wholeWord}
						onChange={(e) => setWholeWord((e.target as HTMLInputElement).checked)}
					/>
					Whole Word
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={useRegex}
						onChange={(e) => setUseRegex((e.target as HTMLInputElement).checked)}
					/>
					Regex
				</label>
			</div>

			{error && (
				<div
					class="mb-4 rounded-md p-3 text-body-sm"
					style="background: var(--color-error-surface, rgba(220,38,38,0.1)); color: var(--color-error, #dc2626)"
				>
					{error}
				</div>
			)}

			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{count}</div>
					<div class="text-caption-uppercase text-muted mt-1">Replacements</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{input.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Input Length</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{result.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Output Length</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px"
						placeholder="Type or paste your text here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">
							{findText ? "Matches Highlighted" : "Output"}
						</label>
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
						value={findText ? highlightedPreview : result}
						readOnly
						placeholder="Result will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
