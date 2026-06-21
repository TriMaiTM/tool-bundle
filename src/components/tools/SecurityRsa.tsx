import { useEffect, useState } from "preact/hooks";

export default function SecurityRsa() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [keySize, setKeySize] = useState<1024 | 2048 | 4096>(2048);
	const [publicKeyPem, setPublicKeyPem] = useState("");
	const [privateKeyPem, setPrivateKeyPem] = useState("");
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "RSA Key Generator",
			lblSize: "Key Size (bits)",
			btnGenerate: "Generate Key Pair",
			generating: "Generating Key Pair...",
			lblPublicKey: "Public Key (PEM)",
			lblPrivateKey: "Private Key (PEM)",
			desc: "RSA keys are cryptographically generated client-side using the browser's Web Crypto API. The process takes longer for 4096-bit keys.",
		},
		vi: {
			title: "Tạo cặp khóa RSA",
			lblSize: "Độ dài khóa (bits)",
			btnGenerate: "Tạo cặp khóa",
			generating: "Đang tạo cặp khóa...",
			lblPublicKey: "Khóa công khai (Public Key - PEM)",
			lblPrivateKey: "Khóa riêng tư (Private Key - PEM)",
			desc: "Khóa RSA được tạo lập hoàn toàn trên trình duyệt bằng Web Crypto API. Quá trình tạo khóa 4096-bit có thể tốn vài giây.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Convert ArrayBuffer to PEM format
	const arrayBufferToPem = (buffer: ArrayBuffer, label: string): string => {
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		const base64 = btoa(binary);
		const formatted = base64.match(/.{1,64}/g)!.join("\n");
		return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
	};

	const handleGenerate = async () => {
		setGenerating(true);
		setError(null);
		setPublicKeyPem("");
		setPrivateKeyPem("");

		try {
			// Generate standard RSA-OAEP key pair
			const keyPair = await crypto.subtle.generateKey(
				{
					name: "RSA-OAEP",
					modulusLength: keySize,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256",
				},
				true,
				["encrypt", "decrypt"],
			);

			// Export keys to PKCS8/SPKI
			const pubBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
			const privBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

			setPublicKeyPem(arrayBufferToPem(pubBuffer, "PUBLIC KEY"));
			setPrivateKeyPem(arrayBufferToPem(privBuffer, "PRIVATE KEY"));
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Failed to generate keys." : "Không thể tạo khóa.");
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblSize}</label>
						<select
							class="input w-full"
							value={keySize}
							onChange={(e) => setKeySize(Number((e.target as HTMLSelectElement).value) as any)}
						>
							<option value="1024">1024 bits</option>
							<option value="2048">2048 bits (Recommended)</option>
							<option value="4096">4096 bits</option>
						</select>
					</div>

					<button
						class="btn-primary w-full py-2.5 mt-2"
						onClick={handleGenerate}
						disabled={generating}
					>
						{generating ? t.generating : t.btnGenerate}
					</button>

					<p class="text-xs text-muted leading-relaxed pt-2 border-t border-hairline">{t.desc}</p>
				</div>

				{/* Output PEM fields */}
				<div class="lg:col-span-8 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{publicKeyPem && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblPublicKey}</label>
							<div class="relative">
								<textarea
									readOnly
									class="input w-full h-36 font-mono text-[10px] bg-surface-soft whitespace-pre"
									value={publicKeyPem}
								/>
								<button
									class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
									onClick={() => navigator.clipboard.writeText(publicKeyPem)}
								>
									Copy
								</button>
							</div>
						</div>
					)}

					{privateKeyPem && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblPrivateKey}</label>
							<div class="relative">
								<textarea
									readOnly
									class="input w-full h-44 font-mono text-[10px] bg-surface-soft whitespace-pre"
									value={privateKeyPem}
								/>
								<button
									class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
									onClick={() => navigator.clipboard.writeText(privateKeyPem)}
								>
									Copy
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
