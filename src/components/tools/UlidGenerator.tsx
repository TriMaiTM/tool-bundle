import { useCallback, useEffect, useState } from "preact/hooks";

export default function UlidGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [activeTab, setActiveTab] = useState<"generate" | "decode">("generate");

	// Generate configs
	const [count, setCount] = useState(5);
	const [useCustomTime, setUseCustomTime] = useState(false);
	const [customTimeVal, setCustomTimeVal] = useState(
		new Date()
			.toISOString()
			.substring(0, 16), // datetime-local format
	);
	const [lowercase, setLowercase] = useState(false);

	const [outputList, setOutputList] = useState<string[]>([]);
	const [copied, setCopied] = useState(false);

	// Decode configs
	const [decodeInput, setDecodeInput] = useState("");
	const [decodedTime, setDecodedTime] = useState<Date | null>(null);
	const [decodeError, setDecodeError] = useState<string | null>(null);

	const t = {
		en: {
			title: "ULID Generator & Decoder",
			tabGenerate: "Generate ULIDs",
			tabDecode: "Decode ULID",
			lblCount: "Number of ULIDs to generate",
			lblCustomTime: "Specify Custom Timestamp",
			lblLowercase: "Output in Lowercase",
			btnGenerate: "Generate ULIDs",
			btnCopy: "Copy All",
			copied: "Copied!",
			lblOutput: "Generated ULIDs",
			lblDecodeInput: "Enter ULID to extract timestamp",
			btnDecode: "Decode",
			lblResultTime: "Extracted Timestamp",
			lblResultLocal: "Local Date & Time",
			lblResultUtc: "UTC Date & Time",
			errInvalidChar: "Invalid ULID character. Must use Crockford's Base32 alphabet.",
			errInvalidLength: "ULID must be exactly 26 characters long.",
		},
		vi: {
			title: "Trình tạo & Giải mã ULID",
			tabGenerate: "Tạo mã ULID",
			tabDecode: "Giải mã ULID",
			lblCount: "Số lượng ULID cần tạo",
			lblCustomTime: "Sử dụng mốc thời gian tùy chọn",
			lblLowercase: "Định dạng chữ thường",
			btnGenerate: "Tạo danh sách ULID",
			btnCopy: "Sao chép tất cả",
			copied: "Đã copy!",
			lblOutput: "Các mã ULID tạo ra",
			lblDecodeInput: "Nhập mã ULID cần trích xuất thời gian",
			btnDecode: "Giải mã",
			lblResultTime: "Mốc thời gian trích xuất",
			lblResultLocal: "Giờ địa phương (Local)",
			lblResultUtc: "Giờ chuẩn quốc tế (UTC)",
			errInvalidChar: "Ký tự ULID không hợp lệ. Phải thuộc bảng mã Crockford Base32.",
			errInvalidLength: "Mã ULID phải chứa chính xác 26 ký tự.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Crockford Base32 characters
	const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

	const encodeTime = (time: number, len: number): string => {
		let str = "";
		let t = time;
		for (let i = len - 1; i >= 0; i--) {
			const mod = t % 32;
			str = ENCODING[mod] + str;
			t = Math.floor(t / 32);
		}
		return str;
	};

	const encodeRandom = (len: number): string => {
		let str = "";
		for (let i = 0; i < len; i++) {
			const rand = Math.floor(Math.random() * 32);
			str += ENCODING[rand];
		}
		return str;
	};

	const handleGenerate = useCallback(() => {
		const timestamp = useCustomTime ? new Date(customTimeVal).getTime() : Date.now();
		const results: string[] = [];

		for (let i = 0; i < count; i++) {
			// Add tiny millisecond offsets to prevent sorting collision if bulk generated with custom time
			const timeMillis = timestamp + i;
			let ulid = encodeTime(timeMillis, 10) + encodeRandom(16);
			if (lowercase) {
				ulid = ulid.toLowerCase();
			}
			results.push(ulid);
		}

		setOutputList(results);
	}, [count, useCustomTime, customTimeVal, lowercase]);

	// Auto generate on mount
	useEffect(() => {
		handleGenerate();
	}, [handleGenerate]);

	const handleCopy = () => {
		if (outputList.length === 0) return;
		const text = outputList.join("\n");
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleDecode = useCallback(() => {
		setDecodeError(null);
		setDecodedTime(null);

		const clean = decodeInput.trim().toUpperCase();
		if (!clean) return;

		if (clean.length !== 26) {
			setDecodeError(t.errInvalidLength);
			return;
		}

		const timePart = clean.substring(0, 10);
		let time = 0;

		try {
			for (let i = 0; i < 10; i++) {
				const char = timePart[i];
				const val = ENCODING.indexOf(char);
				if (val === -1) {
					throw new Error(t.errInvalidChar);
				}
				time = time * 32 + val;
			}
			setDecodedTime(new Date(time));
		} catch (err: any) {
			setDecodeError(err.message || "Decoding error");
		}
	}, [decodeInput, t.errInvalidChar, t.errInvalidLength]);

	useEffect(() => {
		handleDecode();
	}, [handleDecode]);

	return (
		<div class="space-y-6">
			{/* Tab Header */}
			<div class="flex border-b border-hairline gap-2">
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "generate"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("generate")}
				>
					{t.tabGenerate}
				</button>
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "decode"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("decode")}
				>
					{t.tabDecode}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input Column */}
				<div class="lg:col-span-5 space-y-4">
					{activeTab === "generate" ? (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
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
										setCount(
											Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
										)
									}
								/>
							</div>

							{/* Custom Timestamp */}
							<div class="space-y-2">
								<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
									<input
										type="checkbox"
										class="accent-primary"
										checked={useCustomTime}
										onChange={(e) => setUseCustomTime((e.target as HTMLInputElement).checked)}
									/>
									{t.lblCustomTime}
								</label>
								{useCustomTime && (
									<input
										type="datetime-local"
										class="input w-full font-mono text-body-sm"
										value={customTimeVal}
										onInput={(e) => setCustomTimeVal((e.target as HTMLInputElement).value)}
									/>
								)}
							</div>

							{/* Lowercase option */}
							<div>
								<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
									<input
										type="checkbox"
										class="accent-primary"
										checked={lowercase}
										onChange={(e) => setLowercase((e.target as HTMLInputElement).checked)}
									/>
									{t.lblLowercase}
								</label>
							</div>

							<button class="btn-primary w-full py-2.5" onClick={handleGenerate}>
								{t.btnGenerate}
							</button>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							{/* Decoder Input */}
							<div class="space-y-2">
								<label class="text-body-sm-strong text-ink block">{t.lblDecodeInput}</label>
								<input
									type="text"
									class="input w-full font-mono text-body-sm text-center"
									placeholder="e.g. 01ARZ3NDEKTSV4RRFFQ69G5FAV"
									value={decodeInput}
									onInput={(e) => setDecodeInput((e.target as HTMLInputElement).value)}
								/>
								{decodeError && (
									<p class="text-xs font-bold text-accent-rose mt-1">{decodeError}</p>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Output Column */}
				<div class="lg:col-span-7 space-y-4">
					{activeTab === "generate" ? (
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
								style={{ minHeight: "280px" }}
								readOnly
								value={outputList.join("\n")}
							/>
						</div>
					) : (
						decodedTime && (
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
									ULID Metadata
								</h3>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
									<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResultTime}</div>
										<div class="text-body-strong text-ink font-bold mt-1">
											{decodedTime.getTime()} ms
										</div>
									</div>

									<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResultLocal}</div>
										<div class="text-body-strong text-primary font-bold mt-1">
											{decodedTime.toLocaleString()}
										</div>
									</div>

									<div class="p-3 bg-surface-soft border border-hairline rounded-lg sm:col-span-2">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResultUtc}</div>
										<div class="text-body-strong text-ink font-bold mt-1">
											{decodedTime.toUTCString()}
										</div>
									</div>
								</div>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}
