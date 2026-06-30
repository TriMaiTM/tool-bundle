import { useEffect, useState } from "preact/hooks";

function formatCustomDate(date: Date, pattern: string): string {
	const pad = (num: number) => num.toString().padStart(2, "0");
	const yyyy = date.getFullYear().toString();
	const yy = yyyy.substring(2);
	const mm = pad(date.getMonth() + 1);
	const dd = pad(date.getDate());
	const hh = pad(date.getHours());
	const min = pad(date.getMinutes());
	const ss = pad(date.getSeconds());

	return pattern
		.replace(/YYYY/g, yyyy)
		.replace(/YY/g, yy)
		.replace(/MM/g, mm)
		.replace(/DD/g, dd)
		.replace(/HH/g, hh)
		.replace(/mm/g, min)
		.replace(/ss/g, ss);
}

export default function DateFormatConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [inputDate, setInputDate] = useState(new Date().toISOString().substring(0, 10));
	const [customPattern, setCustomPattern] = useState("DD-MM-YYYY HH:mm");
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "Date Format Converter",
			desc: "Convert a calendar date to standard international formats, local text strings, or design a custom format layout.",
			lblInput: "Select Date",
			lblCustom: "Custom Format String",
			lblResults: "Standard Formats",
			copied: "Copied!",
			copy: "Copy",
			patternHelp:
				"Presets: YYYY (year), YY (short year), MM (month), DD (day), HH (hour), mm (minute), ss (second).",
		},
		vi: {
			title: "Định dạng ngày tháng",
			desc: "Quy đổi ngày tháng sang nhiều định dạng chuẩn quốc gia, định dạng văn bản hoặc thiết lập chuỗi định dạng tùy chỉnh.",
			lblInput: "Chọn ngày",
			lblCustom: "Mã định dạng tùy chọn",
			lblResults: "Các định dạng chuẩn đầu ra",
			copied: "Đã chép!",
			copy: "Sao chép",
			patternHelp:
				"Gợi ý: YYYY (năm), YY (năm viết tắt), MM (tháng), DD (ngày), HH (giờ), mm (phút), ss (giây).",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const dateObj = new Date(inputDate);
	const isValid = !Number.isNaN(dateObj.getTime());

	const pad = (num: number) => num.toString().padStart(2, "0");

	// Formatting definitions
	const getFormats = () => {
		if (!isValid) return [];

		const yyyy = dateObj.getFullYear();
		const mm = pad(dateObj.getMonth() + 1);
		const dd = pad(dateObj.getDate());

		return [
			{ label: "ISO Date (YYYY-MM-DD)", val: `${yyyy}-${mm}-${dd}`, key: "iso" },
			{ label: "US Format (MM/DD/YYYY)", val: `${mm}/${dd}/${yyyy}`, key: "us" },
			{ label: "UK/EU Format (DD/MM/YYYY)", val: `${dd}/${mm}/${yyyy}`, key: "uk" },
			{
				label: lang === "en" ? "Long Text" : "Văn bản dài",
				val: dateObj.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				}),
				key: "long",
			},
			{ label: "RFC 2822", val: dateObj.toUTCString(), key: "rfc" },
			{
				label: lang === "en" ? "Custom Pattern Result" : "Kết quả mã tùy chọn",
				val: formatCustomDate(dateObj, customPattern),
				key: "custom",
			},
		];
	};

	const formatsList = getFormats();

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
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

					{/* Date selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<input
							type="date"
							class="input w-full"
							value={inputDate}
							onChange={(e) => setInputDate((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Custom format pattern code */}
					<div class="space-y-1.5 pt-2 border-t border-hairline">
						<label class="text-body-sm-strong text-ink block">{t.lblCustom}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={customPattern}
							onInput={(e) => setCustomPattern((e.target as HTMLInputElement).value)}
						/>
						<span class="text-[10px] text-muted block leading-relaxed">{t.patternHelp}</span>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{!isValid ? (
						<div class="text-center py-8 text-accent-rose text-body-sm italic font-bold">
							{lang === "en" ? "Invalid Date" : "Ngày không hợp lệ"}
						</div>
					) : (
						<div class="space-y-4">
							{formatsList.map((item) => (
								<div key={item.key} class="space-y-1.5">
									<label class="text-caption-uppercase text-muted block">{item.label}</label>
									<div class="flex gap-2">
										<input
											readOnly
											type="text"
											class="input w-full font-mono text-body-sm bg-surface-soft"
											value={item.val}
										/>
										<button
											class="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
											onClick={() => handleCopy(item.val, item.key)}
										>
											{copiedFormat === item.key ? t.copied : t.copy}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
