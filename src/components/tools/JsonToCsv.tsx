import { useCallback, useMemo, useState } from "preact/hooks";

type Delimiter = "," | ";" | "\t" | "|";

const DELIMITERS: { label: string; value: Delimiter }[] = [
	{ label: "Comma (,)", value: "," },
	{ label: "Semicolon (;)", value: ";" },
	{ label: "Tab", value: "\t" },
	{ label: "Pipe (|)", value: "|" },
];

const SAMPLE_JSON = JSON.stringify(
	[
		{
			name: "Alice Johnson",
			age: 28,
			email: "alice@example.com",
			city: "New York",
			role: "Engineer",
		},
		{
			name: "Bob Smith",
			age: 34,
			email: "bob@example.com",
			city: "San Francisco",
			role: "Designer",
		},
		{
			name: "Charlie Brown",
			age: 22,
			email: "charlie@example.com",
			city: "London",
			role: "Developer",
		},
		{
			name: "Diana Prince",
			age: 30,
			email: "diana@example.com",
			city: "Berlin",
			role: "Manager",
		},
		{
			name: "Eve Davis",
			age: 27,
			email: "eve@example.com",
			city: "Tokyo",
			role: "Analyst",
		},
	],
	null,
	2,
);

function escapeCsvField(value: unknown, delimiter: Delimiter): string {
	const str = value === null || value === undefined ? "" : String(value);
	const needsQuote =
		str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r");
	if (needsQuote) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

export default function JsonToCsv() {
	const [input, setInput] = useState("");
	const [delimiter, setDelimiter] = useState<Delimiter>(",");
	const [hasHeader, setHasHeader] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const parsed = useMemo(() => {
		if (!input.trim()) {
			setError(null);
			return null;
		}
		try {
			const data = JSON.parse(input);
			if (!Array.isArray(data)) {
				setError("Input must be a JSON array of objects.");
				return null;
			}
			if (data.length === 0) {
				setError("Array is empty.");
				return null;
			}
			if (typeof data[0] !== "object" || data[0] === null || Array.isArray(data[0])) {
				setError("Array must contain objects.");
				return null;
			}
			setError(null);
			return data as Record<string, unknown>[];
		} catch (e) {
			setError((e as Error).message);
			return null;
		}
	}, [input]);

	const headers = useMemo(() => {
		if (!parsed || parsed.length === 0) return [];
		const keySet = new Set<string>();
		for (const obj of parsed) {
			for (const key of Object.keys(obj)) {
				keySet.add(key);
			}
		}
		return Array.from(keySet);
	}, [parsed]);

	const csvOutput = useMemo(() => {
		if (!parsed || headers.length === 0) return "";
		const lines: string[] = [];
		if (hasHeader) {
			lines.push(headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter));
		}
		for (const obj of parsed) {
			const row = headers.map((h) => escapeCsvField(obj[h], delimiter));
			lines.push(row.join(delimiter));
		}
		return lines.join("\n");
	}, [parsed, headers, delimiter, hasHeader]);

	const stats = useMemo(() => {
		if (!parsed) return { objects: 0, cols: 0, size: 0 };
		return {
			objects: parsed.length,
			cols: headers.length,
			size: new Blob([csvOutput]).size,
		};
	}, [parsed, headers, csvOutput]);

	const handleCopy = useCallback(async () => {
		if (!csvOutput) return;
		await navigator.clipboard.writeText(csvOutput);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [csvOutput]);

	const handleDownload = useCallback(() => {
		if (!csvOutput) return;
		const blob = new Blob([csvOutput], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "output.csv";
		a.click();
		URL.revokeObjectURL(url);
	}, [csvOutput]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_JSON);
	}, []);

	return (
		<div>
			{/* Options */}
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<div class="flex items-center gap-2">
					<label class="text-caption-uppercase text-muted">Delimiter</label>
					<select
						class="input"
						style="width: auto; height: 36px"
						value={delimiter}
						onChange={(e) => setDelimiter((e.target as HTMLSelectElement).value as Delimiter)}
					>
						{DELIMITERS.map((d) => (
							<option key={d.value} value={d.value}>
								{d.label}
							</option>
						))}
					</select>
				</div>

				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={hasHeader}
						onChange={(e) => setHasHeader((e.target as HTMLInputElement).checked)}
					/>
					<span class="text-body-sm text-body">Include header row</span>
				</label>

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Sample JSON
				</button>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
					<strong>Invalid JSON:</strong> {error}
				</div>
			)}

			{/* Stats */}
			{parsed && (
				<div class="flex gap-3 mb-4">
					<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
						<div class="text-title-lg text-primary">{stats.objects}</div>
						<div class="text-caption-uppercase text-muted">Objects</div>
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

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Input */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
					<textarea
						class="textarea"
						style="min-height: 360px; font-family: var(--font-mono); font-size: 13px"
						placeholder={
							'Paste JSON array here...\n[\n  {"name": "Alice", "age": 28},\n  {"name": "Bob", "age": 34}\n]'
						}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>

				{/* Output */}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">CSV Output</label>
						{csvOutput && (
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
									Download .csv
								</button>
							</div>
						)}
					</div>

					{/* Table preview */}
					{parsed && headers.length > 0 && (
						<div class="mb-3">
							<label class="text-caption-uppercase text-muted block mb-2">Preview</label>
							<div class="bg-surface-elevated rounded-lg" style="max-height: 240px; overflow: auto">
								<div style="min-width: max-content">
									{/* Header row */}
									<div class="flex" style="border-bottom: 1px solid var(--color-hairline)">
										{headers.map((h) => (
											<div
												key={h}
												class="px-3 py-2 text-body-sm font-medium"
												style="min-width: 120px; flex-shrink: 0"
											>
												{h}
											</div>
										))}
									</div>
									{/* Data rows */}
									{parsed.slice(0, 50).map((obj, ri) => (
										<div
											key={ri}
											class="flex"
											style={`border-bottom: 1px solid var(--color-hairline); ${ri % 2 === 0 ? "" : "background: var(--color-surface-soft)"}`}
										>
											{headers.map((h) => (
												<div
													key={h}
													class="px-3 py-2 text-body-sm truncate"
													style="min-width: 120px; flex-shrink: 0"
												>
													{obj[h] === null || obj[h] === undefined ? "" : String(obj[h])}
												</div>
											))}
										</div>
									))}
									{parsed.length > 50 && (
										<div class="px-3 py-2 text-caption text-muted">
											Showing 50 of {parsed.length} rows
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<label class="text-caption-uppercase text-muted block mb-2">CSV Output</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
						value={csvOutput}
						readOnly
						placeholder="CSV will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
