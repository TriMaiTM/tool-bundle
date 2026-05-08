import { useCallback, useMemo, useState } from "preact/hooks";

type Mode = "format" | "minify" | "uppercase";

const MAJOR_KEYWORDS = new Set([
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
	"INTO",
	"FROM",
]);

const INDENT_KEYWORDS = new Set(["SELECT", "WHERE", "SET", "VALUES", "HAVING"]);

const NEWLINE_BEFORE_KEYWORDS = new Set([
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

const _JOIN_KEYWORDS = new Set([
	"JOIN",
	"LEFT JOIN",
	"RIGHT JOIN",
	"INNER JOIN",
	"OUTER JOIN",
	"FULL JOIN",
	"CROSS JOIN",
]);

function tokenizeSql(sql: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const len = sql.length;

	while (i < len) {
		// Skip whitespace (but track it)
		if (/\s/.test(sql[i])) {
			i++;
			continue;
		}

		// String literals (single quotes)
		if (sql[i] === "'") {
			let j = i + 1;
			while (j < len) {
				if (sql[j] === "'" && sql[j + 1] === "'") {
					j += 2; // escaped quote
				} else if (sql[j] === "'") {
					j++;
					break;
				} else {
					j++;
				}
			}
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// String literals (double quotes for identifiers)
		if (sql[i] === '"') {
			let j = i + 1;
			while (j < len && sql[j] !== '"') j++;
			if (j < len) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Backtick identifiers
		if (sql[i] === "`") {
			let j = i + 1;
			while (j < len && sql[j] !== "`") j++;
			if (j < len) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Comments (-- style)
		if (sql[i] === "-" && sql[i + 1] === "-") {
			let j = i + 2;
			while (j < len && sql[j] !== "\n") j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Comments (/* */ style)
		if (sql[i] === "/" && sql[i + 1] === "*") {
			let j = i + 2;
			while (j < len && !(sql[j] === "*" && sql[j + 1] === "/")) j++;
			if (j < len) j += 2;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Parentheses and commas
		if (sql[i] === "(" || sql[i] === ")" || sql[i] === "," || sql[i] === ";") {
			tokens.push(sql[i]);
			i++;
			continue;
		}

		// Operators
		if (["=", "<", ">", "!", "+", "-", "*", "/", "%"].includes(sql[i])) {
			let j = i + 1;
			if (j < len && (sql[j] === "=" || sql[j] === ">" || sql[j] === "<")) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Numbers
		if (/[0-9]/.test(sql[i])) {
			let j = i;
			while (j < len && /[0-9.]/.test(sql[j])) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Words (identifiers or keywords)
		if (/[a-zA-Z_$#]/.test(sql[i])) {
			let j = i;
			while (j < len && /[a-zA-Z0-9_$#]/.test(sql[j])) j++;
			tokens.push(sql.substring(i, j));
			i = j;
			continue;
		}

		// Anything else
		tokens.push(sql[i]);
		i++;
	}

	return tokens;
}

function isKeyword(token: string): boolean {
	return MAJOR_KEYWORDS.has(token.toUpperCase());
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
		if (match) {
			return { keyword: pattern.join(" "), length: pattern.length };
		}
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

		// Check for multi-word keyword
		const multiWord = matchMultiWordKeyword(tokens, i);

		// Handle comments
		if (token.startsWith("--") || token.startsWith("/*")) {
			if (!lineStart) result += `\n${indentStr.repeat(indent)}`;
			result += token;
			lineStart = true;
			i++;
			continue;
		}

		// Handle semicolons
		if (token === ";") {
			result += ";\n";
			lineStart = true;
			i++;
			continue;
		}

		// Handle opening parenthesis
		if (token === "(") {
			parenDepth++;
			result += "(";
			// If next token is a SELECT or other keyword, add newline and increase indent
			if (i + 1 < tokens.length && /^(SELECT|WITH|INSERT|UPDATE|DELETE)$/i.test(tokens[i + 1])) {
				indent++;
				result += `\n${indentStr.repeat(indent)}`;
				lineStart = true;
			}
			i++;
			continue;
		}

		// Handle closing parenthesis
		if (token === ")") {
			parenDepth--;
			if (parenDepth < 0) parenDepth = 0;
			// Check if we need to decrease indent
			if (indent > 0 && result.trimEnd().endsWith(indentStr.trimEnd() || indentStr)) {
				indent = Math.max(0, indent - 1);
				result = result.trimEnd();
				result += `\n${indentStr.repeat(indent)})`;
			} else {
				result += ")";
			}
			lineStart = false;
			i++;
			continue;
		}

		// Handle commas
		if (token === ",") {
			result = `${result.trimEnd()},`;
			// If this is inside a SELECT column list or VALUES, newline
			if (parenDepth === 0) {
				result += `\n${indentStr.repeat(indent + 1)}`;
				lineStart = true;
			}
			i++;
			continue;
		}

		// Handle multi-word keywords
		if (multiWord) {
			const keyword = uppercaseKeywords ? multiWord.keyword : multiWord.keyword.toLowerCase();

			if (NEWLINE_BEFORE_KEYWORDS.has(multiWord.keyword)) {
				if (!lineStart) {
					result = `${result.trimEnd()}\n`;
				}
				result += indentStr.repeat(indent);
				result += `${keyword} `;
				lineStart = false;
			} else {
				if (!lineStart) result += " ";
				result += `${keyword} `;
				lineStart = false;
			}

			i += multiWord.length;
			continue;
		}

		// Handle single-word keywords
		if (isKeyword(token)) {
			const keyword = uppercaseKeywords ? upper : upper.toLowerCase();

			if (NEWLINE_BEFORE_KEYWORDS.has(upper)) {
				if (!lineStart) {
					result = `${result.trimEnd()}\n`;
				}
				if (INDENT_KEYWORDS.has(upper)) {
					result += `${indentStr.repeat(indent) + keyword} `;
				} else {
					result += `${indentStr.repeat(indent) + keyword} `;
				}
				lineStart = false;
			} else {
				if (!lineStart) result += " ";
				result += `${keyword} `;
				lineStart = false;
			}

			i++;
			continue;
		}

		// Regular identifiers, literals, operators
		if (!lineStart) {
			// Add space before token unless it follows certain characters
			const lastChar = result.trimEnd().slice(-1);
			if (lastChar && !["(", ",", ".", " "].includes(lastChar)) {
				result += " ";
			}
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
		.replace(/--[^\n]*/g, "") // Remove line comments
		.replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
		.replace(/\s+/g, " ") // Collapse whitespace
		.replace(/\s*([(),;])\s*/g, "$1") // Remove space around punctuation
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

const SAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE u.created_at >= '2024-01-01'
  AND u.status = 'active'
  AND o.total > 100.00
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 50;

INSERT INTO products (name, price, category, created_at)
VALUES ('Widget Pro', 29.99, 'Electronics', NOW()),
       ('Gadget Plus', 49.99, 'Electronics', NOW());

UPDATE users SET last_login = NOW(), login_count = login_count + 1
WHERE id = 42;

DELETE FROM sessions WHERE expires_at < NOW();

-- Get top customers with subquery
SELECT name, email FROM users
WHERE id IN (
    SELECT user_id FROM orders
    WHERE total > 500
    GROUP BY user_id
    HAVING COUNT(*) > 3
)
ORDER BY name;`;

export default function SqlFormatter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<Mode>("format");
	const [indentSize, setIndentSize] = useState(2);
	const [uppercase, setUppercase] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const result = useMemo(() => {
		if (!input.trim()) {
			setError(null);
			return "";
		}
		try {
			if (mode === "format") {
				const formatted = formatSql(input, indentSize, uppercase);
				setError(null);
				return formatted;
			}
			if (mode === "minify") {
				const minified = minifySql(input);
				setError(null);
				return minified;
			}
			// Uppercase mode
			const upper = uppercaseKeywords(input);
			setError(null);
			return upper;
		} catch (e) {
			setError((e as Error).message);
			return "";
		}
	}, [input, mode, indentSize, uppercase]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	const handleSample = useCallback(() => {
		setInput(SAMPLE_SQL);
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
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "uppercase" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("uppercase")}
					>
						Uppercase
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
								checked={uppercase}
								onChange={(e) => setUppercase((e.target as HTMLInputElement).checked)}
							/>
							Uppercase keywords
						</label>
					</>
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

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input SQL</label>
					<textarea
						class="textarea code-block"
						style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
						placeholder="Paste your SQL query here..."
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
								? "Formatted SQL will appear here..."
								: mode === "minify"
									? "Minified SQL will appear here..."
									: "SQL with uppercase keywords will appear here..."
						}
					/>
				</div>
			</div>
		</div>
	);
}
