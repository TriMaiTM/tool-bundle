import { useCallback, useEffect, useState } from "preact/hooks";

interface HeaderItem {
	key: string;
	value: string;
	enabled: boolean;
}

export default function GraphqlTester() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const defaultQuery = `query GetCountry($code: ID!) {
  country(code: $code) {
    name
    native
    capital
    emoji
    currency
    languages {
      code
      name
    }
  }
}`;

	const defaultVariables = `{
  "code": "VN"
}`;

	const [activeTab, setActiveTab] = useState<"format" | "test">("format");
	const [queryText, setQueryText] = useState(defaultQuery);
	const [variablesText, setVariablesText] = useState(defaultVariables);
	const [endpoint, setEndpoint] = useState("https://countries.trevorblades.com/graphql");

	const [headers, setHeaders] = useState<HeaderItem[]>([
		{ key: "Content-Type", value: "application/json", enabled: true },
	]);

	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<"query" | "response" | null>(null);

	const t = {
		en: {
			title: "GraphQL Formatter & Tester",
			tabFormat: "Query Formatter",
			tabTest: "API Tester",
			lblQuery: "GraphQL Query",
			lblVariables: "Query Variables (JSON)",
			lblEndpoint: "GraphQL Endpoint",
			btnFormat: "Format Query",
			btnSend: "Send Query",
			btnClear: "Clear",
			copyQuery: "Copy Query",
			copyResponse: "Copy Response",
			copied: "Copied!",
			headersTitle: "Request Headers",
			responseTitle: "Response",
			invalidVariables: "Invalid variables JSON format",
			placeholderQuery: "Write your GraphQL query here...",
		},
		vi: {
			title: "Trình định dạng & Thử nghiệm GraphQL",
			tabFormat: "Định dạng Truy vấn",
			tabTest: "Thử nghiệm API",
			lblQuery: "Truy vấn GraphQL (Query)",
			lblVariables: "Biến truyền vào (JSON Variables)",
			lblEndpoint: "Địa chỉ GraphQL Endpoint",
			btnFormat: "Định dạng",
			btnSend: "Gửi truy vấn",
			btnClear: "Xóa sạch",
			copyQuery: "Sao chép truy vấn",
			copyResponse: "Sao chép phản hồi",
			copied: "Đã copy!",
			headersTitle: "Tiêu đề yêu cầu (Headers)",
			responseTitle: "Kết quả phản hồi",
			invalidVariables: "Định dạng JSON biến truyền vào không hợp lệ",
			placeholderQuery: "Viết câu truy vấn GraphQL của bạn vào đây...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleAddHeader = () => {
		setHeaders([...headers, { key: "", value: "", enabled: true }]);
	};

	const handleRemoveHeader = (index: number) => {
		setHeaders(headers.filter((_, i) => i !== index));
	};

	const handleHeaderChange = (index: number, field: "key" | "value" | "enabled", val: any) => {
		setHeaders(
			headers.map((h, i) => {
				if (i === index) {
					return { ...h, [field]: val };
				}
				return h;
			}),
		);
	};

	const handleFormat = () => {
		let indent = 0;
		const lines = queryText
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		const formattedLines: string[] = [];
		for (const line of lines) {
			const openCount = (line.match(/\{/g) || []).length;
			const closeCount = (line.match(/\}/g) || []).length;

			const startsWithClose = line.startsWith("}");
			const lineIndent = startsWithClose ? Math.max(0, indent - 1) : indent;

			formattedLines.push("  ".repeat(lineIndent) + line);
			indent = Math.max(0, indent + openCount - closeCount);
		}

		setQueryText(formattedLines.join("\n"));

		// Format variables as well
		if (variablesText.trim()) {
			try {
				const parsed = JSON.parse(variablesText);
				setVariablesText(JSON.stringify(parsed, null, 2));
			} catch {
				// Ignore invalid variables format formatting
			}
		}
	};

	const handleSendRequest = async () => {
		if (!endpoint.trim()) {
			setError("Endpoint URL is required.");
			return;
		}

		let variablesObj = {};
		if (variablesText.trim()) {
			try {
				variablesObj = JSON.parse(variablesText);
			} catch {
				setError(t.invalidVariables);
				return;
			}
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		const requestHeaders = new Headers();
		for (const h of headers) {
			if (h.enabled && h.key.trim()) {
				requestHeaders.append(h.key.trim(), h.value);
			}
		}

		try {
			const res = await fetch(endpoint.trim(), {
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify({
					query: queryText,
					variables: variablesObj,
				}),
			});

			const data = await res.json();
			setResponse(JSON.stringify(data, null, 2));
		} catch (err: any) {
			setError(
				err.message ||
					"Failed to query GraphQL endpoint. Check for network errors or CORS restrictions.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = (text: string, type: "query" | "response") => {
		if (!text) return;
		navigator.clipboard.writeText(text).then(() => {
			setCopied(type);
			setTimeout(() => setCopied(null), 2000);
		});
	};

	const handleClear = () => {
		setQueryText("");
		setVariablesText("");
		setResponse(null);
		setError(null);
	};

	return (
		<div class="space-y-6">
			{/* Tab Headers */}
			<div class="flex border-b border-hairline gap-2">
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "format"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("format")}
				>
					{t.tabFormat}
				</button>
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "test"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("test")}
				>
					{t.tabTest}
				</button>
			</div>

			{/* Main Grid */}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Query & Variables Editors */}
				<div class="lg:col-span-6 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<label class="text-body-sm-strong text-ink">{t.lblQuery}</label>
								<div class="flex gap-2">
									<button
										class="btn-secondary py-1 px-3 text-xs font-bold"
										onClick={() => handleCopy(queryText, "query")}
									>
										{copied === "query" ? t.copied : t.copyQuery}
									</button>
									<button class="btn-tertiary text-xs py-1 px-2.5" onClick={handleClear}>
										{t.btnClear}
									</button>
								</div>
							</div>
							<textarea
								class="textarea font-mono text-body-sm w-full"
								style={{ minHeight: "260px" }}
								placeholder={t.placeholderQuery}
								value={queryText}
								onInput={(e) => setQueryText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>

						<div class="space-y-2">
							<label class="text-body-sm-strong text-ink block">{t.lblVariables}</label>
							<textarea
								class="textarea font-mono text-body-sm w-full"
								style={{ minHeight: "120px" }}
								placeholder="{}"
								value={variablesText}
								onInput={(e) => setVariablesText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>

						{activeTab === "format" && (
							<button class="btn-primary w-full py-2.5" onClick={handleFormat}>
								{t.btnFormat}
							</button>
						)}
					</div>
				</div>

				{/* HTTP config & Output panel */}
				<div class="lg:col-span-6 space-y-4">
					{activeTab === "test" ? (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							{/* Endpoint */}
							<div class="space-y-2">
								<label class="text-body-sm-strong text-ink block">{t.lblEndpoint}</label>
								<input
									type="text"
									class="input w-full font-mono text-body-sm"
									value={endpoint}
									onInput={(e) => setEndpoint((e.target as HTMLInputElement).value)}
								/>
							</div>

							{/* Headers */}
							<div class="space-y-2">
								<div class="flex justify-between items-center">
									<span class="text-body-sm-strong text-ink">{t.headersTitle}</span>
									<button class="btn-tertiary text-xs py-1" onClick={handleAddHeader}>
										+ Add Header
									</button>
								</div>
								<div class="space-y-2 max-h-40 overflow-y-auto">
									{headers.map((h, i) => (
										<div key={i} class="flex items-center gap-2">
											<input
												type="checkbox"
												class="accent-primary"
												checked={h.enabled}
												onChange={(e) =>
													handleHeaderChange(i, "enabled", (e.target as HTMLInputElement).checked)
												}
											/>
											<input
												type="text"
												class="input py-1 text-xs font-mono"
												placeholder="Header"
												value={h.key}
												onInput={(e) =>
													handleHeaderChange(i, "key", (e.target as HTMLInputElement).value)
												}
											/>
											<input
												type="text"
												class="input py-1 text-xs font-mono"
												placeholder="Value"
												value={h.value}
												onInput={(e) =>
													handleHeaderChange(i, "value", (e.target as HTMLInputElement).value)
												}
											/>
											<button
												class="text-accent-rose hover:text-error-deep p-1.5"
												onClick={() => handleRemoveHeader(i)}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										</div>
									))}
								</div>
							</div>

							<button
								class="btn-primary w-full py-2.5"
								onClick={handleSendRequest}
								disabled={loading}
							>
								{loading ? "Sending..." : t.btnSend}
							</button>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<h4 class="text-body-strong text-ink">GraphQL Syntax Helper</h4>
							<p class="text-body-sm text-muted leading-relaxed">
								Format your GraphQL queries instantly with a single click. This tool handles fields,
								fragments, arguments, inline variables, and nested braces according to modern
								formatting standards.
							</p>
							<div class="text-xs text-muted border-t border-hairline pt-3 space-y-1">
								<p class="font-bold text-ink">Tips:</p>
								<ul class="list-disc pl-5 space-y-1">
									<li>Use the API Tester tab to run live queries.</li>
									<li>Check CORS configurations if API request fails.</li>
									<li>Variables must be written in valid JSON format.</li>
								</ul>
							</div>
						</div>
					)}

					{/* Response Display */}
					{(response || error) && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-body-sm-strong text-ink">{t.responseTitle}</span>
								{response && (
									<button
										class="btn-secondary py-1 px-3 text-xs font-bold"
										onClick={() => handleCopy(response, "response")}
									>
										{copied === "response" ? t.copied : t.copyResponse}
									</button>
								)}
							</div>
							{error && (
								<p class="text-body-sm text-accent-rose bg-accent-rose/5 p-3 rounded border border-accent-rose/20">
									{error}
								</p>
							)}
							{response && (
								<textarea
									class="textarea font-mono text-body-sm w-full bg-surface-soft"
									style={{ minHeight: "260px" }}
									readOnly
									value={response}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
