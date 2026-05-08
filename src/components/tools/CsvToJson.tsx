import { useCallback, useMemo, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type Delimiter = "," | ";" | "\t" | "|";

const DELIMITERS: { label: string; value: Delimiter }[] = [
	{ label: "Comma (,)", value: "," },
	{ label: "Semicolon (;)", value: ";" },
	{ label: "Tab", value: "\t" },
	{ label: "Pipe (|)", value: "|" },
];

const SAMPLE_CSV = `name,age,email,city,role
Alice Johnson,28,alice@example.com,New York,Engineer
Bob Smith,34,bob@example.com,San Francisco,Designer
Charlie Brown,22,charlie@example.com,London,Developer
Diana Prince,30,diana@example.com,Berlin,Manager
Eve Davis,27,eve@example.com,Tokyo,Analyst`;

function detectDelimiter(text: string): Delimiter {
	const firstLines = text.split("\n").slice(0, 5).join("\n");
	const counts: Record<string, number> = {
		",": (firstLines.match(/,/g) || []).length,
		";": (firstLines.match(/;/g) || []).length,
		"\t": (firstLines.match(/\t/g) || []).length,
		"|": (firstLines.match(/\|/g) || []).length,
	};
	const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
	return (best[1] > 0 ? best[0] : ",") as Delimiter;
}

function parseCsv(
	text: string,
	delimiter: Delimiter,
	hasHeader: boolean,
	trim: boolean,
): { headers: string[]; rows: string[][] } {
	const lines = text.split("\n").filter((l) => l.trim().length > 0);
	if (lines.length === 0) return { headers: [], rows: [] };

	const split = (line: string): string[] => {
		const result: string[] = [];
		let current = "";
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (ch === delimiter && !inQuotes) {
				result.push(trim ? current.trim() : current);
				current = "";
			} else {
				current += ch;
			}
		}
		result.push(trim ? current.trim() : current);
		return result;
	};

	if (hasHeader) {
		const headers = split(lines[0]);
		const rows = lines.slice(1).map(split);
		return { headers, rows };
	}
	const rows = lines.map(split);
	const numCols = rows[0]?.length || 0;
	const headers = Array.from({ length: numCols }, (_, i) => `column_${i + 1}`);
	return { headers, rows };
}

export default function CsvToJson() {
	const [input, setInput] = useState("");
	const [delimiter, setDelimiter] = useState<Delimiter>(",");
	const [hasHeader, setHasHeader] = useState(true);
	const [trim, setTrim] = useState(true);
	const [autoDetect, setAutoDetect] = useState(true);
	const [copied, setCopied] = useState(false);

	const effectiveDelimiter = useMemo(() => {
		if (autoDetect && input.trim()) return detectDelimiter(input);
		return delimiter;
	}, [autoDetect, input, delimiter]);

	const parsed = useMemo(() => {
		if (!input.trim()) return null;
		return parseCsv(input, effectiveDelimiter, hasHeader, trim);
	}, [input, effectiveDelimiter, hasHeader, trim]);

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
		setInput(SAMPLE_CSV);
	}, []);

	const handleFile = useCallback((files: File[]) => {
		const file = files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => setInput(reader.result as string);
		reader.readAsText(file);
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
						value={autoDetect ? "auto" : delimiter}
						onChange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							if (val === "auto") {
								setAutoDetect(true);
							} else {
								setAutoDetect(false);
								setDelimiter(val as Delimiter);
							}
						}}
					>
						<option value="auto">Auto-detect</option>
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
					<span class="text-body-sm text-body">Has header row</span>
				</label>

				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={trim}
						onChange={(e) => setTrim((e.target as HTMLInputElement).checked)}
					/>
					<span class="text-body-sm text-body">Trim whitespace</span>
				</label>

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Sample CSV
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

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Input */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">CSV Input</label>
					<FileDropZone
						accept=".csv,text/csv"
						multiple={false}
						onFiles={handleFile}
						label="Drop a CSV file here or click to browse"
						sublabel=".csv files accepted"
					/>
					<textarea
						class="textarea mt-3"
						style="min-height: 260px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste CSV data here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>

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
					<div class="mb-3">
						<label class="text-caption-uppercase text-muted block mb-2">Preview</label>
						<pre
							class="code-block"
							style="min-height: 200px; max-height: 300px; overflow: auto; white-space: pre-wrap; font-size: 12px"
						>
							{jsonOutput || "// Parsed JSON will appear here"}
						</pre>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Output</label>
						<textarea
							class="textarea"
							style="min-height: 160px; font-family: var(--font-mono); font-size: 13px"
							value={jsonOutput}
							readOnly
							placeholder="Formatted JSON will appear here..."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
