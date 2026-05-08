import { useState, useMemo } from "preact/hooks";

function jsonToXml(obj: any, rootName = "root", indent = 2, level = 0): string {
	const pad = " ".repeat(indent * level);
	const padChild = " ".repeat(indent * (level + 1));
	if (obj === null || obj === undefined) return `${pad}<${rootName}/>`;
	if (typeof obj !== "object") return `${pad}<${rootName}>${escapeXml(String(obj))}</${rootName}>`;
	if (Array.isArray(obj))
		return obj.map((item, i) => jsonToXml(item, `${rootName}`, indent, level)).join("\n");
	let xml = `${pad}<${rootName}>`;
	for (const [key, value] of Object.entries(obj)) {
		if (Array.isArray(value)) {
			xml += `\n${value.map((item) => jsonToXml(item, key, indent, level + 1)).join("\n")}`;
		} else {
			xml += `\n${jsonToXml(value, key, indent, level + 1)}`;
		}
	}
	xml += `\n${pad}</${rootName}>`;
	return xml;
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export default function JsonToXml() {
	const [input, setInput] = useState("");
	const [rootName, setRootName] = useState("root");
	const [indent, setIndent] = useState(2);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const parsed = JSON.parse(input);
			return `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parsed, rootName, indent)}`;
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input, rootName, indent]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Error")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Root Element</label>
					<input
						class="input"
						value={rootName}
						onInput={(e) => setRootName((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Indent</label>
					<select
						class="input"
						value={indent}
						onChange={(e) => setIndent(Number((e.target as HTMLSelectElement).value))}
					>
						<option value="2">2 spaces</option>
						<option value="4">4 spaces</option>
						<option value="0">None</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px; font-family: var(--font-mono)"
						placeholder='{"name": "John", "age": 30}'
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">XML Output</label>
						{result && !result.startsWith("Error") && (
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
