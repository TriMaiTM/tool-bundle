import { useCallback, useMemo, useState } from "preact/hooks";

export default function WhitespaceRemover() {
	const [input, setInput] = useState("");
	const [trimLines, setTrimLines] = useState(true);
	const [collapseSpaces, setCollapseSpaces] = useState(false);
	const [removeBlankLines, setRemoveBlankLines] = useState(false);
	const [removeAllWhitespace, setRemoveAllWhitespace] = useState(false);
	const [tabsToSpaces, setTabsToSpaces] = useState(false);
	const [spacesToTabs, setSpacesToTabs] = useState(false);

	const result = useMemo(() => {
		if (!input) return { text: "", linesRemoved: 0, spacesRemoved: 0 };

		const originalLength = input.length;
		let text = input;

		if (removeAllWhitespace) {
			const cleaned = text.replace(/\s/g, "");
			return {
				text: cleaned,
				linesRemoved: 0,
				spacesRemoved: originalLength - cleaned.length,
			};
		}

		if (tabsToSpaces) {
			text = text.replace(/\t/g, "    ");
		}

		if (spacesToTabs) {
			text = text.replace(/ {4}/g, "\t");
		}

		let lines = text.split("\n");
		const originalLineCount = lines.length;

		if (trimLines) {
			lines = lines.map((line) => line.trim());
		}

		if (collapseSpaces) {
			lines = lines.map((line) => line.replace(/ {2,}/g, " "));
		}

		if (removeBlankLines) {
			lines = lines.filter((line) => line.trim() !== "");
		}

		const resultText = lines.join("\n");
		const linesRemoved = originalLineCount - lines.length;
		const spacesRemoved = input.replace(/\s/g, "").length - resultText.replace(/\s/g, "").length;

		return {
			text: resultText,
			linesRemoved: Math.max(0, linesRemoved),
			spacesRemoved: Math.max(0, spacesRemoved),
		};
	}, [
		input,
		trimLines,
		collapseSpaces,
		removeBlankLines,
		removeAllWhitespace,
		tabsToSpaces,
		spacesToTabs,
	]);

	const handleCopy = useCallback(async () => {
		if (result.text) await navigator.clipboard.writeText(result.text);
	}, [result.text]);

	return (
		<div>
			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{input.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Input Length</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{result.text.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Output Length</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{input.length - result.text.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Chars Removed</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-x-6 gap-y-3 mb-4">
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={trimLines}
						onChange={(e) => setTrimLines((e.target as HTMLInputElement).checked)}
					/>
					Trim lines
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={collapseSpaces}
						onChange={(e) => setCollapseSpaces((e.target as HTMLInputElement).checked)}
					/>
					Collapse spaces
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={removeBlankLines}
						onChange={(e) => setRemoveBlankLines((e.target as HTMLInputElement).checked)}
					/>
					Remove blank lines
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={removeAllWhitespace}
						onChange={(e) => setRemoveAllWhitespace((e.target as HTMLInputElement).checked)}
					/>
					Remove all whitespace
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={tabsToSpaces}
						onChange={(e) => {
							setTabsToSpaces((e.target as HTMLInputElement).checked);
							if ((e.target as HTMLInputElement).checked) setSpacesToTabs(false);
						}}
					/>
					Tabs → Spaces
				</label>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer">
					<input
						type="checkbox"
						checked={spacesToTabs}
						onChange={(e) => {
							setSpacesToTabs((e.target as HTMLInputElement).checked);
							if ((e.target as HTMLInputElement).checked) setTabsToSpaces(false);
						}}
					/>
					Spaces → Tabs
				</label>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px"
						placeholder="Type or paste your text here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Cleaned Output</label>
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
						style="min-height: 300px"
						value={result.text}
						readOnly
						placeholder="Cleaned text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
