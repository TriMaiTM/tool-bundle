import { useEffect, useState } from "preact/hooks";

// Convert Gregorian date to Julian Date
function getJulianDate(date: Date): number {
	const time = date.getTime();
	return time / 86400000 + 2440587.5;
}

export default function IsoDateConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [inputStr, setInputStr] = useState(new Date().toISOString());
	const [parsedDate, setParsedDate] = useState<Date | null>(new Date());
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "ISO-8601 & Timestamp Converter",
			desc: "Universal date parser. Inputs can be readable dates, ISO strings, or numeric Unix timestamps (seconds/milliseconds).",
			lblInput: "Enter Date / Unix Timestamp",
			btnNow: "Use Current Time",
			lblResults: "Parsed Formats",
			lblUtc: "ISO 8601 (UTC)",
			lblLocal: "ISO 8601 (Local)",
			lblUnixMs: "Unix Timestamp (Milliseconds)",
			lblUnixSec: "Unix Timestamp (Seconds)",
			lblGmt: "UTC / GMT String",
			lblJulian: "Julian Date",
			copied: "Copied!",
			copy: "Copy",
			invalid: "Invalid Date Format",
		},
		vi: {
			title: "Chuyển đổi định dạng ISO-8601",
			desc: "Bộ phân tích ngày tháng vạn năng. Đầu vào hỗ trợ chuỗi ngày, chuỗi ISO hoặc số Unix timestamp (giây/mili-giây).",
			lblInput: "Nhập chuỗi ngày / Unix Timestamp",
			btnNow: "Lấy giờ hiện tại",
			lblResults: "Định dạng quy đổi đầu ra",
			lblUtc: "ISO 8601 (UTC)",
			lblLocal: "ISO 8601 (Giờ địa phương)",
			lblUnixMs: "Unix Epoch (Mili-giây)",
			lblUnixSec: "Unix Epoch (Giây)",
			lblGmt: "Chuỗi UTC / GMT",
			lblJulian: "Lịch Julian",
			copied: "Đã chép!",
			copy: "Sao chép",
			invalid: "Định dạng ngày không hợp lệ",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run parsing whenever input updates
	useEffect(() => {
		const trimmed = inputStr.trim();
		if (!trimmed) {
			setParsedDate(null);
			return;
		}

		// Try parsing as number (Unix timestamp)
		if (/^\d+$/.test(trimmed)) {
			const num = Number(trimmed);
			// Check if seconds or milliseconds
			const date = num > 99999999999 ? new Date(num) : new Date(num * 1000);
			if (!Number.isNaN(date.getTime())) {
				setParsedDate(date);
				return;
			}
		}

		const parsed = new Date(trimmed);
		if (!Number.isNaN(parsed.getTime())) {
			setParsedDate(parsed);
		} else {
			setParsedDate(null);
		}
	}, [inputStr]);

	const setToNow = () => {
		setInputStr(new Date().toISOString());
	};

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	// Local timezone ISO string helper
	const getLocalIsoString = (date: Date) => {
		const tzOffset = -date.getTimezoneOffset();
		const diff = tzOffset >= 0 ? "+" : "-";
		const pad = (num: number) => num.toString().padStart(2, "0");
		const hh = pad(Math.floor(Math.abs(tzOffset) / 60));
		const mm = pad(Math.abs(tzOffset) % 60);

		// Local date representation format
		const yyyy = date.getFullYear();
		const mo = pad(date.getMonth() + 1);
		const dd = pad(date.getDate());
		const hr = pad(date.getHours());
		const mi = pad(date.getMinutes());
		const se = pad(date.getSeconds());
		const ms = date.getMilliseconds().toString().padStart(3, "0");

		return `${yyyy}-${mo}-${dd}T${hr}:${mi}:${se}.${ms}${diff}${hh}:${mm}`;
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

					{/* Text input */}
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={inputStr}
							onInput={(e) => setInputStr((e.target as HTMLInputElement).value)}
							placeholder="e.g. 2026-07-01T00:00:00Z or 1780287600000"
						/>
					</div>

					<button class="btn-secondary w-full py-2" onClick={setToNow}>
						{t.btnNow}
					</button>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{!parsedDate ? (
						<div class="text-center py-8 text-accent-rose text-body-sm italic font-bold">
							{t.invalid}
						</div>
					) : (
						<div class="space-y-3">
							{[
								{ label: t.lblUtc, val: parsedDate.toISOString(), key: "utc" },
								{ label: t.lblLocal, val: getLocalIsoString(parsedDate), key: "local" },
								{ label: t.lblUnixMs, val: parsedDate.getTime().toString(), key: "unixms" },
								{
									label: t.lblUnixSec,
									val: Math.floor(parsedDate.getTime() / 1000).toString(),
									key: "unixsec",
								},
								{ label: t.lblGmt, val: parsedDate.toUTCString(), key: "gmt" },
								{ label: t.lblJulian, val: getJulianDate(parsedDate).toFixed(5), key: "julian" },
							].map((item) => (
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
