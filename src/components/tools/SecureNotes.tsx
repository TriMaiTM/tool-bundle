import { useEffect, useState } from "preact/hooks";

interface NotePayload {
	title: string;
	body: string;
	timestamp: number;
}

export default function SecureNotes() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

	// Encrypt state
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [password, setPassword] = useState("");
	const [encryptedResult, setEncryptedResult] = useState("");

	// Decrypt state
	const [cipherInput, setCipherInput] = useState("");
	const [decryptPassword, setDecryptPassword] = useState("");
	const [decryptedNote, setDecryptedNote] = useState<NotePayload | null>(null);

	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const t = {
		en: {
			title: "Secure Notes Encryptor",
			desc: "Write, encrypt, and store sensitive notes offline. Everything runs locally in your browser using secure AES-256 GCM.",
			tabEncrypt: "Write & Encrypt",
			tabDecrypt: "Decrypt Note",
			lblTitle: "Note Title (Optional)",
			lblContent: "Note Content",
			lblPassword: "Password (Key derivation)",
			lblResult: "Encrypted Package Data (Save this securely)",
			btnEncrypt: "Encrypt & Package Note",
			btnDecrypt: "Decrypt Package",
			errInput: "Please write some note content and enter a security password.",
			errDecrypt:
				"Decryption failed! The password might be wrong or the data package is corrupted.",
			lblDecryptedTitle: "Note Title",
			lblDecryptedContent: "Note Content",
			btnDownloadEnc: "Download Encrypted File (.enc)",
			btnUploadEnc: "Upload .enc File",
			successEncrypt: "Note encrypted successfully!",
			successDecrypt: "Note decrypted successfully!",
			lblCreated: "Created",
			placeholderTitle: "e.g. My Bank Credentials",
			placeholderContent: "Write your private information here...",
			placeholderCipher: "Paste your encrypted note data package here...",
		},
		vi: {
			title: "Mã hóa ghi chú bảo mật",
			desc: "Viết, mã hóa và lưu trữ ghi chú nhạy cảm offline. Tất cả diễn ra trên trình duyệt với mã hóa AES-256 GCM.",
			tabEncrypt: "Viết & Mã hóa",
			tabDecrypt: "Giải mã ghi chú",
			lblTitle: "Tiêu đề ghi chú (Không bắt buộc)",
			lblContent: "Nội dung ghi chú",
			lblPassword: "Mật khẩu bảo mật",
			lblResult: "Gói dữ liệu mã hóa (Hãy lưu trữ an toàn)",
			btnEncrypt: "Mã hóa & Đóng gói ghi chú",
			btnDecrypt: "Giải mã gói dữ liệu",
			errInput: "Vui lòng viết nội dung ghi chú và nhập mật khẩu bảo mật.",
			errDecrypt: "Giải mã thất bại! Có thể mật khẩu sai hoặc gói dữ liệu bị lỗi.",
			lblDecryptedTitle: "Tiêu đề ghi chú",
			lblDecryptedContent: "Nội dung ghi chú",
			btnDownloadEnc: "Tải xuống tệp mã hóa (.enc)",
			btnUploadEnc: "Tải lên tệp .enc",
			successEncrypt: "Ghi chú đã được mã hóa thành công!",
			successDecrypt: "Giải mã ghi chú thành công!",
			lblCreated: "Được tạo lúc",
			placeholderTitle: "Ví dụ: Tài khoản ngân hàng",
			placeholderContent: "Nhập thông tin riêng tư của bạn tại đây...",
			placeholderCipher: "Dán gói dữ liệu ghi chú đã mã hóa tại đây...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Derive CryptoKey using PBKDF2
	const deriveKey = async (pass: string, salt: Uint8Array): Promise<CryptoKey> => {
		const enc = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, [
			"deriveBits",
			"deriveKey",
		]);
		return crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt,
				iterations: 150000,
				hash: "SHA-256",
			},
			keyMaterial,
			{ name: "AES-GCM", length: 256 },
			false,
			["encrypt", "decrypt"],
		);
	};

	const handleEncrypt = async () => {
		if (!body.trim() || !password.trim()) {
			setError(t.errInput);
			setSuccess(null);
			return;
		}
		setError(null);
		setSuccess(null);

		try {
			const salt = crypto.getRandomValues(new Uint8Array(16));
			const iv = crypto.getRandomValues(new Uint8Array(12));

			const key = await deriveKey(password, salt);

			const payload: NotePayload = {
				title: title.trim(),
				body: body.trim(),
				timestamp: Date.now(),
			};

			const enc = new TextEncoder();
			const encrypted = await crypto.subtle.encrypt(
				{ name: "AES-GCM", iv },
				key,
				enc.encode(JSON.stringify(payload)),
			);

			// Convert salt, iv, and ciphertext to hex or base64
			const saltHex = Array.from(salt)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			const ivHex = Array.from(iv)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			const cipherBytes = new Uint8Array(encrypted);
			let binary = "";
			for (let i = 0; i < cipherBytes.length; i++) {
				binary += String.fromCharCode(cipherBytes[i]);
			}
			const base64Cipher = btoa(binary);

			// Combined payload
			const finalData = `${saltHex}:${ivHex}:${base64Cipher}`;
			setEncryptedResult(finalData);
			setSuccess(t.successEncrypt);
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Encryption failed." : "Mã hóa thất bại.");
		}
	};

	const handleDecrypt = async (providedCipher?: string) => {
		const cipherToUse = providedCipher || cipherInput;
		if (!cipherToUse.trim() || !decryptPassword.trim()) {
			setError(t.errInput);
			setDecryptedNote(null);
			setSuccess(null);
			return;
		}
		setError(null);
		setSuccess(null);

		try {
			const parts = cipherToUse.trim().split(":");
			if (parts.length !== 3) {
				setError(t.errDecrypt);
				setDecryptedNote(null);
				return;
			}

			const saltHex = parts[0];
			const ivHex = parts[1];
			const base64Cipher = parts[2];

			if (saltHex.length !== 32 || ivHex.length !== 24) {
				setError(t.errDecrypt);
				setDecryptedNote(null);
				return;
			}

			const salt = new Uint8Array(
				saltHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
			);
			const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));

			const binary = atob(base64Cipher);
			const cipherBytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				cipherBytes[i] = binary.charCodeAt(i);
			}

			const key = await deriveKey(decryptPassword, salt);
			const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);

			const dec = new TextDecoder();
			const payload: NotePayload = JSON.parse(dec.decode(decrypted));
			setDecryptedNote(payload);
			setSuccess(t.successDecrypt);
		} catch (err) {
			console.error(err);
			setError(t.errDecrypt);
			setDecryptedNote(null);
		}
	};

	const downloadEncryptedFile = () => {
		if (!encryptedResult) return;
		const blob = new Blob([encryptedResult], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title.trim() ? title.trim().toLowerCase().replace(/\s+/g, "_") : "secure_note"}.enc`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleFileUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			if (text) {
				if (mode === "decrypt") {
					setCipherInput(text);
				} else {
					setMode("decrypt");
					setCipherInput(text);
				}
			}
		};
		reader.readAsText(file);
	};

	return (
		<div class="space-y-6">
			{/* Tab Selector */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "encrypt"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setMode("encrypt");
						setError(null);
						setSuccess(null);
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
						setError(null);
						setSuccess(null);
					}}
				>
					{t.tabDecrypt}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings / Actions Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{mode === "encrypt" ? (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblPassword}</label>
								<input
									type="password"
									class="input w-full"
									value={password}
									onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
									placeholder="••••••••"
								/>
							</div>

							<button class="btn-primary w-full py-2.5 mt-2" onClick={handleEncrypt}>
								{t.btnEncrypt}
							</button>

							<div class="border-t border-hairline pt-3 mt-3">
								<label class="btn-secondary w-full text-center block cursor-pointer py-2">
									{t.btnUploadEnc}
									<input type="file" accept=".enc" class="hidden" onChange={handleFileUpload} />
								</label>
							</div>
						</div>
					) : (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblPassword}</label>
								<input
									type="password"
									class="input w-full"
									value={decryptPassword}
									onInput={(e) => setDecryptPassword((e.target as HTMLInputElement).value)}
									placeholder="••••••••"
								/>
							</div>

							<button class="btn-primary w-full py-2.5 mt-2" onClick={() => handleDecrypt()}>
								{t.btnDecrypt}
							</button>

							<div class="border-t border-hairline pt-3 mt-3">
								<label class="btn-secondary w-full text-center block cursor-pointer py-2">
									{t.btnUploadEnc}
									<input type="file" accept=".enc" class="hidden" onChange={handleFileUpload} />
								</label>
							</div>
						</div>
					)}
				</div>

				{/* Note editor / Result View */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{success && (
						<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 text-body-sm text-accent-emerald font-bold">
							{success}
						</div>
					)}

					{mode === "encrypt" ? (
						<div class="space-y-4">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblTitle}</label>
								<input
									type="text"
									class="input w-full"
									value={title}
									onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
									placeholder={t.placeholderTitle}
								/>
							</div>

							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblContent}</label>
								<textarea
									class="input w-full h-48 text-body-sm"
									value={body}
									onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
									placeholder={t.placeholderContent}
								/>
							</div>

							{encryptedResult && (
								<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
									<label class="text-body-sm-strong text-ink block">{t.lblResult}</label>
									<div class="relative">
										<textarea
											readOnly
											class="input w-full h-24 font-mono text-body-sm bg-surface-soft"
											value={encryptedResult}
										/>
										<button
											class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
											onClick={() => navigator.clipboard.writeText(encryptedResult)}
										>
											Copy
										</button>
									</div>

									<button class="btn-secondary w-full py-2" onClick={downloadEncryptedFile}>
										{t.btnDownloadEnc}
									</button>
								</div>
							)}
						</div>
					) : (
						<div class="space-y-4">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.placeholderCipher}</label>
								<textarea
									class="input w-full h-32 font-mono text-body-sm"
									value={cipherInput}
									onInput={(e) => setCipherInput((e.target as HTMLTextAreaElement).value)}
									placeholder={t.placeholderCipher}
								/>
							</div>

							{decryptedNote && (
								<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
									<div>
										<span class="text-caption-uppercase text-muted">{t.lblCreated}</span>
										<span class="text-body-xs text-muted ml-2">
											{new Date(decryptedNote.timestamp).toLocaleString()}
										</span>
									</div>

									{decryptedNote.title && (
										<div class="space-y-1.5 border-b border-hairline pb-2">
											<label class="text-caption-uppercase text-muted block">
												{t.lblDecryptedTitle}
											</label>
											<div class="text-body-strong text-ink font-bold">{decryptedNote.title}</div>
										</div>
									)}

									<div class="space-y-1.5">
										<label class="text-caption-uppercase text-muted block">
											{t.lblDecryptedContent}
										</label>
										<div class="bg-surface-soft p-4 rounded-lg text-body-sm text-body whitespace-pre-wrap font-mono">
											{decryptedNote.body}
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
