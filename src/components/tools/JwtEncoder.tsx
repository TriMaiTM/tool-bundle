import { useCallback, useMemo, useState } from "preact/hooks";

type Algorithm = "HS256" | "HS384" | "HS512";

const ALGORITHMS: Algorithm[] = ["HS256", "HS384", "HS512"];

const SAMPLE_PRESETS: Record<string, { header: string; payload: string }> = {
	"user-session": {
		header: '{"alg":"HS256","typ":"JWT"}',
		payload: JSON.stringify(
			{
				sub: "1234567890",
				name: "John Doe",
				email: "john@example.com",
				role: "admin",
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			},
			null,
			2,
		),
	},
	"api-key": {
		header: '{"alg":"HS256","typ":"JWT"}',
		payload: JSON.stringify(
			{
				sub: "api-key-xyz",
				scope: ["read", "write"],
				org: "acme-corp",
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400,
			},
			null,
			2,
		),
	},
};

function base64UrlEncode(str: string): string {
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getHashAlgorithm(algo: Algorithm): string {
	switch (algo) {
		case "HS256":
			return "SHA-256";
		case "HS384":
			return "SHA-384";
		case "HS512":
			return "SHA-512";
	}
}

async function hmacSign(algo: Algorithm, message: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const algorithm = getHashAlgorithm(algo);

	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: algorithm },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
	const signatureArray = new Uint8Array(signature);
	let binary = "";
	for (const byte of signatureArray) {
		binary += String.fromCharCode(byte);
	}
	return base64UrlEncode(binary);
}

export default function JwtEncoder() {
	const [header, setHeader] = useState('{"alg":"HS256","typ":"JWT"}');
	const [payload, setPayload] = useState("");
	const [secret, setSecret] = useState("");
	const [algorithm, setAlgorithm] = useState<Algorithm>("HS256");
	const [token, setToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const headerValidation = useMemo(() => {
		try {
			JSON.parse(header);
			return { valid: true, error: null };
		} catch {
			return { valid: false, error: "Invalid JSON in header" };
		}
	}, [header]);

	const payloadValidation = useMemo(() => {
		if (!payload.trim()) return { valid: false, error: "Payload is required" };
		try {
			JSON.parse(payload);
			return { valid: true, error: null };
		} catch {
			return { valid: false, error: "Invalid JSON in payload" };
		}
	}, [payload]);

	const handleEncode = useCallback(async () => {
		setError(null);
		setToken(null);

		if (!headerValidation.valid) {
			setError(headerValidation.error);
			return;
		}
		if (!payloadValidation.valid) {
			setError(payloadValidation.error);
			return;
		}

		try {
			const headerB64 = base64UrlEncode(header.trim());
			const payloadB64 = base64UrlEncode(payload.trim());
			const message = `${headerB64}.${payloadB64}`;
			const signature = await hmacSign(algorithm, message, secret);
			setToken(`${message}.${signature}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to encode JWT");
		}
	}, [header, payload, secret, algorithm, headerValidation, payloadValidation]);

	const handleCopy = useCallback(async () => {
		if (!token) return;
		await navigator.clipboard.writeText(token);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [token]);

	const handlePreset = useCallback((preset: string) => {
		const data = SAMPLE_PRESETS[preset];
		if (data) {
			setHeader(data.header);
			setPayload(data.payload);
		}
	}, []);

	return (
		<div class="space-y-6">
			{/* Presets */}
			<div class="flex flex-wrap items-center gap-3">
				<label class="text-caption-uppercase text-muted">Presets:</label>
				{Object.entries(SAMPLE_PRESETS).map(([key]) => (
					<button
						key={key}
						class="btn-secondary text-body-sm"
						style="height: 36px"
						onClick={() => handlePreset(key)}
					>
						{key.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
					</button>
				))}
			</div>

			{/* Algorithm */}
			<div class="flex items-center gap-3">
				<label class="text-caption-uppercase text-muted">Algorithm</label>
				<select
					class="input"
					style="width: auto; height: 36px"
					value={algorithm}
					onChange={(e) => setAlgorithm((e.target as HTMLSelectElement).value as Algorithm)}
				>
					{ALGORITHMS.map((algo) => (
						<option key={algo} value={algo}>
							{algo}
						</option>
					))}
				</select>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Header */}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Header</label>
						{!headerValidation.valid && (
							<span class="text-caption text-accent-rose">{headerValidation.error}</span>
						)}
					</div>
					<textarea
						class={`textarea ${!headerValidation.valid ? "border-accent-rose" : ""}`}
						style="min-height: 100px; font-family: var(--font-mono); font-size: 13px"
						placeholder='{"alg":"HS256","typ":"JWT"}'
						value={header}
						onInput={(e) => setHeader((e.target as HTMLTextAreaElement).value)}
					/>
				</div>

				{/* Payload */}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Payload</label>
						{!payloadValidation.valid && (
							<span class="text-caption text-accent-rose">{payloadValidation.error}</span>
						)}
					</div>
					<textarea
						class={`textarea ${!payloadValidation.valid ? "border-accent-rose" : ""}`}
						style="min-height: 100px; font-family: var(--font-mono); font-size: 13px"
						placeholder='{"sub":"1234567890","name":"John Doe"}'
						value={payload}
						onInput={(e) => setPayload((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
			</div>

			{/* Secret */}
			<div>
				<label class="text-caption-uppercase text-muted block mb-2">Secret Key</label>
				<input
					type="text"
					class="input w-full"
					placeholder="Enter your secret key..."
					value={secret}
					onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
				/>
			</div>

			{/* Encode button */}
			<div class="flex items-center gap-3">
				<button
					class="btn-primary"
					onClick={handleEncode}
					disabled={!headerValidation.valid || !payloadValidation.valid}
				>
					Encode JWT
				</button>
				<a
					href="/tools/jwt-decoder"
					class="text-body-sm text-primary hover:text-primary-active transition-colors"
				>
					Open JWT Decoder →
				</a>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* Output */}
			{token && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<div class="flex items-center justify-between mb-3">
						<label class="text-caption-uppercase text-muted">Encoded JWT</label>
						<button class="btn-secondary text-body-sm" onClick={handleCopy}>
							{copied ? "Copied!" : "Copy"}
						</button>
					</div>
					<textarea
						class="textarea"
						style="min-height: 100px; font-family: var(--font-mono); font-size: 12px; word-break: break-all"
						value={token}
						readOnly
					/>
				</div>
			)}
		</div>
	);
}
