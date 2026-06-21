import { useEffect, useState } from "preact/hooks";

type TokenFormat = "hex" | "base64" | "base64url" | "base32" | "alphanumeric" | "ascii" | "custom";

function base32Encode(bytes: Uint8Array): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let bits = 0;
	let value = 0;
	let output = "";
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8) | bytes[i];
		bits += 8;
		while (bits >= 5) {
			output += alphabet[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) {
		output += alphabet[(value << (5 - bits)) & 31];
	}
	return output;
}

export default function RandomToken() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [format, setFormat] = useState<TokenFormat>("hex");
	const [length, setLength] = useState(32);
	const [count, setCount] = useState(5);
	const [customChars, setCustomChars] = useState(
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*",
	);
	const [tokens, setTokens] = useState<string[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);

	const t = {
		en: {
			title: "Secure Random Token Generator",
			desc: "Generate cryptographically secure random tokens, secrets, and keys of customizable types and lengths. Built using Web Crypto API.",
			lblFormat: "Token Format",
			lblLength: "Length (Characters / Bytes)",
			lblCount: "Generate Count",
			btnGenerate: "Generate Tokens",
			lblTokens: "Generated Tokens",
			copyAll: "Copy All",
			copied: "Copied!",
			copy: "Copy",
			customCharset: "Custom Character Set",
			optHex: "Hexadecimal (0-9, a-f)",
			optBase64: "Base64 Encoding",
			optBase64Url: "Base64URL (URL-safe)",
			optBase32: "Base32 Encoding",
			optAlphanumeric: "Alphanumeric (A-Z, a-z, 0-9)",
			optAscii: "Printable ASCII (Alphanumeric & Symbols)",
			optCustom: "Custom Character Set",
		},
		vi: {
			title: "Bộ sinh Token ngẫu nhiên",
			desc: "Tạo các token ngẫu nhiên bảo mật, khóa bí mật với độ dài và định dạng tùy chỉnh. Sử dụng Web Crypto API.",
			lblFormat: "Định dạng Token",
			lblLength: "Độ dài (Ký tự / Byte)",
			lblCount: "Số lượng tạo",
			btnGenerate: "Tạo Token ngẫu nhiên",
			lblTokens: "Token đã tạo",
			copyAll: "Sao chép tất cả",
			copied: "Đã chép!",
			copy: "Sao chép",
			customCharset: "Bộ ký tự tùy chỉnh",
			optHex: "Hexadecimal (Thập lục phân)",
			optBase64: "Mã hóa Base64",
			optBase64Url: "Base64URL (An toàn cho URL)",
			optBase32: "Mã hóa Base32",
			optAlphanumeric: "Chữ và Số (A-Z, a-z, 0-9)",
			optAscii: "ASCII đầy đủ (Chữ, số & Ký hiệu)",
			optCustom: "Bộ ký tự tùy chỉnh",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const generateTokens = () => {
		const result: string[] = [];
		const charsetAlphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charsetAscii =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~/`";

		for (let c = 0; c < count; c++) {
			let token = "";

			if (format === "hex") {
				const bytes = new Uint8Array(Math.ceil(length / 2));
				crypto.getRandomValues(bytes);
				token = Array.from(bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")
					.substring(0, length);
			} else if (format === "base64") {
				// Estimate bytes needed for character length
				const bytes = new Uint8Array(Math.ceil((length * 3) / 4));
				crypto.getRandomValues(bytes);
				let binary = "";
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				token = btoa(binary).substring(0, length);
			} else if (format === "base64url") {
				const bytes = new Uint8Array(Math.ceil((length * 3) / 4));
				crypto.getRandomValues(bytes);
				let binary = "";
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				token = btoa(binary)
					.replace(/\+/g, "-")
					.replace(/\//g, "_")
					.replace(/=/g, "")
					.substring(0, length);
			} else if (format === "base32") {
				const bytes = new Uint8Array(Math.ceil((length * 5) / 8));
				crypto.getRandomValues(bytes);
				token = base32Encode(bytes).substring(0, length);
			} else {
				let targetCharset = charsetAlphanumeric;
				if (format === "ascii") targetCharset = charsetAscii;
				if (format === "custom") targetCharset = customChars || charsetAlphanumeric;

				const bytes = new Uint8Array(length);
				crypto.getRandomValues(bytes);
				for (let i = 0; i < length; i++) {
					token += targetCharset[bytes[i] % targetCharset.length];
				}
			}

			result.push(token);
		}

		setTokens(result);
		setCopiedIndex(null);
		setCopiedAll(false);
	};

	useEffect(() => {
		generateTokens();
	}, [format, length, count, customChars]);

	const handleCopy = (token: string, index: number) => {
		navigator.clipboard.writeText(token);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	};

	const handleCopyAll = () => {
		navigator.clipboard.writeText(tokens.join("\n"));
		setCopiedAll(true);
		setTimeout(() => setCopiedAll(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Format selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblFormat}</label>
						<select
							class="input w-full"
							value={format}
							onChange={(e) => setFormat((e.target as HTMLSelectElement).value as TokenFormat)}
						>
							<option value="hex">{t.optHex}</option>
							<option value="base64">{t.optBase64}</option>
							<option value="base64url">{t.optBase64Url}</option>
							<option value="base32">{t.optBase32}</option>
							<option value="alphanumeric">{t.optAlphanumeric}</option>
							<option value="ascii">{t.optAscii}</option>
							<option value="custom">{t.optCustom}</option>
						</select>
					</div>

					{/* Custom character set configuration */}
					{format === "custom" && (
						<div class="space-y-1.5 animate-fadeIn">
							<label class="text-body-sm-strong text-ink block">{t.customCharset}</label>
							<input
								type="text"
								class="input w-full font-mono text-xs"
								value={customChars}
								onInput={(e) => setCustomChars((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Length input slider & text */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink block">{t.lblLength}</label>
							<span class="text-body-sm-strong text-primary font-mono">{length}</span>
						</div>
						<div class="flex gap-4 items-center">
							<input
								type="range"
								min="4"
								max="256"
								step="1"
								class="w-full accent-primary"
								value={length}
								onInput={(e) => setLength(Number.parseInt((e.target as HTMLInputElement).value))}
							/>
							<input
								type="number"
								min="4"
								max="512"
								class="input w-20 text-center font-mono text-body-sm"
								value={length}
								onChange={(e) =>
									setLength(Math.max(4, Number.parseInt((e.target as HTMLInputElement).value) || 4))
								}
							/>
						</div>
					</div>

					{/* Count input slider & text */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink block">{t.lblCount}</label>
							<span class="text-body-sm-strong text-primary font-mono">{count}</span>
						</div>
						<div class="flex gap-4 items-center">
							<input
								type="range"
								min="1"
								max="50"
								step="1"
								class="w-full accent-primary"
								value={count}
								onInput={(e) => setCount(Number.parseInt((e.target as HTMLInputElement).value))}
							/>
							<input
								type="number"
								min="1"
								max="100"
								class="input w-20 text-center font-mono text-body-sm"
								value={count}
								onChange={(e) =>
									setCount(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
								}
							/>
						</div>
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={generateTokens}>
						{t.btnGenerate}
					</button>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center justify-between border-b border-hairline pb-2 mb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.lblTokens}</h3>
						{tokens.length > 1 && (
							<button class="btn-secondary py-1 px-3 text-xs" onClick={handleCopyAll}>
								{copiedAll ? t.copied : t.copyAll}
							</button>
						)}
					</div>

					<div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
						{tokens.map((token, index) => (
							<div
								key={index}
								class="bg-surface-soft p-3 rounded-lg border border-hairline flex items-center justify-between gap-4"
							>
								<code class="text-body-sm text-body-strong font-mono truncate select-all">
									{token}
								</code>
								<button
									class="btn-secondary text-[10px] py-1 px-2.5 shrink-0"
									onClick={() => handleCopy(token, index)}
								>
									{copiedIndex === index ? t.copied : t.copy}
								</button>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
