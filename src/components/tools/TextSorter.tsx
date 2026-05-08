import { useCallback, useMemo, useState } from "preact/hooks";

type SortMode = "alpha" | "reverse" | "length-asc" | "length-desc" | "shuffle";

const SORT_MODES: { id: SortMode; label: string }[] = [
	{ id: "alpha", label: "A → Z" },
	{ id: "reverse", label: "Z → A" },
	{ id: "length-asc", label: "Shortest First" },
	{ id: "length-desc", label: "Longest First" },
	{ id: "shuffle", label: "Random Shuffle" },
];

export default function TextSorter() {
	const [input, setInput] = useState("");
	const [sortMode, setSortMode] = useState<SortMode>("alpha");
	const [caseSensitive, setCaseSensitive] = useState(true);
	const [removeEmpty, setRemoveEmpty] = useState(false);

	const result = useMemo(() => {
		if (!input) return "";

		let lines = input.split("\n");

		if (removeEmpty) {
			lines = lines.filter((line) => line.trim() !== "");
		}

		switch (sortMode) {
			case "alpha":
				lines.sort((a, b) => {
					const sa = caseSensitive ? a : a.toLowerCase();
					const sb = caseSensitive ? b : b.toLowerCase();
					return sa.localeCompare(sb);
				});
				break;
			case "reverse":
				lines.sort((a, b) => {
					const sa = caseSensitive ? a : a.toLowerCase();
					const sb = caseSensitive ? b : b.toLowerCase();
					return sb.localeCompare(sa);
				});
				break;
			case "length-asc":
				lines.sort((a, b) => a.length - b.length);
				break;
			case "length-desc":
				lines.sort((a, b) => b.length - a.length);
				break;
			case "shuffle":
				for (let i = lines.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[lines[i], lines[j]] = [lines[j], lines[i]];
				}
				break;
		}

		return lines.join("\n");
	}, [input, sortMode, caseSensitive, removeEmpty]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	return (
		<div>
			<div class="flex flex-wrap gap-2 mb-6">
				{SORT_MODES.map((mode) => (
					<button
						key={mode.id}
						class={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
							sortMode === mode.id
								? "bg-primary text-on-primary"
								: "bg-surface-elevated text-body hover:text-on-dark"
						}`}
						onClick={() => setSortMode(mode.id)}
					>
						{mode.label}
					</button>
				))}
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
						checked={removeEmpty}
						onChange={(e) => setRemoveEmpty((e.target as HTMLInputElement).checked)}
					/>
					Remove empty lines
				</label>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste lines of text to sort..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Output</label>
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
						placeholder="Sorted text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
