import { useCallback, useEffect, useState } from "preact/hooks";

export default function NanoidGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const alphabets = {
		default: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",
		numbers: "0123456789",
		lowercase: "abcdefghijklmnopqrstuvwxyz0123456789",
		uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		hex: "0123456789abcdef",
	};

	const [alphabetType, setAlphabetType] = useState<keyof typeof alphabets | "custom">("default");
	const [customAlphabet, setCustomAlphabet] = useState("abcde12345");
	const [idLength, setIdLength] = useState(21);
	const [count, setCount] = useState(5);

	const [outputList, setOutputList] = useState<string[]>([]);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "NanoID Generator",
			lblAlphabet: "Alphabet Characters",
			lblLength: "ID Length",
			lblCount: "Number of IDs to generate",
			btnGenerate: "Generate IDs",
			btnCopy: "Copy All",
			copied: "Copied!",
			lblOutput: "Generated NanoIDs",
			optDefault: "Standard URL Safe (A-Z, a-z, 0-9, _, -)",
			optNumbers: "Numbers Only (0-9)",
			optLowercase: "Lowercase Alphanumeric",
			optUppercase: "Uppercase Alphanumeric",
			optHex: "Hexadecimal (0-f)",
			optCustom: "Custom Character Set",
			lblCustomChar: "Custom Characters",
			collisionTitle: "Collision Estimation (at 1000 IDs/sec)",
			collisionMsg: "With these settings, it would take approximately",
			collisionEnd: "to have a 1% probability of at least one collision.",
		},
		vi: {
			title: "Trình tạo mã NanoID",
			lblAlphabet: "Bảng ký tự tạo mã",
			lblLength: "Độ dài mã (Length)",
			lblCount: "Số lượng mã cần tạo",
			btnGenerate: "Tạo danh sách mã",
			btnCopy: "Sao chép tất cả",
			copied: "Đã copy!",
			lblOutput: "Các mã NanoID tạo ra",
			optDefault: "Mặc định (Ký tự URL Safe)",
			optNumbers: "Chỉ chữ số (0-9)",
			optLowercase: "Chữ thường và chữ số",
			optUppercase: "Chữ hoa và chữ số",
			optHex: "Hệ thập lục phân (Hex)",
			optCustom: "Bảng ký tự tùy chỉnh",
			lblCustomChar: "Nhập các ký tự tùy chỉnh",
			collisionTitle: "Dự tính trùng lặp (tốc độ 1000 mã/giây)",
			collisionMsg: "Với cấu hình này, sẽ mất khoảng",
			collisionEnd: "để có 1% khả năng xảy ra ít nhất một vụ trùng lặp.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleGenerate = useCallback(() => {
		const selectedAlphabet = alphabetType === "custom" ? customAlphabet : alphabets[alphabetType];
		if (!selectedAlphabet) return;

		const results: string[] = [];
		const bytes = new Uint8Array(idLength);

		for (let i = 0; i < count; i++) {
			crypto.getRandomValues(bytes);
			let id = "";
			for (let j = 0; j < idLength; j++) {
				id += selectedAlphabet[bytes[j] % selectedAlphabet.length];
			}
			results.push(id);
		}

		setOutputList(results);
	}, [alphabetType, customAlphabet, idLength, count]);

	useEffect(() => {
		handleGenerate();
	}, [handleGenerate]);

	const handleCopy = () => {
		if (outputList.length === 0) return;
		navigator.clipboard.writeText(outputList.join("\n")).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	// Approximate calculation for collision probability
	// Formula estimation for 1% probability: N ≈ sqrt(2 * ln(1/(1-p)) * Alphabet^Length)
	const getCollisionTime = (): string => {
		const alpha = alphabetType === "custom" ? customAlphabet : alphabets[alphabetType];
		const n = alpha?.length || 10;
		const l = idLength;

		// Total combinations = n^l
		const combinations = n ** l;

		if (combinations === Number.POSITIVE_INFINITY || l > 20) {
			return lang === "en" ? "trillions of years" : "hàng nghìn tỷ năm";
		}

		// Number of generations for 1% collision probability
		// p = 0.01
		// 2 * ln(1/0.99) ≈ 0.0201
		const generations = Math.sqrt(0.0201 * combinations);

		// Generations at 1000 IDs per second
		const seconds = generations / 1000;
		if (seconds < 60) {
			return lang === "en" ? `${Math.round(seconds)} seconds` : `${Math.round(seconds)} giây`;
		}
		const minutes = seconds / 60;
		if (minutes < 60) {
			return lang === "en" ? `${Math.round(minutes)} minutes` : `${Math.round(minutes)} phút`;
		}
		const hours = minutes / 60;
		if (hours < 24) {
			return lang === "en" ? `${Math.round(hours)} hours` : `${Math.round(hours)} giờ`;
		}
		const days = hours / 24;
		if (days < 365) {
			return lang === "en" ? `${Math.round(days)} days` : `${Math.round(days)} ngày`;
		}
		const years = days / 365;
		return lang === "en" ? `${Math.round(years)} years` : `${Math.round(years)} năm`;
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Builder settings */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					{/* Alphabet selector */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-1.5">{t.lblAlphabet}</label>
						<select
							class="input w-full"
							value={alphabetType}
							onChange={(e) => setAlphabetType((e.target as HTMLSelectElement).value as any)}
						>
							<option value="default">{t.optDefault}</option>
							<option value="numbers">{t.optNumbers}</option>
							<option value="lowercase">{t.optLowercase}</option>
							<option value="uppercase">{t.optUppercase}</option>
							<option value="hex">{t.optHex}</option>
							<option value="custom">{t.optCustom}</option>
						</select>
					</div>

					{/* Custom characters field */}
					{alphabetType === "custom" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-1.5">{t.lblCustomChar}</label>
							<input
								type="text"
								class="input w-full font-mono text-body-sm"
								value={customAlphabet}
								onInput={(e) => setCustomAlphabet((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* ID length */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-1.5">
							{t.lblLength} ({idLength})
						</label>
						<input
							type="range"
							class="w-full accent-primary"
							min="1"
							max="128"
							value={idLength}
							onChange={(e) => setIdLength(Number.parseInt((e.target as HTMLInputElement).value))}
						/>
					</div>

					{/* Count */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-1.5">{t.lblCount}</label>
						<input
							type="number"
							class="input w-full font-bold"
							min="1"
							max="100"
							value={count}
							onInput={(e) =>
								setCount(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
							}
						/>
					</div>

					<button class="btn-primary w-full py-2.5" onClick={handleGenerate}>
						{t.btnGenerate}
					</button>
				</div>

				{/* Output Panel */}
				<div class="lg:col-span-7 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-body-sm-strong text-ink">{t.lblOutput}</span>
							<button
								class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
								onClick={handleCopy}
							>
								{copied ? t.copied : t.btnCopy}
							</button>
						</div>
						<textarea
							class="textarea font-mono text-body-sm w-full bg-surface-soft font-bold text-primary"
							style={{ minHeight: "180px" }}
							readOnly
							value={outputList.join("\n")}
						/>
					</div>

					{/* Collision Probability Analysis */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<h4 class="text-body-strong text-ink font-bold">{t.collisionTitle}</h4>
						<p class="text-body-sm text-muted leading-relaxed">
							{t.collisionMsg} <strong class="text-primary">{getCollisionTime()}</strong>{" "}
							{t.collisionEnd}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
