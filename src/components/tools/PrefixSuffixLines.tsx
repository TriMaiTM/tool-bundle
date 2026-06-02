import { useCallback, useEffect, useState } from "preact/hooks";

export default function PrefixSuffixLines() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Settings
	const [prefix, setPrefix] = useState("");
	const [suffix, setSuffix] = useState("");
	const [skipEmpty, setSkipEmpty] = useState(true);

	const t = {
		en: {
			title: "Prefix/Suffix Lines Tool",
			inputPlaceholder: "Enter or paste your text here...",
			outputPlaceholder: "Processed text will appear here...",
			processBtn: "Add Prefix / Suffix",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Configuration",
			lblPrefix: "Prefix (Add to start of each line)",
			lblSuffix: "Suffix (Add to end of each line)",
			lblSkipEmpty: "Skip empty lines",
			helpText:
				"Add specific text at the start or end of each line. Useful for SQL queries, wrapping array elements, or list formatting.",
		},
		vi: {
			title: "Thêm tiền tố & hậu tố cho dòng",
			inputPlaceholder: "Nhập hoặc dán văn bản cần xử lý ở đây...",
			outputPlaceholder: "Văn bản sau khi thêm tiền tố/hậu tố sẽ hiển thị ở đây...",
			processBtn: "Thêm Tiền tố / Hậu tố",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cấu hình",
			lblPrefix: "Tiền tố (Thêm vào đầu mỗi dòng)",
			lblSuffix: "Hậu tố (Thêm vào cuối mỗi dòng)",
			lblSkipEmpty: "Bỏ qua dòng trống",
			helpText:
				"Thêm ký tự hoặc chữ vào đầu hoặc cuối tất cả các dòng. Rất hữu ích khi viết truy vấn SQL, tạo mảng code, hoặc định dạng danh sách.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleAddPrefixSuffix = () => {
		const lines = inputText.split("\n");
		const processed = lines.map((line) => {
			if (skipEmpty && line.trim() === "") {
				return line;
			}
			return prefix + line + suffix;
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
		setPrefix("");
		setSuffix("");
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
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Prefix Input */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblPrefix}</label>
						<input
							type="text"
							class="input w-full"
							placeholder="e.g. 'SELECT * FROM "
							value={prefix}
							onInput={(e) => setPrefix((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Suffix Input */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblSuffix}</label>
						<input
							type="text"
							class="input w-full"
							placeholder='e.g. ", "'
							value={suffix}
							onInput={(e) => setSuffix((e.target as HTMLInputElement).value)}
						/>
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

					<p class="text-caption text-muted bg-surface-soft p-3 rounded-lg border border-hairline">
						{t.helpText}
					</p>

					{/* Actions */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleAddPrefixSuffix}>
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
