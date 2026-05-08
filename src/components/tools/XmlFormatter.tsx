import { useCallback, useMemo, useState } from "preact/hooks";

type Mode = "format" | "minify" | "validate";

interface ValidationResult {
	valid: boolean;
	error: string | null;
	line: number | null;
}

function indentStr(indentSize: number): string {
	if (indentSize === -1) return "\t";
	return " ".repeat(indentSize);
}

interface XmlToken {
	type: "open" | "close" | "selfclose" | "text" | "comment" | "cdata" | "declaration" | "doctype";
	content: string;
	tagName?: string;
	line: number;
}

function tokenizeXml(xml: string): XmlToken[] {
	const tokens: XmlToken[] = [];
	let i = 0;
	let line = 1;

	while (i < xml.length) {
		// Track line numbers
		if (xml[i] === "\n") {
			line++;
			i++;
			continue;
		}

		// CDATA section
		if (xml.startsWith("<![CDATA[", i)) {
			const end = xml.indexOf("]]>", i);
			if (end !== -1) {
				tokens.push({
					type: "cdata",
					content: xml.substring(i, end + 3),
					line,
				});
				i = end + 3;
				continue;
			}
		}

		// Comment
		if (xml.startsWith("<!--", i)) {
			const end = xml.indexOf("-->", i + 4);
			if (end !== -1) {
				tokens.push({
					type: "comment",
					content: xml.substring(i, end + 3),
					line,
				});
				i = end + 3;
				continue;
			}
		}

		// DOCTYPE
		if (xml.startsWith("<!", i) && !xml.startsWith("<!--", i) && !xml.startsWith("<![CDATA[", i)) {
			const end = xml.indexOf(">", i);
			if (end !== -1) {
				tokens.push({
					type: "doctype",
					content: xml.substring(i, end + 1),
					line,
				});
				i = end + 1;
				continue;
			}
		}

		// XML declaration
		if (xml.startsWith("<?", i)) {
			const end = xml.indexOf("?>", i);
			if (end !== -1) {
				tokens.push({
					type: "declaration",
					content: xml.substring(i, end + 2),
					line,
				});
				i = end + 2;
				continue;
			}
		}

		// Tag
		if (xml[i] === "<") {
			const end = xml.indexOf(">", i);
			if (end !== -1) {
				const tagContent = xml.substring(i + 1, end);
				const isClosing = tagContent.startsWith("/");
				const isSelfClosing = tagContent.endsWith("/");
				const raw = isClosing
					? tagContent.substring(1).trim()
					: isSelfClosing
						? tagContent.slice(0, -1).trim()
						: tagContent.trim();
				const tagNameMatch = raw.match(/^([a-zA-Z_:][a-zA-Z0-9._:-]*)/);

				tokens.push({
					type: isClosing ? "close" : isSelfClosing ? "selfclose" : "open",
					content: xml.substring(i, end + 1),
					tagName: tagNameMatch ? tagNameMatch[1] : undefined,
					line,
				});
				i = end + 1;
				continue;
			}
		}

		// Text content
		let textEnd = i;
		while (textEnd < xml.length && xml[textEnd] !== "<") {
			if (xml[textEnd] === "\n") line++;
			textEnd++;
		}
		if (textEnd > i) {
			tokens.push({ type: "text", content: xml.substring(i, textEnd), line });
			i = textEnd;
		} else {
			i++;
		}
	}

	return tokens;
}

function formatXml(xml: string, indentSize: number, selfClose: boolean): string {
	const tokens = tokenizeXml(xml);
	const is = indentStr(indentSize);
	let result = "";
	let indent = 0;

	for (const token of tokens) {
		switch (token.type) {
			case "declaration":
			case "doctype":
				result += `${token.content}\n`;
				break;

			case "comment":
				result += `${is.repeat(indent) + token.content}\n`;
				break;

			case "cdata":
				result += `${is.repeat(indent) + token.content}\n`;
				break;

			case "open":
				result += `${is.repeat(indent) + token.content}\n`;
				indent++;
				break;

			case "close":
				indent = Math.max(0, indent - 1);
				result += `${is.repeat(indent) + token.content}\n`;
				break;

			case "selfclose":
				if (selfClose) {
					result += `${is.repeat(indent) + token.content}\n`;
				} else {
					// Convert <tag/> to <tag></tag>
					const tagName = token.tagName || "";
					const attrs = token.content
						.replace(/<\//, "")
						.replace(/\/>$/, "")
						.replace(new RegExp(`^${tagName}\\s*`, "i"), "")
						.trim();
					const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
					result += `${is.repeat(indent) + openTag}</${tagName}>\n`;
				}
				break;

			case "text": {
				const text = token.content.trim();
				if (text) {
					result += `${is.repeat(indent) + text}\n`;
				}
				break;
			}
		}
	}

	return result
		.split("\n")
		.map((line) => line.trimEnd())
		.filter((line, i, arr) => !(line === "" && i > 0 && arr[i - 1] === ""))
		.join("\n")
		.trim();
}

function minifyXml(xml: string): string {
	return xml
		.replace(/<!--[\s\S]*?-->/g, "") // Remove comments
		.replace(/>\s+</g, "><") // Remove whitespace between tags
		.replace(/\s{2,}/g, " ") // Collapse whitespace
		.replace(/\n/g, "") // Remove newlines
		.trim();
}

function validateXml(xml: string): ValidationResult {
	if (!xml.trim()) {
		return { valid: false, error: "Empty XML input", line: null };
	}

	const tokens = tokenizeXml(xml);
	const stack: { tagName: string; line: number }[] = [];
	let _line = 1;

	for (const token of tokens) {
		if (token.line) _line = token.line;

		switch (token.type) {
			case "open":
				stack.push({ tagName: token.tagName || "", line: token.line });
				break;

			case "close": {
				if (stack.length === 0) {
					return {
						valid: false,
						error: `Unexpected closing tag </${token.tagName}> with no matching opening tag`,
						line: token.line,
					};
				}
				const last = stack[stack.length - 1];
				if (last.tagName !== token.tagName) {
					return {
						valid: false,
						error: `Mismatched tags: expected </${last.tagName}> but found </${token.tagName}>`,
						line: token.line,
					};
				}
				stack.pop();
				break;
			}

			case "selfclose":
				// Self-closing tags don't need matching
				break;

			case "text":
				// Check for invalid characters in text
				if (
					token.content.includes("&") &&
					!token.content.match(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/)
				) {
					return {
						valid: false,
						error: `Unescaped '&' character in text content`,
						line: token.line,
					};
				}
				break;
		}
	}

	if (stack.length > 0) {
		const unclosed = stack[stack.length - 1];
		return {
			valid: false,
			error: `Unclosed tag <${unclosed.tagName}>`,
			line: unclosed.line,
		};
	}

	// Check for basic XML structure
	const _hasDeclaration = xml.includes("<?xml");
	const hasRoot = tokens.some((t) => t.type === "open");

	if (!hasRoot && !tokens.some((t) => t.type === "selfclose")) {
		return {
			valid: false,
			error: "No root element found",
			line: null,
		};
	}

	return { valid: true, error: null, line: null };
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">10.99</price>
    <description>A novel about the American Dream set in the Jazz Age.</description>
  </book>
  <book category="science">
    <title lang="en">A Brief History of Time</title>
    <author>Stephen Hawking</author>
    <year>1988</year>
    <price currency="USD">15.99</price>
    <description>Exploring the mysteries of the universe.</description>
  </book>
  <book category="technology">
    <title lang="en">Clean Code</title>
    <author>Robert C. Martin</author>
    <year>2008</year>
    <price currency="USD">39.99</price>
    <description>A handbook of agile software craftsmanship.</description>
  </book>
  <!-- Inventory metadata -->
  <metadata>
    <totalBooks>3</totalBooks>
    <lastUpdated>2024-01-15T10:30:00Z</lastUpdated>
    <location>
      <city>Portland</city>
      <state>OR</state>
      <country>US</country>
    </location>
  </metadata>
</bookstore>`;

export default function XmlFormatter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<Mode>("format");
	const [indentSize, setIndentSize] = useState(2);
	const [selfClosingTags, setSelfClosingTags] = useState(true);
	const [validation, setValidation] = useState<ValidationResult | null>(null);

	const result = useMemo(() => {
		if (!input.trim()) {
			setValidation(null);
			return "";
		}

		if (mode === "validate") {
			const v = validateXml(input);
			setValidation(v);
			return input;
		}

		setValidation(null);

		try {
			if (mode === "format") {
				return formatXml(input, indentSize, selfClosingTags);
			}
			return minifyXml(input);
		} catch (e) {
			setValidation({ valid: false, error: (e as Error).message, line: null });
			return "";
		}
	}, [input, mode, indentSize, selfClosingTags]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_XML);
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
					<button
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "validate" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("validate")}
					>
						Validate
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
								checked={selfClosingTags}
								onChange={(e) => setSelfClosingTags((e.target as HTMLInputElement).checked)}
							/>
							Self-closing tags
						</label>
					</>
				)}

				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Load Sample
				</button>
			</div>

			{validation && (
				<div
					class={`rounded-lg p-4 mb-4 text-body-sm ${
						validation.valid
							? "bg-green-500/10 border border-green-500/30 text-green-700"
							: "bg-accent-rose/10 border border-accent-rose/30 text-accent-rose"
					}`}
				>
					{validation.valid ? (
						<div class="flex items-center gap-2">
							<span class="text-title-lg">&#10003;</span>
							<strong>Valid XML</strong> &mdash; The document is well-formed.
						</div>
					) : (
						<div>
							<strong>Invalid XML:</strong> {validation.error}
							{validation.line !== null && (
								<span class="text-caption-uppercase text-muted ml-2">(Line {validation.line})</span>
							)}
						</div>
					)}
				</div>
			)}

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input XML</label>
					<textarea
						class="textarea code-block"
						style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your XML here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">
							{mode === "validate" ? "Input (unchanged)" : "Output"}
						</label>
						{result && mode !== "validate" && (
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
						readOnly={mode !== "validate"}
						placeholder={
							mode === "format"
								? "Formatted XML will appear here..."
								: mode === "minify"
									? "Minified XML will appear here..."
									: "Paste XML and click Validate to check well-formedness..."
						}
					/>
				</div>
			</div>
		</div>
	);
}
