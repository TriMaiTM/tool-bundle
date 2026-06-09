import { useCallback, useEffect, useState } from "preact/hooks";

export default function HmacGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [message, setMessage] = useState("Hello World");
	const [key, setKey] = useState("secret-key");
	const [algorithm, setAlgorithm] = useState("SHA-256");
	const [format, setFormat] = useState<"hex" | "base64">("hex");

	const [result, setResult] = useState("");
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "HMAC Hash Generator",
			lblMessage: "Input Message / Data",
			lblKey: "HMAC Key / Secret",
			lblAlgorithm: "Hash Algorithm",
			lblFormat: "Output Encoding",
			lblResult: "Computed HMAC Signature",
			btnCopy: "Copy HMAC",
			copied: "Copied!",
			clearBtn: "Clear",
			snippetsTitle: "Code Examples",
		},
		vi: {
			title: "Trình tạo mã băm HMAC",
			lblMessage: "Thông điệp đầu vào (Data)",
			lblKey: "Khóa bảo mật HMAC (Secret)",
			lblAlgorithm: "Thuật toán băm",
			lblFormat: "Định dạng đầu ra",
			lblResult: "Mã chữ ký HMAC tính toán",
			btnCopy: "Sao chép mã HMAC",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			snippetsTitle: "Ví dụ tích hợp mã nguồn",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const calculateHmac = useCallback(async () => {
		if (!message.trim() || !key.trim()) {
			setResult("");
			return;
		}

		let hashName = "SHA-256";
		if (algorithm === "SHA-1") hashName = "SHA-1";
		if (algorithm === "SHA-384") hashName = "SHA-384";
		if (algorithm === "SHA-512") hashName = "SHA-512";

		try {
			const enc = new TextEncoder();
			const keyBytes = enc.encode(key);
			const msgBytes = enc.encode(message);

			const cryptoKey = await crypto.subtle.importKey(
				"raw",
				keyBytes,
				{ name: "HMAC", hash: { name: hashName } },
				false,
				["sign"],
			);

			const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
			const sigBytes = new Uint8Array(signature);

			if (format === "hex") {
				const hex = Array.from(sigBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");
				setResult(hex);
			} else {
				let binary = "";
				for (let i = 0; i < sigBytes.byteLength; i++) {
					binary += String.fromCharCode(sigBytes[i]);
				}
				setResult(btoa(binary));
			}
		} catch {
			setResult("HMAC calculation failed.");
		}
	}, [message, key, algorithm, format]);

	useEffect(() => {
		calculateHmac();
	}, [calculateHmac]);

	const handleCopy = () => {
		if (!result) return;
		navigator.clipboard.writeText(result).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const getSnippetCode = (langName: "js" | "py" | "php"): string => {
		const lowerAlg = algorithm.replace("-", "").toLowerCase(); // sha256
		if (langName === "js") {
			return `// Node.js Crypto example
const crypto = require('crypto');
const hmac = crypto.createHmac('${lowerAlg}', '${key}')
                   .update('${message}')
                   .digest('${format === "hex" ? "hex" : "base64"}');
console.log(hmac);`;
		}
		if (langName === "py") {
			return `# Python hmac example
import hmac
import hashlib
import base64

key = b'${key}'
msg = b'${message}'
h = hmac.new(key, msg, hashlib.${lowerAlg})
result = ${format === "hex" ? "h.hexdigest()" : "base64.b64encode(h.digest()).decode('utf-8')"}
print(result)`;
		}
		if (langName === "php") {
			return `<?php
// PHP hash_hmac example
$key = '${key}';
$msg = '${message}';
$hmac = hash_hmac('${lowerAlg}', $msg, $key, ${format === "base64" ? "true" : "false"});
echo ${format === "base64" ? "base64_encode($hmac)" : "$hmac"};
?>`;
		}
		return "";
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configurations panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					{/* Message */}
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.lblMessage}</label>
						<textarea
							class="textarea font-mono text-body-sm w-full"
							style={{ minHeight: "100px" }}
							value={message}
							onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Key */}
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.lblKey}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={key}
							onInput={(e) => setKey((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Algorithm and Format */}
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblAlgorithm}</label>
							<select
								class="input w-full"
								value={algorithm}
								onChange={(e) => setAlgorithm((e.target as HTMLSelectElement).value)}
							>
								{["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((alg) => (
									<option key={alg} value={alg}>
										{alg}
									</option>
								))}
							</select>
						</div>
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblFormat}</label>
							<select
								class="input w-full"
								value={format}
								onChange={(e) => setFormat((e.target as HTMLSelectElement).value as any)}
							>
								<option value="hex">Hex (Base 16)</option>
								<option value="base64">Base64</option>
							</select>
						</div>
					</div>
				</div>

				{/* Output Panel */}
				<div class="lg:col-span-7 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-body-sm-strong text-ink">{t.lblResult}</span>
							<button
								class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
								onClick={handleCopy}
							>
								{copied ? t.copied : t.btnCopy}
							</button>
						</div>
						<textarea
							class="textarea font-mono text-body-sm w-full bg-surface-soft font-bold text-primary"
							style={{ minHeight: "80px" }}
							readOnly
							value={result}
						/>
					</div>

					{/* Integration code snippets */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold">{t.snippetsTitle}</h3>

						{/* Code Tabs */}
						<div class="space-y-4">
							<div class="space-y-1.5">
								<span class="text-[11px] font-bold text-muted uppercase">JavaScript (Node.js)</span>
								<pre class="bg-surface-soft p-3 rounded border border-hairline font-mono text-[10px] text-ink overflow-x-auto">
									{getSnippetCode("js")}
								</pre>
							</div>

							<div class="space-y-1.5">
								<span class="text-[11px] font-bold text-muted uppercase">Python</span>
								<pre class="bg-surface-soft p-3 rounded border border-hairline font-mono text-[10px] text-ink overflow-x-auto">
									{getSnippetCode("py")}
								</pre>
							</div>

							<div class="space-y-1.5">
								<span class="text-[11px] font-bold text-muted uppercase">PHP</span>
								<pre class="bg-surface-soft p-3 rounded border border-hairline font-mono text-[10px] text-ink overflow-x-auto">
									{getSnippetCode("php")}
								</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
