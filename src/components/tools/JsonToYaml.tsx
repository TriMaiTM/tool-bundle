import { useCallback, useMemo, useState } from "preact/hooks";

const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "hiking"],
  "projects": [
    {
      "name": "Project A",
      "status": "completed"
    },
    {
      "name": "Project B",
      "status": "in-progress"
    }
  ]
}`;

function jsonToYaml(obj: unknown, indent = 2, sortKeys = false, level = 0): string {
	const prefix = " ".repeat(level * indent);

	if (obj === null || obj === undefined) return "null";
	if (typeof obj === "boolean") return obj ? "true" : "false";
	if (typeof obj === "number") return String(obj);
	if (typeof obj === "string") {
		if (
			obj.includes("\n") ||
			obj.includes(":") ||
			obj.includes("#") ||
			obj.includes("{") ||
			obj.includes("}") ||
			obj.includes("[") ||
			obj.includes("]") ||
			obj.includes(",") ||
			obj.includes("&") ||
			obj.includes("*") ||
			obj.includes("?") ||
			obj.includes("|") ||
			obj.includes(">") ||
			obj.includes("'") ||
			obj.includes('"') ||
			obj.includes("%") ||
			obj.includes("@") ||
			obj.includes("`") ||
			obj.startsWith(" ") ||
			obj.endsWith(" ") ||
			obj === "" ||
			obj === "true" ||
			obj === "false" ||
			obj === "null" ||
			/^\d+(\.\d+)?$/.test(obj)
		) {
			if (obj.includes("\n")) {
				const lines = obj.split("\n");
				return `|\n${lines.map((l) => `${prefix}${" ".repeat(indent)}${l}`).join("\n")}`;
			}
			return `"${obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
		}
		return obj;
	}

	if (Array.isArray(obj)) {
		if (obj.length === 0) return "[]";
		return obj
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					const inner = jsonToYaml(item, indent, sortKeys, level + 1);
					const lines = inner.split("\n");
					return `${prefix}- ${lines[0]}\n${lines
						.slice(1)
						.map((l) => `${prefix}  ${l}`)
						.join("\n")}`;
				}
				return `${prefix}- ${jsonToYaml(item, indent, sortKeys, level + 1)}`;
			})
			.join("\n");
	}

	if (typeof obj === "object") {
		const entries = Object.entries(obj);
		if (entries.length === 0) return "{}";
		const sorted = sortKeys ? [...entries].sort(([a], [b]) => a.localeCompare(b)) : entries;
		return sorted
			.map(([key, value]) => {
				const valStr = jsonToYaml(value, indent, sortKeys, level + 1);
				if (
					typeof value === "object" &&
					value !== null &&
					!Array.isArray(value) &&
					Object.keys(value).length > 0
				) {
					const lines = valStr.split("\n");
					return `${prefix}${key}:\n${lines.map((l) => `${prefix}${" ".repeat(indent)}${l}`).join("\n")}`;
				}
				if (Array.isArray(value) && value.length > 0) {
					return `${prefix}${key}:\n${valStr}`;
				}
				return `${prefix}${key}: ${valStr}`;
			})
			.join("\n");
	}

	return String(obj);
}

export default function JsonToYaml() {
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState(2);
	const [sortKeys, setSortKeys] = useState(false);
	const [copied, setCopied] = useState(false);

	const { output, error } = useMemo(() => {
		if (!input.trim()) return { output: "", error: null };
		try {
			const parsed = JSON.parse(input);
			return { output: jsonToYaml(parsed, indent, sortKeys), error: null };
		} catch (err) {
			return { output: "", error: err instanceof Error ? err.message : "Invalid JSON" };
		}
	}, [input, indent, sortKeys]);

	const handleCopy = useCallback(async () => {
		if (!output) return;
		await navigator.clipboard.writeText(output);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [output]);

	const handleDownload = useCallback(() => {
		if (!output) return;
		const blob = new Blob([output], { type: "text/yaml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "output.yaml";
		a.click();
		URL.revokeObjectURL(url);
	}, [output]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_JSON);
	}, []);

	return (
		<div>
			{/* Options */}
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<div class="flex items-center gap-2">
					<label class="text-caption-uppercase text-muted">Indent</label>
					<select
						class="input"
						style="width: auto; height: 36px"
						value={indent}
						onChange={(e) => setIndent(Number((e.target as HTMLSelectElement).value))}
					>
						<option value={2}>2 Spaces</option>
						<option value={4}>4 Spaces</option>
					</select>
				</div>

				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={sortKeys}
						onChange={(e) => setSortKeys((e.target as HTMLInputElement).checked)}
					/>
					<span class="text-body-sm text-body">Sort keys</span>
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

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Input */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
					<textarea
						class="textarea"
						style="min-height: 320px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste JSON here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>

				{/* Output */}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">YAML Output</label>
						{output && (
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
									Download .yaml
								</button>
							</div>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 320px; font-family: var(--font-mono); font-size: 13px"
						value={output}
						readOnly
						placeholder="YAML output will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
