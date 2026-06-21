import { useEffect, useState } from "preact/hooks";

export default function HmacValidator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [message, setMessage] = useState("");
	const [secretKey, setSecretKey] = useState("");
	const [expectedHmac, setExpectedHmac] = useState("");
	const [hashAlgo, setHashAlgo] = useState<"SHA-256" | "SHA-512" | "SHA-1" | "SHA-384">("SHA-256");
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [calculating, setCalculating] = useState(false);

	const t = {
		en: {
			title: "HMAC Signature Validator",
			lblMessage: "Enter Message / Data",
			lblSecretKey: "Secret Key",
			lblExpected: "Expected HMAC (Hex format)",
			lblAlgo: "Hash Algorithm",
			btnVerify: "Validate Signature",
			lblResult: "Validation Status",
			match: "VALID: The calculated HMAC signature matches the expected HMAC exactly!",
			mismatch: "INVALID: The calculated HMAC does not match. The message or key has been altered.",
			errInput: "Please fill in all the fields.",
			errHex: "The expected HMAC must be a valid hex string.",
		},
		vi: {
			title: "Xác thực chữ ký HMAC",
			lblMessage: "Nhập thông điệp / Dữ liệu",
			lblSecretKey: "Khóa bí mật (Secret Key)",
			lblExpected: "Mã HMAC mong đợi (định dạng Hex)",
			lblAlgo: "Thuật toán băm",
			btnVerify: "Xác thực chữ ký",
			lblResult: "Trạng thái xác thực",
			match: "HỢP LỆ: Chữ ký HMAC được tính toán trùng khớp hoàn toàn với mã mong đợi!",
			mismatch: "KHÔNG HỢP LỆ: Chữ ký HMAC không khớp. Khóa hoặc dữ liệu đã bị sửa đổi.",
			errInput: "Vui lòng nhập đầy đủ các trường thông tin.",
			errHex: "Mã HMAC mong đợi phải ở định dạng Hex hợp lệ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleVerify = async () => {
		if (!message.trim() || !secretKey.trim() || !expectedHmac.trim()) {
			setError(t.errInput);
			setIsValid(null);
			return;
		}

		// Basic hex validation
		const hexRegex = /^[0-9a-fA-F]+$/;
		const cleanExpected = expectedHmac.trim().replace(/\s+/g, "");
		if (!hexRegex.test(cleanExpected)) {
			setError(t.errHex);
			setIsValid(null);
			return;
		}

		setError(null);
		setCalculating(true);

		try {
			const enc = new TextEncoder();
			// Import key
			const key = await crypto.subtle.importKey(
				"raw",
				enc.encode(secretKey),
				{
					name: "HMAC",
					hash: hashAlgo,
				},
				false,
				["sign"],
			);

			// Calculate HMAC
			const calculatedBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(message));

			// Convert to hex
			const calculatedHex = Array.from(new Uint8Array(calculatedBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			setIsValid(calculatedHex.toLowerCase() === cleanExpected.toLowerCase());
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Verification failed." : "Lỗi trong quá trình xác thực.");
		} finally {
			setCalculating(false);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Inputs */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Algorithm */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblAlgo}</label>
						<select
							class="input w-full"
							value={hashAlgo}
							onChange={(e) => setHashAlgo((e.target as HTMLSelectElement).value as any)}
						>
							<option value="SHA-256">HMAC-SHA256</option>
							<option value="SHA-512">HMAC-SHA512</option>
							<option value="SHA-384">HMAC-SHA384</option>
							<option value="SHA-1">HMAC-SHA1</option>
						</select>
					</div>

					{/* Secret Key */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblSecretKey}</label>
						<input
							type="password"
							class="input w-full"
							value={secretKey}
							onInput={(e) => setSecretKey((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Expected HMAC */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblExpected}</label>
						<input
							type="text"
							class="input w-full font-mono text-xs"
							value={expectedHmac}
							onInput={(e) => setExpectedHmac((e.target as HTMLInputElement).value)}
						/>
					</div>

					<button
						class="btn-primary w-full py-2.5 mt-2"
						onClick={handleVerify}
						disabled={calculating}
					>
						{calculating ? "Calculating..." : t.btnVerify}
					</button>
				</div>

				{/* Results dashboard */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{isValid !== null && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblResult}
							</h4>
							<div
								class={`p-4 rounded-lg text-body-sm font-bold border ${
									isValid
										? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald"
										: "bg-accent-rose/10 border-accent-rose/30 text-accent-rose"
								}`}
							>
								{isValid ? t.match : t.mismatch}
							</div>
						</div>
					)}

					{/* Message inputs area */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblMessage}</label>
						<textarea
							class="input w-full h-36 font-mono text-body-sm"
							value={message}
							onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
