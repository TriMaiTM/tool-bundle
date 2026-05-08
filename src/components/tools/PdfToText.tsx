import { PDFDocument } from "pdf-lib";
import { useCallback, useState } from "preact/hooks";
import { copyToClipboard, downloadText, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfToText() {
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [totalPages, setTotalPages] = useState(0);
	const [pageSize, setPageSize] = useState("");
	const [processing, setProcessing] = useState(false);
	const [extractedText, setExtractedText] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [pageTexts, setPageTexts] = useState<{ page: number; text: string }[]>([]);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setExtractedText(null);
		setPageTexts([]);
		setCopied(false);

		try {
			const arrayBuffer = await f.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			setFile(f);
			setFileName(f.name);
			setTotalPages(pdfDoc.getPageCount());
			setPageSize(formatFileSize(f.size));
		} catch (e) {
			alert(`Failed to load PDF: ${(e as Error).message}`);
		}
	}, []);

	const handleExtract = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		setExtractedText(null);
		setPageTexts([]);
		setCopied(false);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const pages = pdfDoc.getPages();

			const allPageTexts: { page: number; text: string }[] = [];

			for (let i = 0; i < pages.length; i++) {
				const page = pages[i];
				const textContent = await page.getTextContent();

				let pageText = "";
				if (textContent?.items && textContent.items.length > 0) {
					const textItems = textContent.items
						.filter((item: any) => item.str !== undefined)
						.map((item: any) => item.str as string);
					pageText = textItems.join(" ");
				}

				allPageTexts.push({
					page: i + 1,
					text: pageText.trim(),
				});
			}

			setPageTexts(allPageTexts);

			const fullText = allPageTexts.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");

			setExtractedText(fullText);
		} catch (e) {
			alert(`Text extraction failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file]);

	const handleCopy = useCallback(async () => {
		if (!extractedText) return;
		const success = await copyToClipboard(extractedText);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [extractedText]);

	const handleDownloadText = useCallback(() => {
		if (!extractedText) return;
		const baseName = fileName.replace(/\.pdf$/i, "");
		downloadText(extractedText, `${baseName}.txt`);
	}, [extractedText, fileName]);

	const handleReset = useCallback(() => {
		setFile(null);
		setFileName("");
		setTotalPages(0);
		setPageSize("");
		setExtractedText(null);
		setPageTexts([]);
		setCopied(false);
	}, []);

	const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;
	const charCount = extractedText ? extractedText.length : 0;

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept=".pdf"
					multiple={false}
					onFiles={handleFiles}
					label="Drop a PDF file here to extract text"
					sublabel="Extract text content from all pages of your PDF"
				/>
			) : (
				<div>
					{/* File Info */}
					<div class="bg-surface-elevated rounded-lg p-4 mb-6">
						<div class="text-caption-uppercase text-muted mb-3">Document Info</div>
						<div class="text-body text-primary truncate mb-1">{fileName}</div>
						<div class="text-caption text-muted">
							{totalPages} pages • {pageSize}
						</div>
					</div>

					{/* Extract Button */}
					{!extractedText && !processing && (
						<div class="flex flex-wrap gap-3 mb-6">
							<button class="btn-primary" onClick={handleExtract}>
								Extract Text
							</button>
							<button class="btn-secondary" onClick={handleReset}>
								Choose Another File
							</button>
						</div>
					)}

					{/* Processing State */}
					{processing && (
						<div class="bg-surface-elevated rounded-lg p-8 mb-6 text-center">
							<div class="text-body text-primary mb-2">Extracting text...</div>
							<div class="text-caption text-muted">Processing {totalPages} pages</div>
						</div>
					)}

					{/* Results */}
					{extractedText && !processing && (
						<div>
							{/* Stats */}
							<div class="bg-surface-elevated rounded-lg p-4 mb-6">
								<div class="text-caption-uppercase text-muted mb-3">Extraction Results</div>
								<div class="grid grid-cols-3 gap-4 text-center">
									<div>
										<div class="text-display-sm text-primary">{wordCount}</div>
										<div class="text-caption text-muted">Words</div>
									</div>
									<div>
										<div class="text-display-sm text-primary">{charCount}</div>
										<div class="text-caption text-muted">Characters</div>
									</div>
									<div>
										<div class="text-display-sm text-primary">
											{pageTexts.filter((p) => p.text).length}
										</div>
										<div class="text-caption text-muted">Pages with text</div>
									</div>
								</div>
							</div>

							{/* Text Area */}
							<div class="mb-6">
								<div class="flex items-center justify-between mb-2">
									<label class="text-caption-uppercase text-muted">Extracted Text</label>
									<div class="flex gap-2">
										<button
											class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors flex items-center gap-2"
											onClick={handleCopy}
										>
											{copied ? (
												<>
													<svg
														class="w-4 h-4 text-accent-emerald"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<polyline points="20 6 9 17 4 12" />
													</svg>
													Copied!
												</>
											) : (
												<>
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
														<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
													</svg>
													Copy
												</>
											)}
										</button>
										<button
											class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors flex items-center gap-2"
											onClick={handleDownloadText}
										>
											<svg
												class="w-4 h-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
												<polyline points="7 10 12 15 17 10" />
												<line x1="12" y1="15" x2="12" y2="3" />
											</svg>
											Download .txt
										</button>
									</div>
								</div>
								<textarea
									class="textarea font-mono text-body-sm"
									value={extractedText}
									readOnly
									rows={15}
									style="resize: vertical"
								/>
							</div>

							{/* Actions */}
							<div class="flex flex-wrap gap-3">
								<button class="btn-secondary" onClick={handleReset}>
									Choose Another File
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
