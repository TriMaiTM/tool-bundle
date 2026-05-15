import { useCallback, useMemo, useState } from "preact/hooks";

interface ParsedUrl {
	original: string;
	protocol: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
	origin: string;
	queryParams: Record<string, string>;
	error?: string;
}

function parseUrlString(urlStr: string): ParsedUrl {
	const trimmed = urlStr.trim();
	if (!trimmed) {
		return {
			original: "",
			protocol: "",
			hostname: "",
			port: "",
			pathname: "",
			search: "",
			hash: "",
			origin: "",
			queryParams: {},
		};
	}

	try {
		const url = new URL(trimmed);
		const params: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			params[key] = value;
		});

		return {
			original: trimmed,
			protocol: url.protocol.replace(":", ""),
			hostname: url.hostname,
			port: url.port,
			pathname: url.pathname,
			search: url.search,
			hash: url.hash,
			origin: url.origin,
			queryParams: params,
		};
	} catch {
		return {
			original: trimmed,
			protocol: "",
			hostname: "",
			port: "",
			pathname: "",
			search: "",
			hash: "",
			origin: "",
			queryParams: {},
			error: "Invalid URL",
		};
	}
}

function UrlDisplay({ parsed, encodeParams }: { parsed: ParsedUrl; encodeParams: boolean }) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const handleCopyField = useCallback(async (field: string, value: string) => {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			/* ignore */
		}
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	}, []);

	if (parsed.error) {
		return (
			<div class="card p-4 mb-3">
				<div class="text-body-sm text-primary font-mono break-all mb-2">{parsed.original}</div>
				<div class="badge" style="background: var(--color-error); color: var(--color-on-error)">
					{parsed.error}
				</div>
			</div>
		);
	}

	if (!parsed.original) return null;

	const fields = [
		{ label: "Protocol", value: parsed.protocol },
		{ label: "Hostname", value: parsed.hostname },
		{ label: "Port", value: parsed.port || "(default)" },
		{ label: "Pathname", value: parsed.pathname },
		{ label: "Search", value: parsed.search || "(none)" },
		{ label: "Hash", value: parsed.hash || "(none)" },
		{ label: "Origin", value: parsed.origin },
	];

	const paramEntries = Object.entries(parsed.queryParams);

	return (
		<div class="card p-4 mb-3">
			<div class="text-body-sm text-primary font-mono break-all mb-3">{parsed.original}</div>

			<div class="space-y-2">
				{fields.map((f) => (
					<div key={f.label} class="flex items-start gap-2">
						<span class="text-caption-uppercase text-muted" style="min-width: 80px">
							{f.label}
						</span>
						<span class="text-body-sm font-mono flex-1 break-all">{f.value}</span>
						<button
							class="text-body-sm text-primary hover:text-primary-active shrink-0"
							onClick={() => handleCopyField(f.label, f.value)}
						>
							{copiedField === f.label ? "Copied!" : "Copy"}
						</button>
					</div>
				))}
			</div>

			{paramEntries.length > 0 && (
				<div class="mt-3 pt-3 border-t border-hairline">
					<label class="text-caption-uppercase text-muted block mb-2">
						Query Parameters ({paramEntries.length})
					</label>
					<div class="space-y-1">
						{paramEntries.map(([key, value]) => (
							<div key={key} class="flex items-center gap-2 text-body-sm font-mono">
								<span class="text-primary">{encodeParams ? encodeURIComponent(key) : key}</span>
								<span class="text-muted">=</span>
								<span class="break-all">{encodeParams ? encodeURIComponent(value) : value}</span>
								<button
									class="text-body-sm text-primary hover:text-primary-active shrink-0 ml-auto"
									onClick={() => handleCopyField(`param-${key}`, `${key}=${value}`)}
								>
									{copiedField === `param-${key}` ? "Copied!" : "Copy"}
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function UrlParser() {
	const [input, setInput] = useState(
		"https://example.com:8080/path/to/page?name=test&id=123#section",
	);
	const [encodeParams, setEncodeParams] = useState(false);
	const [copiedJson, setCopiedJson] = useState(false);

	const parsedUrls = useMemo(() => {
		if (!input.trim()) return [];
		return input
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map(parseUrlString);
	}, [input]);

	const handleCopyJson = useCallback(async () => {
		const data = parsedUrls.map((p) => ({
			original: p.original,
			protocol: p.protocol,
			hostname: p.hostname,
			port: p.port,
			pathname: p.pathname,
			search: p.search,
			hash: p.hash,
			origin: p.origin,
			queryParams: p.queryParams,
		}));
		try {
			await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
		} catch {
			/* ignore */
		}
		setCopiedJson(true);
		setTimeout(() => setCopiedJson(false), 2000);
	}, [parsedUrls]);

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">URL(s) — one per line</label>
				<textarea
					class="textarea"
					style="min-height: 120px; font-family: var(--font-mono); font-size: 13px"
					placeholder="Enter URL(s), one per line..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div class="flex flex-wrap items-center gap-3 mb-4">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={encodeParams}
						onChange={(e) => setEncodeParams((e.target as HTMLInputElement).checked)}
						class="w-4 h-4"
					/>
					<span class="text-body-sm">Encode query params</span>
				</label>

				{parsedUrls.length > 0 && (
					<button class="btn-secondary text-body-sm" onClick={handleCopyJson}>
						{copiedJson ? "Copied!" : "Copy All as JSON"}
					</button>
				)}
			</div>

			<div>
				{parsedUrls.map((parsed, i) => (
					<UrlDisplay key={`${parsed.original}-${i}`} parsed={parsed} encodeParams={encodeParams} />
				))}
			</div>
		</div>
	);
}
