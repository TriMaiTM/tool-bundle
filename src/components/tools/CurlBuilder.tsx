import { useCallback, useMemo, useState } from "preact/hooks";

interface KeyValueItem {
	key: string;
	value: string;
	enabled: boolean;
}

export default function CurlBuilder() {
	const [method, setMethod] = useState("GET");
	const [url, setUrl] = useState("https://api.example.com/v1/users");

	// Query params
	const [queryParams, setQueryParams] = useState<KeyValueItem[]>([
		{ key: "limit", value: "10", enabled: true },
		{ key: "page", value: "1", enabled: true },
	]);

	// Headers
	const [headers, setHeaders] = useState<KeyValueItem[]>([
		{ key: "Content-Type", value: "application/json", enabled: true },
		{ key: "Authorization", value: "Bearer token123", enabled: false },
	]);

	// Auth
	const [authType, setAuthType] = useState<"none" | "basic" | "bearer">("none");
	const [authUser, setAuthUser] = useState("");
	const [authPass, setAuthPass] = useState("");
	const [authToken, setAuthToken] = useState("");

	// Body
	const [bodyType, setBodyType] = useState<"none" | "json" | "raw">("none");
	const [bodyText, setBodyText] = useState("");

	// Flags
	const [insecure, setInsecure] = useState(false);
	const [location, setLocation] = useState(false);
	const [includeHeaders, setIncludeHeaders] = useState(false);
	const [silent, setSilent] = useState(false);
	const [timeout, setTimeoutVal] = useState("");
	const [multiline, setMultiline] = useState(true);

	const [copied, setCopied] = useState(false);

	// Handlers
	const handleAddQuery = () =>
		setQueryParams([...queryParams, { key: "", value: "", enabled: true }]);
	const handleRemoveQuery = (index: number) =>
		setQueryParams(queryParams.filter((_, i) => i !== index));
	const handleQueryChange = (index: number, field: "key" | "value" | "enabled", val: any) => {
		setQueryParams(queryParams.map((q, i) => (i === index ? { ...q, [field]: val } : q)));
	};

	const handleAddHeader = () => setHeaders([...headers, { key: "", value: "", enabled: true }]);
	const handleRemoveHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
	const handleHeaderChange = (index: number, field: "key" | "value" | "enabled", val: any) => {
		setHeaders(headers.map((h, i) => (i === index ? { ...h, [field]: val } : h)));
	};

	// Generate cURL
	const generatedCurl = useMemo(() => {
		const parts: string[] = ["curl"];

		// Base request method (default GET is implicit, but let's explicit make it -X)
		if (method !== "GET") {
			parts.push(`-X ${method}`);
		}

		// Flags
		if (insecure) parts.push("-k");
		if (location) parts.push("-L");
		if (includeHeaders) parts.push("-i");
		if (silent) parts.push("-s");
		if (timeout.trim()) {
			const sec = Number.parseInt(timeout) || 0;
			if (sec > 0) parts.push(`--max-time ${sec}`);
		}

		// Headers
		const finalHeaders = [...headers];

		// Auth header injection
		if (authType === "bearer" && authToken.trim()) {
			finalHeaders.push({
				key: "Authorization",
				value: `Bearer ${authToken.trim()}`,
				enabled: true,
			});
		} else if (authType === "basic" && (authUser.trim() || authPass.trim())) {
			const credentials = btoa(`${authUser.trim()}:${authPass.trim()}`);
			finalHeaders.push({ key: "Authorization", value: `Basic ${credentials}`, enabled: true });
		}

		for (const h of finalHeaders) {
			if (h.enabled && h.key.trim()) {
				// Escape single quotes in headers
				const cleanKey = h.key.trim().replace(/'/g, "'\\''");
				const cleanVal = h.value.replace(/'/g, "'\\''");
				parts.push(`-H '${cleanKey}: ${cleanVal}'`);
			}
		}

		// Body
		if (method !== "GET" && method !== "HEAD" && bodyType !== "none" && bodyText.trim()) {
			const escapedBody = bodyText.replace(/'/g, "'\\''");
			parts.push(`-d '${escapedBody}'`);
		}

		// URL and query parameters
		let finalUrl = url.trim();
		if (!finalUrl) finalUrl = "https://api.example.com";

		const activeQueries = queryParams.filter((q) => q.enabled && q.key.trim());
		if (activeQueries.length > 0) {
			const queryString = activeQueries
				.map((q) => `${encodeURIComponent(q.key.trim())}=${encodeURIComponent(q.value)}`)
				.join("&");
			finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryString;
		}

		parts.push(`'${finalUrl.replace(/'/g, "'\\''")}'`);

		// Multiline join or single line join
		if (multiline) {
			return parts.join(" \\\n  ");
		}
		return parts.join(" ");
	}, [
		method,
		url,
		queryParams,
		headers,
		authType,
		authUser,
		authPass,
		authToken,
		bodyType,
		bodyText,
		insecure,
		location,
		includeHeaders,
		silent,
		timeout,
		multiline,
	]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(generatedCurl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [generatedCurl]);

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration Panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
					<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2">
						Configure Request
					</h3>

					{/* Method & URL */}
					<div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
						<div class="sm:col-span-1">
							<label class="text-body-sm-strong text-ink block mb-1">Method</label>
							<select
								class="input text-body-sm font-bold"
								value={method}
								onChange={(e) => setMethod((e.target as HTMLSelectElement).value)}
							>
								{["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].map((m) => (
									<option key={m} value={m}>
										{m}
									</option>
								))}
							</select>
						</div>
						<div class="sm:col-span-3">
							<label class="text-body-sm-strong text-ink block mb-1">Base URL</label>
							<input
								type="text"
								class="input font-mono text-body-sm"
								placeholder="https://api.example.com/v1/users"
								value={url}
								onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					{/* Query Params */}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink">Query Parameters</label>
							<button class="btn-tertiary text-xs py-0.5" onClick={handleAddQuery}>
								+ Add Parameter
							</button>
						</div>
						<div class="space-y-2 max-h-36 overflow-y-auto">
							{queryParams.map((q, i) => (
								<div key={i} class="flex items-center gap-2">
									<input
										type="checkbox"
										class="accent-primary"
										checked={q.enabled}
										onChange={(e) =>
											handleQueryChange(i, "enabled", (e.target as HTMLInputElement).checked)
										}
									/>
									<input
										type="text"
										class="input py-1 text-xs font-mono"
										placeholder="key"
										value={q.key}
										onInput={(e) =>
											handleQueryChange(i, "key", (e.target as HTMLInputElement).value)
										}
									/>
									<input
										type="text"
										class="input py-1 text-xs font-mono"
										placeholder="value"
										value={q.value}
										onInput={(e) =>
											handleQueryChange(i, "value", (e.target as HTMLInputElement).value)
										}
									/>
									<button class="text-accent-rose p-1.5" onClick={() => handleRemoveQuery(i)}>
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

					{/* Headers */}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink">Headers</label>
							<button class="btn-tertiary text-xs py-0.5" onClick={handleAddHeader}>
								+ Add Header
							</button>
						</div>
						<div class="space-y-2 max-h-36 overflow-y-auto">
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
									<button class="text-accent-rose p-1.5" onClick={() => handleRemoveHeader(i)}>
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

					{/* Authentication */}
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block">Authentication</label>
						<div class="flex gap-2 mb-2">
							{(["none", "basic", "bearer"] as const).map((a) => (
								<button
									key={a}
									class={`px-3 py-1 rounded-full text-xs font-bold border transition-colors capitalize ${
										authType === a
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setAuthType(a)}
								>
									{a === "none" ? "None" : a === "basic" ? "Basic Auth" : "Bearer Token"}
								</button>
							))}
						</div>
						{authType === "basic" && (
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									class="input text-xs"
									placeholder="Username"
									value={authUser}
									onInput={(e) => setAuthUser((e.target as HTMLInputElement).value)}
								/>
								<input
									type="password"
									class="input text-xs"
									placeholder="Password"
									value={authPass}
									onInput={(e) => setAuthPass((e.target as HTMLInputElement).value)}
								/>
							</div>
						)}
						{authType === "bearer" && (
							<input
								type="text"
								class="input text-xs font-mono"
								placeholder="token123xyz"
								value={authToken}
								onInput={(e) => setAuthToken((e.target as HTMLInputElement).value)}
							/>
						)}
					</div>

					{/* Request Body */}
					{method !== "GET" && method !== "HEAD" && (
						<div class="space-y-2">
							<div class="flex items-center gap-4">
								<label class="text-body-sm-strong text-ink">Request Body</label>
								<div class="flex gap-2">
									{(["none", "json", "raw"] as const).map((b) => (
										<button
											key={b}
											class={`px-3 py-0.5 rounded-full text-[11px] font-bold border transition-colors uppercase ${
												bodyType === b
													? "bg-primary border-primary text-white"
													: "bg-surface-soft border-hairline text-ink hover:border-primary"
											}`}
											onClick={() => setBodyType(b)}
										>
											{b}
										</button>
									))}
								</div>
							</div>
							{bodyType !== "none" && (
								<textarea
									class="textarea font-mono text-body-sm"
									style="min-height: 100px;"
									placeholder={
										bodyType === "json" ? '{\n  "name": "John"\n}' : "Enter raw payload..."
									}
									value={bodyText}
									onInput={(e) => setBodyText((e.target as HTMLTextAreaElement).value)}
								/>
							)}
						</div>
					)}

					{/* Advanced Flags */}
					<div class="space-y-2 pt-2 border-t border-hairline">
						<label class="text-body-sm-strong text-ink block">cURL Options / Flags</label>
						<div class="grid grid-cols-2 gap-x-4 gap-y-2">
							<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
								<input
									type="checkbox"
									class="accent-primary"
									checked={insecure}
									onChange={(e) => setInsecure((e.target as HTMLInputElement).checked)}
								/>
								Allow Insecure Connection (-k)
							</label>
							<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
								<input
									type="checkbox"
									class="accent-primary"
									checked={location}
									onChange={(e) => setLocation((e.target as HTMLInputElement).checked)}
								/>
								Follow Redirects (-L)
							</label>
							<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
								<input
									type="checkbox"
									class="accent-primary"
									checked={includeHeaders}
									onChange={(e) => setIncludeHeaders((e.target as HTMLInputElement).checked)}
								/>
								Include Response Headers (-i)
							</label>
							<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
								<input
									type="checkbox"
									class="accent-primary"
									checked={silent}
									onChange={(e) => setSilent((e.target as HTMLInputElement).checked)}
								/>
								Silent / Quiet Mode (-s)
							</label>
						</div>
						<div class="flex items-center gap-2 pt-2">
							<span class="text-xs font-bold text-ink">Max Execution Timeout:</span>
							<input
								type="number"
								class="input py-1 text-xs w-20 text-center"
								placeholder="sec"
								min="0"
								value={timeout}
								onInput={(e) => setTimeoutVal((e.target as HTMLInputElement).value)}
							/>
							<span class="text-caption text-muted">seconds</span>
						</div>
					</div>
				</div>

				{/* Output Panel */}
				<div class="lg:col-span-5 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<div class="flex justify-between items-center border-b border-hairline pb-2">
							<h3 class="text-body-strong text-ink">cURL Command</h3>
							<div class="flex gap-2">
								<button
									class={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
										multiline
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink"
									}`}
									onClick={() => setMultiline(true)}
								>
									Multi-line
								</button>
								<button
									class={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
										!multiline
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink"
									}`}
									onClick={() => setMultiline(false)}
								>
									Single-line
								</button>
							</div>
						</div>

						<div class="relative">
							<textarea
								class="textarea font-mono text-body-sm bg-surface-soft w-full"
								style="min-height: 250px; font-size: 12px; line-height: 1.6;"
								readOnly
								value={generatedCurl}
							/>
						</div>

						<button
							class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
							onClick={handleCopy}
						>
							{copied ? (
								<>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									Copied to Clipboard!
								</>
							) : (
								<>
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
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
									</svg>
									Copy cURL Command
								</>
							)}
						</button>
					</div>

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2 text-body-sm text-muted">
						<p class="font-bold text-ink">What is cURL?</p>
						<p class="leading-relaxed">
							cURL is a command-line tool for transferring data with URLs. It supports protocols
							like HTTP, HTTPS, FTP, and more. It is widely used for testing APIs, scraping data,
							and automating server-to-server operations.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
