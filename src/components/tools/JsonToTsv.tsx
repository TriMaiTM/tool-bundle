import { useCallback, useMemo, useState } from "preact/hooks";

const SAMPLE_JSON = `[
  {
    "name": "Alice Johnson",
    "age": 28,
    "email": "alice@example.com",
    "city": "New York",
    "role": "Engineer"
  },
  {
    "name": "Bob Smith",
    "age": 34,
    "email": "bob@example.com",
    "city": "San Francisco",
    "role": "Designer"
  },
  {
    "name": "Charlie Brown",
    "age": 22,
    "email": "charlie@example.com",
    "city": "London",
    "role": "Developer"
  }
]`;

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
		} else if (Array.isArray(value)) {
			result[newKey] = JSON.stringify(value);
		} else {
			result[newKey] = value === null || value === undefined ? "" : String(value);
		}
	}
	return result;
}

export default function JsonToTsv() {
	const [input, setInput] = useState("");
	const [flatten, setFlatten] = useState(false);
	const [copied, setCopied] = useState(false);

	const { parsedData, headers, error } = useMemo(() => {
		if (!input.trim()) return { parsedData: null, headers: [], error: null };
		try {
			const parsed = JSON.parse(input);
			const arr = Array.isArray(parsed) ? parsed : [parsed];
			if (arr.length === 0) return { parsedData: [], headers: [], error: null };

			const processed = flatten
				? arr.map((item) => flattenObject(item as Record<string, unknown>))
				: arr.map((item) => {
						const obj: Record<string, string> = {};
						for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
							obj[k] =
								v === null || v === undefined
									? ""
									: typeof v === "object"
										? JSON.stringify(v)
										: String(v);
						}
						return obj;
					});

			const allKeys = new Set<string>();
			for (const row of processed) {
				for (const key of Object.keys(row)) {
					allKeys.add(key);
				}
			}
			const headerList = Array.from(allKeys);
			return { parsedData: processed, headers: headerList, error: null };
		} catch (err) {
			return {
				parsedData: null,
				headers: [],
				error: err instanceof Error ? err.message : "Invalid JSON",
			};
		}
	}, [input, flatten]);

	const tsvOutput = useMemo(() => {
		if (!parsedData || parsedData.length === 0) return "";
		const lines = [headers.join("\t")];
		for (const row of parsedData) {
			lines.push(headers.map((h) => row[h] ?? "").join("\t"));
		}
		return lines.join("\n");
	}, [parsedData, headers]);

	const stats = useMemo(() => {
		if (!parsedData) return { rows: 0, cols: 0, size: 0 };
		return {
			rows: parsedData.length,
			cols: headers.length,
			size: new Blob([tsvOutput]).size,
		};
	}, [parsedData, headers, tsvOutput]);

	const handleCopy = useCallback(async () => {
		if (!tsvOutput) return;
		await navigator.clipboard.writeText(tsvOutput);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [tsvOutput]);

	const handleDownload = useCallback(() => {
		if (!tsvOutput) return;
		const blob = new Blob([tsvOutput], { type: "text/tab-separated-values" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "output.tsv";
		a.click();
		URL.revokeObjectURL(url);
	}, [tsvOutput]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_JSON);
	}, []);

	const previewRows = parsedData ? parsedData.slice(0, 50) : [];
	const hasMoreRows = parsedData ? parsedData.length > 50 : false;

	return (
		<div>
			{/* Options */}
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={flatten}
						onChange={(e) => setFlatten((e.target as HTMLInputElement).checked)}
					/>
					<span class="text-body-sm text-body">Flatten nested objects</span>
				</label>

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Sample JSON
				</button>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* Stats */}
			{parsedData && (
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
				<label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
				<textarea
					class="textarea"
					style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
					placeholder='Paste JSON array here... e.g. [{"name":"Alice","age":28}]'
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			{/* Table Preview */}
			{parsedData && parsedData.length > 0 && (
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Preview</label>
						{hasMoreRows && (
							<span class="text-caption text-muted">Showing 50 of {parsedData.length} rows</span>
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
								{headers.map((h, i) => (
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
									{headers.map((h, ci) => (
										<div
											key={ci}
											class="px-3 py-2 text-body-sm truncate"
											style="min-width: 120px; flex-shrink: 0"
											title={row[h] ?? ""}
										>
											{row[h] ?? ""}
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
					<label class="text-caption-uppercase text-muted">TSV Output</label>
					{tsvOutput && (
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
								Download .tsv
							</button>
						</div>
					)}
				</div>
				<textarea
					class="textarea"
					style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
					value={tsvOutput}
					readOnly
					placeholder="TSV output will appear here..."
				/>
			</div>
		</div>
	);
}
