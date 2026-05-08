import { useCallback, useState } from "preact/hooks";

interface DiffLine {
	type: "added" | "removed" | "unchanged";
	content: string;
	lineNum: number;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");
	const _result: DiffLine[] = [];

	// Simple LCS-based diff
	const m = oldLines.length;
	const n = newLines.length;

	// Build LCS table
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (oldLines[i - 1] === newLines[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to find diff
	let i = m;
	let j = n;
	const tempResult: DiffLine[] = [];

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
			tempResult.unshift({
				type: "unchanged",
				content: oldLines[i - 1],
				lineNum: j,
			});
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			tempResult.unshift({
				type: "added",
				content: newLines[j - 1],
				lineNum: j,
			});
			j--;
		} else {
			tempResult.unshift({
				type: "removed",
				content: oldLines[i - 1],
				lineNum: i,
			});
			i--;
		}
	}

	return tempResult;
}

export default function TextDiff() {
	const [oldText, setOldText] = useState("");
	const [newText, setNewText] = useState("");
	const [diff, setDiff] = useState<DiffLine[]>([]);
	const [showDiff, setShowDiff] = useState(false);

	const handleCompare = useCallback(() => {
		if (!oldText && !newText) {
			setDiff([]);
			setShowDiff(false);
			return;
		}
		const result = computeDiff(oldText, newText);
		setDiff(result);
		setShowDiff(true);
	}, [oldText, newText]);

	const added = diff.filter((d) => d.type === "added").length;
	const removed = diff.filter((d) => d.type === "removed").length;

	return (
		<div>
			{/* Side by side inputs */}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Original Text</label>
					<textarea
						class="textarea"
						style="min-height: 200px"
						placeholder="Paste the original text here..."
						value={oldText}
						onInput={(e) => {
							setOldText((e.target as HTMLTextAreaElement).value);
							if (showDiff) setShowDiff(false);
						}}
					/>
					<div class="text-caption text-muted mt-1">
						{oldText.split("\n").filter(Boolean).length} lines
					</div>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Modified Text</label>
					<textarea
						class="textarea"
						style="min-height: 200px"
						placeholder="Paste the modified text here..."
						value={newText}
						onInput={(e) => {
							setNewText((e.target as HTMLTextAreaElement).value);
							if (showDiff) setShowDiff(false);
						}}
					/>
					<div class="text-caption text-muted mt-1">
						{newText.split("\n").filter(Boolean).length} lines
					</div>
				</div>
			</div>

			{/* Compare button */}
			<div class="mb-6">
				<button class="btn-primary" onClick={handleCompare}>
					Compare
				</button>
			</div>

			{/* Diff result */}
			{showDiff && (
				<div>
					<div class="flex items-center gap-4 mb-3">
						<span class="text-caption-uppercase text-muted">Diff Result ({diff.length} lines)</span>
						<span class="text-body-sm text-accent-emerald">+{added} added</span>
						<span class="text-body-sm text-accent-rose">-{removed} removed</span>
					</div>
					<div class="bg-surface-card rounded-lg overflow-hidden border border-hairline">
						{diff.map((line, i) => (
							<div
								key={i}
								class={`flex items-start text-body-sm font-mono px-4 py-1 border-l-3 ${
									line.type === "added"
										? "bg-accent-emerald/10 border-l-accent-emerald"
										: line.type === "removed"
											? "bg-accent-rose/10 border-l-accent-rose"
											: "border-l-transparent"
								}`}
							>
								<span class="text-caption text-muted w-12 text-right mr-4 flex-shrink-0 select-none">
									{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
								</span>
								<span
									class="flex-1 whitespace-pre-wrap break-all"
									style={{
										color:
											line.type === "added"
												? "#22c55e"
												: line.type === "removed"
													? "#ef4444"
													: "var(--color-body)",
									}}
								>
									{line.content || " "}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{showDiff && diff.length === 0 && (
				<div class="bg-surface-elevated rounded-lg p-6 text-center">
					<p class="text-body-sm text-muted">Both texts are identical.</p>
				</div>
			)}
		</div>
	);
}
