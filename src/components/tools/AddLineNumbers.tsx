import { useCallback, useEffect, useState } from "preact/hooks";

type NumberFormat = "dot" | "colon" | "bracket" | "pipe" | "custom";

export default function AddLineNumbers() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Settings
	const [startFrom, setStartFrom] = useState<number>(1);
	const [step, setStep] = useState<number>(1);
	const [formatType, setFormatType] = useState<NumberFormat>("dot");
	const [customFormat, setCustomFormat] = useState("%n) ");
	const [zeroPadding, setZeroPadding] = useState<number>(0); // 0 = none, 2 = 01, 3 = 001
	const [skipEmpty, setSkipEmpty] = useState(false);

	const t = {
		en: {
			title: "Add Line Numbers",
			inputPlaceholder: "Enter or paste your text here...",
			outputPlaceholder: "Numbered text will appear here...",
			processBtn: "Add Line Numbers",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Numbering Settings",
			lblStartFrom: "Start Numbering From",
			lblStep: "Increment Step",
			lblFormat: "Format Style",
			lblCustomFormat: "Custom Format (%n is line number)",
			lblZeroPadding: "Zero Padding",
			lblSkipEmpty: "Skip numbering on empty lines",
			formatDot: "1. Line",
			formatColon: "1: Line",
			formatBracket: "[1] Line",
			formatPipe: "1 | Line",
			formatCustom: "Custom Formatter",
			padNone: "None (1, 2, 3...)",
			padTwo: "Two Digits (01, 02...)",
			padThree: "Three Digits (001, 002...)",
		},
		vi: {
			title: "Thêm số thứ tự dòng",
			inputPlaceholder: "Nhập hoặc dán văn bản cần đánh số dòng vào đây...",
			outputPlaceholder: "Văn bản kèm số dòng sẽ hiển thị ở đây...",
			processBtn: "Thêm số dòng",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cài đặt đánh số",
			lblStartFrom: "Bắt đầu đánh số từ",
			lblStep: "Bước tăng (Increment)",
			lblFormat: "Định dạng số dòng",
			lblCustomFormat: "Định dạng tự chọn (%n là số dòng)",
			lblZeroPadding: "Đệm chữ số 0",
			lblSkipEmpty: "Không đánh số dòng trống",
			formatDot: "1. Dòng",
			formatColon: "1: Dòng",
			formatBracket: "[1] Dòng",
			formatPipe: "1 | Dòng",
			formatCustom: "Định dạng tự chọn",
			padNone: "Không đệm (1, 2, 3...)",
			padTwo: "2 chữ số (01, 02...)",
			padThree: "3 chữ số (001, 002...)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const padNumber = (num: number, width: number): string => {
		const numStr = num.toString();
		if (width <= 0) return numStr;
		return numStr.padStart(width, "0");
	};

	const formatLineNumber = (num: number): string => {
		const padded = padNumber(num, zeroPadding);

		switch (formatType) {
			case "dot":
				return `${padded}. `;
			case "colon":
				return `${padded}: `;
			case "bracket":
				return `[${padded}] `;
			case "pipe":
				return `${padded} | `;
			case "custom":
				return customFormat.replace("%n", padded);
			default:
				return `${padded}. `;
		}
	};

	const handleAddNumbers = () => {
		const lines = inputText.split("\n");
		let currentNumber = startFrom;

		const processed = lines.map((line) => {
			if (skipEmpty && line.trim() === "") {
				return line;
			}

			const numPrefix = formatLineNumber(currentNumber);
			currentNumber += step;
			return numPrefix + line;
		});

		setOutputText(processed.join("\n"));
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
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
							<path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Format selection */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblFormat}</label>
						<select
							class="input w-full"
							value={formatType}
							onChange={(e) => setFormatType((e.target as HTMLSelectElement).value as NumberFormat)}
						>
							<option value="dot">{t.formatDot}</option>
							<option value="colon">{t.formatColon}</option>
							<option value="bracket">{t.formatBracket}</option>
							<option value="pipe">{t.formatPipe}</option>
							<option value="custom">{t.formatCustom}</option>
						</select>
					</div>

					{/* Custom format expression */}
					{formatType === "custom" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblCustomFormat}</label>
							<input
								type="text"
								class="input w-full"
								value={customFormat}
								onInput={(e) => setCustomFormat((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Zero padding */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblZeroPadding}</label>
						<select
							class="input w-full"
							value={zeroPadding}
							onChange={(e) =>
								setZeroPadding(Number.parseInt((e.target as HTMLSelectElement).value))
							}
						>
							<option value="0">{t.padNone}</option>
							<option value="2">{t.padTwo}</option>
							<option value="3">{t.padThree}</option>
						</select>
					</div>

					{/* Start From and Increment */}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblStartFrom}</label>
							<input
								type="number"
								class="input w-full"
								value={startFrom}
								onInput={(e) =>
									setStartFrom(Number.parseInt((e.target as HTMLInputElement).value) || 1)
								}
							/>
						</div>
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblStep}</label>
							<input
								type="number"
								class="input w-full"
								value={step}
								onInput={(e) => setStep(Number.parseInt((e.target as HTMLInputElement).value) || 1)}
							/>
						</div>
					</div>

					{/* Skip empty lines checkbox */}
					<div>
						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={skipEmpty}
								onChange={(e) => setSkipEmpty((e.target as HTMLInputElement).checked)}
							/>
							{t.lblSkipEmpty}
						</label>
					</div>

					{/* Actions */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleAddNumbers}>
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
						<label class="text-body-sm-strong text-ink block">Input</label>
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
