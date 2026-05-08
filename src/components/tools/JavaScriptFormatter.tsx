import { useCallback, useMemo, useState } from "preact/hooks";

type Mode = "format" | "minify";

const JS_KEYWORDS = [
	"function",
	"const",
	"let",
	"var",
	"if",
	"else",
	"for",
	"while",
	"return",
	"try",
	"catch",
	"finally",
	"switch",
	"case",
	"break",
	"continue",
	"new",
	"class",
	"extends",
	"import",
	"export",
	"default",
];

function removeComments(code: string): string {
	// Remove single-line comments
	let result = code.replace(/\/\/.*$/gm, "");
	// Remove multi-line comments
	result = result.replace(/\/\*[\s\S]*?\*\//g, "");
	return result;
}

function formatJs(code: string, indentSize: number, uppercaseKeywords: boolean): string {
	let cleaned = removeComments(code);

	// Build keyword regex for splitting
	const kwPattern = JS_KEYWORDS.map((kw) => `\\b${kw}\\b`).join("|");

	// Insert separator tokens around braces and semicolons
	cleaned = cleaned.replace(/\{/g, " { ");
	cleaned = cleaned.replace(/\}/g, " } ");
	cleaned = cleaned.replace(/;/g, " ; ");

	// Insert separator tokens around keywords
	const kwRegex = new RegExp(`\\b(${kwPattern})\\b`, "g");
	cleaned = cleaned.replace(kwRegex, " $1 ");

	// Collapse whitespace
	cleaned = cleaned.replace(/\s+/g, " ").trim();

	const indentStr = indentSize === -1 ? "\t" : " ".repeat(indentSize);
	let indent = 0;
	const _result = "";
	let inString: string | null = null;
	let escapeNext = false;
	let token = "";
	const tokens: string[] = [];

	// Tokenize respecting string literals
	for (let i = 0; i < cleaned.length; i++) {
		const ch = cleaned[i];

		if (escapeNext) {
			token += ch;
			escapeNext = false;
			continue;
		}

		if (inString) {
			token += ch;
			if (ch === "\\") {
				escapeNext = true;
			} else if (ch === inString) {
				inString = null;
			}
			continue;
		}

		if (ch === '"' || ch === "'" || ch === "`") {
			if (token.trim()) tokens.push(token.trim());
			token = ch;
			inString = ch;
			continue;
		}

		if (ch === " ") {
			if (token.trim()) tokens.push(token.trim());
			token = "";
			continue;
		}

		if (ch === "{" || ch === "}" || ch === ";") {
			if (token.trim()) tokens.push(token.trim());
			tokens.push(ch);
			token = "";
			continue;
		}

		token += ch;
	}
	if (token.trim()) tokens.push(token.trim());

	// Format tokens
	const lines: string[] = [];
	let currentLine = "";

	for (let i = 0; i < tokens.length; i++) {
		const tok = tokens[i];

		if (tok === ";") {
			currentLine += ";";
			lines.push(currentLine);
			currentLine = "";
			continue;
		}

		if (tok === "{") {
			currentLine = `${currentLine.trimEnd()} {`;
			lines.push(currentLine);
			indent++;
			currentLine = "";
			continue;
		}

		if (tok === "}") {
			if (currentLine.trim()) {
				lines.push(currentLine);
				currentLine = "";
			}
			indent = Math.max(0, indent - 1);
			lines.push("}");
			continue;
		}

		// Check if token is a keyword
		let formatted = tok;
		const isKeyword = JS_KEYWORDS.includes(tok.toLowerCase());
		if (isKeyword && uppercaseKeywords) {
			formatted = tok.toUpperCase();
		}

		if (currentLine === "") {
			currentLine = indentStr.repeat(indent) + formatted;
		} else {
			currentLine += ` ${formatted}`;
		}
	}

	if (currentLine.trim()) {
		lines.push(currentLine);
	}

	return lines
		.map((line) => line.trimEnd())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function minifyJs(code: string): string {
	let result = removeComments(code);
	// Collapse whitespace
	result = result.replace(/\s+/g, " ");
	// Remove newlines
	result = result.replace(/\n/g, " ");
	// Remove spaces around operators (carefully)
	result = result.replace(/\s*([{}();,:])\s*/g, "$1");
	// Remove trailing semicolons before closing braces
	result = result.replace(/;}/g, "}");
	return result.trim();
}

const SAMPLE_JS = `function   calculateTotal(  items ) {
  // This function calculates the total
  let total = 0;
  for(let i=0;i<items.length;i++){
    const item = items[i];
    if(item.price > 0){
      total += item.price * item.quantity;
    }
  }
  /* Apply discount */
  if(total > 100){
    total = total * 0.9;
  }
  return total;
}

const formatCurrency = (amount) => {
  return '$' + amount.toFixed(2);
};

class ShoppingCart{
  constructor(){
    this.items = [];
  }
  addItem(item){
    this.items.push(item);
  }
  getTotal(){
    return calculateTotal(this.items);
  }
}`;

export default function JavaScriptFormatter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<Mode>("format");
	const [indentSize, setIndentSize] = useState(2);
	const [uppercaseKeywords, setUppercaseKeywords] = useState(false);
	const [copied, setCopied] = useState(false);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			if (mode === "format") {
				return formatJs(input, indentSize, uppercaseKeywords);
			}
			return minifyJs(input);
		} catch {
			return "Error processing JavaScript";
		}
	}, [input, mode, indentSize, uppercaseKeywords]);

	const inputSize = useMemo(() => new Blob([input]).size, [input]);
	const outputSize = useMemo(() => new Blob([result]).size, [result]);

	const sizeComparison = useMemo(() => {
		if (!input.trim() || !result) return null;
		const diff = inputSize - outputSize;
		const pct = inputSize > 0 ? Math.round((diff / inputSize) * 100) : 0;
		if (diff > 0) return `${pct}% smaller (${formatBytes(inputSize)} → ${formatBytes(outputSize)})`;
		if (diff < 0)
			return `${Math.abs(pct)}% larger (${formatBytes(inputSize)} → ${formatBytes(outputSize)})`;
		return `Same size (${formatBytes(inputSize)})`;
	}, [inputSize, outputSize, input, result]);

	const handleCopy = useCallback(async () => {
		if (result) {
			await navigator.clipboard.writeText(result);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}, [result]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_JS);
	}, []);

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<div class="flex rounded-md overflow-hidden border border-hairline">
					<button
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "format" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("format")}
					>
						Format
					</button>
					<button
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "minify" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("minify")}
					>
						Minify
					</button>
				</div>

				{mode === "format" && (
					<>
						<select
							class="input"
							style="width: auto; height: 36px"
							value={indentSize}
							onChange={(e) => setIndentSize(Number((e.target as HTMLSelectElement).value))}
						>
							<option value={2}>2 spaces</option>
							<option value={4}>4 spaces</option>
							<option value={-1}>Tab</option>
						</select>

						<label class="flex items-center gap-2 text-body-sm cursor-pointer">
							<input
								type="checkbox"
								checked={uppercaseKeywords}
								onChange={(e) => setUppercaseKeywords((e.target as HTMLInputElement).checked)}
							/>
							Uppercase Keywords
						</label>
					</>
				)}

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Load Sample
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input JavaScript</label>
					<textarea
						class="textarea"
						style="min-height: 350px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your JavaScript here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">
							Output
							{sizeComparison && <span class="badge badge-yellow ml-2">{sizeComparison}</span>}
						</label>
						{result && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 350px; font-family: var(--font-mono); font-size: 13px"
						value={result}
						readOnly
						placeholder={
							mode === "format"
								? "Formatted JavaScript will appear here..."
								: "Minified JavaScript will appear here..."
						}
					/>
				</div>
			</div>
		</div>
	);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}
