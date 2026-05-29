/**
 * Workflow Engine: Tool Chains / Pipeline execution
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

// ─── Workflow-Compatible Tool Registry ───────────────────────────────────────

export const workflowTools: Record<string, WorkflowTool> = {
	// ── Text Transforms ─────────────────────────────────────────────────────
	"case-converter": {
		id: "case-converter",
		name: "Case Converter",
		category: "text",
		description:
			"Convert text to UPPERCASE, lowercase, camelCase, snake_case, kebab-case, or PascalCase",
		process: async (input, settings) => {
			const mode = settings?.mode || "lowercase";
			if (mode === "uppercase") return input.toUpperCase();
			if (mode === "lowercase") return input.toLowerCase();
			if (mode === "camelCase") {
				return input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
			}
			if (mode === "snake_case") {
				return input
					.replace(/\s+/g, "_")
					.replace(/([a-z])([A-Z])/g, "$1_$2")
					.toLowerCase()
					.replace(/[^a-z0-9_]/g, "");
			}
			if (mode === "kebab-case") {
				return input
					.replace(/\s+/g, "-")
					.replace(/([a-z])([A-Z])/g, "$1-$2")
					.toLowerCase()
					.replace(/[^a-z0-9-]/g, "");
			}
			if (mode === "PascalCase") {
				const camel = input
					.toLowerCase()
					.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
				return camel.charAt(0).toUpperCase() + camel.slice(1);
			}
			return input;
		},
		settings: [
			{
				key: "mode",
				label: "Mode",
				type: "select",
				default: "lowercase",
				options: [
					{ label: "lower case", value: "lowercase" },
					{ label: "UPPER CASE", value: "uppercase" },
					{ label: "camelCase", value: "camelCase" },
					{ label: "snake_case", value: "snake_case" },
					{ label: "kebab-case", value: "kebab-case" },
					{ label: "PascalCase", value: "PascalCase" },
				],
			},
		],
	},
	"whitespace-remover": {
		id: "whitespace-remover",
		name: "Whitespace Remover",
		category: "text",
		description: "Trim whitespace or remove blank empty lines",
		process: async (input, settings) => {
			const mode = settings?.mode || "trim";
			if (mode === "trim") {
				return input
					.split("\n")
					.map((l) => l.trim())
					.join("\n");
			}
			if (mode === "remove-empty") {
				return input
					.split("\n")
					.filter((l) => l.trim())
					.join("\n");
			}
			return input.replace(/\s+/g, " ");
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "trim",
				options: [
					{ label: "Trim line-ends", value: "trim" },
					{ label: "Remove empty lines", value: "remove-empty" },
					{ label: "Collapse all spaces", value: "collapse" },
				],
			},
		],
	},
	"text-reverser": {
		id: "text-reverser",
		name: "Text Reverser",
		category: "text",
		description: "Reverse the characters of the input text",
		process: async (input) => Array.from(input).reverse().join(""),
	},
	"text-sorter": {
		id: "text-sorter",
		name: "Text Sorter",
		category: "text",
		description: "Sort text lines alphabetically",
		process: async (input, settings) => {
			const order = settings?.order || "asc";
			const sorted = input.split("\n").sort();
			if (order === "desc") sorted.reverse();
			return sorted.join("\n");
		},
		settings: [
			{
				key: "order",
				label: "Order",
				type: "select",
				default: "asc",
				options: [
					{ label: "A to Z (Ascending)", value: "asc" },
					{ label: "Z to A (Descending)", value: "desc" },
				],
			},
		],
	},
	"remove-duplicate-lines": {
		id: "remove-duplicate-lines",
		name: "Remove Duplicate Lines",
		category: "text",
		description: "Remove duplicate lines from input text",
		process: async (input) => [...new Set(input.split("\n"))].join("\n"),
	},
	"find-replace": {
		id: "find-replace",
		name: "Find & Replace",
		category: "text",
		description: "Find and replace text strings or regular expression matches",
		process: async (input, settings) => {
			const search = settings?.search || "";
			const replace = settings?.replace || "";
			const isRegex =
				settings?.isRegex === 1 || settings?.isRegex === "1" || settings?.isRegex === true;
			if (!search) return input;
			if (isRegex) {
				const regex = new RegExp(search, "g");
				return input.replace(regex, replace);
			}
			return input.replaceAll(search, replace);
		},
		settings: [
			{ key: "search", label: "Search Pattern", type: "text", default: "" },
			{ key: "replace", label: "Replacement", type: "text", default: "" },
			{ key: "isRegex", label: "Regex (0 = No, 1 = Yes)", type: "number", default: 0 },
		],
	},
	"text-repeater": {
		id: "text-repeater",
		name: "Text Repeater",
		category: "text",
		description: "Repeat the input text a specified number of times",
		process: async (input, settings) => {
			const count = Number(settings?.count ?? 3);
			const separator = settings?.separator ?? "\n";
			return Array(Math.max(1, count)).fill(input).join(separator);
		},
		settings: [
			{ key: "count", label: "Repeat Count", type: "number", default: 3 },
			{ key: "separator", label: "Separator", type: "text", default: "\n" },
		],
	},
	"text-truncate": {
		id: "text-truncate",
		name: "Text Truncate",
		category: "text",
		description: "Truncate text to a maximum character length",
		process: async (input, settings) => {
			const max = Number(settings?.max ?? 100);
			if (input.length <= max) return input;
			return `${input.slice(0, max)}...`;
		},
		settings: [{ key: "max", label: "Max Characters", type: "number", default: 100 }],
	},

	// ── Encodings ────────────────────────────────────────────────────────────
	"base64-encoder": {
		id: "base64-encoder",
		name: "Base64 Encoder",
		category: "encoding",
		description: "Encode or decode text in Base64 format",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			if (mode === "decode") {
				return decodeURIComponent(escape(atob(input.trim())));
			}
			return btoa(unescape(encodeURIComponent(input)));
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "Encode to Base64", value: "encode" },
					{ label: "Decode from Base64", value: "decode" },
				],
			},
		],
	},
	"url-encoder": {
		id: "url-encoder",
		name: "URL Encoder",
		category: "encoding",
		description: "Encode or decode text for URLs",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			if (mode === "decode") {
				return decodeURIComponent(input);
			}
			return encodeURIComponent(input);
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "URL Encode", value: "encode" },
					{ label: "URL Decode", value: "decode" },
				],
			},
		],
	},
	"html-entity-encoder": {
		id: "html-entity-encoder",
		name: "HTML Entity Encoder",
		category: "encoding",
		description: "Encode or decode HTML character entities",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			if (mode === "decode") {
				const t = document.createElement("textarea");
				t.innerHTML = input;
				return t.value;
			}
			return input
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;")
				.replace(/[\u0080-\uFFFF]/g, (c) => `&#${c.charCodeAt(0)};`);
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "Encode HTML Entities", value: "encode" },
					{ label: "Decode HTML Entities", value: "decode" },
				],
			},
		],
	},
	"text-to-binary": {
		id: "text-to-binary",
		name: "Text to Binary",
		category: "encoding",
		description: "Convert text to binary representation (and vice versa)",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			if (mode === "decode") {
				return input
					.trim()
					.split(/\s+/)
					.map((b) => String.fromCodePoint(Number.parseInt(b, 2)))
					.join("");
			}
			return Array.from(input)
				.map((c) => c.codePointAt(0)!.toString(2).padStart(8, "0"))
				.join(" ");
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "Text to Binary", value: "encode" },
					{ label: "Binary to Text", value: "decode" },
				],
			},
		],
	},
	"text-to-hex": {
		id: "text-to-hex",
		name: "Text to Hex",
		category: "encoding",
		description: "Convert text to hexadecimal representation (and vice versa)",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			if (mode === "decode") {
				return input
					.trim()
					.replace(/0x/gi, "")
					.split(/\s+/)
					.map((h) => String.fromCodePoint(Number.parseInt(h, 16)))
					.join("");
			}
			return Array.from(input)
				.map((c) => c.codePointAt(0)!.toString(16).toUpperCase().padStart(2, "0"))
				.join(" ");
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "Text to Hex", value: "encode" },
					{ label: "Hex to Text", value: "decode" },
				],
			},
		],
	},
	"rot13-encoder": {
		id: "rot13-encoder",
		name: "ROT13 Encoder",
		category: "encoding",
		description: "Encode or decode ROT13 Caesar cipher text",
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
	"morse-code-converter": {
		id: "morse-code-converter",
		name: "Morse Code Converter",
		category: "encoding",
		description: "Translate alphanumeric text into Morse code and vice versa",
		process: async (input, settings) => {
			const mode = settings?.mode || "encode";
			const MORSE_CODE: Record<string, string> = {
				A: ".-",
				B: "-...",
				C: "-.-.",
				D: "-..",
				E: ".",
				F: "..-.",
				G: "--.",
				H: "....",
				I: "..",
				J: ".---",
				K: "-.-",
				L: ".-..",
				M: "--",
				N: "-.",
				O: "---",
				P: ".--.",
				Q: "--.-",
				R: ".-.",
				S: "...",
				T: "-",
				U: "..-",
				V: "...-",
				W: ".--",
				X: "-..-",
				Y: "-.--",
				Z: "--..",
				"1": ".----",
				"2": "..---",
				"3": "...--",
				"4": "....-",
				"5": ".....",
				"6": "-....",
				"7": "--...",
				"8": "---..",
				"9": "----.",
				"0": "-----",
				" ": "/",
			};
			if (mode === "decode") {
				const reverseMap = Object.entries(MORSE_CODE).reduce(
					(acc, [k, v]) => {
						acc[v] = k;
						return acc;
					},
					{} as Record<string, string>,
				);
				return input
					.trim()
					.split(/\s+/)
					.map((code) => reverseMap[code] || code)
					.join("");
			}
			return Array.from(input.toUpperCase())
				.map((char) => MORSE_CODE[char] || char)
				.join(" ");
		},
		settings: [
			{
				key: "mode",
				label: "Action",
				type: "select",
				default: "encode",
				options: [
					{ label: "Text to Morse Code", value: "encode" },
					{ label: "Morse Code to Text", value: "decode" },
				],
			},
		],
	},

	// ── Hashing ─────────────────────────────────────────────────────────────
	"hash-generator": {
		id: "hash-generator",
		name: "Hash Generator",
		category: "hashing",
		description: "Generate SHA-256, SHA-1, or SHA-512 cryptographic hashes",
		process: async (input, settings) => {
			const algo = settings?.algorithm || "sha256";
			const mapping: Record<string, string> = {
				sha256: "SHA-256",
				sha1: "SHA-1",
				sha512: "SHA-512",
			};
			const selectedAlgo = mapping[algo] || "SHA-256";
			const data = new TextEncoder().encode(input);
			const hash = await crypto.subtle.digest(selectedAlgo, data);
			return Array.from(new Uint8Array(hash))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		},
		settings: [
			{
				key: "algorithm",
				label: "Algorithm",
				type: "select",
				default: "sha256",
				options: [
					{ label: "SHA-256", value: "sha256" },
					{ label: "SHA-1", value: "sha1" },
					{ label: "SHA-512", value: "sha512" },
				],
			},
		],
	},

	// ── Data Formats ─────────────────────────────────────────────────────────
	"json-formatter": {
		id: "json-formatter",
		name: "JSON Formatter",
		category: "data",
		description: "Beautify or minify JSON configurations",
		process: async (input, settings) => {
			const mode = settings?.mode || "format";
			const indent = Number(settings?.indent ?? 2);
			const obj = JSON.parse(input);
			if (mode === "minify") return JSON.stringify(obj);
			return JSON.stringify(obj, null, indent);
		},
		settings: [
			{
				key: "mode",
				label: "Mode",
				type: "select",
				default: "format",
				options: [
					{ label: "Format / Beautify", value: "format" },
					{ label: "Minify", value: "minify" },
				],
			},
			{ key: "indent", label: "Indentation Spaces", type: "number", default: 2 },
		],
	},
	"json-to-xml": {
		id: "json-to-xml",
		name: "JSON to XML",
		category: "data",
		description: "Convert JSON configurations to XML element trees",
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
		description: "Generate clean TypeScript interfaces from a JSON document",
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
		description: "Convert YAML configuration to JSON format",
		process: async (input) => {
			const yaml = await import("js-yaml");
			const doc = yaml.load(input);
			return JSON.stringify(doc, null, 2);
		},
	},
	"json-to-yaml": {
		id: "json-to-yaml",
		name: "JSON to YAML",
		category: "data",
		description: "Convert JSON to YAML configuration format",
		process: async (input) => {
			const yaml = await import("js-yaml");
			const obj = JSON.parse(input);
			return yaml.dump(obj);
		},
	},
	"toml-to-json": {
		id: "toml-to-json",
		name: "TOML to JSON",
		category: "data",
		description: "Convert TOML configuration to JSON format",
		process: async (input) => {
			const parsed = parseToml(input);
			return JSON.stringify(parsed, null, 2);
		},
	},
	"json-to-toml": {
		id: "json-to-toml",
		name: "JSON to TOML",
		category: "data",
		description: "Convert JSON to TOML configuration format",
		process: async (input) => {
			const parsed = JSON.parse(input);
			return jsonToToml(parsed).trim();
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
	"markdown-to-html": {
		id: "markdown-to-html",
		name: "Markdown to HTML",
		category: "data",
		description: "Convert Markdown syntax into HTML markup",
		process: async (input) => {
			const { marked } = await import("marked");
			return marked.parse(input) as string;
		},
	},
	"url-parser": {
		id: "url-parser",
		name: "URL Parser",
		category: "utility",
		description: "Extract components and search parameters from a URL into JSON",
		process: async (input) => {
			try {
				const url = new URL(input.trim());
				const params: Record<string, string> = {};
				url.searchParams.forEach((val, key) => {
					params[key] = val;
				});
				return JSON.stringify(
					{
						href: url.href,
						protocol: url.protocol,
						host: url.host,
						hostname: url.hostname,
						port: url.port,
						pathname: url.pathname,
						search: url.search,
						hash: url.hash,
						searchParams: params,
					},
					null,
					2,
				);
			} catch (e: any) {
				throw new Error(`Invalid URL: ${e.message}`);
			}
		},
	},
};

// ─── Pre-built Workflow Templates ────────────────────────────────────────────

export const workflowTemplates: WorkflowTemplate[] = [
	{
		id: "json-processing",
		name: "JSON Processing Pipeline",
		description: "Format → Minify → Base64 Encode",
		steps: [
			{ toolId: "json-formatter", settings: { mode: "format" } },
			{ toolId: "json-formatter", settings: { mode: "minify" } },
			{ toolId: "base64-encoder", settings: { mode: "encode" } },
		],
	},
	{
		id: "data-migration",
		name: "Data Migration: CSV → JSON → TypeScript",
		description: "Convert CSV data to JSON, then generate TypeScript interfaces",
		steps: [
			{ toolId: "csv-to-json" },
			{ toolId: "json-formatter", settings: { mode: "format" } },
			{ toolId: "json-to-typescript" },
		],
	},
	{
		id: "text-cleanup",
		name: "Text Cleanup Pipeline",
		description: "Trim whitespace → Remove empty lines → Sort → Remove duplicates",
		steps: [
			{ toolId: "whitespace-remover", settings: { mode: "trim" } },
			{ toolId: "whitespace-remover", settings: { mode: "remove-empty" } },
			{ toolId: "text-sorter", settings: { order: "asc" } },
			{ toolId: "remove-duplicate-lines" },
		],
	},
	{
		id: "encoding-chain",
		name: "Encoding Chain: Text → Base64 → URL Encode",
		description: "Encode text through multiple layers",
		steps: [
			{ toolId: "base64-encoder", settings: { mode: "encode" } },
			{ toolId: "url-encoder", settings: { mode: "encode" } },
		],
	},
	{
		id: "hash-pipeline",
		name: "Hash Pipeline: SHA-256 → Base64",
		description: "Hash text with SHA-256, then Base64 encode the hash",
		steps: [
			{ toolId: "hash-generator", settings: { algorithm: "sha256" } },
			{ toolId: "base64-encoder", settings: { mode: "encode" } },
		],
	},
	{
		id: "json-to-xml-typescript",
		name: "JSON → XML + TypeScript",
		description: "Convert JSON to both XML and TypeScript formats",
		steps: [{ toolId: "json-formatter", settings: { mode: "format" } }, { toolId: "json-to-xml" }],
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

// ─── TOML parsing & formatting helpers ──────────────────────────────────────

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
