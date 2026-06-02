import { useCallback, useEffect, useState } from "preact/hooks";

type UnicodeForm = "none" | "NFC" | "NFD" | "NFKC" | "NFKD";

export default function TextCleaner() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [copied, setCopied] = useState(false);

	// Cleaning Options
	const [unicodeForm, setUnicodeForm] = useState<UnicodeForm>("NFC");
	const [removeInvisible, setRemoveInvisible] = useState(true);
	const [removeEmoji, setRemoveEmoji] = useState(false);
	const [stripHtml, setStripHtml] = useState(false);
	const [decodeHtmlEntities, setDecodeHtmlEntities] = useState(true);
	const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
	const [normalizeQuotes, setNormalizeQuotes] = useState(false);

	const t = {
		en: {
			title: "Text Cleaner & Unicode Normalizer",
			inputPlaceholder: "Enter or paste your text to clean here...",
			outputPlaceholder: "Cleaned text will appear here...",
			cleanBtn: "Clean Text",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			optionsTitle: "Cleaning Options",
			optUnicode: "Unicode Normalization",
			optInvisible: "Remove Invisible & Control Characters",
			optEmoji: "Remove Emojis & Pictographs",
			optHtml: "Strip HTML Tags",
			optHtmlEntities: "Decode HTML Entities (e.g. &amp; → &)",
			optWhitespace: "Normalize Whitespace (Trim & merge extra spaces)",
			optQuotes: "Standardize Smart Quotes (“” → \"\", ‘’ → '')",
			unicodeNfc: "NFC (Recommended for Web/Vietnamese)",
			unicodeNfd: "NFD (Decomposed)",
			unicodeNfkc: "NFKC (Compatibility)",
			unicodeNfkd: "NFKD (Compatibility Decomposed)",
			unicodeNone: "No Normalization",
		},
		vi: {
			title: "Làm sạch văn bản & Chuẩn hóa Unicode",
			inputPlaceholder: "Nhập hoặc dán văn bản cần làm sạch vào đây...",
			outputPlaceholder: "Văn bản đã làm sạch sẽ hiển thị ở đây...",
			cleanBtn: "Làm sạch văn bản",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa hết",
			optionsTitle: "Tùy chọn làm sạch",
			optUnicode: "Chuẩn hóa Unicode",
			optInvisible: "Xóa ký tự ẩn & ký tự điều khiển",
			optEmoji: "Xóa ký tự Emojis & Biểu tượng",
			optHtml: "Loại bỏ thẻ HTML (Strip tags)",
			optHtmlEntities: "Giải mã thực thể HTML (vd: &amp; → &)",
			optWhitespace: "Chuẩn hóa khoảng trắng (Trim & xóa dấu cách thừa)",
			optQuotes: "Chuẩn hóa dấu ngoặc kép (“” → \"\", ‘’ → '')",
			unicodeNfc: "NFC (Khuyên dùng cho Tiếng Việt/Web)",
			unicodeNfd: "NFD (Tách âm)",
			unicodeNfkc: "NFKC (Tương thích)",
			unicodeNfkd: "NFKD (Tách tương thích)",
			unicodeNone: "Không chuẩn hóa",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const decodeEntities = (html: string) => {
		const textarea = document.createElement("textarea");
		textarea.innerHTML = html;
		return textarea.value;
	};

	const handleCleanText = () => {
		let text = inputText;

		// 1. Unicode Normalization
		if (unicodeForm !== "none") {
			text = text.normalize(unicodeForm);
		}

		// 2. Decode HTML Entities
		if (decodeHtmlEntities) {
			text = decodeEntities(text);
		}

		// 3. Strip HTML tags
		if (stripHtml) {
			text = text.replace(/<[^>]*>/g, "");
		}

		// 4. Remove Invisible and Control Characters
		if (removeInvisible) {
			// Zero-width spaces, joiners, control chars (except tab, newline)
			// range 00-08, 0B-0C, 0E-1F, 7F, zero-width chars: \u200B-\u200D\uFEFF
			// biome-ignore lint/suspicious/noControlCharactersInRegex: We intentionally target control characters to strip them from user text
			text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200D\uFEFF]/g, "");
		}

		// 5. Remove Emojis & Pictographs
		if (removeEmoji) {
			// standard regex for emojis using unicode property escapes
			try {
				text = text.replace(/\p{Extended_Pictographic}/gu, "");
				text = text.replace(/\p{Emoji_Presentation}/gu, "");
			} catch (e) {
				// Fallback if browser doesn't support unicode properties in regex
				text = text.replace(
					/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
					"",
				);
			}
		}

		// 6. Standardize quotes
		if (normalizeQuotes) {
			text = text
				.replace(/[\u201C\u201D\u201E\u201F]/g, '"') // smart double quotes
				.replace(/[\u2018\u2019\u201A\u201B]/g, "'"); // smart single quotes
		}

		// 7. Normalize Whitespaces
		if (normalizeWhitespace) {
			text = text
				.split("\n")
				.map((line) => {
					// Trim leading/trailing spaces
					let l = line.trim();
					// Replace double/multiple spaces with single space
					l = l.replace(/[ \t]+/g, " ");
					return l;
				})
				.join("\n");
			// Merge multiple empty lines to maximum 1 empty line
			text = text.replace(/\n{3,}/g, "\n\n");
		}

		setOutputText(text);
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
				{/* Left side input and config options */}
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
						{t.optionsTitle}
					</h3>

					{/* Unicode Normalizer */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.optUnicode}</label>
						<select
							class="input w-full"
							value={unicodeForm}
							onChange={(e) => setUnicodeForm((e.target as HTMLSelectElement).value as UnicodeForm)}
						>
							<option value="NFC">{t.unicodeNfc}</option>
							<option value="NFD">{t.unicodeNfd}</option>
							<option value="NFKC">{t.unicodeNfkc}</option>
							<option value="NFKD">{t.unicodeNfkd}</option>
							<option value="none">{t.unicodeNone}</option>
						</select>
					</div>

					{/* Toggle buttons */}
					<div class="space-y-3 pt-2">
						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={removeInvisible}
								onChange={(e) => setRemoveInvisible((e.target as HTMLInputElement).checked)}
							/>
							{t.optInvisible}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={normalizeWhitespace}
								onChange={(e) => setNormalizeWhitespace((e.target as HTMLInputElement).checked)}
							/>
							{t.optWhitespace}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={decodeHtmlEntities}
								onChange={(e) => setDecodeHtmlEntities((e.target as HTMLInputElement).checked)}
							/>
							{t.optHtmlEntities}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={stripHtml}
								onChange={(e) => setStripHtml((e.target as HTMLInputElement).checked)}
							/>
							{t.optHtml}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={normalizeQuotes}
								onChange={(e) => setNormalizeQuotes((e.target as HTMLInputElement).checked)}
							/>
							{t.optQuotes}
						</label>

						<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
							<input
								type="checkbox"
								class="accent-primary"
								checked={removeEmoji}
								onChange={(e) => setRemoveEmoji((e.target as HTMLInputElement).checked)}
							/>
							{t.optEmoji}
						</label>
					</div>

					{/* Action Buttons */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleCleanText}>
							{t.cleanBtn}
						</button>
						<button class="btn-secondary py-2.5 px-4" onClick={handleClear}>
							{t.clearBtn}
						</button>
					</div>
				</div>

				{/* Right side Textareas */}
				<div class="lg:col-span-7 space-y-4">
					{/* Input text */}
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

					{/* Output text */}
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
