import { useCallback, useState } from "preact/hooks";

interface CertEntry {
	id: string;
	issuer_ca_id: number;
	issuer_name: string;
	common_name: string;
	name_value: string;
	not_before: string;
	not_after: string;
	serial_number: string;
	entry_timestamp: string;
}

export default function SslChecker() {
	const [domain, setDomain] = useState("");
	const [certs, setCerts] = useState<CertEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);

	const checkDomain = useCallback(async () => {
		if (!domain.trim()) {
			setError("Please enter a domain name");
			return;
		}

		setLoading(true);
		setError("");
		setCerts([]);

		try {
			const cleanDomain = domain
				.trim()
				.replace(/^https?:\/\//, "")
				.replace(/\/.*$/, "");
			const url = `https://crt.sh/?q=${encodeURIComponent(cleanDomain)}&output=json`;
			const res = await fetch(url);

			if (!res.ok) throw new Error(`Certificate lookup failed (${res.status})`);
			const data: CertEntry[] = await res.json();

			if (!Array.isArray(data) || data.length === 0) {
				throw new Error("No certificates found for this domain");
			}

			// Sort by not_after descending (most recent first) and deduplicate by serial
			const unique = new Map<string, CertEntry>();
			for (const cert of data) {
				const existing = unique.get(cert.serial_number);
				if (!existing || new Date(cert.entry_timestamp) > new Date(existing.entry_timestamp)) {
					unique.set(cert.serial_number, cert);
				}
			}

			const sorted = Array.from(unique.values()).sort(
				(a, b) => new Date(b.not_after).getTime() - new Date(a.not_after).getTime(),
			);

			setCerts(sorted.slice(0, 20));
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, [domain]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter") checkDomain();
		},
		[checkDomain],
	);

	const handleCopyCert = useCallback(
		async (index: number) => {
			const cert = certs[index];
			if (!cert) return;
			const text = [
				`Common Name: ${cert.common_name}`,
				`Issuer: ${cert.issuer_name}`,
				`Valid From: ${cert.not_before}`,
				`Valid To: ${cert.not_after}`,
				`Serial Number: ${cert.serial_number}`,
			].join("\n");
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				/* ignore */
			}
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 1500);
		},
		[certs],
	);

	const handleCopyAll = useCallback(async () => {
		if (!certs.length) return;
		const json = JSON.stringify(certs, null, 2);
		try {
			await navigator.clipboard.writeText(json);
		} catch {
			/* ignore */
		}
		setCopiedAll(true);
		setTimeout(() => setCopiedAll(false), 1500);
	}, [certs]);

	const isExpired = (dateStr: string): boolean => {
		return new Date(dateStr) < new Date();
	};

	const formatDate = (dateStr: string): string => {
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	const extractCN = (name: string): string => {
		const match = name.match(/CN=([^,]+)/);
		return match ? match[1].trim() : name;
	};

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Domain Name</label>
				<div class="flex gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="example.com"
						value={domain}
						onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
						onKeyDown={handleKeyDown}
					/>
					<button class="btn-primary" onClick={checkDomain} disabled={loading}>
						{loading ? "Checking..." : "Check SSL"}
					</button>
				</div>
				<p class="text-body-sm text-muted mt-1">
					Fetches certificate transparency logs from crt.sh
				</p>
			</div>

			{error && (
				<div class="card p-4 mb-4" style="border-left: 3px solid var(--color-error)">
					<p class="text-body-sm" style="color: var(--color-error)">
						{error}
					</p>
				</div>
			)}

			{loading && (
				<div class="flex items-center justify-center py-12">
					<div class="flex flex-col items-center gap-3">
						<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<span class="text-caption text-muted">Fetching certificates...</span>
					</div>
				</div>
			)}

			{certs.length > 0 && (
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-caption-uppercase text-muted">
							{certs.length} certificate{certs.length !== 1 ? "s" : ""} found
						</span>
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleCopyAll}
						>
							{copiedAll ? "Copied!" : "Copy All as JSON"}
						</button>
					</div>

					{certs.map((cert, i) => {
						const expired = isExpired(cert.not_after);
						return (
							<div
								key={`${cert.serial_number}-${i}`}
								class="card p-5"
								style={expired ? "opacity: 0.6" : ""}
							>
								<div class="flex items-start justify-between mb-3">
									<div class="flex items-center gap-2">
										<span class="text-body text-body-strong">
											{cert.common_name || extractCN(cert.name_value)}
										</span>
										<span
											class="badge"
											style={
												expired
													? "background: var(--color-error); color: var(--color-on-error)"
													: "background: var(--color-success); color: var(--color-on-success)"
											}
										>
											{expired ? "Expired" : "Valid"}
										</span>
									</div>
									<button
										class="text-body-sm text-primary hover:text-primary-active transition-colors"
										onClick={() => handleCopyCert(i)}
									>
										{copiedIndex === i ? "Copied!" : "Copy"}
									</button>
								</div>

								<div class="space-y-2">
									<div class="flex items-start gap-3">
										<span class="text-caption-uppercase text-muted" style="min-width: 100px">
											Issuer
										</span>
										<span class="text-body-sm" style="word-break: break-all">
											{extractCN(cert.issuer_name)}
										</span>
									</div>
									<div class="flex items-start gap-3">
										<span class="text-caption-uppercase text-muted" style="min-width: 100px">
											Valid From
										</span>
										<span class="text-body-sm">{formatDate(cert.not_before)}</span>
									</div>
									<div class="flex items-start gap-3">
										<span class="text-caption-uppercase text-muted" style="min-width: 100px">
											Valid To
										</span>
										<span class="text-body-sm" style={expired ? "color: var(--color-error)" : ""}>
											{formatDate(cert.not_after)}
										</span>
									</div>
									<div class="flex items-start gap-3">
										<span class="text-caption-uppercase text-muted" style="min-width: 100px">
											Serial
										</span>
										<span
											class="text-body-sm font-mono"
											style="font-family: var(--font-mono); font-size: 12px; word-break: break-all"
										>
											{cert.serial_number}
										</span>
									</div>
									{cert.name_value !== cert.common_name && (
										<div class="flex items-start gap-3">
											<span class="text-caption-uppercase text-muted" style="min-width: 100px">
												SANs
											</span>
											<span class="text-body-sm" style="word-break: break-all">
												{cert.name_value.replace(/\n/g, ", ")}
											</span>
										</div>
									)}
								</div>
							</div>
						);
					})}

					<div class="card p-5">
						<label class="text-caption-uppercase text-muted block mb-3">SSL Resources</label>
						<div class="space-y-2">
							<a
								class="text-body-sm text-primary hover:text-primary-active transition-colors block"
								href={`https://www.ssllabs.com/ssltest/analyze.html?d=${domain
									.trim()
									.replace(/^https?:\/\//, "")
									.replace(/\/.*$/, "")}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								SSL Labs Server Test
							</a>
							<a
								class="text-body-sm text-primary hover:text-primary-active transition-colors block"
								href={`https://www.sslshopper.com/ssl-checker.html#hostname=${domain
									.trim()
									.replace(/^https?:\/\//, "")
									.replace(/\/.*$/, "")}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								SSL Checker
							</a>
							<a
								class="text-body-sm text-primary hover:text-primary-active transition-colors block"
								href={`https://crt.sh/?q=${domain
									.trim()
									.replace(/^https?:\/\//, "")
									.replace(/\/.*$/, "")}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								crt.sh (Certificate Transparency)
							</a>
						</div>
					</div>
				</div>
			)}

			{!loading && !error && certs.length === 0 && (
				<div class="card p-5">
					<label class="text-caption-uppercase text-muted block mb-3">How SSL/TLS Works</label>
					<div class="space-y-3 text-body-sm">
						<p>
							SSL/TLS (Secure Sockets Layer / Transport Layer Security) encrypts communication
							between a client and server. When you connect to a website via HTTPS, the server
							presents a certificate that your browser verifies.
						</p>
						<p>
							<strong>Certificate Authority (CA):</strong> A trusted third party that signs and
							issues SSL certificates. Browsers maintain a list of trusted CAs.
						</p>
						<p>
							<strong>Certificate Chain:</strong> Your certificate is signed by an intermediate CA,
							which is signed by a root CA. The browser verifies this chain of trust.
						</p>
					</div>

					<label class="text-caption-uppercase text-muted block mb-3 mt-5">Common SSL Issues</label>
					<ul class="space-y-2 text-body-sm" style="list-style: disc; padding-left: 20px">
						<li>Expired certificates cause browser warnings</li>
						<li>Domain name mismatch (cert doesn't match the URL)</li>
						<li>Self-signed certificates not trusted by browsers</li>
						<li>Missing intermediate certificates in the chain</li>
						<li>Weak cipher suites or outdated TLS versions</li>
					</ul>

					<label class="text-caption-uppercase text-muted block mb-3 mt-5">Best Practices</label>
					<ul class="space-y-2 text-body-sm" style="list-style: disc; padding-left: 20px">
						<li>Use TLS 1.2 or higher (prefer TLS 1.3)</li>
						<li>Automate certificate renewal (e.g., Let's Encrypt)</li>
						<li>Enable HSTS (HTTP Strict Transport Security)</li>
						<li>Use strong cipher suites (AES-256-GCM, ChaCha20)</li>
						<li>Implement Certificate Transparency monitoring</li>
						<li>Set up OCSP stapling for faster verification</li>
					</ul>
				</div>
			)}
		</div>
	);
}
