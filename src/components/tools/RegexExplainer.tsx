import { useCallback, useState } from "preact/hooks";

interface Token {
	type: string;
	value: string;
	description: string;
}

function tokenizeRegex(pattern: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < pattern.length) {
		const ch = pattern[i];

		// Escape sequences
		if (ch === "\\" && i + 1 < pattern.length) {
			const next = pattern[i + 1];
			const escapeMap: Record<string, string> = {
				d: "any digit [0-9]",
				D: "any non-digit",
				w: "any word character [a-zA-Z0-9_]",
				W: "any non-word character",
				s: "any whitespace",
				S: "any non-whitespace",
				b: "word boundary",
				B: "non-word boundary",
				n: "newline",
				t: "tab",
				r: "carriage return",
			};
			tokens.push({
				type: "escape",
				value: `\\${next}`,
				description: escapeMap[next] || `escaped character "${next}"`,
			});
			i += 2;
			continue;
		}

		// Character classes
		if (ch === "[") {
			let j = i + 1;
			let negated = false;
			if (j < pattern.length && pattern[j] === "^") {
				negated = true;
				j++;
			}
			while (j < pattern.length && pattern[j] !== "]") {
				if (pattern[j] === "\\") j++;
				j++;
			}
			const content = pattern.slice(i + 1, j);
			const prefix = negated ? "NOT " : "";
			tokens.push({
				type: "class",
				value: pattern.slice(i, j + 1),
				description: `${prefix}any of: ${content}`,
			});
			i = j + 1;
			continue;
		}

		// Groups
		if (ch === "(") {
			let groupType = "capturing group";
			if (pattern[i + 1] === "?") {
				if (pattern[i + 2] === ":") groupType = "non-capturing group";
				else if (pattern[i + 2] === "=") groupType = "positive lookahead";
				else if (pattern[i + 2] === "!") groupType = "negative lookahead";
				else if (pattern[i + 2] === "<" && pattern[i + 3] === "=")
					groupType = "positive lookbehind";
				else if (pattern[i + 2] === "<" && pattern[i + 3] === "!")
					groupType = "negative lookbehind";
				else if (pattern[i + 2] === "<") groupType = "named capture group";
			}
			tokens.push({
				type: "group-start",
				value: "(",
				description: `Start of ${groupType}`,
			});
			i++;
			continue;
		}

		if (ch === ")") {
			tokens.push({
				type: "group-end",
				value: ")",
				description: "End of group",
			});
			i++;
			continue;
		}

		// Quantifiers
		if (ch === "*") {
			const lazy = pattern[i + 1] === "?";
			tokens.push({
				type: "quantifier",
				value: lazy ? "*?" : "*",
				description: lazy ? "0 or more (lazy)" : "0 or more (greedy)",
			});
			i += lazy ? 2 : 1;
			continue;
		}
		if (ch === "+") {
			const lazy = pattern[i + 1] === "?";
			tokens.push({
				type: "quantifier",
				value: lazy ? "+?" : "+",
				description: lazy ? "1 or more (lazy)" : "1 or more (greedy)",
			});
			i += lazy ? 2 : 1;
			continue;
		}
		if (ch === "?") {
			tokens.push({
				type: "quantifier",
				value: "?",
				description: "0 or 1 (optional)",
			});
			i++;
			continue;
		}
		if (ch === "{") {
			let j = i + 1;
			while (j < pattern.length && pattern[j] !== "}") j++;
			const quant = pattern.slice(i + 1, j);
			const parts = quant.split(",");
			let desc = "";
			if (parts.length === 1) desc = `exactly ${parts[0]} times`;
			else if (parts[1] === "") desc = `${parts[0]} or more times`;
			else desc = `between ${parts[0]} and ${parts[1]} times`;
			tokens.push({
				type: "quantifier",
				value: pattern.slice(i, j + 1),
				description: desc,
			});
			i = j + 1;
			continue;
		}

		// Anchors
		if (ch === "^") {
			tokens.push({
				type: "anchor",
				value: "^",
				description: "Start of string/line",
			});
			i++;
			continue;
		}
		if (ch === "$") {
			tokens.push({
				type: "anchor",
				value: "$",
				description: "End of string/line",
			});
			i++;
			continue;
		}

		// Dot
		if (ch === ".") {
			tokens.push({
				type: "dot",
				value: ".",
				description: "Any character (except newline)",
			});
			i++;
			continue;
		}

		// Alternation
		if (ch === "|") {
			tokens.push({
				type: "alternation",
				value: "|",
				description: "OR — match left or right side",
			});
			i++;
			continue;
		}

		// Literal character
		tokens.push({ type: "literal", value: ch, description: `Literal "${ch}"` });
		i++;
	}

	return tokens;
}

const tokenColors: Record<string, string> = {
	escape: "#f59e0b",
	class: "#a855f7",
	"group-start": "#3b82f6",
	"group-end": "#3b82f6",
	quantifier: "#22c55e",
	anchor: "#ef4444",
	dot: "#06b6d4",
	alternation: "#ec4899",
	literal: "#e6e6e6",
};

export default function RegexExplainer() {
	const [pattern, setPattern] = useState("");
	const [testString, setTestString] = useState("");
	const [flags, setFlags] = useState("g");
	const [tokens, setTokens] = useState<Token[]>([]);
	const [matches, setMatches] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleExplain = useCallback(() => {
		if (!pattern.trim()) {
			setTokens([]);
			setMatches([]);
			setError(null);
			return;
		}
		try {
			setError(null);
			const parsed = tokenizeRegex(pattern);
			setTokens(parsed);

			if (testString) {
				const regex = new RegExp(pattern, flags);
				const found: string[] = [];
				let m;
				if (flags.includes("g")) {
					while ((m = regex.exec(testString)) !== null) {
						found.push(m[0]);
						if (m.index === regex.lastIndex) regex.lastIndex++;
					}
				} else {
					m = regex.exec(testString);
					if (m) found.push(m[0]);
				}
				setMatches(found);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Invalid regex");
			setTokens([]);
			setMatches([]);
		}
	}, [pattern, testString, flags]);

	const handleCopy = useCallback(async () => {
		if (tokens.length === 0) return;
		const text = tokens.map((t) => `${t.value} → ${t.description}`).join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [tokens]);

	return (
		<div>
			{/* Pattern input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-1">Regex Pattern</label>
				<div class="flex gap-2">
					<span class="text-body-md text-muted self-center">/</span>
					<input
						class="input flex-1 font-mono"
						placeholder="[a-z]+@[a-z]+\.[a-z]{2,}"
						value={pattern}
						onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
					/>
					<span class="text-body-md text-muted self-center">/</span>
					<input
						class="input font-mono"
						style="width: 60px"
						value={flags}
						onInput={(e) => setFlags((e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>

			{/* Test string */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-1">Test String (optional)</label>
				<textarea
					class="textarea"
					style="min-height: 80px"
					placeholder="Enter text to test the regex against..."
					value={testString}
					onInput={(e) => {
						setTestString((e.target as HTMLTextAreaElement).value);
						if (pattern) handleExplain();
					}}
				/>
			</div>

			{/* Explain button */}
			<div class="mb-6">
				<button class="btn-primary" onClick={handleExplain} disabled={!pattern.trim()}>
					Explain Regex
				</button>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* Tokens */}
			{tokens.length > 0 && (
				<div class="mb-6">
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">
							Breakdown ({tokens.length} tokens)
						</span>
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleCopy}
						>
							{copied ? "Copied!" : "Copy"}
						</button>
					</div>
					<div class="flex flex-wrap gap-2 mb-4">
						{tokens.map((t, i) => (
							<span
								key={i}
								class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-body-sm font-mono"
								style={{
									background: `${tokenColors[t.type]}22`,
									color: tokenColors[t.type],
									border: `1px solid ${tokenColors[t.type]}44`,
								}}
							>
								{t.value}
							</span>
						))}
					</div>
					<div class="space-y-2">
						{tokens.map((t, i) => (
							<div key={i} class="flex items-center gap-3 bg-surface-elevated rounded-lg p-3">
								<span
									class="font-mono text-body-sm font-semibold"
									style={{ color: tokenColors[t.type], minWidth: "40px" }}
								>
									{t.value}
								</span>
								<span class="text-body-sm text-muted">→</span>
								<span class="text-body-sm text-body">{t.description}</span>
								<span
									class="badge text-caption-uppercase ml-auto"
									style={{
										background: `${tokenColors[t.type]}22`,
										color: tokenColors[t.type],
									}}
								>
									{t.type}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Matches */}
			{testString && matches.length > 0 && (
				<div class="mb-6">
					<div class="text-caption-uppercase text-muted mb-3">Matches ({matches.length})</div>
					<div class="flex flex-wrap gap-2">
						{matches.map((m, i) => (
							<span key={i} class="badge badge-yellow font-mono">
								{m}
							</span>
						))}
					</div>
				</div>
			)}

			{testString && tokens.length > 0 && matches.length === 0 && !error && (
				<div class="bg-surface-elevated rounded-lg p-4">
					<p class="text-body-sm text-muted">No matches found in the test string.</p>
				</div>
			)}
		</div>
	);
}
