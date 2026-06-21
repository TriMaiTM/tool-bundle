import { useEffect, useState } from "preact/hooks";

export default function SecurityAes() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
	const [text, setText] = useState("");
	const [password, setPassword] = useState("");
	const [salt, setSalt] = useState("toolbundle_salt");
	const [result, setResult] = useState("");
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "AES Text Encrypt/Decrypt",
			tabEncrypt: "Encrypt Text",
			tabDecrypt: "Decrypt Text",
			lblInputText: "Input Plaintext",
			lblInputCipher: "Input Ciphertext (Base64)",
			lblPassword: "Secret Password",
			lblSalt: "Salt / Key Identifier",
			btnProcess: "Process AES",
			lblResult: "Output Result",
			errInput: "Please enter input text and password.",
			errDecrypt: "Decryption failed! Ensure password and salt are correct.",
		},
		vi: {
			title: "Mã hóa & Giải mã AES",
			tabEncrypt: "Mã hóa văn bản",
			tabDecrypt: "Giải mã văn bản",
			lblInputText: "Văn bản gốc",
			lblInputCipher: "Văn bản mã hóa (Base64)",
			lblPassword: "Mật khẩu bí mật",
			lblSalt: "Muối (Salt)",
			btnProcess: "Thực hiện AES",
			lblResult: "Kết quả đầu ra",
			errInput: "Vui lòng nhập văn bản và mật khẩu.",
			errDecrypt: "Giải mã thất bại! Đảm bảo mật khẩu và muối chính xác.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Derive AES-GCM key from password and salt using PBKDF2
	const deriveKey = async (pass: string, saltStr: string): Promise<CryptoKey> => {
		const enc = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, [
			"deriveBits",
			"deriveKey",
		]);
		return crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt: enc.encode(saltStr),
				iterations: 100000,
				hash: "SHA-256",
			},
			keyMaterial,
			{ name: "AES-GCM", length: 256 },
			false,
			["encrypt", "decrypt"],
		);
	};

	const handleEncrypt = async () => {
		if (!text.trim() || !password.trim()) {
			setError(t.errInput);
			return;
		}
		setError(null);

		try {
			const key = await deriveKey(password, salt);
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const enc = new TextEncoder();
			const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));

			// Package result as iv_hex + ciphertext_base64
			const ivHex = Array.from(iv)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			const cipherBytes = new Uint8Array(encrypted);
			let binary = "";
			for (let i = 0; i < cipherBytes.length; i++) {
				binary += String.fromCharCode(cipherBytes[i]);
			}
			const base64Cipher = btoa(binary);

			setResult(`${ivHex}:${base64Cipher}`);
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Encryption failed." : "Mã hóa thất bại.");
		}
	};

	const handleDecrypt = async () => {
		if (!text.trim() || !password.trim()) {
			setError(t.errInput);
			return;
		}
		setError(null);

		try {
			const parts = text.split(":");
			if (parts.length !== 2) {
				setError(t.errDecrypt);
				return;
			}

			const ivHex = parts[0];
			const base64Cipher = parts[1];

			if (ivHex.length !== 24) {
				setError(t.errDecrypt);
				return;
			}

			const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));
			const binary = atob(base64Cipher);
			const cipherBytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				cipherBytes[i] = binary.charCodeAt(i);
			}

			const key = await deriveKey(password, salt);
			const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);

			const dec = new TextDecoder();
			setResult(dec.decode(decrypted));
		} catch (err) {
			console.error(err);
			setError(t.errDecrypt);
		}
	};

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
						setText("");
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
						setText("");
						setResult("");
						setError(null);
					}}
				>
					{t.tabDecrypt}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					<div class="space-y-3">
						{/* Password */}
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblPassword}</label>
							<input
								type="password"
								class="input w-full"
								value={password}
								onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
							/>
						</div>

						{/* Salt */}
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblSalt}</label>
							<input
								type="text"
								class="input w-full font-mono text-xs"
								value={salt}
								onInput={(e) => setSalt((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					<button
						class="btn-primary w-full py-2.5 mt-2"
						onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
					>
						{t.btnProcess}
					</button>
				</div>

				{/* Input and output textareas */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					<div class="space-y-4">
						{/* Text area */}
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">
								{mode === "encrypt" ? t.lblInputText : t.lblInputCipher}
							</label>
							<textarea
								class="input w-full h-32 font-mono text-body-sm"
								value={text}
								onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>

						{/* Result */}
						{result && (
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblResult}</label>
								<div class="relative">
									<textarea
										readOnly
										class="input w-full h-32 font-mono text-body-sm bg-surface-soft"
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
		</div>
	);
}
