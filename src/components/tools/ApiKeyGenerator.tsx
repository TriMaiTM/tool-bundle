import { useEffect, useState } from "preact/hooks";

type PresetType = "stripe_live" | "stripe_test" | "openai" | "github" | "npm" | "custom";

export default function ApiKeyGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [preset, setPreset] = useState<PresetType>("stripe_live");
	const [customPrefix, setCustomPrefix] = useState("api_key_");
	const [length, setLength] = useState(32);
	const [count, setCount] = useState(5);
	const [separator, setSeparator] = useState<"none" | "underscore" | "dash">("none");
	const [keys, setKeys] = useState<string[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);

	const t = {
		en: {
			title: "API Key Generator",
			desc: "Generate production-grade formatted API keys and secret tokens client-side. Useful for bootstrapping project mock databases or designing token schemes.",
			lblPreset: "Key Format Preset",
			lblPrefix: "Custom Prefix",
			lblLength: "Secret String Length",
			lblCount: "Keys to Generate",
			lblSeparator: "Separator",
			btnGenerate: "Generate API Keys",
			lblKeys: "Generated API Keys",
			copyAll: "Copy All",
			copied: "Copied!",
			copy: "Copy",
			stripeLive: "Stripe Live Key (sk_live_)",
			stripeTest: "Stripe Test Key (sk_test_)",
			openai: "OpenAI API Key (sk-proj-)",
			github: "GitHub PAT (ghp_)",
			npm: "npm Registry Token (npm_)",
			custom: "Custom Pattern",
			sepNone: "None",
			sepUnderscore: "Underscore (_)",
			sepDash: "Dash (-)",
		},
		vi: {
			title: "Trình tạo mã API Key",
			desc: "Tạo các mã API Key định dạng chuẩn và mã bí mật chạy hoàn toàn trên client. Tiện lợi cho việc thiết kế mô hình hoặc dữ liệu giả lập.",
			lblPreset: "Mẫu định dạng",
			lblPrefix: "Tiền tố tùy chỉnh",
			lblLength: "Độ dài chuỗi bí mật",
			lblCount: "Số lượng mã cần tạo",
			lblSeparator: "Ký tự phân tách",
			btnGenerate: "Tạo các mã API Keys",
			lblKeys: "Mã API Keys đã tạo",
			copyAll: "Sao chép tất cả",
			copied: "Đã chép!",
			copy: "Sao chép",
			stripeLive: "Stripe Live Key (sk_live_)",
			stripeTest: "Stripe Test Key (sk_test_)",
			openai: "OpenAI API Key (sk-proj-)",
			github: "GitHub PAT (ghp_)",
			npm: "npm Registry Token (npm_)",
			custom: "Tự định nghĩa",
			sepNone: "Không chia",
			sepUnderscore: "Dấu gạch dưới (_)",
			sepDash: "Dấu gạch ngang (-)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const generateKeys = () => {
		const result: string[] = [];
		const base62Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		let prefixStr = "";
		if (preset === "stripe_live") prefixStr = "sk_live";
		else if (preset === "stripe_test") prefixStr = "sk_test";
		else if (preset === "openai") prefixStr = "sk-proj";
		else if (preset === "github") prefixStr = "ghp";
		else if (preset === "npm") prefixStr = "npm";
		else prefixStr = customPrefix.trim();

		const sepChar = separator === "underscore" ? "_" : separator === "dash" ? "-" : "";

		for (let c = 0; c < count; c++) {
			let secret = "";
			const bytes = new Uint8Array(length);
			crypto.getRandomValues(bytes);
			for (let i = 0; i < length; i++) {
				secret += base62Chars[bytes[i] % 62];
			}

			// Assemble key
			let key = "";
			if (prefixStr) {
				key = `${prefixStr}${sepChar}${secret}`;
			} else {
				key = secret;
			}
			result.push(key);
		}

		setKeys(result);
		setCopiedIndex(null);
		setCopiedAll(false);
	};

	useEffect(() => {
		generateKeys();
	}, [preset, customPrefix, length, count, separator]);

	const handleCopy = (keyVal: string, index: number) => {
		navigator.clipboard.writeText(keyVal);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	};

	const handleCopyAll = () => {
		navigator.clipboard.writeText(keys.join("\n"));
		setCopiedAll(true);
		setTimeout(() => setCopiedAll(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings control panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Presets dropdown */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblPreset}</label>
						<select
							class="input w-full"
							value={preset}
							onChange={(e) => setPreset((e.target as HTMLSelectElement).value as PresetType)}
						>
							<option value="stripe_live">{t.stripeLive}</option>
							<option value="stripe_test">{t.stripeTest}</option>
							<option value="openai">{t.openai}</option>
							<option value="github">{t.github}</option>
							<option value="npm">{t.npm}</option>
							<option value="custom">{t.custom}</option>
						</select>
					</div>

					{/* Custom prefix */}
					{preset === "custom" && (
						<div class="space-y-1.5 animate-fadeIn">
							<label class="text-body-sm-strong text-ink block">{t.lblPrefix}</label>
							<input
								type="text"
								class="input w-full font-mono text-xs"
								value={customPrefix}
								onInput={(e) => setCustomPrefix((e.target as HTMLInputElement).value)}
								placeholder="e.g. app_secret_"
							/>
						</div>
					)}

					{/* Separator option */}
					{preset === "custom" && (
						<div class="space-y-1.5 animate-fadeIn">
							<label class="text-body-sm-strong text-ink block">{t.lblSeparator}</label>
							<select
								class="input w-full"
								value={separator}
								onChange={(e) => setSeparator((e.target as HTMLSelectElement).value as any)}
							>
								<option value="none">{t.sepNone}</option>
								<option value="underscore">{t.sepUnderscore}</option>
								<option value="dash">{t.sepDash}</option>
							</select>
						</div>
					)}

					{/* Secret length */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink block">{t.lblLength}</label>
							<span class="text-body-sm-strong text-primary font-mono">{length}</span>
						</div>
						<input
							type="range"
							min="16"
							max="128"
							step="1"
							class="w-full accent-primary"
							value={length}
							onInput={(e) => setLength(Number.parseInt((e.target as HTMLInputElement).value))}
						/>
					</div>

					{/* Keys quantity */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink block">{t.lblCount}</label>
							<span class="text-body-sm-strong text-primary font-mono">{count}</span>
						</div>
						<input
							type="range"
							min="1"
							max="50"
							step="1"
							class="w-full accent-primary"
							value={count}
							onInput={(e) => setCount(Number.parseInt((e.target as HTMLInputElement).value))}
						/>
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={generateKeys}>
						{t.btnGenerate}
					</button>
				</div>

				{/* Output list panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center justify-between border-b border-hairline pb-2 mb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.lblKeys}</h3>
						{keys.length > 1 && (
							<button class="btn-secondary py-1 px-3 text-xs" onClick={handleCopyAll}>
								{copiedAll ? t.copied : t.copyAll}
							</button>
						)}
					</div>

					<div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
						{keys.map((keyVal, index) => (
							<div
								key={index}
								class="bg-surface-soft p-3 rounded-lg border border-hairline flex items-center justify-between gap-4"
							>
								<code class="text-body-sm text-body-strong font-mono truncate select-all">
									{keyVal}
								</code>
								<button
									class="btn-secondary text-[10px] py-1 px-2.5 shrink-0"
									onClick={() => handleCopy(keyVal, index)}
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
