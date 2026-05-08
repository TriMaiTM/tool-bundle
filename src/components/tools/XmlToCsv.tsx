import { useState, useMemo } from "preact/hooks";

export default function XmlToCsv() {
	const [input, setInput] = useState("");
	const [delimiter, setDelimiter] = useState(",");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(input, "text/xml");
			if (doc.querySelector("parsererror")) return "Invalid XML";
			const root = doc.documentElement;
			const rows = root.children;
			if (rows.length === 0) return "No rows found";
			const allHeaders = new Set<string>();
			const data: Record<string, string>[] = [];
			for (let i = 0; i < rows.length; i++) {
				const row: Record<string, string> = {};
				const children = rows[i].children;
				for (let j = 0; j < children.length; j++) {
					const tag = children[j].nodeName;
					allHeaders.add(tag);
					row[tag] = children[j].textContent?.trim() || "";
				}
				data.push(row);
			}
			const headers = Array.from(allHeaders);
			let csv = `${headers.map((h) => escapeCsv(h, delimiter)).join(delimiter)}\n`;
			for (const row of data) {
				csv += `${headers.map((h) => escapeCsv(row[h] || "", delimiter)).join(delimiter)}\n`;
			}
			return csv.trim();
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input, delimiter]);

	const handleCopy = async () => {
		if (
			result &&
			!result.startsWith("Error") &&
			!result.startsWith("Invalid") &&
			result !== "No rows found"
		)
			await navigator.clipboard.writeText(result);
	};
	const handleDownload = () => {
		if (result && !result.startsWith("Error")) {
			const blob = new Blob([result], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "converted.csv";
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-1">Delimiter</label>
				<select
					class="input"
					value={delimiter}
					onChange={(e) => setDelimiter((e.target as HTMLSelectElement).value)}
				>
					<option value=",">Comma (,)</option>
					<option value=";">Semicolon (;)</option>
					<option value="\t">Tab</option>
				</select>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">XML Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px; font-family: var(--font-mono)"
						placeholder="<root><item><name>John</name><age>30</age></item></root>"
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">CSV Output</label>
						<div class="flex gap-2">
							{result && !result.startsWith("Error") && (
								<button
									class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
									onClick={handleCopy}
								>
									Copy
								</button>
							)}
							{result && !result.startsWith("Error") && (
								<button
									class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
									onClick={handleDownload}
								>
									Download
								</button>
							)}
						</div>
					</div>
					<textarea
						class="textarea"
						style="min-height: 250px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="CSV output..."
					/>
				</div>
			</div>
		</div>
	);
}

function escapeCsv(value: string, delimiter: string): string {
	if (value.includes(delimiter) || value.includes('"') || value.includes("\n"))
		return `"${value.replace(/"/g, '""')}"`;
	return value;
}
