import { useCallback, useEffect, useState } from "preact/hooks";

interface JwtDecoded {
	header: any;
	payload: any;
	signature: string;
}

export default function JwtVerifier() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Default demo token (HS256 signed with secret "secret")
	const defaultToken =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MTYyMzkwMjJ9.XPb1tU9W1_npxR9D7a3n1l3t4eR-HmW-W3-L4S5eT8U";

	const [token, setToken] = useState(defaultToken);
	const [secret, setSecret] = useState("secret");
	const [alg, setAlg] = useState("HS256");

	const [decoded, setDecoded] = useState<JwtDecoded | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isExpired, setIsExpired] = useState<boolean | null>(null);
	const [sigStatus, setSigStatus] = useState<"unchecked" | "valid" | "invalid">("unchecked");

	const t = {
		en: {
			title: "JWT (JSON Web Token) Verifier",
			lblToken: "JWT Token Input",
			lblSecret: "Signature Secret (for HMAC algorithms)",
			lblHeader: "JWT Header",
			lblPayload: "JWT Payload (Claims)",
			lblSignature: "Signature status",
			validSig: "Signature Verified successfully!",
			invalidSig: "Invalid Signature! The token has been altered or secret is incorrect.",
			noSecret: "Signature not verified. Enter secret key to run verification.",
			expired: "Token is Expired! (exp claims checker)",
			notExpired: "Token is active (not expired).",
			btnClear: "Clear",
			placeholderToken: "Paste your JWT token here...",
			placeholderSecret: "Enter secret key...",
		},
		vi: {
			title: "Trình xác thực mã JWT",
			lblToken: "Nhập mã JWT Token",
			lblSecret: "Khóa bí mật (cho thuật toán HMAC)",
			lblHeader: "Phần đầu JWT Header",
			lblPayload: "Phần thân JWT Payload",
			lblSignature: "Trạng thái chữ ký",
			validSig: "Chữ ký hợp lệ! Token chuẩn xác.",
			invalidSig: "Chữ ký không hợp lệ! Token đã bị sửa đổi hoặc sai khóa bí mật.",
			noSecret: "Chưa kiểm tra chữ ký. Nhập khóa bí mật để xác thực.",
			expired: "Mã JWT này đã hết hạn! (Dựa trên trường exp)",
			notExpired: "Mã JWT còn hạn sử dụng.",
			btnClear: "Xóa sạch",
			placeholderToken: "Dán mã JWT của bạn vào đây...",
			placeholderSecret: "Nhập khóa bí mật để kiểm tra...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const base64UrlDecode = (str: string): string => {
		let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
		while (base64.length % 4) {
			base64 += "=";
		}
		return atob(base64);
	};

	const base64UrlToUint8Array = (str: string): Uint8Array => {
		const binary = base64UrlDecode(str);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	};

	const handleDecode = useCallback(() => {
		setParseError(null);
		setDecoded(null);
		setIsExpired(null);
		setSigStatus("unchecked");

		const cleanToken = token.trim();
		if (!cleanToken) return;

		const parts = cleanToken.split(".");
		if (parts.length !== 3) {
			setParseError("Invalid JWT format. Must contain 3 parts separated by dots.");
			return;
		}

		try {
			const headerObj = JSON.parse(base64UrlDecode(parts[0]));
			const payloadObj = JSON.parse(base64UrlDecode(parts[1]));

			if (headerObj.alg) {
				setAlg(headerObj.alg);
			}

			setDecoded({
				header: headerObj,
				payload: payloadObj,
				signature: parts[2],
			});

			// Expiration Check
			if (payloadObj.exp) {
				const expTimestamp = payloadObj.exp * 1000;
				setIsExpired(Date.now() > expTimestamp);
			}
		} catch (err: any) {
			setParseError(err.message || "Failed to parse JWT parts.");
		}
	}, [token]);

	useEffect(() => {
		handleDecode();
	}, [handleDecode]);

	// Verify JWT HMAC Signature using Web Crypto API
	const handleVerifySignature = useCallback(async () => {
		if (!decoded || !secret.trim() || !token.trim()) {
			setSigStatus("unchecked");
			return;
		}

		const parts = token.trim().split(".");
		if (parts.length !== 3) return;

		const [headerB64, payloadB64, signatureB64] = parts;
		const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

		let hashAlg = "SHA-256";
		if (alg === "HS384") hashAlg = "SHA-384";
		if (alg === "HS512") hashAlg = "SHA-512";

		try {
			const keyData = new TextEncoder().encode(secret);
			const cryptoKey = await crypto.subtle.importKey(
				"raw",
				keyData,
				{ name: "HMAC", hash: { name: hashAlg } },
				false,
				["verify"],
			);

			const sigBuf = base64UrlToUint8Array(signatureB64);
			const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBuf, data);

			setSigStatus(isValid ? "valid" : "invalid");
		} catch {
			setSigStatus("invalid");
		}
	}, [decoded, secret, token, alg]);

	useEffect(() => {
		handleVerifySignature();
	}, [handleVerifySignature]);

	const handleClear = () => {
		setToken("");
		setSecret("");
		setDecoded(null);
		setParseError(null);
		setIsExpired(null);
		setSigStatus("unchecked");
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Inputs panel */}
				<div class="lg:col-span-5 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						{/* Token textarea */}
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<label class="text-body-sm-strong text-ink">{t.lblToken}</label>
								<button class="btn-tertiary text-xs py-1 px-3" onClick={handleClear}>
									{t.btnClear}
								</button>
							</div>
							<textarea
								class={`textarea font-mono text-body-sm w-full ${
									parseError ? "border-accent-rose focus:border-accent-rose" : ""
								}`}
								style={{ minHeight: "220px" }}
								placeholder={t.placeholderToken}
								value={token}
								onInput={(e) => setToken((e.target as HTMLTextAreaElement).value)}
							/>
							{parseError && <p class="text-xs font-bold text-accent-rose mt-1">{parseError}</p>}
						</div>

						{/* Secret input */}
						{alg.startsWith("HS") && (
							<div class="space-y-2">
								<label class="text-body-sm-strong text-ink block">{t.lblSecret}</label>
								<input
									type="text"
									class="input w-full font-mono text-body-sm"
									placeholder={t.placeholderSecret}
									value={secret}
									onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
								/>
							</div>
						)}
					</div>

					{/* Signature & Expiry Status Banner */}
					{decoded && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<span class="text-body-sm-strong text-ink block">{t.lblSignature}</span>

							{/* Signature status */}
							{sigStatus === "valid" && (
								<div class="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-lg text-xs font-bold flex items-center gap-2">
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
										<polyline points="12 8 12 12 14 14" />
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
										<polyline points="22 4 12 14.01 9 11.01" />
									</svg>
									{t.validSig}
								</div>
							)}
							{sigStatus === "invalid" && (
								<div class="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose rounded-lg text-xs font-bold flex items-center gap-2">
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
										<line x1="15" y1="9" x2="9" y2="15" />
										<line x1="9" y1="9" x2="15" y2="15" />
									</svg>
									{t.invalidSig}
								</div>
							)}
							{sigStatus === "unchecked" && (
								<div class="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs font-bold flex items-center gap-2">
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
									{t.noSecret}
								</div>
							)}

							{/* Expiry status */}
							{isExpired !== null && (
								<div
									class={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
										isExpired
											? "bg-accent-rose/10 border border-accent-rose/20 text-accent-rose"
											: "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
									}`}
								>
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
										<polyline points="12 6 12 12 16 14" />
									</svg>
									{isExpired ? t.expired : t.notExpired}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Decoded Views Column */}
				<div class="lg:col-span-7 space-y-4">
					{decoded ? (
						<div class="space-y-4">
							{/* Header claims */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<span class="text-body-sm-strong text-ink block">{t.lblHeader}</span>
								<pre class="bg-surface-soft p-4 rounded-lg border border-hairline font-mono text-xs text-primary font-bold overflow-x-auto">
									{JSON.stringify(decoded.header, null, 2)}
								</pre>
							</div>

							{/* Payload claims */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<span class="text-body-sm-strong text-ink block">{t.lblPayload}</span>
								<pre class="bg-surface-soft p-4 rounded-lg border border-hairline font-mono text-xs text-indigo-500 font-bold overflow-x-auto">
									{JSON.stringify(decoded.payload, null, 2)}
								</pre>
							</div>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm text-center py-12 text-muted text-body-sm">
							Decoded claims and JWT components will appear here when a valid token is entered.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
