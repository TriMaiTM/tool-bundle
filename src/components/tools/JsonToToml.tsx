import { useState, useMemo } from "preact/hooks";

function jsonToToml(obj: any, prefix = ""): string {
	let result = "";
	const simpleEntries: [string, any][] = [];
	const tableEntries: [string, any][] = [];

	for (const [key, value] of Object.entries(obj)) {
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			tableEntries.push([key, value]);
		} else {
			simpleEntries.push([key, value]);
		}
	}

	for (const [key, value] of simpleEntries) {
		result += `${key} = ${formatTomlValue(value)}\n`;
	}

	for (const [key, value] of tableEntries) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		result += `\n[${fullKey}]\n`;
		result += jsonToToml(value, fullKey);
	}

	return result;
}

function formatTomlValue(value: any): string {
	if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return String(value);
	if (Array.isArray(value)) return `[${value.map(formatTomlValue).join(", ")}]`;
	return `"${String(value)}"`;
}

export default function JsonToToml() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const parsed = JSON.parse(input);
			return jsonToToml(parsed).trim();
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
					<label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						placeholder='{"server": {"host": "localhost", "port": 8080}}'
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">TOML Output</label>
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
						placeholder="TOML output..."
					/>
				</div>
			</div>
		</div>
	);
}
