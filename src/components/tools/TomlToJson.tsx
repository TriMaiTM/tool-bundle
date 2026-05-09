import { useState, useMemo } from "preact/hooks";

function parseToml(toml: string): any {
	const result: any = {};
	let current = result;
	const stack: any[] = [result];

	for (const rawLine of toml.split("\n")) {
		const line = rawLine.replace(/#.*$/, "").trim();
		if (!line) continue;

		const sectionMatch = line.match(/^\[([^\]]+)\]$/);
		if (sectionMatch) {
			const keys = sectionMatch[1].split(".");
			current = result;
			for (const key of keys) {
				if (!current[key]) current[key] = {};
				current = current[key];
			}
			continue;
		}

		const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
		if (kvMatch) {
			const key = kvMatch[1];
			let value: any = kvMatch[2].trim();
			if (value === "true") value = true;
			else if (value === "false") value = false;
			else if (/^-?\d+$/.test(value)) value = Number.parseInt(value, 10);
			else if (/^-?\d+\.\d+$/.test(value)) value = Number.parseFloat(value);
			else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
			else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
			else if (value.startsWith("[") && value.endsWith("]")) {
				try {
					value = JSON.parse(value);
				} catch {
					/* keep as string */
				}
			}
			current[key] = value;
		}
	}
	return result;
}

export default function TomlToJson() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const parsed = parseToml(input);
			return JSON.stringify(parsed, null, 2);
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Error")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">TOML Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						placeholder={
							'[server]\nhost = "localhost"\nport = 8080\n\n[database]\nurl = "postgres://..."\npool_size = 5'
						}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">JSON Output</label>
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
						style="min-height: 300px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="JSON output..."
					/>
				</div>
			</div>
		</div>
	);
}
