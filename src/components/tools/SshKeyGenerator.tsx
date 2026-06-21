import { useEffect, useState } from "preact/hooks";

function base64UrlToBuffer(b64url: string): Uint8Array {
	const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
	const pad = (4 - (b64.length % 4)) % 4;
	const padded = b64 + "=".repeat(pad);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export default function SshKeyGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [keyType, setKeyType] = useState<"rsa" | "ecdsa">("rsa");
	const [keySize, setKeySize] = useState<2048 | 4096>(2048);
	const [comment, setComment] = useState("user@toolbundle");
	const [publicKeyPem, setPublicKeyPem] = useState("");
	const [privateKeyPem, setPrivateKeyPem] = useState("");
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "SSH Key Generator",
			lblType: "Key Algorithm",
			lblSize: "Key Size (bits)",
			lblComment: "Key Comment / Label",
			btnGenerate: "Generate SSH Key",
			generating: "Generating Key Pair...",
			lblPublicKey: "SSH Public Key (authorized_keys format)",
			lblPrivateKey: "SSH Private Key (PEM format)",
			desc: "Generates secure SSH key pairs (RSA or ECDSA P-256) client-side. The public key is formatted for your server's authorized_keys file.",
		},
		vi: {
			title: "Tạo khóa SSH",
			lblType: "Thuật toán khóa",
			lblSize: "Độ dài khóa (bits)",
			lblComment: "Ghi chú khóa (Comment)",
			btnGenerate: "Tạo khóa SSH",
			generating: "Đang tạo khóa...",
			lblPublicKey: "Khóa công khai (Định dạng authorized_keys)",
			lblPrivateKey: "Khóa riêng tư (Định dạng PEM)",
			desc: "Tạo các cặp khóa SSH bảo mật (RSA hoặc ECDSA P-256) trực tiếp trên trình duyệt. Khóa công khai sẵn sàng để thêm vào tệp authorized_keys trên máy chủ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Convert RSA JWK to OpenSSH wire format
	const formatRsaSshPublicKey = (nB64: string, eB64: string, keyComment: string): string => {
		const n = base64UrlToBuffer(nB64);
		const e = base64UrlToBuffer(eB64);

		// Helper to write length prefix and bytes
		const writeBlock = (bytes: Uint8Array): Uint8Array => {
			const block = new Uint8Array(4 + bytes.length);
			new DataView(block.buffer).setUint32(0, bytes.length);
			block.set(bytes, 4);
			return block;
		};

		// Helper to write mpint
		const writeMpint = (bytes: Uint8Array): Uint8Array => {
			// If high bit is set, prepend a zero byte to keep it positive
			let outBytes = bytes;
			if ((bytes[0] & 0x80) !== 0) {
				const tmp = new Uint8Array(bytes.length + 1);
				tmp.set(bytes, 1);
				outBytes = tmp;
			}
			return writeBlock(outBytes);
		};

		const algoBlock = writeBlock(new TextEncoder().encode("ssh-rsa"));
		const eBlock = writeMpint(e);
		const nBlock = writeMpint(n);

		// Combine parts
		const totalLength = algoBlock.length + eBlock.length + nBlock.length;
		const finalBuffer = new Uint8Array(totalLength);
		finalBuffer.set(algoBlock, 0);
		finalBuffer.set(eBlock, algoBlock.length);
		finalBuffer.set(nBlock, algoBlock.length + eBlock.length);

		let binary = "";
		for (let i = 0; i < finalBuffer.length; i++) {
			binary += String.fromCharCode(finalBuffer[i]);
		}
		return `ssh-rsa ${btoa(binary)} ${keyComment}`;
	};

	// Convert ECDSA JWK to OpenSSH wire format
	const formatEcdsaSshPublicKey = (xB64: string, yB64: string, keyComment: string): string => {
		const x = base64UrlToBuffer(xB64);
		const y = base64UrlToBuffer(yB64);

		const writeBlock = (bytes: Uint8Array): Uint8Array => {
			const block = new Uint8Array(4 + bytes.length);
			new DataView(block.buffer).setUint32(0, bytes.length);
			block.set(bytes, 4);
			return block;
		};

		const algoBlock = writeBlock(new TextEncoder().encode("ecdsa-sha2-nistp256"));
		const curveBlock = writeBlock(new TextEncoder().encode("nistp256"));

		// Public key point Q: octet string [0x04] + X + Y
		const qKey = new Uint8Array(1 + x.length + y.length);
		qKey[0] = 0x04;
		qKey.set(x, 1);
		qKey.set(y, 1 + x.length);
		const qBlock = writeBlock(qKey);

		const totalLength = algoBlock.length + curveBlock.length + qBlock.length;
		const finalBuffer = new Uint8Array(totalLength);
		finalBuffer.set(algoBlock, 0);
		finalBuffer.set(curveBlock, algoBlock.length);
		finalBuffer.set(qBlock, algoBlock.length + curveBlock.length);

		let binary = "";
		for (let i = 0; i < finalBuffer.length; i++) {
			binary += String.fromCharCode(finalBuffer[i]);
		}
		return `ecdsa-sha2-nistp256 ${btoa(binary)} ${keyComment}`;
	};

	const handleGenerate = async () => {
		setGenerating(true);
		setError(null);
		setPublicKeyPem("");
		setPrivateKeyPem("");

		try {
			if (keyType === "rsa") {
				const keyPair = await crypto.subtle.generateKey(
					{
						name: "RSASSA-PKCS1-v1_5",
						modulusLength: keySize,
						publicExponent: new Uint8Array([1, 0, 1]),
						hash: "SHA-256",
					},
					true,
					["sign", "verify"],
				);

				const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
				const sshPub = formatRsaSshPublicKey(jwk.n!, jwk.e!, comment.trim());

				const privBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
				const bytes = new Uint8Array(privBuffer);
				let binary = "";
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				const privPem = `-----BEGIN RSA PRIVATE KEY-----\n${btoa(binary)
					.match(/.{1,64}/g)!
					.join("\n")}\n-----END RSA PRIVATE KEY-----`;

				setPublicKeyPem(sshPub);
				setPrivateKeyPem(privPem);
			} else {
				// ECDSA P-256
				const keyPair = await crypto.subtle.generateKey(
					{
						name: "ECDSA",
						namedCurve: "P-256",
					},
					true,
					["sign", "verify"],
				);

				const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
				const sshPub = formatEcdsaSshPublicKey(jwk.x!, jwk.y!, comment.trim());

				const privBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
				const bytes = new Uint8Array(privBuffer);
				let binary = "";
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				const privPem = `-----BEGIN EC PRIVATE KEY-----\n${btoa(binary)
					.match(/.{1,64}/g)!
					.join("\n")}\n-----END EC PRIVATE KEY-----`;

				setPublicKeyPem(sshPub);
				setPrivateKeyPem(privPem);
			}
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Failed to generate SSH key." : "Không thể tạo khóa SSH.");
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Key Type */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblType}</label>
						<select
							class="input w-full"
							value={keyType}
							onChange={(e) => setKeyType((e.target as HTMLSelectElement).value as any)}
						>
							<option value="rsa">RSA</option>
							<option value="ecdsa">ECDSA (P-256)</option>
						</select>
					</div>

					{/* RSA Size select */}
					{keyType === "rsa" && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblSize}</label>
							<select
								class="input w-full"
								value={keySize}
								onChange={(e) => setKeySize(Number((e.target as HTMLSelectElement).value) as any)}
							>
								<option value="2048">2048 bits</option>
								<option value="4096">4096 bits</option>
							</select>
						</div>
					)}

					{/* Key comment */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblComment}</label>
						<input
							type="text"
							class="input w-full font-mono text-xs"
							value={comment}
							onInput={(e) => setComment((e.target as HTMLInputElement).value)}
						/>
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

				{/* Key output area */}
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
									class="input w-full h-24 font-mono text-[10px] bg-surface-soft"
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
