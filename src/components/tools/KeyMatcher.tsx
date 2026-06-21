import { useEffect, useState } from "preact/hooks";

export default function KeyMatcher() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [publicKeyPem, setPublicKeyPem] = useState("");
	const [privateKeyPem, setPrivateKeyPem] = useState("");
	const [checking, setChecking] = useState(false);
	const [matchResult, setMatchResult] = useState<"match" | "mismatch" | null>(null);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Public / Private Key Matcher",
			lblPublicKey: "Enter Public Key (PEM)",
			lblPrivateKey: "Enter Private Key (PEM)",
			btnVerify: "Check Match Status",
			verifying: "Verifying cryptographic signatures...",
			lblResult: "Verification Status",
			matching: "MATCH: Public Key and Private Key form a valid cryptographic pair!",
			mismatching: "MISMATCH: The keys do not belong to the same pair.",
			errParse: "Invalid PEM key format. Ensure they are valid RSA keys.",
		},
		vi: {
			title: "Kiểm tra sự trùng khớp khóa",
			lblPublicKey: "Nhập Khóa công khai (Public Key - PEM)",
			lblPrivateKey: "Nhập Khóa riêng tư (Private Key - PEM)",
			btnVerify: "Kiểm tra tính trùng khớp",
			verifying: "Đang kiểm tra chữ ký mã hóa...",
			lblResult: "Trạng thái xác thực",
			matching: "TRÙNG KHỚP: Cặp khóa công khai và riêng tư này hợp lệ!",
			mismatching: "KHÔNG TRÙNG KHỚP: Hai khóa này không đi cùng cặp.",
			errParse: "Định dạng khóa PEM không hợp lệ. Vui lòng kiểm tra lại cấu trúc khóa RSA.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Parse PEM helper
	const pemToArrayBuffer = (pem: string, label: string): ArrayBuffer => {
		const lines = pem.trim().split("\n");
		const body = lines
			.filter((line) => !line.startsWith("-----BEGIN") && !line.startsWith("-----END"))
			.join("")
			.replace(/\s+/g, "");
		const binary = atob(body);
		const buffer = new ArrayBuffer(binary.length);
		const view = new Uint8Array(buffer);
		for (let i = 0; i < binary.length; i++) {
			view[i] = binary.charCodeAt(i);
		}
		return buffer;
	};

	const handleVerify = async () => {
		if (!publicKeyPem.trim() || !privateKeyPem.trim()) {
			setError(t.errParse);
			return;
		}

		setChecking(true);
		setError(null);
		setMatchResult(null);

		try {
			// Extract binary keys
			const pubBuffer = pemToArrayBuffer(publicKeyPem, "PUBLIC KEY");
			const privBuffer = pemToArrayBuffer(privateKeyPem, "PRIVATE KEY");

			// Import keys
			const pubKey = await crypto.subtle.importKey(
				"spki",
				pubBuffer,
				{
					name: "RSASSA-PKCS1-v1_5",
					hash: "SHA-256",
				},
				true,
				["verify"],
			);

			const privKey = await crypto.subtle.importKey(
				"pkcs8",
				privBuffer,
				{
					name: "RSASSA-PKCS1-v1_5",
					hash: "SHA-256",
				},
				true,
				["sign"],
			);

			// Test signature
			const testData = new TextEncoder().encode("toolbundle_key_matcher_test_data");
			const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privKey, testData);

			const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", pubKey, signature, testData);

			setMatchResult(isValid ? "match" : "mismatch");
		} catch (err) {
			console.error(err);
			setError(t.errParse);
		} finally {
			setChecking(false);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
				{/* Inputs panel */}
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Public Key */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblPublicKey}</label>
						<textarea
							class="input w-full h-36 font-mono text-[10px]"
							placeholder="-----BEGIN PUBLIC KEY-----"
							value={publicKeyPem}
							onInput={(e) => setPublicKeyPem((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Private Key */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblPrivateKey}</label>
						<textarea
							class="input w-full h-36 font-mono text-[10px]"
							placeholder="-----BEGIN PRIVATE KEY-----"
							value={privateKeyPem}
							onInput={(e) => setPrivateKeyPem((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={handleVerify} disabled={checking}>
						{checking ? t.verifying : t.btnVerify}
					</button>
				</div>

				{/* Results pane */}
				<div class="space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{matchResult !== null && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblResult}
							</h4>
							<div
								class={`p-4 rounded-lg text-body-sm font-bold border ${
									matchResult === "match"
										? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald"
										: "bg-accent-rose/10 border-accent-rose/30 text-accent-rose"
								}`}
							>
								{matchResult === "match" ? t.matching : t.mismatching}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
