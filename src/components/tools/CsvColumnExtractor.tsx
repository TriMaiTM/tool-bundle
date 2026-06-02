import { useCallback, useEffect, useState } from "preact/hooks";

type DelimiterType = "comma" | "tab" | "semicolon" | "space" | "custom";

export default function CsvColumnExtractor() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Settings
	const [delimiterType, setDelimiterType] = useState<DelimiterType>("comma");
	const [customDelimiter, setCustomDelimiter] = useState(",");
	const [columnsInput, setColumnsInput] = useState("1"); // e.g. "1", "1,3", "2-4"
	const [outputDelimiterType, setOutputDelimiterType] = useState<DelimiterType | "newline">(
		"comma",
	);
	const [customOutputDelimiter, setCustomOutputDelimiter] = useState(",");
	const [skipHeader, setSkipHeader] = useState(false);
	const [trimValues, setTrimValues] = useState(true);

	const t = {
		en: {
			title: "CSV/Text Column Extractor",
			inputPlaceholder: "Paste your CSV, TSV, or delimited text here...",
			outputPlaceholder: "Extracted columns will appear here...",
			processBtn: "Extract Columns",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Extractor Configuration",
			lblDelimiter: "Source Delimiter",
			lblCustomDelimiter: "Custom Source Delimiter",
			lblColumns: "Columns to Extract (e.g. 1, 1,3, or 2-4)",
			lblOutputDelimiter: "Output Delimiter",
			lblCustomOutputDelimiter: "Custom Output Delimiter",
			lblSkipHeader: "Skip first row (Header)",
			lblTrim: "Trim spaces from extracted values",
			sepComma: "Comma (,)",
			sepTab: "Tab (\\t)",
			sepSemicolon: "Semicolon (;)",
			sepSpace: "Space ( )",
			sepCustom: "Custom String",
			sepNewline: "New Line (\\n)",
			invalidColumns: "Invalid columns format. Please enter numbers like 1, 1,3, or 2-4.",
			helpText:
				"Extract specific columns from delimited text files. Supports full CSV parsing (respecting quoted text fields with commas) offline.",
		},
		vi: {
			title: "Trích xuất cột CSV / Văn bản",
			inputPlaceholder: "Dán văn bản CSV, TSV hoặc danh sách phân tách cột ở đây...",
			outputPlaceholder: "Kết quả trích xuất cột sẽ hiển thị ở đây...",
			processBtn: "Trích xuất cột",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cấu hình trích xuất",
			lblDelimiter: "Ký tự phân tách nguồn",
			lblCustomDelimiter: "Ký tự phân tách tự chọn",
			lblColumns: "Cột cần lấy (Ví dụ: 1, 1,3 hoặc 2-4)",
			lblOutputDelimiter: "Ký tự phân tách đầu ra",
			lblCustomOutputDelimiter: "Ký tự đầu ra tự chọn",
			lblSkipHeader: "Bỏ qua dòng đầu tiên (Tiêu đề)",
			lblTrim: "Cắt khoảng trắng của giá trị (Trim)",
			sepComma: "Dấu phẩy (,)",
			sepTab: "Tab (\\t)",
			sepSemicolon: "Dấu chấm phẩy (;)",
			sepSpace: "Khoảng trắng ( )",
			sepCustom: "Chuỗi tự chọn",
			sepNewline: "Xuống dòng (\\n)",
			invalidColumns: "Định dạng cột không hợp lệ. Vui lòng nhập số, ví dụ 1, 1,3 hoặc khoảng 2-4.",
			helpText:
				"Trích xuất các cột mong muốn từ file văn bản có cấu trúc phân tách. Hỗ trợ giải mã tệp CSV chuẩn (bỏ qua dấu phẩy nằm trong dấu ngoặc kép) 100% offline.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Parse CSV Line (handles double quotes containing commas)
	const parseLine = (line: string, delimiter: string): string[] => {
		if (delimiter !== ",") {
			return line.split(delimiter);
		}

		const result: string[] = [];
		let current = "";
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === delimiter && !inQuotes) {
				result.push(current);
				current = "";
			} else {
				current += char;
			}
		}
		result.push(current);
		return result;
	};

	// Parse column request (e.g., "1,3" or "2-4" or "1")
	const parseColumns = (input: string): number[] | null => {
		const clean = input.replace(/\s+/g, "");
		if (/^\d+$/.test(clean)) {
			return [Number.parseInt(clean) - 1];
		}
		if (/^\d+(,\d+)+$/.test(clean)) {
			return clean.split(",").map((n) => Number.parseInt(n) - 1);
		}
		if (/^\d+-\d+$/.test(clean)) {
			const parts = clean.split("-").map((n) => Number.parseInt(n));
			const start = Math.min(parts[0], parts[1]);
			const end = Math.max(parts[0], parts[1]);
			const res: number[] = [];
			for (let i = start; i <= end; i++) {
				res.push(i - 1);
			}
			return res;
		}
		return null;
	};

	const handleExtract = () => {
		const targetCols = parseColumns(columnsInput);
		if (!targetCols) {
			alert(t.invalidColumns);
			return;
		}

		// Find actual source delimiter
		let srcDelim = ",";
		if (delimiterType === "tab") srcDelim = "\t";
		else if (delimiterType === "semicolon") srcDelim = ";";
		else if (delimiterType === "space") srcDelim = " ";
		else if (delimiterType === "custom") srcDelim = customDelimiter;

		// Find actual output delimiter
		let outDelim = ",";
		if (outputDelimiterType === "tab") outDelim = "\t";
		else if (outputDelimiterType === "semicolon") outDelim = ";";
		else if (outputDelimiterType === "space") outDelim = " ";
		else if (outputDelimiterType === "newline") outDelim = "\n";
		else if (outputDelimiterType === "custom") outDelim = customOutputDelimiter;

		const lines = inputText.split("\n");
		const startIdx = skipHeader ? 1 : 0;
		const results: string[] = [];

		for (let i = startIdx; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const cells = parseLine(line, srcDelim);
			const extractedCells = targetCols.map((colIdx) => {
				const cell = cells[colIdx] || "";
				// Strip surrounding quotes if present
				let cleaned = cell.trim();
				if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
					cleaned = cleaned.substring(1, cleaned.length - 1);
				}
				return trimValues ? cleaned.trim() : cleaned;
			});

			results.push(extractedCells.join(outDelim));
		}

		setOutputText(results.join("\n"));
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
							<path d="M12 8V16" />
							<path d="M8 12H16" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Delimiter Source */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblDelimiter}</label>
						<select
							class="input w-full"
							value={delimiterType}
							onChange={(e) =>
								setDelimiterType((e.target as HTMLSelectElement).value as DelimiterType)
							}
						>
							<option value="comma">{t.sepComma}</option>
							<option value="tab">{t.sepTab}</option>
							<option value="semicolon">{t.sepSemicolon}</option>
							<option value="space">{t.sepSpace}</option>
							<option value="custom">{t.sepCustom}</option>
						</select>
					</div>

					{delimiterType === "custom" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblCustomDelimiter}</label>
							<input
								type="text"
								class="input w-full"
								value={customDelimiter}
								onInput={(e) => setCustomDelimiter((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Columns Extractor Input */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblColumns}</label>
						<input
							type="text"
							class="input w-full"
							value={columnsInput}
							placeholder="e.g. 1, 1,3, or 2-4"
							onInput={(e) => setColumnsInput((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Output Delimiter */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblOutputDelimiter}</label>
						<select
							class="input w-full"
							value={outputDelimiterType}
							onChange={(e) => setOutputDelimiterType((e.target as HTMLSelectElement).value as any)}
						>
							<option value="comma">{t.sepComma}</option>
							<option value="tab">{t.sepTab}</option>
							<option value="semicolon">{t.sepSemicolon}</option>
							<option value="space">{t.sepSpace}</option>
							<option value="newline">{t.sepNewline}</option>
							<option value="custom">{t.sepCustom}</option>
						</select>
					</div>

					{outputDelimiterType === "custom" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">
								{t.lblCustomOutputDelimiter}
							</label>
							<input
								type="text"
								class="input w-full"
								value={customOutputDelimiter}
								onInput={(e) => setCustomOutputDelimiter((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Checkboxes */}
					<div class="space-y-3 pt-2">
						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={skipHeader}
								onChange={(e) => setSkipHeader((e.target as HTMLInputElement).checked)}
							/>
							{t.lblSkipHeader}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={trimValues}
								onChange={(e) => setTrimValues((e.target as HTMLInputElement).checked)}
							/>
							{t.lblTrim}
						</label>
					</div>

					<p class="text-caption text-muted bg-surface-soft p-3 rounded-lg border border-hairline">
						{t.helpText}
					</p>

					{/* Actions */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleExtract}>
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
						<label class="text-body-sm-strong text-ink block">Input Delimited Text</label>
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
