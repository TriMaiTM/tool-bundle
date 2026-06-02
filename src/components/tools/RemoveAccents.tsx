import { useCallback, useEffect, useState } from "preact/hooks";

type CaseMode = "preserve" | "lower" | "upper" | "slug";

export default function RemoveAccents() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Accent removal options
	const [caseMode, setCaseMode] = useState<CaseMode>("preserve");
	const [removePunctuation, setRemovePunctuation] = useState(false);

	const t = {
		en: {
			title: "Vietnamese Accent Remover",
			inputPlaceholder: "Enter or paste Vietnamese text here...",
			outputPlaceholder: "Text without accents will appear here...",
			convertBtn: "Remove Accents",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			caseLabel: "Letter Casing / Output Style",
			casePreserve: "Keep Original Casing",
			caseLower: "All Lowercase",
			caseUpper: "All Uppercase",
			caseSlug: "URL Slug (Lowercase, hyphens)",
			optPunctuation: "Remove special punctuation / symbols",
			helpText:
				"Removes tone marks from Vietnamese characters offline. Perfect for creating clean text, SEO URLs, or matching keywords.",
		},
		vi: {
			title: "Xóa dấu tiếng Việt",
			inputPlaceholder: "Nhập hoặc dán văn bản tiếng Việt cần bỏ dấu ở đây...",
			outputPlaceholder: "Văn bản không dấu sẽ hiển thị ở đây...",
			convertBtn: "Bỏ dấu tiếng Việt",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			caseLabel: "Định dạng chữ đầu ra",
			casePreserve: "Giữ nguyên kiểu chữ",
			caseLower: "Chữ thường",
			caseUpper: "Chữ hoa",
			caseSlug: "Dạng đường dẫn (Slug - gạch nối)",
			optPunctuation: "Loại bỏ ký tự đặc biệt & dấu câu",
			helpText:
				"Bỏ dấu tiếng Việt offline nhanh chóng, an toàn. Phù hợp để làm sạch dữ liệu, tạo URL SEO hoặc tìm kiếm từ khóa không dấu.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const stripVietnameseAccents = (str: string): string => {
		// Use NFD to decompose accented characters, then strip accents range, then map đ/Đ
		let res = str
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/đ/g, "d")
			.replace(/Đ/g, "D");

		if (caseMode === "lower") {
			res = res.toLowerCase();
		} else if (caseMode === "upper") {
			res = res.toUpperCase();
		} else if (caseMode === "slug") {
			// Lowercase, remove symbols, replace space with hyphen
			res = res
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, "")
				.trim()
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-");
		}

		if (removePunctuation && caseMode !== "slug") {
			// Strip special punctuation, keep letters, numbers, spaces, newlines
			res = res.replace(/[^a-zA-Z0-9\s\n]/g, "");
		}

		return res;
	};

	const handleConvert = () => {
		setOutputText(stripVietnameseAccents(inputText));
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
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
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
						Settings
					</h3>

					{/* Output style */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.caseLabel}</label>
						<select
							class="input w-full"
							value={caseMode}
							onChange={(e) => setCaseMode((e.target as HTMLSelectElement).value as CaseMode)}
						>
							<option value="preserve">{t.casePreserve}</option>
							<option value="lower">{t.caseLower}</option>
							<option value="upper">{t.caseUpper}</option>
							<option value="slug">{t.caseSlug}</option>
						</select>
					</div>

					{/* Extra config checkbox */}
					{caseMode !== "slug" && (
						<div>
							<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
								<input
									type="checkbox"
									class="accent-primary"
									checked={removePunctuation}
									onChange={(e) => setRemovePunctuation((e.target as HTMLInputElement).checked)}
								/>
								{t.optPunctuation}
							</label>
						</div>
					)}

					<p class="text-caption text-muted bg-surface-soft p-3 rounded-lg border border-hairline">
						{t.helpText}
					</p>

					{/* Action Buttons */}
					<div class="flex gap-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleConvert}>
							{t.convertBtn}
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
