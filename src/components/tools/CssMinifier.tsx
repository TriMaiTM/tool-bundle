import { useCallback, useMemo, useState } from "preact/hooks";

interface MinifyOptions {
	removeComments: boolean;
	removeWhitespace: boolean;
	shortenColors: boolean;
	shortenZeros: boolean;
	removeLastSemicolon: boolean;
}

const DEFAULT_OPTIONS: MinifyOptions = {
	removeComments: true,
	removeWhitespace: true,
	shortenColors: true,
	shortenZeros: true,
	removeLastSemicolon: true,
};

const SAMPLE_CSS = `/* Reset styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0px;
  padding: 0px;
}

/* Body */
body {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333333;
  background-color: #ffffff;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0px auto;
  padding: 20px 30px;
}

/* Button styles */
.button {
  display: inline-block;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background-color: #007bff;
  border: 0px none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0056b3;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Card component */
.card {
  background-color: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
}

.card__title {
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 8px;
}

.card__text {
  color: #666666;
  line-height: 1.6;
}`;

function shortenColor(value: string): string {
	// Match hex colors like #ffffff, #aabbcc
	return value.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, "#$1$2$3");
}

function shortenZeros(value: string): string {
	// Replace 0px, 0em, 0rem, etc. with just 0
	return value.replace(/\b0(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch)\b/g, "0");
}

function removeLastSemicolon(value: string): string {
	// Remove semicolon before closing brace
	return value.replace(/;\s*}/g, "}");
}

function formatCss(css: string, indentSize: number): string {
	let result = "";
	let indent = 0;
	const indentStr = " ".repeat(indentSize);

	const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const normalized = cleaned.replace(/\s+/g, " ").trim();

	let i = 0;
	while (i < normalized.length) {
		const ch = normalized[i];

		if (ch === "{") {
			result = result.trimEnd();
			result += " {\n";
			indent++;
			result += indentStr.repeat(indent);
			i++;
			while (i < normalized.length && normalized[i] === " ") i++;
			continue;
		}

		if (ch === "}") {
			result = result.trimEnd();
			result += "\n";
			indent = Math.max(0, indent - 1);
			result += `${indentStr.repeat(indent)}}\n`;
			result += indentStr.repeat(indent);
			i++;
			while (i < normalized.length && normalized[i] === " ") i++;
			continue;
		}

		if (ch === ";") {
			result = result.trimEnd();
			result += ";\n";
			result += indentStr.repeat(indent);
			i++;
			while (i < normalized.length && normalized[i] === " ") i++;
			continue;
		}

		result += ch;
		i++;
	}

	return result
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function minifyCss(css: string, options: MinifyOptions): string {
	let result = css;

	if (options.removeComments) {
		result = result.replace(/\/\*[\s\S]*?\*\//g, "");
	}

	if (options.shortenColors) {
		result = shortenColor(result);
	}

	if (options.shortenZeros) {
		result = shortenZeros(result);
	}

	if (options.removeWhitespace) {
		result = result
			.replace(/\s+/g, " ")
			.replace(/\s*{\s*/g, "{")
			.replace(/\s*}\s*/g, "}")
			.replace(/\s*;\s*/g, ";")
			.replace(/\s*:\s*/g, ":")
			.replace(/\s*,\s*/g, ",")
			.trim();
	}

	if (options.removeLastSemicolon) {
		result = removeLastSemicolon(result);
	}

	return result;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function CssMinifier() {
	const [input, setInput] = useState("");
	const [options, setOptions] = useState<MinifyOptions>(DEFAULT_OPTIONS);
	const [copied, setCopied] = useState(false);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		return minifyCss(input, options);
	}, [input, options]);

	const formatted = useMemo(() => {
		if (!input.trim()) return "";
		return formatCss(input, 2);
	}, [input]);

	const stats = useMemo(() => {
		const originalSize = new TextEncoder().encode(input).length;
		const minifiedSize = new TextEncoder().encode(result).length;
		const savings = originalSize > 0 ? ((originalSize - minifiedSize) / originalSize) * 100 : 0;
		return { originalSize, minifiedSize, savings };
	}, [input, result]);

	const handleCopy = useCallback(async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [result]);

	const handleFormat = useCallback(() => {
		setInput(formatted);
	}, [formatted]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_CSS);
	}, []);

	const toggleOption = useCallback((key: keyof MinifyOptions) => {
		setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<button class="btn-secondary text-body-sm" onClick={handleSample}>
					Load Sample CSS
				</button>
				<button class="btn-secondary text-body-sm" onClick={handleFormat} disabled={!input.trim()}>
					Format (Beautify)
				</button>
			</div>

			<div class="flex flex-wrap gap-4 mb-4">
				{(
					[
						["removeComments", "Remove comments"],
						["removeWhitespace", "Remove whitespace"],
						["shortenColors", "Shorten colors (#fff)"],
						["shortenZeros", "Shorten zeros (0px → 0)"],
						["removeLastSemicolon", "Remove last semicolon"],
					] as [keyof MinifyOptions, string][]
				).map(([key, label]) => (
					<label key={key} class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={options[key]}
							onChange={() => toggleOption(key)}
							class="w-4 h-4"
						/>
						<span class="text-body-sm">{label}</span>
					</label>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input CSS</label>
					<textarea
						class="textarea"
						style="min-height: 350px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your CSS here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Minified Output</label>
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
						placeholder="Minified CSS will appear here..."
					/>
				</div>
			</div>

			{input.trim() && (
				<div class="card p-4 mt-4">
					<label class="text-caption-uppercase text-muted block mb-3">Size Statistics</label>
					<div class="grid grid-cols-3 gap-4 text-center">
						<div>
							<div class="text-body-sm text-muted">Original</div>
							<div class="text-body-lg font-bold">{formatBytes(stats.originalSize)}</div>
						</div>
						<div>
							<div class="text-body-sm text-muted">Minified</div>
							<div class="text-body-lg font-bold">{formatBytes(stats.minifiedSize)}</div>
						</div>
						<div>
							<div class="text-body-sm text-muted">Savings</div>
							<div
								class="text-body-lg font-bold"
								style={stats.savings > 0 ? "color: var(--color-success)" : ""}
							>
								{stats.savings.toFixed(1)}%
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
