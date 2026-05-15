import { useCallback, useEffect, useState } from "preact/hooks";

interface IpInfo {
	ip: string;
	country: string;
	countryCode: string;
	city: string;
	region: string;
	regionName: string;
	isp: string;
	org: string;
	timezone: string;
	lat: number;
	lon: number;
	as: string;
	query: string;
}

const FLAG_EMOJI_MAP: Record<string, string> = {};

function getFlagEmoji(countryCode: string): string {
	if (!countryCode) return "";
	if (FLAG_EMOJI_MAP[countryCode]) return FLAG_EMOJI_MAP[countryCode];
	const codePoints = countryCode
		.toUpperCase()
		.split("")
		.map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
	const flag = String.fromCodePoint(...codePoints);
	FLAG_EMOJI_MAP[countryCode] = flag;
	return flag;
}

export default function IpLookup() {
	const [ipInput, setIpInput] = useState("");
	const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [autoDetected, setAutoDetected] = useState(false);

	const fetchIpInfo = useCallback(async (queryIp?: string) => {
		setLoading(true);
		setError("");
		setIpInfo(null);

		try {
			let targetIp = queryIp?.trim();

			if (!targetIp) {
				// Auto-detect: fetch user's public IP
				const ipRes = await fetch("https://api.ipify.org?format=json");
				if (!ipRes.ok) throw new Error("Failed to fetch public IP");
				const ipData = await ipRes.json();
				targetIp = ipData.ip;
				setIpInput(targetIp);
				setAutoDetected(true);
			} else {
				setAutoDetected(false);
			}

			// Use ip-api.com for geolocation (free, no key required)
			const res = await fetch(
				`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,org,as,lat,lon,query`,
			);
			if (!res.ok) throw new Error("Failed to fetch IP info");
			const data = await res.json();

			if (data.status === "fail") {
				throw new Error(data.message || "IP lookup failed");
			}

			setIpInfo(data as IpInfo);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, []);

	// Auto-detect on page load
	useEffect(() => {
		fetchIpInfo();
	}, [fetchIpInfo]);

	const handleLookup = useCallback(() => {
		if (ipInput.trim()) {
			fetchIpInfo(ipInput.trim());
		}
	}, [ipInput, fetchIpInfo]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter") handleLookup();
		},
		[handleLookup],
	);

	const handleCopyIp = useCallback(async () => {
		const ip = ipInfo?.ip || ipInput;
		if (ip) {
			try {
				await navigator.clipboard.writeText(ip);
			} catch {
				/* ignore */
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}, [ipInfo, ipInput]);

	const handleCopyAll = useCallback(async () => {
		if (!ipInfo) return;
		const text = [
			`IP Address: ${ipInfo.ip}`,
			`Country: ${ipInfo.country} (${ipInfo.countryCode})`,
			`City: ${ipInfo.city}`,
			`Region: ${ipInfo.regionName} (${ipInfo.region})`,
			`ISP: ${ipInfo.isp}`,
			`Organization: ${ipInfo.org}`,
			`Timezone: ${ipInfo.timezone}`,
			`Coordinates: ${ipInfo.lat}, ${ipInfo.lon}`,
			`AS: ${ipInfo.as}`,
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [ipInfo]);

	const isIPv6 = ipInfo?.ip?.includes(":");

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">IP Address</label>
				<div class="flex gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="Enter IP address (leave empty to auto-detect)"
						value={ipInput}
						onInput={(e) => setIpInput((e.target as HTMLInputElement).value)}
						onKeyDown={handleKeyDown}
					/>
					<button class="btn-primary" onClick={handleLookup} disabled={loading}>
						{loading ? "Looking up..." : "Lookup"}
					</button>
				</div>
				<p class="text-body-sm text-muted mt-1">
					Leave empty and click Lookup to auto-detect your public IP.
				</p>
			</div>

			{error && (
				<div class="card p-4 mb-4" style="border-left: 3px solid var(--color-error)">
					<p class="text-body-sm" style="color: var(--color-error)">
						{error}
					</p>
				</div>
			)}

			{ipInfo && (
				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<span class="text-body text-body-strong">
								{getFlagEmoji(ipInfo.countryCode)} {ipInfo.ip}
							</span>
							<span class="badge">{isIPv6 ? "IPv6" : "IPv4"}</span>
							{autoDetected && <span class="badge">Auto-detected</span>}
						</div>
						<div class="flex gap-2">
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopyIp}
							>
								{copied ? "Copied!" : "Copy IP"}
							</button>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopyAll}
							>
								Copy All
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								Country
							</span>
							<span class="text-body font-medium">
								{getFlagEmoji(ipInfo.countryCode)} {ipInfo.country}
							</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								City
							</span>
							<span class="text-body font-medium">{ipInfo.city || "N/A"}</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								Region
							</span>
							<span class="text-body font-medium">
								{ipInfo.regionName ? `${ipInfo.regionName} (${ipInfo.region})` : "N/A"}
							</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								ISP
							</span>
							<span class="text-body font-medium">{ipInfo.isp || "N/A"}</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								Organization
							</span>
							<span class="text-body font-medium">{ipInfo.org || "N/A"}</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								Timezone
							</span>
							<span class="text-body font-medium">{ipInfo.timezone || "N/A"}</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								Coordinates
							</span>
							<span class="text-body font-medium">
								{ipInfo.lat}, {ipInfo.lon}
							</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								AS
							</span>
							<span class="text-body font-medium font-mono" style="font-family: var(--font-mono)">
								{ipInfo.as || "N/A"}
							</span>
						</div>
						<div class="flex items-start gap-3">
							<span class="text-caption-uppercase text-muted" style="min-width: 110px">
								IP Version
							</span>
							<span class="text-body font-medium">{isIPv6 ? "IPv6" : "IPv4"}</span>
						</div>
					</div>

					<div class="mt-4 pt-4 border-t border-hairline">
						<a
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							href={`https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on Google Maps
						</a>
					</div>
				</div>
			)}

			{loading && !ipInfo && (
				<div class="flex items-center justify-center py-12">
					<div class="flex flex-col items-center gap-3">
						<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<span class="text-caption text-muted">Looking up IP...</span>
					</div>
				</div>
			)}
		</div>
	);
}
