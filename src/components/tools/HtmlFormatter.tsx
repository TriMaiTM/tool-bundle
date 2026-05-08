import { useCallback, useMemo, useState } from "preact/hooks";

type Mode = "format" | "minify";

interface FormatOptions {
	indentSize: number;
	wrapLineLength: number;
}

interface MinifyOptions {
	removeComments: boolean;
	collapseWhitespace: boolean;
	removeOptionalTags: boolean;
}

const SELF_CLOSING_TAGS = new Set([
	"br",
	"hr",
	"img",
	"input",
	"meta",
	"link",
	"area",
	"base",
	"col",
	"embed",
	"param",
	"source",
	"track",
	"wbr",
]);

const VOID_ELEMENTS = new Set([
	"br",
	"hr",
	"img",
	"input",
	"meta",
	"link",
	"area",
	"base",
	"col",
	"embed",
	"param",
	"source",
	"track",
	"wbr",
]);

function formatHtml(html: string, options: FormatOptions): string {
	const { indentSize, wrapLineLength } = options;
	const indentStr = indentLevel(indentSize);

	// Tokenize: split into tags and text content
	const tokens = tokenize(html);
	let result = "";
	let indent = 0;
	let lineLength = 0;

	for (const token of tokens) {
		if (token.type === "comment") {
			const commentStr = `<!--${token.value}-->`;
			if (lineLength + commentStr.length > wrapLineLength && lineLength > 0) {
				result += `\n${indentStr.repeat(indent)}`;
				lineLength = indent * indentSize;
			}
			result += commentStr;
			lineLength += commentStr.length;
			continue;
		}

		if (token.type === "doctype") {
			const doctypeStr = `<!DOCTYPE ${token.value}>`;
			result += `${doctypeStr}\n`;
			lineLength = 0;
			continue;
		}

		if (token.type === "text") {
			const text = token.value.trim();
			if (!text) continue;
			if (lineLength + text.length > wrapLineLength && lineLength > 0) {
				result += `\n${indentStr.repeat(indent)}`;
				lineLength = indent * indentSize;
			}
			result += text;
			lineLength += text.length;
			continue;
		}

		if (token.type === "tag") {
			const tagName = token.tagName.toLowerCase();
			const isSelfClosing = SELF_CLOSING_TAGS.has(tagName) || token.selfClosing;
			const isClosingTag = token.closing;
			const isVoid = VOID_ELEMENTS.has(tagName);

			if (isClosingTag) {
				indent = Math.max(0, indent - 1);
				result = result.trimEnd();
				result += `\n${indentStr.repeat(indent)}<${token.raw}>`;
				lineLength = indent * indentSize + token.raw.length + 2;
			} else if (isSelfClosing || isVoid) {
				const tagStr = token.selfClosing ? `<${token.raw}/>` : `<${token.raw}>`;
				if (lineLength + tagStr.length > wrapLineLength && lineLength > 0) {
					result += `\n${indentStr.repeat(indent)}`;
					lineLength = indent * indentSize;
				}
				result += tagStr;
				lineLength += tagStr.length;
			} else {
				if (lineLength > 0) {
					result += `\n${indentStr.repeat(indent)}`;
					lineLength = indent * indentSize;
				}
				result += `<${token.raw}>`;
				lineLength += token.raw.length + 2;
				indent++;
			}
		}
	}

	return result
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function indentLevel(indentSize: number): string {
	if (indentSize === -1) return "\t";
	return " ".repeat(indentSize);
}

interface Token {
	type: "tag" | "text" | "comment" | "doctype";
	value: string;
	raw: string;
	tagName: string;
	closing: boolean;
	selfClosing: boolean;
}

function tokenize(html: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < html.length) {
		// Comment
		if (html.startsWith("<!--", i)) {
			const end = html.indexOf("-->", i + 4);
			if (end !== -1) {
				tokens.push({
					type: "comment",
					value: html.substring(i + 4, end),
					raw: "",
					tagName: "",
					closing: false,
					selfClosing: false,
				});
				i = end + 3;
				continue;
			}
		}

		// DOCTYPE
		if (html.startsWith("<!", i) && !html.startsWith("<!--", i)) {
			const end = html.indexOf(">", i);
			if (end !== -1) {
				tokens.push({
					type: "doctype",
					value: html.substring(i + 2, end).trim(),
					raw: "",
					tagName: "",
					closing: false,
					selfClosing: false,
				});
				i = end + 1;
				continue;
			}
		}

		// Tag
		if (html[i] === "<") {
			const end = html.indexOf(">", i);
			if (end !== -1) {
				const tagContent = html.substring(i + 1, end);
				const closing = tagContent.startsWith("/");
				const selfClosing = tagContent.endsWith("/");
				const raw = closing
					? tagContent.substring(1)
					: selfClosing
						? tagContent.slice(0, -1)
						: tagContent;
				const tagNameMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
				tokens.push({
					type: "tag",
					value: "",
					raw: raw.trim(),
					tagName: tagNameMatch ? tagNameMatch[1] : "",
					closing,
					selfClosing,
				});
				i = end + 1;
				continue;
			}
		}

		// Text content
		let textEnd = html.indexOf("<", i);
		if (textEnd === -1) textEnd = html.length;
		const text = html.substring(i, textEnd);
		if (text.trim()) {
			tokens.push({
				type: "text",
				value: text,
				raw: "",
				tagName: "",
				closing: false,
				selfClosing: false,
			});
		}
		i = textEnd;
	}

	return tokens;
}

function minifyHtml(html: string, options: MinifyOptions): string {
	let result = html;

	if (options.removeComments) {
		result = result.replace(/<!--[\s\S]*?-->/g, "");
	}

	if (options.collapseWhitespace) {
		// Collapse whitespace between tags
		result = result.replace(/>\s+</g, "><");
		// Collapse whitespace within text content
		result = result.replace(/\s{2,}/g, " ");
		// Trim whitespace around tags
		result = result.replace(/\s*>\s*/g, ">");
		result = result.replace(/\s*<\s*/g, "<");
	}

	if (options.removeOptionalTags) {
		// Remove optional closing tags
		result = result.replace(
			/<\/(li|dt|dd|p|rt|rp|optgroup|option|colgroup|caption|thead|tbody|tfoot|tr|td|th)>/gi,
			"",
		);
		// Remove optional opening <html>, <head>, <body>
		result = result.replace(/<html[^>]*>/gi, "");
		result = result.replace(/<\/html>/gi, "");
		result = result.replace(/<head[^>]*>/gi, "");
		result = result.replace(/<\/head>/gi, "");
		result = result.replace(/<body[^>]*>/gi, "");
		result = result.replace(/<\/body>/gi, "");
	}

	return result.trim();
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="main-header">
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact Us</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <h1>Welcome to the Sample Page</h1>
    <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
    <!-- This is a comment that should be preserved in format mode -->
    <div class="container">
      <img src="photo.jpg" alt="A photo" width="600" height="400">
      <br>
      <hr>
      <form action="/submit" method="post">
        <input type="text" name="username" placeholder="Username">
        <input type="email" name="email" placeholder="Email">
        <button type="submit">Submit</button>
      </form>
    </div>
  </main>
  <footer>
    <p>&copy; 2024 Sample Company. All rights reserved.</p>
  </footer>
</body>
</html>`;

export default function HtmlFormatter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<Mode>("format");
	const [indentSize, setIndentSize] = useState(2);
	const [wrapLineLength, setWrapLineLength] = useState(80);
	const [removeComments, setRemoveComments] = useState(true);
	const [collapseWhitespace, setCollapseWhitespace] = useState(true);
	const [removeOptionalTags, setRemoveOptionalTags] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const result = useMemo(() => {
		if (!input.trim()) {
			setError(null);
			return "";
		}
		try {
			if (mode === "format") {
				const formatted = formatHtml(input, { indentSize, wrapLineLength });
				setError(null);
				return formatted;
			}
			const minified = minifyHtml(input, {
				removeComments,
				collapseWhitespace,
				removeOptionalTags,
			});
			setError(null);
			return minified;
		} catch (e) {
			setError((e as Error).message);
			return "";
		}
	}, [
		input,
		mode,
		indentSize,
		wrapLineLength,
		removeComments,
		collapseWhitespace,
		removeOptionalTags,
	]);

	const originalSize = useMemo(() => new TextEncoder().encode(input).length, [input]);
	const resultSize = useMemo(() => new TextEncoder().encode(result).length, [result]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_HTML);
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
						<label class="flex items-center gap-2 text-body-sm">
							<span class="text-caption-uppercase text-muted">Wrap at</span>
							<input
								class="input"
								type="number"
								style="width: 80px; height: 36px"
								value={wrapLineLength}
								min={40}
								max={200}
								onInput={(e) =>
									setWrapLineLength(
										Math.max(40, Math.min(200, Number((e.target as HTMLInputElement).value) || 80)),
									)
								}
							/>
							<span class="text-caption-uppercase text-muted">chars</span>
						</label>
					</>
				)}

				{mode === "minify" && (
					<div class="flex items-center gap-4 text-body-sm">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={removeComments}
								onChange={(e) => setRemoveComments((e.target as HTMLInputElement).checked)}
							/>
							Remove comments
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={collapseWhitespace}
								onChange={(e) => setCollapseWhitespace((e.target as HTMLInputElement).checked)}
							/>
							Collapse whitespace
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={removeOptionalTags}
								onChange={(e) => setRemoveOptionalTags((e.target as HTMLInputElement).checked)}
							/>
							Remove optional tags
						</label>
					</div>
				)}

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Load Sample
				</button>
			</div>

			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
					<strong>Error:</strong> {error}
				</div>
			)}

			{input.trim() && result && (
				<div class="bg-surface-elevated rounded-lg p-3 mb-4 flex flex-wrap items-center gap-4">
					<div class="flex items-center gap-2">
						<span class="text-caption-uppercase text-muted">Original:</span>
						<span class="badge">{formatSize(originalSize)}</span>
					</div>
					<span class="text-caption-uppercase text-muted">&rarr;</span>
					<div class="flex items-center gap-2">
						<span class="text-caption-uppercase text-muted">
							{mode === "format" ? "Formatted" : "Minified"}:
						</span>
						<span class="badge">{formatSize(resultSize)}</span>
					</div>
					{originalSize > 0 && (
						<span class="text-caption-uppercase text-muted">
							(
							{mode === "minify" && resultSize < originalSize
								? `${((1 - resultSize / originalSize) * 100).toFixed(1)}% smaller`
								: mode === "format" && resultSize > originalSize
									? `${((resultSize / originalSize - 1) * 100).toFixed(1)}% larger`
									: "Same size"}
							)
						</span>
					)}
				</div>
			)}

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input HTML</label>
					<textarea
						class="textarea code-block"
						style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your HTML here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Output</label>
						{result && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea code-block"
						style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
						value={result}
						readOnly
						placeholder={
							mode === "format"
								? "Formatted HTML will appear here..."
								: "Minified HTML will appear here..."
						}
					/>
				</div>
			</div>
		</div>
	);
}
