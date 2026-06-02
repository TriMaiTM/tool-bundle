import { useCallback, useEffect, useState } from "preact/hooks";

interface RegexPreset {
	key: string;
	nameEn: string;
	nameVi: string;
	pattern: string;
	replace: string;
	descEn: string;
	descVi: string;
}

const REGEX_PRESETS: RegexPreset[] = [
	{
		key: "digits",
		nameEn: "Remove All Digits",
		nameVi: "Xóa tất cả các chữ số",
		pattern: "\\d+",
		replace: "",
		descEn: "Matches any digit character (0-9) and replaces it with empty text.",
		descVi: "Khớp với bất kỳ chữ số nào (0-9) và thay thế bằng chuỗi rỗng.",
	},
	{
		key: "emails",
		nameEn: "Remove Email Addresses",
		nameVi: "Xóa địa chỉ Email",
		pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
		replace: "[email_removed]",
		descEn: "Matches standard email formats like user@domain.com.",
		descVi: "Khớp các định dạng email tiêu chuẩn như user@domain.com.",
	},
	{
		key: "urls",
		nameEn: "Strip URL Links",
		nameVi: "Xóa đường dẫn liên kết URL",
		pattern:
			"https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
		replace: "",
		descEn: "Matches web URLs starting with http:// or https://.",
		descVi: "Khớp các đường dẫn trang web bắt đầu bằng http:// hoặc https://.",
	},
	{
		key: "phones",
		nameEn: "Mask Phone Numbers",
		nameVi: "Ẩn số điện thoại Việt Nam",
		pattern: "(0|\\+84)\\d{9,10}",
		replace: "[phone_masked]",
		descEn: "Matches Vietnamese phone numbers (starting with 0 or +84).",
		descVi: "Khớp số điện thoại Việt Nam (bắt đầu bằng số 0 hoặc +84).",
	},
	{
		key: "html",
		nameEn: "Strip HTML Tags",
		nameVi: "Loại bỏ thẻ HTML (HTML Tags)",
		pattern: "<[^>]*>",
		replace: "",
		descEn: "Matches any HTML tags like <div>, <p>, or <a href='...'>.",
		descVi: "Khớp với bất kỳ thẻ HTML nào như <div>, <p> hoặc <a href='...'>.",
	},
	{
		key: "spaces",
		nameEn: "Merge Extra Spaces",
		nameVi: "Chuẩn hóa khoảng trắng thừa",
		pattern: "[ \\t]+",
		replace: " ",
		descEn: "Matches groups of consecutive spaces or tabs, compressing them into a single space.",
		descVi: "Khớp với các cụm khoảng trắng hoặc tab liên tục và thu gọn thành 1 khoảng trắng.",
	},
	{
		key: "blank-lines",
		nameEn: "Delete Blank Lines",
		nameVi: "Xóa các dòng trống",
		pattern: "^\\s*$\\n?",
		replace: "",
		descEn: "Matches lines that are empty or contain only whitespace.",
		descVi: "Khớp với các dòng không chứa nội dung hoặc chỉ chứa dấu cách.",
	},
];

export default function RegexReplaceBuilder() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Editor settings
	const [selectedPresetKey, setSelectedPresetKey] = useState<string>("digits");
	const [pattern, setPattern] = useState("\\d+");
	const [replaceStr, setReplaceStr] = useState("");
	const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
	const [isGlobal, setIsGlobal] = useState(true);
	const [isMultiline, setIsMultiline] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Regex Replace Builder",
			inputPlaceholder: "Paste your text to test replacing here...",
			outputPlaceholder: "Replaced text will appear here...",
			processBtn: "Run Regex Replace",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Regex Config",
			lblPreset: "Regex Preset Patterns",
			lblPattern: "Find Pattern (Regular Expression)",
			lblReplace: "Replace With",
			lblFlags: "Regex Flags",
			lblCase: "Case Insensitive (i)",
			lblGlobal: "Global Replace (g)",
			lblMultiline: "Multiline Mode (m)",
			lblExplain: "Regex Match Explanation",
			errorRegex: "Invalid Regular Expression syntax. Please check your pattern.",
			infoExplain: "Custom regular expression pattern.",
		},
		vi: {
			title: "Tạo bộ tìm thế bằng Regex",
			inputPlaceholder: "Dán văn bản kiểm tra thay thế ở đây...",
			outputPlaceholder: "Kết quả sau khi thay thế sẽ hiển thị ở đây...",
			processBtn: "Thực thi thay thế (Replace)",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cấu hình Regex",
			lblPreset: "Biểu mẫu thường dùng",
			lblPattern: "Biểu thức tìm kiếm (Find Pattern)",
			lblReplace: "Thay thế bằng (Replace With)",
			lblFlags: "Cờ Regex (Flags)",
			lblCase: "Không phân biệt hoa/thường (i)",
			lblGlobal: "Thay thế toàn bộ (g)",
			lblMultiline: "Chế độ nhiều dòng (m)",
			lblExplain: "Giải thích Regex",
			errorRegex: "Cú pháp biểu thức Regex không hợp lệ. Vui lòng kiểm tra lại.",
			infoExplain: "Biểu thức chính quy tự định nghĩa.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Handle preset selection
	const handlePresetChange = (key: string) => {
		setSelectedPresetKey(key);
		if (key === "custom") return;

		const preset = REGEX_PRESETS.find((p) => p.key === key);
		if (preset) {
			setPattern(preset.pattern);
			setReplaceStr(preset.replace);
		}
	};

	// Validate and run Regex Replace
	const handleReplace = () => {
		setError(null);

		let flags = "";
		if (isGlobal) flags += "g";
		if (isCaseInsensitive) flags += "i";
		if (isMultiline) flags += "m";

		try {
			const regex = new RegExp(pattern, flags);
			// Process escaped characters in replacement string (like \n, \t, etc.)
			let cleanReplaceStr = replaceStr;
			cleanReplaceStr = cleanReplaceStr.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

			const result = inputText.replace(regex, cleanReplaceStr);
			setOutputText(result);
		} catch (e) {
			setError(t.errorRegex);
		}
	};

	const handleCopy = () => {
		if (!outputText) return;
		navigator.clipboard.writeText(outputText).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleClear = () => {
		setInputText("");
		setOutputText("");
		setCopied(false);
		setError(null);
	};

	const currentPreset = REGEX_PRESETS.find((p) => p.key === selectedPresetKey);

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Left Config Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Presets Select */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblPreset}</label>
						<select
							class="input w-full"
							value={selectedPresetKey}
							onChange={(e) => handlePresetChange((e.target as HTMLSelectElement).value)}
						>
							{REGEX_PRESETS.map((preset) => (
								<option key={preset.key} value={preset.key}>
									{lang === "vi" ? preset.nameVi : preset.nameEn}
								</option>
							))}
							<option value="custom">
								{lang === "vi" ? "Tự định nghĩa..." : "Custom Expression..."}
							</option>
						</select>
					</div>

					{/* Find Regex Input */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblPattern}</label>
						<div class="relative">
							<span class="absolute left-3 top-2.5 text-muted font-mono font-bold select-none">
								/
							</span>
							<input
								type="text"
								class="input w-full font-mono pl-6 pr-12"
								value={pattern}
								onInput={(e) => {
									setPattern((e.target as HTMLInputElement).value);
									setSelectedPresetKey("custom");
								}}
							/>
							<span class="absolute right-3 top-2.5 text-muted font-mono font-bold select-none">
								/{isGlobal ? "g" : ""}
								{isCaseInsensitive ? "i" : ""}
								{isMultiline ? "m" : ""}
							</span>
						</div>
					</div>

					{/* Replace Input */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblReplace}</label>
						<input
							type="text"
							class="input w-full font-mono"
							value={replaceStr}
							placeholder="e.g. [censor] or \n"
							onInput={(e) => setReplaceStr((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Flags */}
					<div class="space-y-2 pt-1">
						<label class="text-body-sm-strong text-ink block mb-1">{t.lblFlags}</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={isGlobal}
								onChange={(e) => setIsGlobal((e.target as HTMLInputElement).checked)}
							/>
							{t.lblGlobal}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={isCaseInsensitive}
								onChange={(e) => setIsCaseInsensitive((e.target as HTMLInputElement).checked)}
							/>
							{t.lblCase}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={isMultiline}
								onChange={(e) => setIsMultiline((e.target as HTMLInputElement).checked)}
							/>
							{t.lblMultiline}
						</label>
					</div>

					{/* Explanation explanation box */}
					<div class="bg-surface-soft p-3 rounded-lg border border-hairline space-y-1">
						<h4 class="text-xs font-bold text-ink">{t.lblExplain}</h4>
						<p class="text-caption text-muted">
							{selectedPresetKey !== "custom" && currentPreset
								? lang === "vi"
									? currentPreset.descVi
									: currentPreset.descEn
								: t.infoExplain}
						</p>
					</div>

					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-3 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{/* Actions */}
					<div class="flex gap-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleReplace}>
							{t.processBtn}
						</button>
						<button class="btn-secondary py-2.5 px-4" onClick={handleClear}>
							{t.clearBtn}
						</button>
					</div>
				</div>

				{/* Right Side Text Areas */}
				<div class="lg:col-span-7 space-y-4">
					{/* Input */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<label class="text-body-sm-strong text-ink block">Input Text</label>
						<textarea
							class="textarea font-mono text-body-sm w-full"
							style={{ minHeight: "150px" }}
							placeholder={t.inputPlaceholder}
							value={inputText}
							onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Output */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink">Output</label>
							{outputText && (
								<button
									class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
									onClick={handleCopy}
								>
									{copied ? (
										<>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="var(--color-accent-emerald)"
												stroke-width="3"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
											{t.copied}
										</>
									) : (
										<>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
												<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
											</svg>
											{t.copyBtn}
										</>
									)}
								</button>
							)}
						</div>
						<textarea
							class="textarea font-mono text-body-sm w-full"
							style={{ minHeight: "180px" }}
							readOnly
							placeholder={t.outputPlaceholder}
							value={outputText}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
