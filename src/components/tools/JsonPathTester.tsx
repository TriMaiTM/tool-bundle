import { useCallback, useEffect, useState } from "preact/hooks";

interface Token {
	type: "child" | "recursive-child" | "wildcard" | "recursive-wildcard" | "index" | "slice";
	key?: string;
	index?: number;
	start?: number;
	end?: number;
}

export default function JsonPathTester() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [jsonInput, setJsonInput] = useState(
		JSON.stringify(
			{
				store: {
					book: [
						{
							category: "reference",
							author: "Nigel Rees",
							title: "Sayings of the Century",
							price: 8.95,
						},
						{
							category: "fiction",
							author: "Evelyn Waugh",
							title: "Sword of Honour",
							price: 12.99,
						},
						{
							category: "fiction",
							author: "Herman Melville",
							title: "Moby Dick",
							isbn: "0-553-21311-3",
							price: 8.99,
						},
						{
							category: "fiction",
							author: "J. R. R. Tolkien",
							title: "The Lord of the Rings",
							isbn: "0-395-19395-8",
							price: 22.99,
						},
					],
					bicycle: {
						color: "red",
						price: 19.95,
					},
				},
			},
			null,
			2,
		),
	);
	const [pathExpression, setPathExpression] = useState("$.store.book[*].author");
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [pathError, setPathError] = useState<string | null>(null);
	const [output, setOutput] = useState<any[]>([]);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "JSON Path Tester",
			jsonInputLabel: "JSON Input",
			pathInputLabel: "JSONPath Expression",
			outputLabel: "Query Result",
			invalidJson: "Invalid JSON format",
			copyBtn: "Copy Result",
			copied: "Copied!",
			clearBtn: "Clear",
			jsonPlaceholder: "Paste your JSON here...",
			pathPlaceholder: "e.g. $.store.book[*].author",
			examplesTitle: "Supported Syntax Examples",
			exRoot: "Root object",
			exChild: "Child property",
			exWildcard: "All items/keys",
			exRecDescent: "Deep scan for key",
			exArrayIndex: "N-th array element",
			exSlice: "Array slice range",
		},
		vi: {
			title: "JSON Path Tester",
			jsonInputLabel: "Dữ liệu JSON",
			pathInputLabel: "Biểu thức JSONPath",
			outputLabel: "Kết quả truy vấn",
			invalidJson: "Định dạng JSON không hợp lệ",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			jsonPlaceholder: "Dán mã JSON của bạn vào đây...",
			pathPlaceholder: "Ví dụ: $.store.book[*].author",
			examplesTitle: "Ví dụ cú pháp hỗ trợ",
			exRoot: "Đối tượng gốc",
			exChild: "Thuộc tính con",
			exWildcard: "Tất cả phần tử/khóa",
			exRecDescent: "Tìm kiếm sâu theo khóa",
			exArrayIndex: "Phần tử thứ N trong mảng",
			exSlice: "Cắt mảng theo khoảng",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Helper to parse the path expression
	const parseBracketContent = (content: string, recursive: boolean): Token => {
		if (content === "*") {
			return { type: recursive ? "recursive-wildcard" : "wildcard" };
		}

		if (
			(content.startsWith("'") && content.endsWith("'")) ||
			(content.startsWith('"') && content.endsWith('"'))
		) {
			const key = content.substring(1, content.length - 1);
			return { type: recursive ? "recursive-child" : "child", key };
		}

		if (content.includes(":")) {
			const parts = content.split(":");
			const start = parts[0].trim() ? Number.parseInt(parts[0].trim(), 10) : 0;
			const end = parts[1].trim() ? Number.parseInt(parts[1].trim(), 10) : undefined;
			return { type: "slice", start, end };
		}

		const idx = Number.parseInt(content, 10);
		if (!Number.isNaN(idx)) {
			return { type: "index", index: idx };
		}

		return { type: recursive ? "recursive-child" : "child", key: content };
	};

	const parsePath = (path: string): Token[] => {
		const tokens: Token[] = [];
		let i = 1; // skip '$'
		const len = path.length;

		while (i < len) {
			if (path[i] === "." && path[i + 1] === ".") {
				i += 2;
				if (path[i] === "*") {
					tokens.push({ type: "recursive-wildcard" });
					i++;
				} else if (path[i] === "[") {
					const closing = path.indexOf("]", i);
					if (closing === -1) throw new Error("Unclosed bracket");
					const bracketContent = path.substring(i + 1, closing).trim();
					i = closing + 1;
					tokens.push(parseBracketContent(bracketContent, true));
				} else {
					let end = i;
					while (end < len && /[a-zA-Z0-9_-]/.test(path[end])) {
						end++;
					}
					const key = path.substring(i, end);
					if (!key) throw new Error("Expected identifier after '..'");
					tokens.push({ type: "recursive-child", key });
					i = end;
				}
				continue;
			}

			if (path[i] === ".") {
				i++;
				if (path[i] === "*") {
					tokens.push({ type: "wildcard" });
					i++;
				} else {
					let end = i;
					while (end < len && /[a-zA-Z0-9_-]/.test(path[end])) {
						end++;
					}
					const key = path.substring(i, end);
					if (!key) throw new Error("Expected identifier after '.'");
					tokens.push({ type: "child", key });
					i = end;
				}
				continue;
			}

			if (path[i] === "[") {
				const closing = path.indexOf("]", i);
				if (closing === -1) throw new Error("Unclosed bracket");
				const bracketContent = path.substring(i + 1, closing).trim();
				i = closing + 1;
				tokens.push(parseBracketContent(bracketContent, false));
				continue;
			}

			let end = i;
			while (end < len && /[a-zA-Z0-9_-]/.test(path[end])) {
				end++;
			}
			const key = path.substring(i, end);
			if (key) {
				tokens.push({ type: "child", key });
				i = end;
				continue;
			}

			throw new Error(`Unexpected character '${path[i]}' at index ${i}`);
		}

		return tokens;
	};

	const evaluate = (obj: any, tokens: Token[]): any[] => {
		let currentResults = [obj];

		for (const token of tokens) {
			const nextResults: any[] = [];
			for (const res of currentResults) {
				if (res === null || res === undefined) continue;

				if (token.type === "child") {
					if (typeof res === "object" && token.key! in res) {
						nextResults.push(res[token.key!]);
					}
				} else if (token.type === "wildcard") {
					if (Array.isArray(res)) {
						nextResults.push(...res);
					} else if (typeof res === "object") {
						nextResults.push(...Object.values(res));
					}
				} else if (token.type === "index") {
					if (Array.isArray(res)) {
						const idx = token.index! < 0 ? res.length + token.index! : token.index!;
						if (idx >= 0 && idx < res.length) {
							nextResults.push(res[idx]);
						}
					}
				} else if (token.type === "slice") {
					if (Array.isArray(res)) {
						const start = token.start! < 0 ? res.length + token.start! : token.start!;
						const end =
							token.end === undefined
								? res.length
								: token.end < 0
									? res.length + token.end
									: token.end;
						nextResults.push(...res.slice(start, end));
					}
				} else if (token.type === "recursive-child") {
					const matches: any[] = [];
					const recurse = (node: any) => {
						if (node === null || typeof node !== "object") return;
						if (token.key! in node) {
							matches.push(node[token.key!]);
						}
						if (Array.isArray(node)) {
							for (const child of node) recurse(child);
						} else {
							for (const child of Object.values(node)) recurse(child);
						}
					};
					recurse(res);
					nextResults.push(...matches);
				} else if (token.type === "recursive-wildcard") {
					const matches: any[] = [];
					const recurse = (node: any) => {
						if (node === null || typeof node !== "object") return;
						if (Array.isArray(node)) {
							matches.push(...node);
							for (const child of node) recurse(child);
						} else {
							matches.push(...Object.values(node));
							for (const child of Object.values(node)) recurse(child);
						}
					};
					recurse(res);
					nextResults.push(...matches);
				}
			}
			currentResults = nextResults;
		}

		return currentResults;
	};

	const handleEvaluate = useCallback(() => {
		setJsonError(null);
		setPathError(null);

		let parsedJson: any;
		try {
			parsedJson = JSON.parse(jsonInput);
		} catch (err: any) {
			setJsonError(err.message || t.invalidJson);
			setOutput([]);
			return;
		}

		if (!pathExpression.startsWith("$")) {
			setPathError("Expression must start with '$'");
			setOutput([]);
			return;
		}

		try {
			const tokens = parsePath(pathExpression);
			const result = evaluate(parsedJson, tokens);
			setOutput(result);
		} catch (err: any) {
			setPathError(err.message || "Parse error");
			setOutput([]);
		}
	}, [jsonInput, pathExpression, t.invalidJson]);

	useEffect(() => {
		handleEvaluate();
	}, [handleEvaluate]);

	const handleCopy = () => {
		if (output.length === 0) return;
		const text = JSON.stringify(output, null, 2);
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleClear = () => {
		setJsonInput("");
		setPathExpression("$");
		setOutput([]);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* JSON Input panel */}
				<div class="lg:col-span-6 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink">{t.jsonInputLabel}</label>
							<button class="btn-tertiary text-xs py-1 px-3" onClick={handleClear}>
								{t.clearBtn}
							</button>
						</div>
						<textarea
							class={`textarea font-mono text-body-sm w-full ${
								jsonError
									? "border-accent-rose focus:border-accent-rose focus:ring-accent-rose"
									: ""
							}`}
							style={{ minHeight: "350px" }}
							placeholder={t.jsonPlaceholder}
							value={jsonInput}
							onInput={(e) => setJsonInput((e.target as HTMLTextAreaElement).value)}
						/>
						{jsonError && <p class="text-xs font-bold text-accent-rose mt-1">{jsonError}</p>}
					</div>

					{/* Supported Syntax Examples */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink">{t.examplesTitle}</h4>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$</span>
								<div class="text-muted mt-1">{t.exRoot}</div>
							</div>
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$.store.bicycle</span>
								<div class="text-muted mt-1">{t.exChild}</div>
							</div>
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$..price</span>
								<div class="text-muted mt-1">{t.exRecDescent}</div>
							</div>
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$.store.book[*].author</span>
								<div class="text-muted mt-1">{t.exWildcard}</div>
							</div>
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$.store.book[0]</span>
								<div class="text-muted mt-1">{t.exArrayIndex}</div>
							</div>
							<div class="p-2.5 bg-surface-soft border border-hairline rounded-lg">
								<span class="text-primary font-bold">$.store.book[0:2]</span>
								<div class="text-muted mt-1">{t.exSlice}</div>
							</div>
						</div>
					</div>
				</div>

				{/* JSONPath Expression and Results */}
				<div class="lg:col-span-6 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						{/* Path Expression Input */}
						<div class="space-y-2">
							<label class="text-body-sm-strong text-ink block">{t.pathInputLabel}</label>
							<input
								type="text"
								class={`input w-full font-mono ${
									pathError
										? "border-accent-rose focus:border-accent-rose focus:ring-accent-rose"
										: ""
								}`}
								placeholder={t.pathPlaceholder}
								value={pathExpression}
								onInput={(e) => setPathExpression((e.target as HTMLInputElement).value)}
							/>
							{pathError && <p class="text-xs font-bold text-accent-rose mt-1">{pathError}</p>}
						</div>

						{/* Output Result */}
						<div class="space-y-2 pt-2 border-t border-hairline">
							<div class="flex justify-between items-center">
								<label class="text-body-sm-strong text-ink">{t.outputLabel}</label>
								{output.length > 0 && (
									<button
										class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
										onClick={handleCopy}
									>
										{copied ? (
											<>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="var(--color-accent-emerald)"
													stroke-width="3"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
												{t.copied}
											</>
										) : (
											<>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
													<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
												</svg>
												{t.copyBtn}
											</>
										)}
									</button>
								)}
							</div>
							<textarea
								class="textarea font-mono text-body-sm w-full bg-surface-soft"
								style={{ minHeight: "336px" }}
								readOnly
								value={output.length > 0 ? JSON.stringify(output, null, 2) : "[]"}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
