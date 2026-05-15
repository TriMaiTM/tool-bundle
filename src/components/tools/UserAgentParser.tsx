import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

interface UaInfo {
	browser: string;
	browserVersion: string;
	os: string;
	osVersion: string;
	device: string;
	engine: string;
	cpu: string;
	raw: string;
}

const UA_PRESETS: { label: string; ua: string }[] = [
	{
		label: "Chrome (Windows)",
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	},
	{
		label: "Firefox (Windows)",
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
	},
	{
		label: "Safari (macOS)",
		ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
	},
	{
		label: "Edge (Windows)",
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
	},
	{
		label: "Chrome (Android)",
		ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
	},
	{
		label: "Safari (iOS)",
		ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
	},
];

function parseBrowser(ua: string): { name: string; version: string } {
	// Order matters — check more specific before generic
	const patterns: [RegExp, string][] = [
		[/Edg\/([\d.]+)/, "Edge"],
		[/OPR\/([\d.]+)/, "Opera"],
		[/Vivaldi\/([\d.]+)/, "Vivaldi"],
		[/Brave Chrome\/([\d.]+)/, "Brave"],
		[/Chrome\/([\d.]+)/, "Chrome"],
		[/Firefox\/([\d.]+)/, "Firefox"],
		[/Version\/([\d.]+).*Safari/, "Safari"],
		[/MSIE ([\d.]+)/, "Internet Explorer"],
		[/Trident\/.*rv:([\d.]+)/, "Internet Explorer"],
	];

	for (const [regex, name] of patterns) {
		const match = ua.match(regex);
		if (match) return { name, version: match[1] };
	}

	return { name: "Unknown", version: "" };
}

function parseOS(ua: string): { name: string; version: string } {
	const patterns: [RegExp, string, (m: RegExpMatchArray) => string][] = [
		[/Windows NT 10\.0/, "Windows", () => "10"],
		[/Windows NT 6\.3/, "Windows", () => "8.1"],
		[/Windows NT 6\.2/, "Windows", () => "8"],
		[/Windows NT 6\.1/, "Windows", () => "7"],
		[/Mac OS X ([\d_]+)/, "macOS", (m) => m[1].replace(/_/g, ".")],
		[/Android ([\d.]+)/, "Android", (m) => m[1]],
		[/iPhone OS ([\d_]+)/, "iOS", (m) => m[1].replace(/_/g, ".")],
		[/iPad.*OS ([\d_]+)/, "iPadOS", (m) => m[1].replace(/_/g, ".")],
		[/Linux/, "Linux", () => ""],
		[/CrOS/, "Chrome OS", () => ""],
	];

	for (const [regex, name, getVersion] of patterns) {
		const match = ua.match(regex);
		if (match) return { name, version: getVersion(match) };
	}

	return { name: "Unknown", version: "" };
}

function parseDevice(ua: string): string {
	if (/Mobile|Android.*Mobile|iPhone|Windows Phone/i.test(ua)) return "Mobile";
	if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "Tablet";
	return "Desktop";
}

function parseEngine(ua: string): string {
	if (/Gecko\/\d+/.test(ua) && /Firefox\//.test(ua)) return "Gecko";
	if (/AppleWebKit\/\d+/.test(ua)) return "WebKit";
	if (/Trident\//.test(ua)) return "Trident";
	if (/Presto\//.test(ua)) return "Presto";
	if (/Blink\//.test(ua)) return "Blink";
	if (/AppleWebKit/.test(ua) && /Chrome\//.test(ua)) return "Blink";
	return "Unknown";
}

function parseCPU(ua: string): string {
	if (/x86_64|x86-64|Win64|x64|amd64|AMD64/.test(ua)) return "x86_64";
	if (/(x86|i[3-6]86|i86pc)/.test(ua)) return "x86";
	if (/aarch64|arm64/i.test(ua)) return "ARM64";
	if (/arm/i.test(ua)) return "ARM";
	return "Unknown";
}

function parseUA(ua: string): UaInfo {
	const browser = parseBrowser(ua);
	const os = parseOS(ua);

	return {
		browser: browser.name,
		browserVersion: browser.version,
		os: os.name,
		osVersion: os.version,
		device: parseDevice(ua),
		engine: parseEngine(ua),
		cpu: parseCPU(ua),
		raw: ua,
	};
}

export default function UserAgentParser() {
	const [input, setInput] = useState("");
	const [copiedJson, setCopiedJson] = useState(false);
	const [copiedRaw, setCopiedRaw] = useState(false);

	useEffect(() => {
		if (typeof navigator !== "undefined" && !input) {
			setInput(navigator.userAgent);
		}
	}, []);

	const parsed = useMemo(() => {
		if (!input.trim()) return null;
		return parseUA(input.trim());
	}, [input]);

	const handleCopyJson = useCallback(async () => {
		if (!parsed) return;
		const { raw: _raw, ...data } = parsed;
		try {
			await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
		} catch {
			/* ignore */
		}
		setCopiedJson(true);
		setTimeout(() => setCopiedJson(false), 2000);
	}, [parsed]);

	const handleCopyRaw = useCallback(async () => {
		if (!input.trim()) return;
		try {
			await navigator.clipboard.writeText(input.trim());
		} catch {
			/* ignore */
		}
		setCopiedRaw(true);
		setTimeout(() => setCopiedRaw(false), 2000);
	}, [input]);

	const handlePreset = useCallback((ua: string) => {
		setInput(ua);
	}, []);

	const fields = parsed
		? [
				{
					label: "Browser",
					value: parsed.browserVersion
						? `${parsed.browser} ${parsed.browserVersion}`
						: parsed.browser,
				},
				{ label: "OS", value: parsed.osVersion ? `${parsed.os} ${parsed.osVersion}` : parsed.os },
				{ label: "Device", value: parsed.device },
				{ label: "Engine", value: parsed.engine },
				{ label: "CPU", value: parsed.cpu },
			]
		: [];

	return (
		<div>
			<div class="mb-4">
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">User Agent String</label>
					<button
						class="text-body-sm text-primary hover:text-primary-active"
						onClick={handleCopyRaw}
					>
						{copiedRaw ? "Copied!" : "Copy Raw"}
					</button>
				</div>
				<textarea
					class="textarea"
					style="min-height: 100px; font-family: var(--font-mono); font-size: 13px"
					placeholder="Paste a User-Agent string..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Common Presets</label>
				<div class="flex flex-wrap gap-2">
					{UA_PRESETS.map((p) => (
						<button
							key={p.label}
							class="btn-secondary text-body-sm"
							onClick={() => handlePreset(p.ua)}
						>
							{p.label}
						</button>
					))}
				</div>
			</div>

			{parsed && (
				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<label class="text-caption-uppercase text-muted">Parsed Result</label>
						<button
							class="text-body-sm text-primary hover:text-primary-active"
							onClick={handleCopyJson}
						>
							{copiedJson ? "Copied!" : "Copy as JSON"}
						</button>
					</div>

					<div class="space-y-3">
						{fields.map((f) => (
							<div key={f.label} class="flex items-start gap-3">
								<span class="text-caption-uppercase text-muted" style="min-width: 80px">
									{f.label}
								</span>
								<span class="text-body font-medium">{f.value}</span>
							</div>
						))}
					</div>

					<div class="mt-4 pt-4 border-t border-hairline">
						<label class="text-caption-uppercase text-muted block mb-1">Raw UA</label>
						<div class="text-body-sm font-mono break-all text-muted" style="word-break: break-all">
							{parsed.raw}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
