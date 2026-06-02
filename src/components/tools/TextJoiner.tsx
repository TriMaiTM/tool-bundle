import { useCallback, useEffect, useState } from "preact/hooks";

type JoinSeparator = "comma" | "space" | "newline" | "semicolon" | "custom" | "none";
type WrapMode = "none" | "single" | "double" | "brackets";

export default function TextJoiner() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Settings
	const [separatorType, setSeparatorType] = useState<JoinSeparator>("comma");
	const [customSeparator, setCustomSeparator] = useState(", ");
	const [wrapMode, setWrapMode] = useState<WrapMode>("none");
	const [skipEmpty, setSkipEmpty] = useState(true);
	const [trimItems, setTrimItems] = useState(true);

	const t = {
		en: {
			title: "Text Joiner",
			inputPlaceholder: "Enter each item on a new line...",
			outputPlaceholder: "Joined text will appear here...",
			processBtn: "Join Text",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Join Configuration",
			lblSeparator: "Join Separator",
			lblCustomSeparator: "Custom Separator String",
			lblWrap: "Wrap Each Item With",
			lblSkipEmpty: "Skip empty lines / blank items",
			lblTrim: "Trim whitespace from items",
			sepComma: "Comma (,)",
			sepSpace: "Space ( )",
			sepNewline: "New Line (\\n)",
			sepSemicolon: "Semicolon (;)",
			sepCustom: "Custom Text",
			sepNone: "No Separator",
			wrapNone: "No wrapping",
			wrapSingle: "Single Quotes ('item')",
			wrapDouble: 'Double Quotes ("item")',
			wrapBrackets: "Square Brackets ([item])",
			helpText:
				"Combine multiple lines of text into a single line. Wrap items in quotes to easily generate SQL arrays, CSV columns, or coding objects.",
		},
		vi: {
			title: "Bộ ghép văn bản",
			inputPlaceholder: "Nhập mỗi mục trên một dòng riêng biệt...",
			outputPlaceholder: "Văn bản đã ghép sẽ hiển thị ở đây...",
			processBtn: "Ghép văn bản",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cấu hình ghép",
			lblSeparator: "Ký tự nối",
			lblCustomSeparator: "Chuỗi ký tự nối tự chọn",
			lblWrap: "Bao bọc mỗi mục bằng",
			lblSkipEmpty: "Bỏ qua các mục trống",
			lblTrim: "Cắt bỏ khoảng trắng thừa (Trim)",
			sepComma: "Dấu phẩy (,)",
			sepSpace: "Khoảng trắng ( )",
			sepNewline: "Xuống dòng (\\n)",
			sepSemicolon: "Dấu chấm phẩy (;)",
			sepCustom: "Chuỗi tự chọn",
			sepNone: "Không phân tách",
			wrapNone: "Không bao bọc",
			wrapSingle: "Dấu nháy đơn ('mục')",
			wrapDouble: 'Dấu nháy kép ("mục")',
			wrapBrackets: "Ngoặc vuông ([mục])",
			helpText:
				"Ghép nhiều dòng thành một chuỗi duy nhất. Có thể tự động bao bọc từng mục bằng dấu nháy đơn/ngoặc để tạo nhanh các mảng SQL, mảng code, hoặc danh sách CSV.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleJoin = () => {
		let lines = inputText.split("\n");

		if (trimItems) {
			lines = lines.map((l) => l.trim());
		}

		if (skipEmpty) {
			lines = lines.filter((l) => l !== "");
		}

		// Wrap lines
		const wrapped = lines.map((line) => {
			if (wrapMode === "single") return `'${line}'`;
			if (wrapMode === "double") return `"${line}"`;
			if (wrapMode === "brackets") return `[${line}]`;
			return line;
		});

		// Find separator
		let sep = ", ";
		if (separatorType === "space") sep = " ";
		else if (separatorType === "newline") sep = "\n";
		else if (separatorType === "semicolon") sep = ";";
		else if (separatorType === "none") sep = "";
		else if (separatorType === "custom") sep = customSeparator;

		setOutputText(wrapped.join(sep));
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
	};

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
							<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
							<path d="M8 12H16" />
							<path d="M12 8V16" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Separator Selection */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblSeparator}</label>
						<select
							class="input w-full"
							value={separatorType}
							onChange={(e) =>
								setSeparatorType((e.target as HTMLSelectElement).value as JoinSeparator)
							}
						>
							<option value="comma">{t.sepComma}</option>
							<option value="space">{t.sepSpace}</option>
							<option value="newline">{t.sepNewline}</option>
							<option value="semicolon">{t.sepSemicolon}</option>
							<option value="none">{t.sepNone}</option>
							<option value="custom">{t.sepCustom}</option>
						</select>
					</div>

					{/* Custom Separator Input */}
					{separatorType === "custom" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblCustomSeparator}</label>
							<input
								type="text"
								class="input w-full"
								value={customSeparator}
								onInput={(e) => setCustomSeparator((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Wrapper option */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblWrap}</label>
						<select
							class="input w-full"
							value={wrapMode}
							onChange={(e) => setWrapMode((e.target as HTMLSelectElement).value as WrapMode)}
						>
							<option value="none">{t.wrapNone}</option>
							<option value="single">{t.wrapSingle}</option>
							<option value="double">{t.wrapDouble}</option>
							<option value="brackets">{t.wrapBrackets}</option>
						</select>
					</div>

					{/* Toggles */}
					<div class="space-y-3 pt-2">
						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={skipEmpty}
								onChange={(e) => setSkipEmpty((e.target as HTMLInputElement).checked)}
							/>
							{t.lblSkipEmpty}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={trimItems}
								onChange={(e) => setTrimItems((e.target as HTMLInputElement).checked)}
							/>
							{t.lblTrim}
						</label>
					</div>

					<p class="text-caption text-muted bg-surface-soft p-3 rounded-lg border border-hairline">
						{t.helpText}
					</p>

					{/* Actions */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleJoin}>
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
						<label class="text-body-sm-strong text-ink block">Input Items (One per line)</label>
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
