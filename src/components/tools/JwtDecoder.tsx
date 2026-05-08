import { useCallback, useState } from "preact/hooks";

interface JWTParts {
	header: any;
	payload: any;
	signature: string;
	raw: string;
}

function decodeBase64Url(str: string): string {
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	while (base64.length % 4) base64 += "=";
	return atob(base64);
}

function parseJWT(token: string): JWTParts {
	const parts = token.trim().split(".");
	if (parts.length !== 3) throw new Error("Invalid JWT — expected 3 parts separated by dots");

	const header = JSON.parse(decodeBase64Url(parts[0]));
	const payload = JSON.parse(decodeBase64Url(parts[1]));
	const signature = parts[2];

	return { header, payload, signature, raw: token.trim() };
}

function formatDate(exp: number): string {
	const d = new Date(exp * 1000);
	return d.toLocaleString();
}

function isExpired(exp: number): boolean {
	return Date.now() > exp * 1000;
}

export default function JwtDecoder() {
	const [input, setInput] = useState("");
	const [token, setToken] = useState<JWTParts | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	const handleDecode = useCallback(() => {
		if (!input.trim()) {
			setToken(null);
			setError(null);
			return;
		}
		try {
			setError(null);
			const decoded = parseJWT(input);
			setToken(decoded);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Invalid JWT");
			setToken(null);
		}
	}, [input]);

	const handleCopy = useCallback(async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(key);
		setTimeout(() => setCopied(null), 2000);
	}, []);

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-1">JWT Token</label>
				<textarea
					class="textarea code-block font-mono"
					style="min-height: 100px; font-size: 12px"
					placeholder="Paste your JWT token here... e.g. eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						if (token) {
							setToken(null);
						}
					}}
				/>
			</div>

			{/* Decode button */}
			<div class="mb-4">
				<button class="btn-primary" onClick={handleDecode} disabled={!input.trim()}>
					Decode JWT
				</button>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* Decoded result */}
			{token && (
				<div class="space-y-4">
					{/* Header */}
					<div class="card">
						<div class="flex items-center justify-between mb-2">
							<span class="text-caption-uppercase text-muted">Header</span>
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={() => handleCopy(JSON.stringify(token.header, null, 2), "header")}
							>
								{copied === "header" ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre class="code-block font-mono" style="font-size: 13px">
							<code>{JSON.stringify(token.header, null, 2)}</code>
						</pre>
					</div>

					{/* Payload */}
					<div class="card">
						<div class="flex items-center justify-between mb-2">
							<span class="text-caption-uppercase text-muted">Payload</span>
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={() => handleCopy(JSON.stringify(token.payload, null, 2), "payload")}
							>
								{copied === "payload" ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre class="code-block font-mono" style="font-size: 13px">
							<code>{JSON.stringify(token.payload, null, 2)}</code>
						</pre>

						{/* Common claims */}
						<div class="mt-3 space-y-2">
							{token.payload.exp && (
								<div class="flex items-center gap-2">
									<span class="text-body-sm text-muted">Expires:</span>
									<span
										class={`text-body-sm ${isExpired(token.payload.exp) ? "text-accent-rose" : "text-accent-emerald"}`}
									>
										{formatDate(token.payload.exp)}
										{isExpired(token.payload.exp) ? " (EXPIRED)" : " (Valid)"}
									</span>
								</div>
							)}
							{token.payload.iat && (
								<div class="flex items-center gap-2">
									<span class="text-body-sm text-muted">Issued:</span>
									<span class="text-body-sm text-body">{formatDate(token.payload.iat)}</span>
								</div>
							)}
							{token.payload.sub && (
								<div class="flex items-center gap-2">
									<span class="text-body-sm text-muted">Subject:</span>
									<span class="text-body-sm text-body">{token.payload.sub}</span>
								</div>
							)}
						</div>
					</div>

					{/* Signature */}
					<div class="card">
						<div class="flex items-center justify-between mb-2">
							<span class="text-caption-uppercase text-muted">Signature</span>
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={() => handleCopy(token.signature, "sig")}
							>
								{copied === "sig" ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre
							class="code-block font-mono text-body-sm"
							style="font-size: 12px; word-break: break-all"
						>
							<code>{token.signature}</code>
						</pre>
					</div>
				</div>
			)}
		</div>
	);
}
