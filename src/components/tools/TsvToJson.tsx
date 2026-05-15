import { useCallback, useMemo, useState } from "preact/hooks";

const SAMPLE_TSV = `name	age	email	city	role
Alice Johnson	28	alice@example.com	New York	Engineer
Bob Smith	34	bob@example.com	San Francisco	Designer
Charlie Brown	22	charlie@example.com	London	Developer
Diana Prince	30	diana@example.com	Berlin	Manager
Eve Davis	27	eve@example.com	Tokyo	Analyst`;

function parseTsv(text: string, hasHeader: boolean): { headers: string[]; rows: string[][] } {
	const lines = text.split("\n").filter((l) => l.trim().length > 0);
	if (lines.length === 0) return { headers: [], rows: [] };

	const rows = lines.map((line) => line.split("\t"));

	if (hasHeader) {
		const headers = rows[0];
		return { headers, rows: rows.slice(1) };
	}
	const numCols = rows[0]?.length || 0;
	const headers = Array.from({ length: numCols }, (_, i) => `column_${i + 1}`);
	return { headers, rows };
}

function autoDetectHeaders(rows: string[][]): boolean {
	if (rows.length < 2) return false;
	const firstRow = rows[0];
	// Heuristic: if first row values are all strings and different from subsequent rows
	const allStrings = firstRow.every((v) => isNaN(Number(v)) || v.trim() === "");
	if (!allStrings) return false;
	// Check if second row has numbers
	const secondRow = rows[1];
	const hasNumbers = secondRow.some((v) => !isNaN(Number(v)) && v.trim() !== "");
	return hasNumbers;
}

export default function TsvToJson() {
	const [input, setInput] = useState("");
	const [hasHeader, setHasHeader] = useState(true);
	const [copied, setCopied] = useState(false);

	const parsed = useMemo(() => {
		if (!input.trim()) return null;
		const rawRows = input
			.split("\n")
			.filter((l) => l.trim().length > 0)
			.map((l) => l.split("\t"));
		const effectiveHasHeader = hasHeader || autoDetectHeaders(rawRows);
		return parseTsv(input, effectiveHasHeader);
	}, [input, hasHeader]);

	const jsonOutput = useMemo(() => {
		if (!parsed || parsed.rows.length === 0) return "";
		const objects = parsed.rows.map((row) => {
			const obj: Record<string, string> = {};
			parsed.headers.forEach((h, i) => {
				obj[h] = row[i] ?? "";
			});
			return obj;
		});
		return JSON.stringify(objects, null, 2);
	}, [parsed]);

	const stats = useMemo(() => {
		if (!parsed) return { rows: 0, cols: 0, size: 0 };
		return {
			rows: parsed.rows.length,
			cols: parsed.headers.length,
			size: new Blob([jsonOutput]).size,
		};
	}, [parsed, jsonOutput]);

	const handleCopy = useCallback(async () => {
		if (!jsonOutput) return;
		await navigator.clipboard.writeText(jsonOutput);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [jsonOutput]);

	const handleDownload = useCallback(() => {
		if (!jsonOutput) return;
		const blob = new Blob([jsonOutput], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "output.json";
		a.click();
		URL.revokeObjectURL(url);
	}, [jsonOutput]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_TSV);
	}, []);

	const previewRows = parsed ? parsed.rows.slice(0, 50) : [];
	const hasMoreRows = parsed ? parsed.rows.length > 50 : false;

	return (
		<div>
			{/* Options */}
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={hasHeader}
						onChange={(e) => setHasHeader((e.target as HTMLInputElement).checked)}
					/>
					<span class="text-body-sm text-body">First row as header</span>
				</label>

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Sample TSV
				</button>
			</div>

			{/* Stats */}
			{parsed && (
				<div class="flex gap-3 mb-4">
					<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
						<div class="text-title-lg text-primary">{stats.rows}</div>
						<div class="text-caption-uppercase text-muted">Rows</div>
					</div>
					<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
						<div class="text-title-lg text-primary">{stats.cols}</div>
						<div class="text-caption-uppercase text-muted">Columns</div>
					</div>
					<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
						<div class="text-title-lg text-primary">
							{stats.size < 1024 ? `${stats.size} B` : `${(stats.size / 1024).toFixed(1)} KB`}
						</div>
						<div class="text-caption-uppercase text-muted">Output Size</div>
					</div>
				</div>
			)}

			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">TSV Input</label>
				<textarea
					class="textarea"
					style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
					placeholder="Paste TSV data here (tab-separated values)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			{/* Table Preview */}
			{parsed && parsed.rows.length > 0 && (
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Preview</label>
						{hasMoreRows && (
							<span class="text-caption text-muted">Showing 50 of {parsed.rows.length} rows</span>
						)}
					</div>
					<div class="bg-surface-elevated rounded-lg" style="max-height: 300px; overflow: auto">
						<div style="min-width: max-content">
							{/* Header row */}
							<div
								class="flex"
								style={{
									borderBottom: "1px solid var(--color-hairline)",
									background: "var(--color-surface-soft)",
								}}
							>
								{parsed.headers.map((h, i) => (
									<div
										key={i}
										class="px-3 py-2 text-body-sm font-medium truncate"
										style="min-width: 120px; flex-shrink: 0"
										title={h}
									>
										{h}
									</div>
								))}
							</div>
							{/* Data rows */}
							{previewRows.map((row, ri) => (
								<div
									key={ri}
									class="flex"
									style={{
										borderBottom: "1px solid var(--color-hairline)",
										background: ri % 2 === 0 ? "transparent" : "var(--color-surface-soft)",
									}}
								>
									{row.map((cell, ci) => (
										<div
											key={ci}
											class="px-3 py-2 text-body-sm truncate"
											style="min-width: 120px; flex-shrink: 0"
											title={cell}
										>
											{cell}
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Output */}
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">JSON Output</label>
					{jsonOutput && (
						<div class="flex items-center gap-3">
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleDownload}
							>
								Download .json
							</button>
						</div>
					)}
				</div>
				<textarea
					class="textarea"
					style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
					value={jsonOutput}
					readOnly
					placeholder="JSON output will appear here..."
				/>
			</div>
		</div>
	);
}
