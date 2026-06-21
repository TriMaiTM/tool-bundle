import { useEffect, useState } from "preact/hooks";

declare global {
	interface Window {
		openpgp: any;
	}
}

export default function PgpTool() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"encrypt" | "decrypt" | "generate">("encrypt");
	const [libLoaded, setLibLoaded] = useState(false);

	// General inputs
	const [inputText, setInputText] = useState("");
	const [keyPem, setKeyPem] = useState("");
	const [result, setResult] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Key Generation inputs
	const [genName, setGenName] = useState("User");
	const [genEmail, setGenEmail] = useState("user@toolbundle");
	const [passphrase, setPassphrase] = useState("");
	const [generating, setGenerating] = useState(false);

	const t = {
		en: {
			title: "PGP Tool (Pretty Good Privacy)",
			tabEncrypt: "Encrypt",
			tabDecrypt: "Decrypt",
			tabGenerate: "Generate Keys",
			lblInputText: "Input Plaintext",
			lblInputCipher: "Input Armored Ciphertext",
			lblPublicKey: "PGP Public Key (Armored)",
			lblPrivateKey: "PGP Private Key (Armored)",
			btnEncrypt: "Encrypt Message",
			btnDecrypt: "Decrypt Message",
			btnGenerate: "Generate Key Pair",
			lblResult: "Output",
			loading: "Loading OpenPGP.js from secure CDN...",
			errInput: "Please provide the required text and keys.",
			errKey: "Failed to parse public/private key. Verify the key format.",
			errDecrypt:
				"Decryption failed. Ensure the private key matches and the passphrase is correct.",
			desc: "All PGP operations are executed 100% locally in your browser using the openpgpjs engine. Your private keys and messages never leave your machine.",
		},
		vi: {
			title: "Công cụ mã hóa PGP",
			tabEncrypt: "Mã hóa",
			tabDecrypt: "Giải mã",
			tabGenerate: "Tạo khóa PGP",
			lblInputText: "Văn bản gốc",
			lblInputCipher: "Văn bản mã hóa PGP (Armored)",
			lblPublicKey: "Khóa công khai PGP (Public Key - Armored)",
			lblPrivateKey: "Khóa riêng tư PGP (Private Key - Armored)",
			btnEncrypt: "Mã hóa tin nhắn",
			btnDecrypt: "Giải mã tin nhắn",
			btnGenerate: "Tạo cặp khóa PGP",
			lblResult: "Kết quả",
			loading: "Đang tải thư viện OpenPGP.js từ CDN bảo mật...",
			errInput: "Vui lòng nhập đầy đủ văn bản và khóa.",
			errKey: "Không thể đọc định dạng khóa PGP. Vui lòng kiểm tra lại.",
			errDecrypt: "Giải mã thất bại. Vui lòng kiểm tra lại khóa và mật khẩu giải mã.",
			desc: "Mọi hoạt động mã hóa PGP diễn ra trực tiếp 100% trong trình duyệt của bạn qua thư viện openpgpjs. Khóa riêng tư và thông điệp không bao giờ gửi qua internet.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}

		// Load OpenPGP.js dynamically
		if (window.openpgp) {
			setLibLoaded(true);
			return;
		}

		const script = document.createElement("script");
		script.src = "https://cdnjs.cloudflare.com/ajax/libs/openpgp/5.11.0/openpgp.min.js";
		script.async = true;
		script.onload = () => setLibLoaded(true);
		script.onerror = () => {
			setError(
				lang === "en"
					? "Failed to load OpenPGP library. Check network."
					: "Không thể tải thư viện OpenPGP. Vui lòng kiểm tra kết nối mạng.",
			);
		};
		document.body.appendChild(script);
	}, [lang]);

	const handleEncrypt = async () => {
		if (!inputText.trim() || !keyPem.trim()) {
			setError(t.errInput);
			return;
		}
		setError(null);
		setResult("");

		try {
			const openpgp = window.openpgp;
			const publicKeyObj = await openpgp.readKey({ armoredKey: keyPem.trim() });
			const message = await openpgp.createMessage({ text: inputText });

			const encrypted = await openpgp.encrypt({
				message,
				encryptionKeys: publicKeyObj,
			});

			setResult(encrypted as string);
		} catch (err) {
			console.error(err);
			setError(t.errKey);
		}
	};

	const handleDecrypt = async () => {
		if (!inputText.trim() || !keyPem.trim()) {
			setError(t.errInput);
			return;
		}
		setError(null);
		setResult("");

		try {
			const openpgp = window.openpgp;
			const message = await openpgp.readMessage({ armoredMessage: inputText.trim() });

			let privateKeyObj = await openpgp.readPrivateKey({ armoredKey: keyPem.trim() });
			if (passphrase) {
				privateKeyObj = await openpgp.decryptKey({
					privateKey: privateKeyObj,
					passphrase,
				});
			}

			const { data: decrypted } = await openpgp.decrypt({
				message,
				decryptionKeys: privateKeyObj,
			});

			setResult(decrypted as string);
		} catch (err) {
			console.error(err);
			setError(t.errDecrypt);
		}
	};

	const handleGenerateKeys = async () => {
		setGenerating(true);
		setError(null);
		setResult("");

		try {
			const openpgp = window.openpgp;
			const { privateKey, publicKey } = await openpgp.generateKey({
				type: "ecc", // ECC is faster and smaller than RSA
				curve: "ed25519",
				userIDs: [{ name: genName, email: genEmail }],
				passphrase: passphrase || undefined,
			});

			setResult(`--- PUBLIC KEY ---\n${publicKey}\n\n--- PRIVATE KEY ---\n${privateKey}`);
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Key generation failed." : "Tạo khóa PGP thất bại.");
		} finally {
			setGenerating(false);
		}
	};

	if (!libLoaded) {
		return <div class="p-6 text-center text-xs text-muted animate-pulse">{t.loading}</div>;
	}

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "encrypt"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setMode("encrypt");
						setInputText("");
						setKeyPem("");
						setResult("");
						setError(null);
					}}
				>
					{t.tabEncrypt}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "decrypt"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setMode("decrypt");
						setInputText("");
						setKeyPem("");
						setResult("");
						setError(null);
					}}
				>
					{t.tabDecrypt}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "generate"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setMode("generate");
						setResult("");
						setError(null);
					}}
				>
					{t.tabGenerate}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{mode === "generate" ? (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">Name (Tên)</label>
								<input
									type="text"
									class="input w-full"
									value={genName}
									onInput={(e) => setGenName((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">Email</label>
								<input
									type="email"
									class="input w-full"
									value={genEmail}
									onInput={(e) => setGenEmail((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">Passphrase (Optional)</label>
								<input
									type="password"
									class="input w-full"
									value={passphrase}
									onInput={(e) => setPassphrase((e.target as HTMLInputElement).value)}
								/>
							</div>
							<button
								class="btn-primary w-full py-2.5 mt-2"
								onClick={handleGenerateKeys}
								disabled={generating}
							>
								{generating ? "Generating..." : t.btnGenerate}
							</button>
						</div>
					) : (
						<div class="space-y-3">
							{/* Key PEM input */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">
									{mode === "encrypt" ? t.lblPublicKey : t.lblPrivateKey}
								</label>
								<textarea
									class="input w-full h-36 font-mono text-[9px]"
									placeholder={
										mode === "encrypt"
											? "-----BEGIN PGP PUBLIC KEY BLOCK-----"
											: "-----BEGIN PGP PRIVATE KEY BLOCK-----"
									}
									value={keyPem}
									onInput={(e) => setKeyPem((e.target as HTMLTextAreaElement).value)}
								/>
							</div>

							{mode === "decrypt" && (
								<div class="space-y-1.5">
									<label class="text-body-sm-strong text-ink block">
										Private Key Passphrase (If encrypted)
									</label>
									<input
										type="password"
										class="input w-full"
										value={passphrase}
										onInput={(e) => setPassphrase((e.target as HTMLInputElement).value)}
									/>
								</div>
							)}

							<button
								class="btn-primary w-full py-2.5 mt-2"
								onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
							>
								{mode === "encrypt" ? t.btnEncrypt : t.btnDecrypt}
							</button>
						</div>
					)}

					<p class="text-xs text-muted leading-relaxed pt-2 border-t border-hairline">{t.desc}</p>
				</div>

				{/* Inputs/outputs display */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{mode !== "generate" && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">
								{mode === "encrypt" ? t.lblInputText : t.lblInputCipher}
							</label>
							<textarea
								class="input w-full h-36 font-mono text-body-sm"
								value={inputText}
								onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>
					)}

					{result && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblResult}</label>
							<div class="relative">
								<textarea
									readOnly
									class="input w-full h-48 font-mono text-[10px] bg-surface-soft whitespace-pre"
									value={result}
								/>
								<button
									class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
									onClick={() => navigator.clipboard.writeText(result)}
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
