/**
 * Workflow Engine — Tool Chains / Pipeline execution
 * Supports text-based tool chaining with sequential execution
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkflowTool {
	id: string;
	name: string;
	category: string;
	description: string;
	process: (input: string, settings?: Record<string, any>) => Promise<string>;
	settings?: WorkflowSetting[];
}

export interface WorkflowSetting {
	key: string;
	label: string;
	type: "text" | "number" | "select";
	default: string | number;
	options?: { label: string; value: string | number }[];
}

export interface WorkflowStep {
	id: string;
	toolId: string;
	settings?: Record<string, any>;
}

export interface WorkflowTemplate {
	id: string;
	name: string;
	description: string;
	steps: { toolId: string; settings?: Record<string, any> }[];
}

export interface StepResult {
	stepId: string;
	toolId: string;
	toolName: string;
	input: string;
	output: string;
	success: boolean;
	error?: string;
	duration: number;
}

// ─── Workflow-Compatible Tool Registry ───────────────────────────────────────

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export const workflowTools: Record<string, WorkflowTool> = {
	// ── Text Transforms ─────────────────────────────────────────────────────
	uppercase: {
		id: "uppercase",
		name: "Uppercase",
		category: "text",
		description: "Convert text to UPPER CASE",
		process: async (input) => input.toUpperCase(),
	},
	lowercase: {
		id: "lowercase",
		name: "Lowercase",
		category: "text",
		description: "Convert text to lower case",
		process: async (input) => input.toLowerCase(),
	},
	"trim-whitespace": {
		id: "trim-whitespace",
		name: "Trim Whitespace",
		category: "text",
		description: "Remove leading/trailing whitespace from each line",
		process: async (input) =>
			input
				.split("\n")
				.map((l) => l.trim())
				.join("\n"),
	},
	"remove-empty-lines": {
		id: "remove-empty-lines",
		name: "Remove Empty Lines",
		category: "text",
		description: "Remove all blank lines from text",
		process: async (input) =>
			input
				.split("\n")
				.filter((l) => l.trim())
				.join("\n"),
	},
	"reverse-text": {
		id: "reverse-text",
		name: "Reverse Text",
		category: "text",
		description: "Reverse the entire text",
		process: async (input) => Array.from(input).reverse().join(""),
	},
	"sort-lines": {
		id: "sort-lines",
		name: "Sort Lines",
		category: "text",
		description: "Sort lines alphabetically",
		process: async (input) => input.split("\n").sort().join("\n"),
	},
	"remove-duplicates": {
		id: "remove-duplicates",
		name: "Remove Duplicate Lines",
		category: "text",
		description: "Remove duplicate lines from text",
		process: async (input) => [...new Set(input.split("\n"))].join("\n"),
	},

	// ── Encoding ────────────────────────────────────────────────────────────
	"base64-encode": {
		id: "base64-encode",
		name: "Base64 Encode",
		category: "encoding",
		description: "Encode text to Base64",
		process: async (input) => btoa(unescape(encodeURIComponent(input))),
	},
	"base64-decode": {
		id: "base64-decode",
		name: "Base64 Decode",
		category: "encoding",
		description: "Decode Base64 to text",
		process: async (input) => decodeURIComponent(escape(atob(input.trim()))),
	},
	"url-encode": {
		id: "url-encode",
		name: "URL Encode",
		category: "encoding",
		description: "Encode text for URLs",
		process: async (input) => encodeURIComponent(input),
	},
	"url-decode": {
		id: "url-decode",
		name: "URL Decode",
		category: "encoding",
		description: "Decode URL-encoded text",
		process: async (input) => decodeURIComponent(input),
	},
	"html-encode": {
		id: "html-encode",
		name: "HTML Entity Encode",
		category: "encoding",
		description: "Encode text to HTML entities",
		process: async (input) =>
			input
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;")
				.replace(/[\u0080-\uFFFF]/g, (c) => `&#${c.charCodeAt(0)};`),
	},
	"html-decode": {
		id: "html-decode",
		name: "HTML Entity Decode",
		category: "encoding",
		description: "Decode HTML entities to text",
		process: async (input) => {
			const t = document.createElement("textarea");
			t.innerHTML = input;
			return t.value;
		},
	},
	"text-to-binary": {
		id: "text-to-binary",
		name: "Text to Binary",
		category: "encoding",
		description: "Convert text to binary (8-bit)",
		process: async (input) =>
			Array.from(input)
				.map((c) => c.codePointAt(0)!.toString(2).padStart(8, "0"))
				.join(" "),
	},
	"binary-to-text": {
		id: "binary-to-text",
		name: "Binary to Text",
		category: "encoding",
		description: "Convert binary to text",
		process: async (input) =>
			input
				.trim()
				.split(/\s+/)
				.map((b) => String.fromCodePoint(Number.parseInt(b, 2)))
				.join(""),
	},
	"text-to-hex": {
		id: "text-to-hex",
		name: "Text to Hex",
		category: "encoding",
		description: "Convert text to hexadecimal",
		process: async (input) =>
			Array.from(input)
				.map((c) => c.codePointAt(0)!.toString(16).toUpperCase().padStart(2, "0"))
				.join(" "),
	},
	"hex-to-text": {
		id: "hex-to-text",
		name: "Hex to Text",
		category: "encoding",
		description: "Convert hexadecimal to text",
		process: async (input) =>
			input
				.trim()
				.replace(/0x/gi, "")
				.split(/\s+/)
				.map((h) => String.fromCodePoint(Number.parseInt(h, 16)))
				.join(""),
	},
	rot13: {
		id: "rot13",
		name: "ROT13",
		category: "encoding",
		description: "Encode/decode with ROT13 cipher",
		process: async (input) =>
			Array.from(input)
				.map((c) => {
					const code = c.codePointAt(0)!;
					if (code >= 65 && code <= 90) return String.fromCodePoint(((code - 65 + 13) % 26) + 65);
					if (code >= 97 && code <= 122) return String.fromCodePoint(((code - 97 + 13) % 26) + 97);
					return c;
				})
				.join(""),
	},

	// ── Hashing ─────────────────────────────────────────────────────────────
	"sha-256": {
		id: "sha-256",
		name: "SHA-256 Hash",
		category: "hashing",
		description: "Generate SHA-256 hash of text",
		process: async (input) => {
			const data = new TextEncoder().encode(input);
			const hash = await crypto.subtle.digest("SHA-256", data);
			return Array.from(new Uint8Array(hash))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		},
	},
	"sha-1": {
		id: "sha-1",
		name: "SHA-1 Hash",
		category: "hashing",
		description: "Generate SHA-1 hash of text",
		process: async (input) => {
			const data = new TextEncoder().encode(input);
			const hash = await crypto.subtle.digest("SHA-1", data);
			return Array.from(new Uint8Array(hash))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		},
	},
	"sha-512": {
		id: "sha-512",
		name: "SHA-512 Hash",
		category: "hashing",
		description: "Generate SHA-512 hash of text",
		process: async (input) => {
			const data = new TextEncoder().encode(input);
			const hash = await crypto.subtle.digest("SHA-512", data);
			return Array.from(new Uint8Array(hash))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		},
	},

	// ── Data Format ─────────────────────────────────────────────────────────
	"json-format": {
		id: "json-format",
		name: "JSON Format",
		category: "data",
		description: "Format/beautify JSON with indentation",
		process: async (input) => JSON.stringify(JSON.parse(input), null, 2),
		settings: [{ key: "indent", label: "Indentation", type: "number", default: 2 }],
	},
	"json-minify": {
		id: "json-minify",
		name: "JSON Minify",
		category: "data",
		description: "Minify JSON (remove whitespace)",
		process: async (input) => JSON.stringify(JSON.parse(input)),
	},
	"json-to-xml": {
		id: "json-to-xml",
		name: "JSON to XML",
		category: "data",
		description: "Convert JSON to XML format",
		process: async (input, settings) => {
			const obj = JSON.parse(input);
			const root = settings?.rootName || "root";
			function toXml(o: any, name: string, level: number): string {
				const pad = "  ".repeat(level);
				if (o === null || o === undefined) return `${pad}<${name}/>`;
				if (typeof o !== "object") return `${pad}<${name}>${escapeXml(String(o))}</${name}>`;
				if (Array.isArray(o)) return o.map((item) => toXml(item, name, level)).join("\n");
				let xml = `${pad}<${name}>`;
				for (const [k, v] of Object.entries(o)) {
					if (Array.isArray(v)) {
						xml += `\n${v.map((item) => toXml(item, k, level + 1)).join("\n")}`;
					} else {
						xml += `\n${toXml(v, k, level + 1)}`;
					}
				}
				xml += `\n${pad}</${name}>`;
				return xml;
			}
			return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(obj, root, 0)}`;
		},
		settings: [{ key: "rootName", label: "Root Element", type: "text", default: "root" }],
	},
	"json-to-typescript": {
		id: "json-to-typescript",
		name: "JSON to TypeScript",
		category: "data",
		description: "Convert JSON to TypeScript interface",
		process: async (input, settings) => {
			const obj = JSON.parse(input);
			const name = settings?.typeName || "RootType";
			function getType(v: any): string {
				if (v === null || v === undefined) return "null";
				if (Array.isArray(v)) return v.length > 0 ? `${getType(v[0])}[]` : "unknown[]";
				if (typeof v === "object") return "object";
				return typeof v;
			}
			function buildInterface(o: any, ifaceName: string): string {
				let result = `interface ${ifaceName} {\n`;
				for (const [k, v] of Object.entries(o)) {
					if (v !== null && typeof v === "object" && !Array.isArray(v)) {
						result += `  ${k}: ${k.charAt(0).toUpperCase()}${k.slice(1)};\n`;
					} else {
						result += `  ${k}: ${getType(v)};\n`;
					}
				}
				result += "}";
				return result;
			}
			return buildInterface(obj, name);
		},
		settings: [{ key: "typeName", label: "Interface Name", type: "text", default: "RootType" }],
	},
	"yaml-to-json": {
		id: "yaml-to-json",
		name: "YAML to JSON",
		category: "data",
		description: "Convert YAML to JSON (simple key-value)",
		process: async (input) => {
			// Simple YAML parser for flat/nested objects
			const lines = input.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
			const result: any = {};
			let current = result;
			const stack: any[] = [result];
			for (const line of lines) {
				const indent = line.search(/\S/);
				const match = line.trim().match(/^(\w+):\s*(.*)$/);
				if (match) {
					const key = match[1];
					const value = match[2].trim();
					if (value) {
						if (/^-?\d+$/.test(value)) current[key] = Number.parseInt(value);
						else if (/^-?\d+\.\d+$/.test(value)) current[key] = Number.parseFloat(value);
						else if (value === "true") current[key] = true;
						else if (value === "false") current[key] = false;
						else current[key] = value.replace(/^["']|["']$/g, "");
					} else {
						current[key] = {};
						stack.push(current);
						current = current[key];
					}
				}
			}
			return JSON.stringify(result, null, 2);
		},
	},
	"csv-to-json": {
		id: "csv-to-json",
		name: "CSV to JSON",
		category: "data",
		description: "Convert CSV to JSON array",
		process: async (input) => {
			const lines = input
				.trim()
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length < 2) return "[]";
			const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
			const result = [];
			for (let i = 1; i < lines.length; i++) {
				const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
				const row: any = {};
				headers.forEach((h, j) => {
					row[h] = values[j] || "";
				});
				result.push(row);
			}
			return JSON.stringify(result, null, 2);
		},
	},
};

// ─── Pre-built Workflow Templates ────────────────────────────────────────────

export const workflowTemplates: WorkflowTemplate[] = [
	{
		id: "json-processing",
		name: "JSON Processing Pipeline",
		description: "Format → Minify → Base64 Encode",
		steps: [{ toolId: "json-format" }, { toolId: "json-minify" }, { toolId: "base64-encode" }],
	},
	{
		id: "data-migration",
		name: "Data Migration: CSV → JSON → TypeScript",
		description: "Convert CSV data to JSON, then generate TypeScript interfaces",
		steps: [{ toolId: "csv-to-json" }, { toolId: "json-format" }, { toolId: "json-to-typescript" }],
	},
	{
		id: "text-cleanup",
		name: "Text Cleanup Pipeline",
		description: "Trim whitespace → Remove empty lines → Sort → Remove duplicates",
		steps: [
			{ toolId: "trim-whitespace" },
			{ toolId: "remove-empty-lines" },
			{ toolId: "sort-lines" },
			{ toolId: "remove-duplicates" },
		],
	},
	{
		id: "encoding-chain",
		name: "Encoding Chain: Text → Base64 → URL Encode",
		description: "Encode text through multiple layers",
		steps: [{ toolId: "base64-encode" }, { toolId: "url-encode" }],
	},
	{
		id: "hash-pipeline",
		name: "Hash Pipeline: SHA-256 → Base64",
		description: "Hash text with SHA-256, then Base64 encode the hash",
		steps: [{ toolId: "sha-256" }, { toolId: "base64-encode" }],
	},
	{
		id: "json-to-xml-typescript",
		name: "JSON → XML + TypeScript",
		description: "Convert JSON to both XML and TypeScript formats",
		steps: [{ toolId: "json-format" }, { toolId: "json-to-xml" }],
	},
];

// ─── Workflow Execution Engine ───────────────────────────────────────────────

export async function executeWorkflow(
	steps: WorkflowStep[],
	input: string,
	onStepStart: (index: number, toolName: string) => void,
	onStepComplete: (index: number, result: StepResult) => void,
	onStepError: (index: number, error: string) => void,
): Promise<{ results: StepResult[]; finalOutput: string; success: boolean }> {
	const results: StepResult[] = [];
	let currentInput = input;
	let success = true;

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const tool = workflowTools[step.toolId];

		if (!tool) {
			const error = `Unknown tool: ${step.toolId}`;
			onStepError(i, error);
			results.push({
				stepId: step.id,
				toolId: step.toolId,
				toolName: step.toolId,
				input: currentInput,
				output: "",
				success: false,
				error,
				duration: 0,
			});
			success = false;
			break;
		}

		onStepStart(i, tool.name);
		const startTime = performance.now();

		try {
			const output = await tool.process(currentInput, step.settings);
			const duration = Math.round(performance.now() - startTime);

			const result: StepResult = {
				stepId: step.id,
				toolId: step.toolId,
				toolName: tool.name,
				input: currentInput,
				output,
				success: true,
				duration,
			};

			results.push(result);
			onStepComplete(i, result);
			currentInput = output;
		} catch (e: any) {
			const duration = Math.round(performance.now() - startTime);
			const error = e.message || "Unknown error";

			onStepError(i, error);
			results.push({
				stepId: step.id,
				toolId: step.toolId,
				toolName: tool.name,
				input: currentInput,
				output: "",
				success: false,
				error,
				duration,
			});
			success = false;
			break;
		}
	}

	return { results, finalOutput: currentInput, success };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createStepId(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function getToolsByCategory(): Record<string, WorkflowTool[]> {
	const grouped: Record<string, WorkflowTool[]> = {};
	for (const tool of Object.values(workflowTools)) {
		if (!grouped[tool.category]) grouped[tool.category] = [];
		grouped[tool.category].push(tool);
	}
	return grouped;
}
