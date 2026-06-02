import { useCallback, useEffect, useState } from "preact/hooks";
import JSZip from "jszip";

type SplitMethod = "separator" | "chars" | "words";
type SeparatorType = "newline" | "comma" | "semicolon" | "space" | "custom";

interface SplitPart {
	id: string;
	text: string;
	charCount: number;
	wordCount: number;
}

export default function TextSplitter() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState("");
	const [parts, setParts] = useState<SplitPart[]>([]);
	const [copiedPartId, setCopiedPartId] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "done">("idle");

	// Settings
	const [method, setMethod] = useState<SplitMethod>("separator");
	const [separatorType, setSeparatorType] = useState<SeparatorType>("newline");
	const [customSeparator, setCustomSeparator] = useState("---");
	const [maxLength, setMaxLength] = useState<number>(1000);
	const [maxWords, setMaxWords] = useState<number>(200);

	const t = {
		en: {
			title: "Text Splitter",
			inputPlaceholder: "Enter or paste your long text here...",
			partsTitle: "Split Parts",
			processBtn: "Split Text",
			downloadZip: "Download All Parts (ZIP)",
			copyPart: "Copy",
			copied: "Copied!",
			clearBtn: "Clear",
			settingsTitle: "Split Configuration",
			lblMethod: "Split Method",
			lblSeparator: "Separator Character",
			lblCustomSeparator: "Custom Separator",
			lblMaxLength: "Max Characters Per Part",
			lblMaxWords: "Max Words Per Part",
			methodSeparator: "By Separator",
			methodChars: "By Character Length",
			methodWords: "By Word Count",
			sepNewline: "New Line (\\n)",
			sepComma: "Comma (,)",
			sepSemicolon: "Semicolon (;)",
			sepSpace: "Space ( )",
			sepCustom: "Custom Text",
			infoChars: "chars",
			infoWords: "words",
		},
		vi: {
			title: "Bộ tách văn bản",
			inputPlaceholder: "Nhập hoặc dán văn bản dài cần tách vào đây...",
			partsTitle: "Các phần văn bản sau khi tách",
			processBtn: "Tách văn bản",
			downloadZip: "Tải toàn bộ các phần (ZIP)",
			copyPart: "Sao chép",
			copied: "Đã copy!",
			clearBtn: "Xóa hết",
			settingsTitle: "Cấu hình tách",
			lblMethod: "Phương pháp tách",
			lblSeparator: "Ký tự phân tách",
			lblCustomSeparator: "Ký tự phân tách tự chọn",
			lblMaxLength: "Số ký tự tối đa mỗi phần",
			lblMaxWords: "Số lượng từ tối đa mỗi phần",
			methodSeparator: "Theo ký tự phân tách",
			methodChars: "Theo độ dài ký tự",
			methodWords: "Theo số lượng từ",
			sepNewline: "Xuống dòng (\\n)",
			sepComma: "Dấu phẩy (,)",
			sepSemicolon: "Dấu chấm phẩy (;)",
			sepSpace: "Khoảng trắng ( )",
			sepCustom: "Chuỗi tự chọn",
			infoChars: "ký tự",
			infoWords: "từ",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Helper to count words
	const getWordCount = (str: string): number => {
		const s = str.trim();
		if (!s) return 0;
		return s.split(/\s+/).length;
	};

	const handleSplit = () => {
		if (!inputText) {
			setParts([]);
			return;
		}

		let rawParts: string[] = [];

		if (method === "separator") {
			// Find actual separator
			let sep = "\n";
			if (separatorType === "comma") sep = ",";
			else if (separatorType === "semicolon") sep = ";";
			else if (separatorType === "space") sep = " ";
			else if (separatorType === "custom") sep = customSeparator;

			rawParts = inputText.split(sep);
		} else if (method === "chars") {
			const len = Math.max(1, maxLength);
			for (let i = 0; i < inputText.length; i += len) {
				rawParts.push(inputText.substring(i, i + len));
			}
		} else if (method === "words") {
			// Split by words and rebuild chunks
			const words = inputText.trim().split(/\s+/);
			const limit = Math.max(1, maxWords);
			let currentChunk: string[] = [];

			for (const word of words) {
				currentChunk.push(word);
				if (currentChunk.length >= limit) {
					rawParts.push(currentChunk.join(" "));
					currentChunk = [];
				}
			}
			if (currentChunk.length > 0) {
				rawParts.push(currentChunk.join(" "));
			}
		}

		// Map to SplitPart
		const mappedParts: SplitPart[] = rawParts
			.map((txt) => txt.trim())
			.filter((txt) => txt !== "")
			.map((txt, index) => ({
				id: `part-${index + 1}-${Math.random().toString(36).substring(2, 6)}`,
				text: txt,
				charCount: txt.length,
				wordCount: getWordCount(txt),
			}));

		setParts(mappedParts);
		setStatus("done");
	};

	const handleCopyPart = (part: SplitPart) => {
		navigator.clipboard.writeText(part.text).then(() => {
			setCopiedPartId(part.id);
			setTimeout(() => setCopiedPartId(null), 2000);
		});
	};

	const handleDownloadZip = async () => {
		if (parts.length === 0) return;
		const zip = new JSZip();

		parts.forEach((part, index) => {
			zip.file(`part-${index + 1}.txt`, part.text);
		});

		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `split-parts-${Date.now()}.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleClear = () => {
		setInputText("");
		setParts([]);
		setStatus("idle");
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
							<path d="M12 6V18" />
							<path d="M6 12H18" />
						</svg>
						{t.settingsTitle}
					</h3>

					{/* Split Method */}
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.lblMethod}</label>
						<select
							class="input w-full"
							value={method}
							onChange={(e) => setMethod((e.target as HTMLSelectElement).value as SplitMethod)}
						>
							<option value="separator">{t.methodSeparator}</option>
							<option value="chars">{t.methodChars}</option>
							<option value="words">{t.methodWords}</option>
						</select>
					</div>

					{/* Custom inputs depending on split method */}
					{method === "separator" && (
						<>
							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.lblSeparator}</label>
								<select
									class="input w-full"
									value={separatorType}
									onChange={(e) =>
										setSeparatorType((e.target as HTMLSelectElement).value as SeparatorType)
									}
								>
									<option value="newline">{t.sepNewline}</option>
									<option value="comma">{t.sepComma}</option>
									<option value="semicolon">{t.sepSemicolon}</option>
									<option value="space">{t.sepSpace}</option>
									<option value="custom">{t.sepCustom}</option>
								</select>
							</div>
							{separatorType === "custom" && (
								<div>
									<label class="text-body-sm-strong text-ink block mb-2">
										{t.lblCustomSeparator}
									</label>
									<input
										type="text"
										class="input w-full"
										value={customSeparator}
										onInput={(e) => setCustomSeparator((e.target as HTMLInputElement).value)}
									/>
								</div>
							)}
						</>
					)}

					{method === "chars" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblMaxLength}</label>
							<input
								type="number"
								min="10"
								class="input w-full"
								value={maxLength}
								onInput={(e) =>
									setMaxLength(
										Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 10),
									)
								}
							/>
						</div>
					)}

					{method === "words" && (
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.lblMaxWords}</label>
							<input
								type="number"
								min="1"
								class="input w-full"
								value={maxWords}
								onInput={(e) =>
									setMaxWords(
										Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 5),
									)
								}
							/>
						</div>
					)}

					{/* Actions */}
					<div class="flex gap-2 pt-2">
						<button class="btn-primary flex-1 py-2.5" onClick={handleSplit}>
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

					{/* Split Output List */}
					{status === "done" && parts.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4 animate-fadeIn">
							<div class="flex justify-between items-center border-b border-hairline pb-3">
								<h3 class="text-body-strong text-ink">
									{t.partsTitle} ({parts.length})
								</h3>
								<button
									class="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
									onClick={handleDownloadZip}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="7 10 12 15 17 10" />
										<line x1="12" y1="15" x2="12" y2="3" />
									</svg>
									{t.downloadZip}
								</button>
							</div>

							{/* Output Parts List */}
							<div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
								{parts.map((part, index) => {
									const isCopied = copiedPartId === part.id;
									return (
										<div
											key={part.id}
											class="bg-surface-soft border border-hairline rounded-lg p-4 space-y-3 shadow-sm"
										>
											<div class="flex justify-between items-center border-b border-hairline/50 pb-2">
												<span class="text-xs font-bold text-ink-soft">
													Part {index + 1} / {parts.length}
												</span>
												<div class="flex items-center gap-3">
													<span class="text-[11px] text-muted">
														{part.charCount} {t.infoChars} | {part.wordCount} {t.infoWords}
													</span>
													<button
														class="btn-secondary py-1 px-3.5 text-xs flex items-center gap-1 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
														onClick={() => handleCopyPart(part)}
													>
														{isCopied ? (
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
																<span class="text-accent-emerald">{t.copied}</span>
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
																{t.copyPart}
															</>
														)}
													</button>
												</div>
											</div>
											<div class="text-body-sm font-mono whitespace-pre-wrap select-all max-h-[150px] overflow-y-auto leading-relaxed text-ink-soft bg-surface-elevated p-2 border border-hairline/30 rounded">
												{part.text}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
