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

export interface WorkflowTemplate {
	id: string;
	name: string;
	description: string;
	steps: { toolId: string; settings?: Record<string, any> }[];
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
			result = `${result.trimEnd()} {\n`;
			indent++;
			result += indentStr.repeat(indent);
			i++;
			while (i < normalized.length && normalized[i] === " ") i++;
			continue;
		}
		if (ch === "}") {
			result = `${result.trimEnd()}\n`;
			indent = Math.max(0, indent - 1);
			result += `${indentStr.repeat(indent)}}\n${indentStr.repeat(indent)}`;
			i++;
			while (i < normalized.length && normalized[i] === " ") i++;
			continue;
		}
		if (ch === ";") {
			result = `${result.trimEnd()};\n${indentStr.repeat(indent)}`;
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

function minifyCss(css: string): string {
	return css
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\s+/g, " ")
		.replace(/\s*{\s*/g, "{")
		.replace(/\s*}\s*/g, "}")
		.replace(/\s*;\s*/g, ";")
		.replace(/\s*:\s*/g, ":")
		.replace(/\s*,\s*/g, ",")
		.replace(/;}/g, "}")
		.trim();
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

interface HtmlToken {
	type: "tag" | "text" | "comment" | "doctype";
	value: string;
	raw: string;
	tagName: string;
	closing: boolean;
	selfClosing: boolean;
}

function tokenizeHtml(html: string): HtmlToken[] {
	const tokens: HtmlToken[] = [];
	let i = 0;
	while (i < html.length) {
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

function formatHtml(html: string, options: { indentSize: number; wrapLineLength: number }): string {
	const { indentSize, wrapLineLength } = options;
	const indentStr = indentSize === -1 ? "\t" : " ".repeat(indentSize);
	const tokens = tokenizeHtml(html);
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
			result += `<!DOCTYPE ${token.value}>\n`;
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
			if (token.closing) {
				indent = Math.max(0, indent - 1);
				result = `${result.trimEnd()}\n${indentStr.repeat(indent)}<${token.raw}>`;
				lineLength = indent * indentSize + token.raw.length + 2;
			} else if (isSelfClosing) {
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

function minifyHtml(
	html: string,
	options: { removeComments: boolean; collapseWhitespace: boolean; removeOptionalTags: boolean },
): string {
	let result = html;
	if (options.removeComments) result = result.replace(/<!--[\s\S]*?-->/g, "");
	if (options.collapseWhitespace)
		result = result
			.replace(/>\s+</g, "><")
			.replace(/\s{2,}/g, " ")
			.replace(/\s*>\s*/g, ">")
			.replace(/\s*<\s*/g, "<");
	if (options.removeOptionalTags) {
		result = result.replace(
			/<\/(li|dt|dd|p|rt|rp|optgroup|option|colgroup|caption|thead|tbody|tfoot|tr|td|th)>/gi,
			"",
		);
		result = result
			.replace(/<html[^>]*>/gi, "")
			.replace(/<\/html>/gi, "")
			.replace(/<head[^>]*>/gi, "")
			.replace(/<\/head>/gi, "")
			.replace(/<body[^>]*>/gi, "")
			.replace(/<\/body>/gi, "");
	}
	return result.trim();
}

const SQL_MAJOR_KEYWORDS = new Set([
	"SELECT",
	"FROM",
	"WHERE",
	"JOIN",
	"LEFT JOIN",
	"RIGHT JOIN",
	"INNER JOIN",
	"OUTER JOIN",
	"FULL JOIN",
	"CROSS JOIN",
	"ON",
	"AND",
	"OR",
	"ORDER BY",
	"GROUP BY",
	"HAVING",
	"LIMIT",
	"OFFSET",
	"INSERT",
	"INTO",
	"VALUES",
	"UPDATE",
	"SET",
	"DELETE",
	"CREATE",
	"ALTER",
	"DROP",
	"TABLE",
	"INDEX",
	"VIEW",
	"UNION",
	"UNION ALL",
	"EXCEPT",
	"INTERSECT",
	"CASE",
	"WHEN",
	"THEN",
	"ELSE",
	"END",
	"AS",
	"WITH",
	"DISTINCT",
	"TOP",
]);
const SQL_NEWLINE_BEFORE_KEYWORDS = new Set([
	"SELECT",
	"FROM",
	"WHERE",
	"JOIN",
	"LEFT JOIN",
	"RIGHT JOIN",
	"INNER JOIN",
	"OUTER JOIN",
	"FULL JOIN",
	"CROSS JOIN",
	"ON",
	"ORDER BY",
	"GROUP BY",
	"HAVING",
	"LIMIT",
	"OFFSET",
	"UNION",
	"UNION ALL",
	"EXCEPT",
	"INTERSECT",
	"INSERT",
	"INTO",
	"VALUES",
	"UPDATE",
	"SET",
	"DELETE",
	"CREATE",
	"ALTER",
	"DROP",
]);

function tokenizeSql(sql: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const len = sql.length;
	while (i < len) {
		if (/\s/.test(sql[i])) {
			i++;
			continue;
		}
		if (sql[i] === "'") {
			let j = i + 1;
			while (j < len) {
				if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
				else if (sql[j] === "'") {
					j++;
					break;
				} else j++;
			}
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}
		if (sql[i] === '"') {
			let j = i + 1;
			while (j < len && sql[j] !== '"') j++;
			if (j < len) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}
		if (sql[i] === "(" || sql[i] === ")" || sql[i] === "," || sql[i] === ";") {
			tokens.push(sql[i]);
			i++;
			continue;
		}
		if (/[a-zA-Z_$#]/.test(sql[i])) {
			let j = i;
			while (j < len && /[a-zA-Z0-9_$#]/.test(sql[j])) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}
		tokens.push(sql[i]);
		i++;
	}
	return tokens;
}

function matchMultiWordKeyword(
	tokens: string[],
	pos: number,
): { keyword: string; length: number } | null {
	const multiWordPatterns = [
		["ORDER", "BY"],
		["GROUP", "BY"],
		["LEFT", "JOIN"],
		["RIGHT", "JOIN"],
		["INNER", "JOIN"],
		["OUTER", "JOIN"],
		["FULL", "JOIN"],
		["CROSS", "JOIN"],
		["UNION", "ALL"],
	];
	for (const pattern of multiWordPatterns) {
		let match = true;
		for (let k = 0; k < pattern.length; k++) {
			if (pos + k >= tokens.length || tokens[pos + k].toUpperCase() !== pattern[k]) {
				match = false;
				break;
			}
		}
		if (match) return { keyword: pattern.join(" "), length: pattern.length };
	}
	return null;
}

function formatSql(sql: string, indentSize: number, uppercaseKeywords: boolean): string {
	const tokens = tokenizeSql(sql);
	const indentStr = indentSize === -1 ? "\t" : " ".repeat(indentSize);
	let result = "";
	let indent = 0;
	let lineStart = true;
	let parenDepth = 0;
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];
		const upper = token.toUpperCase();
		const multiWord = matchMultiWordKeyword(tokens, i);
		if (token === ";") {
			result += ";\n";
			lineStart = true;
			i++;
			continue;
		}
		if (token === "(") {
			parenDepth++;
			result += "(";
			if (i + 1 < tokens.length && /^(SELECT|WITH|INSERT|UPDATE|DELETE)$/i.test(tokens[i + 1])) {
				indent++;
				result += `\n${indentStr.repeat(indent)}`;
				lineStart = true;
			}
			i++;
			continue;
		}
		if (token === ")") {
			parenDepth--;
			if (parenDepth < 0) parenDepth = 0;
			if (indent > 0 && result.trimEnd().endsWith(indentStr.trimEnd() || indentStr)) {
				indent = Math.max(0, indent - 1);
				result = `${result.trimEnd()}\n${indentStr.repeat(indent)})`;
			} else result += ")";
			lineStart = false;
			i++;
			continue;
		}
		if (token === ",") {
			result = `${result.trimEnd()},`;
			if (parenDepth === 0) {
				result += `\n${indentStr.repeat(indent + 1)}`;
				lineStart = true;
			}
			i++;
			continue;
		}
		if (multiWord) {
			const keyword = uppercaseKeywords ? multiWord.keyword : multiWord.keyword.toLowerCase();
			if (SQL_NEWLINE_BEFORE_KEYWORDS.has(multiWord.keyword)) {
				if (!lineStart) result = `${result.trimEnd()}\n`;
				result += `${indentStr.repeat(indent) + keyword} `;
				lineStart = false;
			} else {
				if (!lineStart) result += " ";
				result += `${keyword} `;
				lineStart = false;
			}
			i += multiWord.length;
			continue;
		}
		if (SQL_MAJOR_KEYWORDS.has(upper)) {
			const keyword = uppercaseKeywords ? upper : upper.toLowerCase();
			if (SQL_NEWLINE_BEFORE_KEYWORDS.has(upper)) {
				if (!lineStart) result = `${result.trimEnd()}\n`;
				result += `${indentStr.repeat(indent) + keyword} `;
				lineStart = false;
			} else {
				if (!lineStart) result += " ";
				result += `${keyword} `;
				lineStart = false;
			}
			i++;
			continue;
		}
		if (!lineStart) {
			const lastChar = result.trimEnd().slice(-1);
			if (lastChar && !["(", ",", ".", " "].includes(lastChar)) result += " ";
		}
		result += token;
		lineStart = false;
		i++;
	}
	return result
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function minifySql(sql: string): string {
	return sql
		.replace(/--[^\n]*/g, "")
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\s+/g, " ")
		.replace(/\s*([(),;])\s*/g, "$1")
		.trim();
}

function uppercaseKeywords(sql: string): string {
	const keywords = [
		"SELECT",
		"FROM",
		"WHERE",
		"JOIN",
		"LEFT",
		"RIGHT",
		"INNER",
		"OUTER",
		"FULL",
		"CROSS",
		"ON",
		"AND",
		"OR",
		"ORDER",
		"BY",
		"GROUP",
		"HAVING",
		"LIMIT",
		"OFFSET",
		"INSERT",
		"INTO",
		"VALUES",
		"UPDATE",
		"SET",
		"DELETE",
		"CREATE",
		"ALTER",
		"DROP",
		"TABLE",
		"INDEX",
		"VIEW",
		"UNION",
		"EXCEPT",
		"INTERSECT",
		"AS",
		"DISTINCT",
		"TOP",
		"ALL",
		"CASE",
		"WHEN",
		"THEN",
		"ELSE",
		"END",
		"WITH",
		"NULL",
		"NOT",
		"IS",
		"IN",
		"LIKE",
		"BETWEEN",
		"EXISTS",
		"TRUE",
		"FALSE",
	];
	let result = sql;
	for (const kw of keywords) {
		const regex = new RegExp(`\\b${kw}\\b`, "gi");
		result = result.replace(regex, kw);
	}
	return result;
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
		if (xml[i] === "\n") {
			line++;
			i++;
			continue;
		}
		if (xml.startsWith("<![CDATA[", i)) {
			const end = xml.indexOf("]]>", i);
			if (end !== -1) {
				tokens.push({ type: "cdata", content: xml.substring(i, end + 3), line });
				i = end + 3;
				continue;
			}
		}
		if (xml.startsWith("<!--", i)) {
			const end = xml.indexOf("-->", i + 4);
			if (end !== -1) {
				tokens.push({ type: "comment", content: xml.substring(i, end + 3), line });
				i = end + 3;
				continue;
			}
		}
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
		let textEnd = i;
		while (textEnd < xml.length && xml[textEnd] !== "<") {
			if (xml[textEnd] === "\n") line++;
			textEnd++;
		}
		if (textEnd > i) {
			tokens.push({ type: "text", content: xml.substring(i, textEnd), line });
			i = textEnd;
		} else i++;
	}
	return tokens;
}

function formatXml(xml: string, indentSize: number, selfClose: boolean): string {
	const tokens = tokenizeXml(xml);
	const is = indentSize === -1 ? "\t" : " ".repeat(indentSize);
	let result = "";
	let indent = 0;
	for (const token of tokens) {
		switch (token.type) {
			case "declaration":
			case "doctype":
				result += `${token.content}\n`;
				break;
			case "comment":
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
				if (selfClose) result += `${is.repeat(indent) + token.content}\n`;
				else {
					const tagName = token.tagName || "";
					const attrs = token.content
						.replace(/<\//, "")
						.replace(/\/>$/, "")
						.replace(new RegExp(`^${tagName}\\s*`, "i"), "")
						.trim();
					result += `${is.repeat(indent) + (attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`)}</${tagName}>\n`;
				}
				break;
			case "text": {
				const text = token.content.trim();
				if (text) result += `${is.repeat(indent) + text}\n`;
				break;
			}
		}
	}
	return result
		.split("\n")
		.map((line) => line.trimEnd())
		.filter((line, idx, arr) => !(line === "" && idx > 0 && arr[idx - 1] === ""))
		.join("\n")
		.trim();
}

function minifyXml(xml: string): string {
	return xml
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/>\s+</g, "><")
		.replace(/\s{2,}/g, " ")
		.replace(/\n/g, "")
		.trim();
}

function elementToObj(el: Element): any {
	const obj: any = {};
	if (el.attributes) {
		for (let i = 0; i < el.attributes.length; i++)
			obj[`@${el.attributes[i].name}`] = el.attributes[i].value;
	}
	const children = el.childNodes;
	if (children.length === 1 && children[0].nodeType === 3) return el.textContent?.trim() || "";
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.nodeType !== 1) continue;
		const childEl = child as Element;
		const value = elementToObj(childEl);
		if (obj[childEl.nodeName]) {
			if (!Array.isArray(obj[childEl.nodeName])) obj[childEl.nodeName] = [obj[childEl.nodeName]];
			obj[childEl.nodeName].push(value);
		} else obj[childEl.nodeName] = value;
	}
	return obj;
}

function xmlToJson(xml: string): any {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const errorNode = doc.querySelector("parsererror");
	if (errorNode) throw new Error("Invalid XML");
	return elementToObj(doc.documentElement);
}

function htmlToText(html: string): string {
	let text = html;
	text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre|section|article)>/gi, "\n");
	text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");
	text = text.replace(/<li[^>]*>/gi, "• ");
	text = text.replace(/<h[1-6][^>]*>/gi, "\n");
	text = text.replace(/<[^>]+>/g, "");
	text = text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ");
	return text
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]+/g, " ")
		.trim();
}

const HASHTAG_STOP_WORDS = new Set([
	"a",
	"an",
	"the",
	"and",
	"or",
	"but",
	"in",
	"on",
	"at",
	"to",
	"for",
	"of",
	"with",
	"by",
	"from",
	"as",
	"is",
	"was",
	"are",
	"were",
	"been",
	"be",
	"have",
	"has",
	"had",
	"do",
	"does",
	"did",
	"will",
	"would",
	"could",
	"should",
	"may",
	"might",
	"shall",
	"can",
	"this",
	"that",
	"these",
	"those",
	"i",
	"me",
	"my",
	"myself",
	"we",
	"our",
	"ours",
	"ourselves",
	"you",
	"your",
	"yours",
	"yourself",
	"yourselves",
	"he",
	"him",
	"his",
	"himself",
	"she",
	"her",
	"hers",
	"herself",
	"it",
	"its",
	"itself",
	"they",
	"them",
	"their",
	"theirs",
	"themselves",
	"what",
	"which",
	"who",
	"whom",
	"when",
	"where",
	"why",
	"how",
	"all",
	"each",
	"every",
	"both",
	"few",
	"more",
	"most",
	"other",
	"some",
	"such",
	"no",
	"nor",
	"not",
	"only",
	"own",
	"same",
	"so",
	"than",
	"too",
	"very",
	"s",
	"t",
	"just",
	"don",
	"now",
	"here",
	"there",
	"then",
	"also",
	"about",
	"up",
	"out",
	"if",
	"into",
	"over",
	"after",
	"before",
	"between",
	"through",
	"during",
	"without",
	"again",
	"further",
	"once",
	"while",
	"because",
	"until",
	"above",
	"below",
	"under",
	"since",
	"along",
	"among",
	"around",
	"behind",
	"beside",
	"beyond",
	"near",
	"toward",
	"upon",
	"against",
	"within",
	"even",
	"still",
	"already",
	"much",
	"many",
	"well",
	"back",
	"down",
	"off",
	"away",
	"quite",
	"really",
	"always",
	"never",
	"often",
	"sometimes",
	"usually",
	"almost",
	"enough",
	"however",
	"although",
	"though",
	"yet",
	"either",
	"neither",
	"whether",
	"whose",
	"whichever",
	"whatever",
	"anything",
	"everything",
	"nothing",
	"something",
	"anyone",
	"everyone",
	"someone",
	"everybody",
	"anybody",
	"somebody",
	"nobody",
	"let",
	"make",
	"made",
	"like",
	"going",
	"get",
	"got",
	"new",
	"one",
	"two",
	"three",
	"first",
	"last",
	"long",
	"great",
	"little",
	"old",
	"right",
	"big",
	"high",
	"different",
	"small",
	"large",
	"next",
	"early",
	"young",
	"important",
	"used",
	"use",
	"using",
	"per",
	"via",
]);

function extractKeywords(
	text: string,
	removeStopWords: boolean,
): { word: string; count: number }[] {
	const cleaned = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length >= 2);
	const filtered = removeStopWords ? cleaned.filter((w) => !HASHTAG_STOP_WORDS.has(w)) : cleaned;
	const freq: Record<string, number> = {};
	for (const word of filtered) freq[word] = (freq[word] || 0) + 1;
	return Object.entries(freq)
		.map(([word, count]) => ({ word, count }))
		.sort((a, b) => b.count - a.count);
}

const fancyCharMap: Record<string, string> = {
	a: "𝕒",
	b: "𝕓",
	c: "𝕔",
	d: "𝕕",
	e: "𝕖",
	f: "𝕗",
	g: "𝕘",
	h: "𝕙",
	i: "𝕚",
	j: "𝕛",
	k: "𝕜",
	l: "𝕝",
	m: "𝕞",
	n: "𝕟",
	o: "𝕠",
	p: "𝕡",
	q: "𝕢",
	r: "𝕣",
	s: "𝕤",
	t: "𝕥",
	u: "𝕦",
	v: "𝕧",
	w: "𝕨",
	x: "𝕩",
	y: "𝕪",
	z: "𝕫",
	A: "mathbb{A}",
	B: "𝔹",
	C: "ℂ",
	D: "𝔻",
	E: "𝔼",
	F: "𝔽",
	G: "𝔾",
	H: "ℍ",
	I: "𝕀",
	J: "𝕁",
	K: "𝕂",
	L: "𝕃",
	M: "𝕄",
	N: "ℕ",
	O: "𝕆",
	P: "ℙ",
	Q: "ℚ",
	R: "ℝ",
	S: "𝕊",
	T: "𝕋",
	U: "𝕌",
	V: "𝕍",
	W: "𝕎",
	X: "𝕏",
	Y: "𝕐",
	Z: "ℤ",
	"0": "0",
	"1": "1",
	"2": "2",
	"3": "3",
	"4": "4",
	"5": "5",
	"6": "6",
	"7": "7",
	"8": "8",
	"9": "9",
};

function convertFancyText(text: string): string {
	return text
		.split("")
		.map((ch) => fancyCharMap[ch] ?? ch)
		.join("");
}

function escapeCsvField(value: unknown, delimiter: string): string {
	const str = value === null || value === undefined ? "" : String(value);
	if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function parseBrowser(ua: string): { name: string; version: string } {
	const patterns: [RegExp, string][] = [
		[/Edg\/([\d.]+)/, "Edge"],
		[/OPR\/([\d.]+)/, "Opera"],
		[/Vivaldi\/([\d.]+)/, "Vivaldi"],
		[/Chrome\/([\d.]+)/, "Chrome"],
		[/Firefox\/([\d.]+)/, "Firefox"],
		[/Version\/([\d.]+).*Safari/, "Safari"],
	];
	for (const [regex, name] of patterns) {
		const match = ua.match(regex);
		if (match) return { name, version: match[1] };
	}
	return { name: "Unknown", version: "" };
}

function parseOS(ua: string): { name: string; version: string } {
	const patterns: [RegExp, string, () => string][] = [
		[/Windows NT 10\.0/, "Windows", () => "10"],
		[/Windows NT 6\.1/, "Windows", () => "7"],
		[/Mac OS X ([\d_]+)/, "macOS", () => "macOS"],
		[/Android ([\d.]+)/, "Android", () => "Android"],
		[/iPhone OS ([\d_]+)/, "iOS", () => "iOS"],
	];
	for (const [regex, name, getVersion] of patterns) {
		const match = ua.match(regex);
		if (match) return { name, version: getVersion() };
	}
	return { name: "Unknown", version: "" };
}

function parseUA(ua: string): any {
	const browser = parseBrowser(ua);
	const os = parseOS(ua);
	return {
		browser: browser.name,
		browserVersion: browser.version,
		os: os.name,
		osVersion: os.version,
		device: /Mobile|iPhone/i.test(ua) ? "Mobile" : "Desktop",
	};
}

export interface WorkflowStep {
	id: string;
	toolId: string;
	settings?: Record<string, any>;
}

export const workflowTools: Record<string, WorkflowTool> = {
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
	"slug-generator": {
		id: "slug-generator",
		name: "Slug Generator",
		category: "text",
		description: "Generate clean URL slugs from any text",
		process: async (input, settings) => {
			const separator = settings?.separator || "-";
			const lowercase = settings?.lowercase !== "no";
			if (!input.trim()) return "";
			let slug = input
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-zA-Z0-9\s-]/g, "")
				.trim()
				.replace(/[\s-]+/g, separator);
			if (lowercase) slug = slug.toLowerCase();
			return slug;
		},
		settings: [
			{
				key: "separator",
				label: "Separator",
				type: "select",
				default: "-",
				options: [
					{ label: "Hyphen (-)", value: "-" },
					{ label: "Underscore (_)", value: "_" },
					{ label: "Dot (.)", value: "." },
				],
			},
			{
				key: "lowercase",
				label: "Lowercase",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
		],
	},
	"word-counter": {
		id: "word-counter",
		name: "Word Counter",
		category: "text",
		description: "Count words, characters, sentences, paragraphs, or lines",
		process: async (input, settings) => {
			const mode = settings?.mode || "report";
			const trimmed = input.trim();
			if (!trimmed) {
				if (mode === "report")
					return "Words: 0\nCharacters: 0\nSentences: 0\nParagraphs: 0\nLines: 0";
				return "0";
			}
			const stats = {
				characters: input.length,
				charactersNoSpaces: input.replace(/\s/g, "").length,
				words: trimmed.split(/\s+/).filter(Boolean).length,
				sentences: trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
				paragraphs: trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length,
				lines: input.split("\n").length,
			};
			if (mode === "words") return String(stats.words);
			if (mode === "characters") return String(stats.characters);
			if (mode === "sentences") return String(stats.sentences);
			if (mode === "paragraphs") return String(stats.paragraphs);
			if (mode === "lines") return String(stats.lines);
			return `Words: ${stats.words}\nCharacters: ${stats.characters}\nNo Spaces: ${stats.charactersNoSpaces}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nLines: ${stats.lines}`;
		},
		settings: [
			{
				key: "mode",
				label: "Output Mode",
				type: "select",
				default: "report",
				options: [
					{ label: "Full Report", value: "report" },
					{ label: "Word Count Only", value: "words" },
					{ label: "Character Count Only", value: "characters" },
					{ label: "Sentence Count Only", value: "sentences" },
					{ label: "Paragraph Count Only", value: "paragraphs" },
					{ label: "Line Count Only", value: "lines" },
				],
			},
		],
	},
	"lorem-generator": {
		id: "lorem-generator",
		name: "Lorem Generator",
		category: "text",
		description: "Generate placeholder Lorem Ipsum text",
		process: async (_input, settings) => {
			const mode = settings?.mode || "paragraphs";
			const count = Number(settings?.count ?? 3);
			const LOREM_WORDS =
				"lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
					" ",
				);
			function generateWords(n: number): string {
				const result: string[] = [];
				for (let i = 0; i < n; i++) {
					result.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
				}
				return result.join(" ");
			}
			function generateSentence(): string {
				const length = 8 + Math.floor(Math.random() * 12);
				const words = generateWords(length);
				return `${words.charAt(0).toUpperCase() + words.slice(1)}.`;
			}
			function generateParagraph(): string {
				const sentenceCount = 3 + Math.floor(Math.random() * 5);
				return Array.from({ length: sentenceCount }, () => generateSentence()).join(" ");
			}
			if (mode === "paragraphs") {
				return Array.from({ length: count }, () => generateParagraph()).join("\n\n");
			}
			if (mode === "sentences") {
				return Array.from({ length: count }, () => generateSentence()).join(" ");
			}
			return generateWords(count);
		},
		settings: [
			{
				key: "mode",
				label: "Mode",
				type: "select",
				default: "paragraphs",
				options: [
					{ label: "Paragraphs", value: "paragraphs" },
					{ label: "Sentences", value: "sentences" },
					{ label: "Words", value: "words" },
				],
			},
			{ key: "count", label: "Count", type: "number", default: 3 },
		],
	},
	"uuid-generator": {
		id: "uuid-generator",
		name: "UUID Generator",
		category: "utility",
		description: "Generate unique UUID v4 values",
		process: async (_input, settings) => {
			const count = Number(settings?.count ?? 1);
			const format = settings?.format || "standard";
			function generateUUID(): string {
				if (typeof crypto !== "undefined" && crypto.randomUUID) {
					return crypto.randomUUID();
				}
				return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
					const r = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 16) | 0;
					const v = c === "x" ? r : (r & 0x3) | 0x8;
					return v.toString(16);
				});
			}
			function formatUUID(uuid: string, f: string): string {
				const raw = uuid.replace(/-/g, "");
				switch (f) {
					case "standard":
						return uuid;
					case "no-dash":
						return raw;
					case "uppercase":
						return uuid.toUpperCase();
					case "braces":
						return `{${uuid}}`;
					case "url":
						return `urn:uuid:${uuid}`;
					case "base64":
						return btoa(raw);
					default:
						return uuid;
				}
			}
			const uuids = Array.from({ length: count }, () => generateUUID());
			return uuids.map((u) => formatUUID(u, format)).join("\n");
		},
		settings: [
			{ key: "count", label: "Generate Count", type: "number", default: 1 },
			{
				key: "format",
				label: "Format Style",
				type: "select",
				default: "standard",
				options: [
					{ label: "Standard", value: "standard" },
					{ label: "UPPERCASE", value: "uppercase" },
					{ label: "No Dashes", value: "no-dash" },
					{ label: "With Braces", value: "braces" },
					{ label: "URN Format", value: "url" },
					{ label: "Base64", value: "base64" },
				],
			},
		],
	},
	"html-to-markdown": {
		id: "html-to-markdown",
		name: "HTML to Markdown",
		category: "developer",
		description: "Convert HTML markup into Markdown syntax",
		process: async (input) => {
			function decodeHtml(html: string): string {
				return html
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/&nbsp;/g, " ");
			}
			let md = input;
			md = md.replace(
				/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
				(_: string, code: string) => {
					const decoded = decodeHtml(code).replace(/\n$/, "");
					return `\n\`\`\`\n${decoded}\n\`\`\`\n`;
				},
			);
			md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
			md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
			md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
			md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
			md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
			md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");
			md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
			md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");
			md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
			md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");
			md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
			md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, "![$1]($2)");
			md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");
			md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n");
			md = md.replace(
				/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
				(_: string, content: string) => {
					const lines = content
						.trim()
						.split("\n")
						.map((l) => `> ${l.trim()}`)
						.join("\n");
					return `\n${lines}\n`;
				},
			);
			md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_: string, content: string) => {
				const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
				return `\n${items.trim()}\n`;
			});
			let olCounter = 0;
			md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_: string, content: string) => {
				olCounter = 0;
				const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
					olCounter++;
					return `${olCounter}. $1\n`;
				});
				return `\n${items.trim()}\n`;
			});
			md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
			md = md.replace(/<br\s*\/?>/gi, "\n");
			md = md.replace(/<[^>]+>/g, "");
			md = decodeHtml(md);
			md = md.replace(/\n{3,}/g, "\n\n");
			return md.trim();
		},
	},
	"css-formatter": {
		id: "css-formatter",
		name: "CSS Formatter",
		category: "developer",
		description: "Format and beautify CSS with custom indentation",
		process: async (input, settings) => {
			const indent = Number(settings?.indent ?? 2);
			return formatCss(input, indent);
		},
		settings: [
			{
				key: "indent",
				label: "Indent size",
				type: "select",
				default: 2,
				options: [
					{ label: "2 spaces", value: 2 },
					{ label: "4 spaces", value: 4 },
				],
			},
		],
	},
	"css-minifier": {
		id: "css-minifier",
		name: "CSS Minifier",
		category: "developer",
		description: "Minify CSS code, removing comments and collapsing spaces",
		process: async (input) => minifyCss(input),
	},
	"html-formatter": {
		id: "html-formatter",
		name: "HTML Formatter",
		category: "developer",
		description: "Format and beautify HTML markup with custom indentation",
		process: async (input, settings) => {
			const indentSize = Number(settings?.indentSize ?? 2);
			const wrapLineLength = Number(settings?.wrapLineLength ?? 80);
			return formatHtml(input, { indentSize, wrapLineLength });
		},
		settings: [
			{
				key: "indentSize",
				label: "Indent size",
				type: "select",
				default: 2,
				options: [
					{ label: "2 spaces", value: 2 },
					{ label: "4 spaces", value: 4 },
				],
			},
			{ key: "wrapLineLength", label: "Wrap Line Length", type: "number", default: 80 },
		],
	},
	"html-to-text": {
		id: "html-to-text",
		name: "HTML to Text",
		category: "text",
		description: "Extract clean plain text from HTML markup",
		process: async (input) => htmlToText(input),
	},
	"sql-formatter": {
		id: "sql-formatter",
		name: "SQL Formatter",
		category: "developer",
		description: "Format SQL queries with uppercase keywords and proper indent",
		process: async (input, settings) => {
			const mode = settings?.mode || "format";
			if (mode === "minify") return minifySql(input);
			if (mode === "uppercase") return uppercaseKeywords(input);
			const indentSize = Number(settings?.indentSize ?? 2);
			const uppercase = settings?.uppercase !== "no";
			return formatSql(input, indentSize, uppercase);
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
					{ label: "Uppercase keywords only", value: "uppercase" },
				],
			},
			{
				key: "indentSize",
				label: "Indent size",
				type: "select",
				default: 2,
				options: [
					{ label: "2 spaces", value: 2 },
					{ label: "4 spaces", value: 4 },
				],
			},
			{
				key: "uppercase",
				label: "Uppercase Keywords",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
		],
	},
	"xml-formatter": {
		id: "xml-formatter",
		name: "XML Formatter",
		category: "developer",
		description: "Format and beautify XML data with validation",
		process: async (input, settings) => {
			const mode = settings?.mode || "format";
			if (mode === "minify") return minifyXml(input);
			const indentSize = Number(settings?.indentSize ?? 2);
			const selfClose = settings?.selfClose !== "no";
			return formatXml(input, indentSize, selfClose);
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
			{
				key: "indentSize",
				label: "Indent size",
				type: "select",
				default: 2,
				options: [
					{ label: "2 spaces", value: 2 },
					{ label: "4 spaces", value: 4 },
				],
			},
			{
				key: "selfClose",
				label: "Keep self-closing",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
		],
	},
	"yaml-formatter": {
		id: "yaml-formatter",
		name: "YAML Formatter",
		category: "developer",
		description: "Format, validate, and beautify YAML configurations",
		process: async (input) => {
			const yamlLib = await import("js-yaml");
			const parsed = yamlLib.load(input);
			return yamlLib.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true });
		},
	},
	"line-counter": {
		id: "line-counter",
		name: "Line Counter",
		category: "text",
		description: "Count total lines, blank lines, and non-blank lines in text",
		process: async (input) => {
			if (!input) return "Total Lines: 0\nNon-Blank: 0\nBlank: 0";
			const lines = input.split("\n");
			const blank = lines.filter((l) => l.trim().length === 0).length;
			return `Total Lines: ${lines.length}\nNon-Blank: ${lines.length - blank}\nBlank: ${blank}`;
		},
	},
	"reading-time-calculator": {
		id: "reading-time-calculator",
		name: "Reading Time Calculator",
		category: "text",
		description: "Estimate reading and speaking time based on word count",
		process: async (input, settings) => {
			const readingWpm = Number(settings?.readingWpm ?? 200);
			const speakingWpm = Number(settings?.speakingWpm ?? 150);
			const trimmed = input.trim();
			if (!trimmed) return "Reading: 0s\nSpeaking: 0s";
			const words = trimmed.split(/\s+/).filter(Boolean).length;
			const readingSec = Math.round((words / readingWpm) * 60);
			const speakingSec = Math.round((words / speakingWpm) * 60);
			return `Reading Time: ${readingSec} sec\nSpeaking Time: ${speakingSec} sec\nWords: ${words}`;
		},
		settings: [
			{ key: "readingWpm", label: "Reading WPM", type: "number", default: 200 },
			{ key: "speakingWpm", label: "Speaking WPM", type: "number", default: 150 },
		],
	},
	"text-to-hashtags": {
		id: "text-to-hashtags",
		name: "Text to Hashtags",
		category: "text",
		description: "Extract top keywords from text and convert to hashtags",
		process: async (input, settings) => {
			const maxCount = Number(settings?.maxCount ?? 10);
			const removeStopWords = settings?.removeStopWords !== "no";
			const keywords = extractKeywords(input, removeStopWords).slice(0, maxCount);
			return keywords.map((k) => `#${k.word}`).join(" ");
		},
		settings: [
			{ key: "maxCount", label: "Max Hashtags", type: "number", default: 10 },
			{
				key: "removeStopWords",
				label: "Remove stop words",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
		],
	},
	"fancy-text": {
		id: "fancy-text",
		name: "Fancy Text Generator",
		category: "text",
		description: "Generate fancy Unicode text in various artistic styles",
		process: async (input) => convertFancyText(input),
	},
	"xml-to-json": {
		id: "xml-to-json",
		name: "XML to JSON",
		category: "data",
		description: "Convert XML data into JSON format",
		process: async (input) => {
			const json = xmlToJson(input);
			return JSON.stringify(json, null, 2);
		},
	},
	"json-to-csv": {
		id: "json-to-csv",
		name: "JSON to CSV",
		category: "data",
		description: "Convert JSON array to CSV spreadsheet format",
		process: async (input, settings) => {
			const delimiter = settings?.delimiter || ",";
			const parsed = JSON.parse(input);
			if (!Array.isArray(parsed) || parsed.length === 0) return "";
			const keySet = new Set<string>();
			for (const obj of parsed) {
				for (const k of Object.keys(obj)) keySet.add(k);
			}
			const headers = Array.from(keySet);
			const lines = [headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter)];
			for (const obj of parsed) {
				lines.push(headers.map((h) => escapeCsvField(obj[h], delimiter)).join(delimiter));
			}
			return lines.join("\n");
		},
		settings: [
			{
				key: "delimiter",
				label: "Delimiter",
				type: "select",
				default: ",",
				options: [
					{ label: "Comma (,)", value: "," },
					{ label: "Semicolon (;)", value: ";" },
					{ label: "Tab (\\t)", value: "\t" },
					{ label: "Pipe (|)", value: "|" },
				],
			},
		],
	},
	"json-to-tsv": {
		id: "json-to-tsv",
		name: "JSON to TSV",
		category: "data",
		description: "Convert JSON array to TSV spreadsheet format",
		process: async (input) => {
			const parsed = JSON.parse(input);
			if (!Array.isArray(parsed) || parsed.length === 0) return "";
			const keySet = new Set<string>();
			for (const obj of parsed) {
				for (const k of Object.keys(obj)) keySet.add(k);
			}
			const headers = Array.from(keySet);
			const lines = [headers.map((h) => escapeCsvField(h, "\t")).join("\t")];
			for (const obj of parsed) {
				lines.push(headers.map((h) => escapeCsvField(obj[h], "\t")).join("\t"));
			}
			return lines.join("\n");
		},
	},
	"tsv-to-json": {
		id: "tsv-to-json",
		name: "TSV to JSON",
		category: "data",
		description: "Convert TSV spreadsheet format to JSON array",
		process: async (input) => {
			const lines = input
				.trim()
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length < 2) return "[]";
			const headers = lines[0].split("\t").map((h) => h.trim().replace(/^"|"$/g, ""));
			const result = [];
			for (let i = 1; i < lines.length; i++) {
				const values = lines[i].split("\t").map((v) => v.trim().replace(/^"|"$/g, ""));
				const row: any = {};
				headers.forEach((h, j) => {
					row[h] = values[j] || "";
				});
				result.push(row);
			}
			return JSON.stringify(result, null, 2);
		},
	},
	"password-generator": {
		id: "password-generator",
		name: "Password Generator",
		category: "security",
		description: "Generate secure random passwords with customizable options",
		process: async (_input, settings) => {
			const length = Number(settings?.length ?? 16);
			const uppercase = settings?.uppercase !== "no";
			const lowercase = settings?.lowercase !== "no";
			const numbers = settings?.numbers !== "no";
			const symbols = settings?.symbols !== "no";
			let pool = "";
			if (uppercase) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			if (lowercase) pool += "abcdefghijklmnopqrstuvwxyz";
			if (numbers) pool += "0123456789";
			if (symbols) pool += "!@#$%^&*()_+-=[]{}|;:,.<>?";
			if (!pool) return "";
			const array = new Uint32Array(length);
			crypto.getRandomValues(array);
			let password = "";
			for (let i = 0; i < length; i++) {
				password += pool[array[i] % pool.length];
			}
			return password;
		},
		settings: [
			{ key: "length", label: "Password Length", type: "number", default: 16 },
			{
				key: "uppercase",
				label: "Include Uppercase",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
			{
				key: "lowercase",
				label: "Include Lowercase",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
			{
				key: "numbers",
				label: "Include Numbers",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
			{
				key: "symbols",
				label: "Include Symbols",
				type: "select",
				default: "yes",
				options: [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" },
				],
			},
		],
	},
	"password-strength-checker": {
		id: "password-strength-checker",
		name: "Password Strength Checker",
		category: "security",
		description: "Check password strength, entropy and crack time estimates",
		process: async (input) => {
			if (!input) return "Please enter a password.";
			let score = 0;
			if (input.length >= 8) score += 1;
			if (input.length >= 12) score += 1;
			if (input.length >= 16) score += 1;
			if (/[A-Z]/.test(input)) score += 1;
			if (/[a-z]/.test(input)) score += 1;
			if (/[0-9]/.test(input)) score += 1;
			if (/[^A-Za-z0-9]/.test(input)) score += 1;
			let label = "Weak";
			if (score > 2) label = "Medium";
			if (score > 4) label = "Strong";
			if (score > 6) label = "Very Strong";
			return `Password Strength: ${label}\nCharacter Count: ${input.length}\nEntropy Score: ${score}/7`;
		},
	},
	"random-number-generator": {
		id: "random-number-generator",
		name: "Random Number Generator",
		category: "utility",
		description: "Generate random numbers within a min/max range",
		process: async (_input, settings) => {
			const min = Number(settings?.min ?? 1);
			const max = Number(settings?.max ?? 100);
			const count = Number(settings?.count ?? 1);
			const results = [];
			for (let i = 0; i < count; i++) {
				results.push(Math.floor(Math.random() * (max - min + 1)) + min);
			}
			return results.join("\n");
		},
		settings: [
			{ key: "min", label: "Min Value", type: "number", default: 1 },
			{ key: "max", label: "Max Value", type: "number", default: 100 },
			{ key: "count", label: "Generate Count", type: "number", default: 1 },
		],
	},
	"unix-timestamp-converter": {
		id: "unix-timestamp-converter",
		name: "Unix Timestamp Converter",
		category: "utility",
		description: "Convert Unix timestamp to dates and vice versa",
		process: async (input, settings) => {
			const mode = settings?.mode || "to-date";
			const clean = input.trim();
			if (!clean) return "";
			if (mode === "to-date") {
				const num = Number(clean);
				const date = new Date(num * 1000);
				return date.toISOString();
			}
			const date = new Date(clean);
			return String(Math.floor(date.getTime() / 1000));
		},
		settings: [
			{
				key: "mode",
				label: "Convert Mode",
				type: "select",
				default: "to-date",
				options: [
					{ label: "Timestamp to ISO Date", value: "to-date" },
					{ label: "Date string to Timestamp", value: "to-timestamp" },
				],
			},
		],
	},
	"user-agent-parser": {
		id: "user-agent-parser",
		name: "User Agent Parser",
		category: "utility",
		description: "Extract browser, OS, and device details from a User-Agent string",
		process: async (input) => {
			const info = parseUA(input);
			return JSON.stringify(info, null, 2);
		},
	},
};

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
	{
		id: "html-cleanup-markdown",
		name: "HTML Cleanup & Markdown Conversion",
		description: "HTML Input → Convert to Markdown → Clean blank lines",
		steps: [
			{ toolId: "html-to-markdown" },
			{ toolId: "whitespace-remover", settings: { mode: "remove-empty" } },
		],
	},
	{
		id: "uuid-generator-pipeline",
		name: "Unique ID Generation Chain",
		description: "Generate 5 UUIDs → Base64 encode the batch",
		steps: [
			{ toolId: "uuid-generator", settings: { count: 5, format: "standard" } },
			{ toolId: "base64-encoder", settings: { mode: "encode" } },
		],
	},
	{
		id: "lorem-sorter-pipeline",
		name: "Lorem Sorter & Stats",
		description: "Generate Lorem Words → Sort Alphabetically → Count Stats",
		steps: [
			{ toolId: "lorem-generator", settings: { mode: "words", count: 20 } },
			{ toolId: "whitespace-remover", settings: { mode: "trim" } },
			{ toolId: "text-sorter", settings: { order: "asc" } },
			{ toolId: "word-counter", settings: { mode: "report" } },
		],
	},
	{
		id: "css-pipeline",
		name: "CSS Formatting & Optimization",
		description: "Beautify input raw CSS then compress it to minimized CSS",
		steps: [{ toolId: "css-formatter", settings: { indent: 2 } }, { toolId: "css-minifier" }],
	},
	{
		id: "html-translation",
		name: "HTML Translation & Extraction",
		description: "Convert HTML to clean Markdown and extract pure text content",
		steps: [{ toolId: "html-to-markdown" }, { toolId: "html-to-text" }],
	},
	{
		id: "sql-cleaning",
		name: "SQL Cleaning Pipeline",
		description: "Format SQL query and uppercase keywords",
		steps: [
			{ toolId: "sql-formatter", settings: { mode: "format", indentSize: 2, uppercase: "yes" } },
		],
	},
	{
		id: "credentials-hub",
		name: "Credentials Security Hub",
		description: "Generate random passwords and measure their strength instantly",
		steps: [
			{ toolId: "password-generator", settings: { length: 16 } },
			{ toolId: "password-strength-checker" },
		],
	},
	{
		id: "hash-randomizer",
		name: "Hash Utilities & Randomizer",
		description: "Generate a random number and compute its SHA-256 cryptographic hash",
		steps: [
			{ toolId: "random-number-generator", settings: { min: 1, max: 100000, count: 1 } },
			{ toolId: "hash-generator", settings: { algorithm: "sha256" } },
		],
	},
	{
		id: "social-content",
		name: "Social Content Prep",
		description: "Analyze content keywords to hashtags and truncate it to post limit",
		steps: [
			{ toolId: "text-to-hashtags", settings: { maxCount: 8, removeStopWords: "yes" } },
			{ toolId: "text-truncate", settings: { max: 280 } },
		],
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
