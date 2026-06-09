import { useCallback, useState } from "preact/hooks";

interface HeaderItem {
	key: string;
	value: string;
	enabled: boolean;
}

interface ResponseState {
	status: number;
	statusText: string;
	time: number;
	headers: Record<string, string>;
	body: string;
	isJson: boolean;
}

export default function ApiTester() {
	const [method, setMethod] = useState("GET");
	const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
	const [headers, setHeaders] = useState<HeaderItem[]>([
		{ key: "Content-Type", value: "application/json", enabled: true },
		{ key: "Accept", value: "application/json", enabled: true },
	]);
	const [bodyType, setBodyType] = useState<"none" | "json" | "text">("none");
	const [bodyText, setBodyText] = useState("");

	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<ResponseState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<"body" | "headers" | null>(null);
	const [abortController, setAbortController] = useState<AbortController | null>(null);

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

	const handleSendRequest = async () => {
		if (!url.trim()) {
			setError("URL is required.");
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		const controller = new AbortController();
		setAbortController(controller);

		const requestHeaders = new Headers();
		for (const h of headers) {
			if (h.enabled && h.key.trim()) {
				requestHeaders.append(h.key.trim(), h.value);
			}
		}

		const options: RequestInit = {
			method,
			headers: requestHeaders,
			signal: controller.signal,
		};

		if (method !== "GET" && method !== "HEAD" && bodyType !== "none") {
			options.body = bodyText;
		}

		const startTime = performance.now();
		try {
			const res = await fetch(url.trim(), options);
			const endTime = performance.now();
			const timeElapsed = Math.round(endTime - startTime);

			// Extract headers
			const resHeaders: Record<string, string> = {};
			res.headers.forEach((val, key) => {
				resHeaders[key] = val;
			});

			const contentType = res.headers.get("content-type") || "";
			const isJson = contentType.includes("application/json");

			const rawBody = await res.text();
			let formattedBody = rawBody;
			if (isJson) {
				try {
					formattedBody = JSON.stringify(JSON.parse(rawBody), null, 2);
				} catch {
					// Fallback if not parsable
				}
			}

			setResponse({
				status: res.status,
				statusText: res.statusText,
				time: timeElapsed,
				headers: resHeaders,
				body: formattedBody,
				isJson,
			});
		} catch (err: any) {
			if (err.name === "AbortError") {
				setError("Request aborted.");
			} else {
				setError(
					err.message ||
						"Network error. This is usually caused by CORS (Cross-Origin Resource Sharing) restrictions on the API endpoint. Scroll down for more info.",
				);
			}
		} finally {
			setLoading(false);
			setAbortController(null);
		}
	};

	const handleAbort = () => {
		if (abortController) {
			abortController.abort();
		}
	};

	const handleCopy = useCallback(async (text: string, type: "body" | "headers") => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(type);
			setTimeout(() => setCopied(null), 2000);
		} catch {
			/* ignore */
		}
	}, []);

	const getStatusColorClass = (status: number) => {
		if (status >= 200 && status < 300) return "text-accent-emerald";
		if (status >= 300 && status < 400) return "text-warning";
		return "text-accent-rose";
	};

	return (
		<div class="space-y-6">
			{/* Input Bar */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
				<div class="flex flex-col sm:flex-row gap-2">
					<select
						class="input max-w-full sm:w-32 text-body-sm font-bold border-hairline"
						value={method}
						onChange={(e) => setMethod((e.target as HTMLSelectElement).value)}
					>
						{["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
					<input
						type="text"
						class="input flex-1 font-mono text-body-sm"
						placeholder="https://api.example.com/v1/resource"
						value={url}
						onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
					/>
					{loading ? (
						<button class="btn-secondary px-6" onClick={handleAbort}>
							Abort
						</button>
					) : (
						<button class="btn-primary px-6" onClick={handleSendRequest}>
							Send
						</button>
					)}
				</div>

				{/* Request Headers */}
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-body-sm-strong text-ink">Headers</span>
						<button class="btn-tertiary text-xs py-1" onClick={handleAddHeader}>
							+ Add Header
						</button>
					</div>
					<div class="space-y-2 max-h-48 overflow-y-auto">
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
									placeholder="Header-Key"
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

				{/* Request Body */}
				{method !== "GET" && method !== "HEAD" && (
					<div class="space-y-2">
						<div class="flex items-center gap-4">
							<span class="text-body-sm-strong text-ink">Body</span>
							<div class="flex gap-2">
								{(["none", "json", "text"] as const).map((b) => (
									<button
										key={b}
										class={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
											bodyType === b
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setBodyType(b)}
									>
										{b.toUpperCase()}
									</button>
								))}
							</div>
						</div>
						{bodyType !== "none" && (
							<textarea
								class="textarea font-mono text-body-sm"
								style="min-height: 120px;"
								placeholder={
									bodyType === "json" ? '{\n  "key": "value"\n}' : "Enter raw request body..."
								}
								value={bodyText}
								onInput={(e) => setBodyText((e.target as HTMLTextAreaElement).value)}
							/>
						)}
					</div>
				)}
			</div>

			{/* Error State */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5">
					<p class="text-body-sm text-accent-rose font-bold mb-1">Request Failed</p>
					<p class="text-body-sm text-muted">{error}</p>
				</div>
			)}

			{/* Response Panel */}
			{response && (
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center justify-between border-b border-hairline pb-3">
						<h3 class="text-body-strong text-ink">Response</h3>
						<div class="flex items-center gap-4 text-xs font-bold">
							<div>
								Status:{" "}
								<span class={getStatusColorClass(response.status)}>
									{response.status} {response.statusText}
								</span>
							</div>
							<div class="text-muted">
								Latency: <span class="text-primary">{response.time} ms</span>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
						{/* Response Headers */}
						<div class="lg:col-span-4 space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-body-sm-strong text-ink">Headers</span>
								<button
									class="btn-tertiary text-xs py-0.5"
									onClick={() => handleCopy(JSON.stringify(response.headers, null, 2), "headers")}
								>
									{copied === "headers" ? "Copied!" : "Copy"}
								</button>
							</div>
							<div class="bg-surface-soft border border-hairline rounded-lg p-3 overflow-auto max-h-60 space-y-1">
								{Object.entries(response.headers).map(([key, val]) => (
									<div key={key} class="text-[11px] font-mono break-all">
										<span class="text-muted font-bold">{key}:</span>{" "}
										<span class="text-body">{val}</span>
									</div>
								))}
							</div>
						</div>

						{/* Response Body */}
						<div class="lg:col-span-8 space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-body-sm-strong text-ink">Body</span>
								<button
									class="btn-tertiary text-xs py-0.5"
									onClick={() => handleCopy(response.body, "body")}
								>
									{copied === "body" ? "Copied!" : "Copy"}
								</button>
							</div>
							<textarea
								class="textarea font-mono text-body-sm w-full bg-surface-soft"
								style="min-height: 240px;"
								readOnly
								value={response.body || "(Empty response body)"}
							/>
						</div>
					</div>
				</div>
			)}

			{/* CORS Guide */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
				<h4 class="text-body-strong text-ink flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
					CORS Restrictions & Client-Side requests
				</h4>
				<div class="text-body-sm text-muted space-y-2 leading-relaxed">
					<p>
						This tool runs <strong>entirely in your browser</strong>. For security reasons, modern
						web browsers enforce
						<strong> CORS (Cross-Origin Resource Sharing)</strong> regulations. If the target server
						does not send the headers <code>Access-Control-Allow-Origin: *</code> (or matches
						ToolBundle origin), the request will fail.
					</p>
					<p class="font-bold text-ink">How to resolve CORS blocks:</p>
					<ul class="list-disc pl-5 space-y-1">
						<li>Call API endpoints that naturally support CORS (e.g. public open APIs).</li>
						<li>Configure your target API server to allow CORS from our web origin.</li>
						<li>
							Install browser extensions like <em>"Allow CORS"</em> to disable local CORS blocks
							during developer testing.
						</li>
						<li>
							Run your local API with dev CORS permissions allowed (e.g. <code>cors: true</code>).
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
