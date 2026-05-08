import { useState, useMemo } from "preact/hooks";

export default function CsvToXml() {
	const [input, setInput] = useState("");
	const [rowTag, setRowTag] = useState("item");
	const [delimiter, setDelimiter] = useState(",");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const lines = input
				.trim()
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length < 2) return "Need at least a header row and one data row";
			const headers = parseCsvLine(lines[0], delimiter);
			let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>';
			for (let i = 1; i < lines.length; i++) {
				const values = parseCsvLine(lines[i], delimiter);
				xml += `\n  <${rowTag}>`;
				headers.forEach((h, j) => {
					const val = (values[j] || "")
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;");
					xml += `\n    <${h}>${val}</${h}>`;
				});
				xml += `\n  </${rowTag}>`;
			}
			xml += "\n</root>";
			return xml;
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input, rowTag, delimiter]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Error") && !result.startsWith("Need"))
			await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Row Tag</label>
					<input
						class="input"
						value={rowTag}
						onInput={(e) => setRowTag((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
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
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">CSV Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px; font-family: var(--font-mono)"
						placeholder="name,age,city\nJohn,30,NYC\nJane,25,LA"
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">XML Output</label>
						{result && !result.startsWith("Error") && !result.startsWith("Need") && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 250px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="XML output..."
					/>
				</div>
			</div>
		</div>
	);
}

function parseCsvLine(line: string, delimiter: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}
