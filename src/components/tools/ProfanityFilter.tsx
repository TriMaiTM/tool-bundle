import { useCallback, useEffect, useState } from "preact/hooks";

type FilterMode = "censor" | "remove" | "highlight";

const DEFAULT_VI_BAD_WORDS = [
	"đm",
	"đéo",
	"cứt",
	"buồi",
	"lồn",
	"dcm",
	"đmm",
	"clgt",
	"mẹ kiếp",
	"khốn nạn",
	"đồ chó",
	"thằng chó",
	"đm",
	"đeo",
	"cut",
	"buoi",
	"lon",
	"cho",
	"vai",
	"vãi",
	"chó",
	"cặc",
	"cac",
	"đút",
	"đứt",
	"đm",
	"vcl",
	"đống mạt",
	"đốn mạt",
	"óc chó",
	"oc cho",
	"ngu lồn",
	"ngu lon",
	"hãm lồn",
	"ham lon",
	"hãm",
	"đâm",
	"đít",
];

const DEFAULT_EN_BAD_WORDS = [
	"fuck",
	"shit",
	"asshole",
	"bitch",
	"cunt",
	"bastard",
	"dick",
	"pussy",
	"damn",
	"crap",
	"wanker",
	"motherfucker",
	"fucker",
	"fucking",
	"shitting",
	"bitches",
	"dicks",
];

export default function ProfanityFilter() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [highlightedHtml, setHighlightedHtml] = useState("");
	const [detectedCount, setDetectedCount] = useState(0);
	const [copied, setCopied] = useState(false);

	// Settings
	const [filterMode, setFilterMode] = useState<FilterMode>("censor");
	const [censorChar, setCensorChar] = useState("*");
	const [customWordsInput, setCustomWordsInput] = useState("");

	const t = {
		en: {
			title: "Profanity Filter & Bad Words Detector",
			inputPlaceholder: "Enter or paste your text here to scan for profanity...",
			outputPlaceholder: "Censored text will appear here...",
			processBtn: "Scan & Filter Text",
			copyBtn: "Copy Text",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Filter Configuration",
			lblMode: "Action Mode",
			lblCensorChar: "Censor Character",
			lblCustomWords: "Custom Bad Words (Comma separated)",
			lblStats: "Scan Report",
			detectedCount: "Bad words detected",
			modeCensor: "Censor (Replace with ***)",
			modeRemove: "Remove bad words",
			modeHighlight: "Highlight bad words",
			censorStar: "Asterisk (*)",
			censorHash: "Hash (#)",
			censorCross: "X character (x)",
			previewHtmlTitle: "Highlighted Text Output",
		},
		vi: {
			title: "Bộ lọc từ thô tục & Từ nhạy cảm",
			inputPlaceholder: "Nhập hoặc dán văn bản cần lọc từ nhạy cảm vào đây...",
			outputPlaceholder: "Văn bản đã lọc sẽ hiển thị ở đây...",
			processBtn: "Kiểm tra & Lọc từ cấm",
			copyBtn: "Sao chép kết quả",
			copied: "Đã copy!",
			clearBtn: "Xóa sạch",
			settingsTitle: "Cấu hình bộ lọc",
			lblMode: "Cách xử lý từ cấm",
			lblCensorChar: "Ký tự che giấu",
			lblCustomWords: "Từ cấm bổ sung (Cách nhau bằng dấu phẩy)",
			lblStats: "Báo cáo kiểm tra",
			detectedCount: "Số từ nhạy cảm phát hiện",
			modeCensor: "Che giấu (Thay thế bằng ***)",
			modeRemove: "Xóa hẳn từ cấm khỏi văn bản",
			modeHighlight: "Đánh dấu nổi bật (Tô đỏ)",
			censorStar: "Dấu sao (*)",
			censorHash: "Dấu thăng (#)",
			censorCross: "Chữ X (x)",
			previewHtmlTitle: "Hiển thị văn bản đánh dấu nổi bật",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Safe HTML escape to prevent XSS in highlighted output
	const escapeHtml = (unsafe: string) => {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	};

	const handleFilterText = () => {
		if (!inputText) {
			setOutputText("");
			setHighlightedHtml("");
			setDetectedCount(0);
			return;
		}

		// Compile list of bad words
		let badWords = [...DEFAULT_VI_BAD_WORDS, ...DEFAULT_EN_BAD_WORDS];
		if (customWordsInput.trim()) {
			const custom = customWordsInput
				.split(",")
				.map((w) => w.trim().toLowerCase())
				.filter((w) => w !== "");
			badWords = [...badWords, ...custom];
		}

		// Remove duplicate words in list
		badWords = Array.from(new Set(badWords));

		// Sort words by length descending so longer phrases get replaced first
		badWords.sort((a, b) => b.length - a.length);

		let count = 0;
		let tempText = inputText;

		// We will build a regex matching any of the bad words as whole words
		// To handle accents and spacing correctly, we can build individual regexes or a combined regex
		// For Vietnamese/non-English, standard word boundaries (\b) don't always behave perfectly,
		// so we can use spacing/punctuation matching or simple replacement
		const escapedWords = badWords.map((word) => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));

		// Map for censor characters
		const getCensorString = (len: number) => censorChar.repeat(len);

		if (filterMode === "censor") {
			for (const word of escapedWords) {
				const regex = new RegExp(`\\b${word}\\b`, "gi");
				// Count matches
				const matches = tempText.match(regex);
				if (matches) {
					count += matches.length;
					tempText = tempText.replace(regex, (match) => getCensorString(match.length));
				}
			}
			setOutputText(tempText);
			setDetectedCount(count);
		} else if (filterMode === "remove") {
			for (const word of escapedWords) {
				const regex = new RegExp(`\\b${word}\\b`, "gi");
				const matches = tempText.match(regex);
				if (matches) {
					count += matches.length;
					tempText = tempText.replace(regex, "");
				}
			}
			// Clean up extra spaces left behind
			tempText = tempText.replace(/[ \t]+/g, " ");
			setOutputText(tempText);
			setDetectedCount(count);
		} else {
			// Highlight Mode: We must escape the whole text first, then wrap bad words in <mark> tags
			let html = escapeHtml(inputText);

			// We do replacement on HTML text. We must be careful not to replace inside tags,
			// but since our tag is only <mark>, we are safe if we run the replace sequentially.
			// To prevent replacing inside the newly added "<mark class=...>" tags, we can replace
			// bad words with placeholder IDs, and then replace those IDs with the mark tags.
			const placeholders: Record<string, string> = {};
			let idCounter = 0;

			for (const word of escapedWords) {
				// Escape regex chars
				const regex = new RegExp(`\\b${word}\\b`, "gi");

				html = html.replace(regex, (match) => {
					count++;
					const placeholderId = `___BADWORD_PLACEHOLDER_${idCounter++}___`;
					placeholders[placeholderId] =
						`<mark class="bg-red-200 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold px-1 rounded">${match}</mark>`;
					return placeholderId;
				});
			}

			// Restore placeholders with mark tags
			for (const [id, markTag] of Object.entries(placeholders)) {
				html = html.replace(id, markTag);
			}

			setHighlightedHtml(html.replace(/\n/g, "<br />"));
			setOutputText(inputText); // fallback output
			setDetectedCount(count);
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
		setHighlightedHtml("");
		setDetectedCount(0);
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

					{/* Action Mode Selection */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblMode}</label>
						<select
							class="input w-full"
							value={filterMode}
							onChange={(e) => setFilterMode((e.target as HTMLSelectElement).value as FilterMode)}
						>
							<option value="censor">{t.modeCensor}</option>
							<option value="remove">{t.modeRemove}</option>
							<option value="highlight">{t.modeHighlight}</option>
						</select>
					</div>

					{/* Censor Character */}
					{filterMode === "censor" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblCensorChar}</label>
							<select
								class="input w-full"
								value={censorChar}
								onChange={(e) => setCensorChar((e.target as HTMLSelectElement).value)}
							>
								<option value="*">{t.censorStar}</option>
								<option value="#">{t.censorHash}</option>
								<option value="x">{t.censorCross}</option>
							</select>
						</div>
					)}

					{/* Custom Words */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblCustomWords}</label>
						<textarea
							class="textarea w-full font-mono text-xs"
							style={{ minHeight: "80px" }}
							placeholder="word1, word2, word3..."
							value={customWordsInput}
							onInput={(e) => setCustomWordsInput((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Report Card */}
					<div class="bg-surface-soft p-4 rounded-lg border border-hairline space-y-2">
						<h4 class="text-xs font-bold text-ink border-b border-hairline/50 pb-1">
							{t.lblStats}
						</h4>
						<div class="flex justify-between items-center text-body-sm">
							<span class="text-muted">{t.detectedCount}:</span>
							<span
								class={`font-bold ${detectedCount > 0 ? "text-accent-rose" : "text-accent-emerald"}`}
							>
								{detectedCount}
							</span>
						</div>
					</div>

					{/* Actions */}
					<div class="flex gap-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleFilterText}>
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

					{/* Output Text / HTML Highlight Box */}
					{filterMode === "highlight" ? (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2">
								{t.previewHtmlTitle}
							</h3>
							<div
								class="textarea font-mono text-body-sm w-full overflow-y-auto whitespace-pre-wrap leading-relaxed text-ink-soft bg-surface-soft border border-hairline p-3 rounded"
								style={{ minHeight: "180px", maxHeight: "350px" }}
								dangerouslySetInnerHTML={{
									__html: highlightedHtml || `<i>${t.outputPlaceholder}</i>`,
								}}
							/>
						</div>
					) : (
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
					)}
				</div>
			</div>
		</div>
	);
}
