import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

type NumberPosition =
	| "footer-left"
	| "footer-center"
	| "footer-right"
	| "header-left"
	| "header-center"
	| "header-right";

export default function PdfPageNumbers() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");
	const [totalPages, setTotalPages] = useState(0);

	const [position, setPosition] = useState<NumberPosition>("footer-center");
	const [startNumber, setStartNumber] = useState(1);
	const [fontSize, setFontSize] = useState(10);
	const [margin, setMargin] = useState(25);
	const [skipFirstPage, setSkipFirstPage] = useState(true);
	const [formatPattern, setFormatPattern] = useState("Page {X} of {Y}");

	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Add Page Numbers to PDF",
			lblSettings: "Page Number Settings",
			lblPosition: "Position",
			lblStartNumber: "Start Numbering From",
			lblFontSize: "Font Size",
			lblMargin: "Margin from edge (pt)",
			lblSkipFirst: "Skip numbering on the first page (Cover page)",
			lblPattern: "Number Format",
			btnProcess: "Add Numbers & Download",
			clearBtn: "Choose Another File",
			processingText: "Adding page numbers...",
			patternHelp: "Use {X} for page number and {Y} for total pages",
		},
		vi: {
			title: "Đánh số trang PDF",
			lblSettings: "Cấu hình số trang",
			lblPosition: "Vị trí đặt",
			lblStartNumber: "Bắt đầu đánh số từ",
			lblFontSize: "Cỡ chữ",
			lblMargin: "Khoảng cách cách lề (pt)",
			lblSkipFirst: "Không đánh số trang đầu tiên (Trang bìa)",
			lblPattern: "Định dạng hiển thị",
			btnProcess: "Đánh số & Tải về",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang tiến hành đánh số...",
			patternHelp: "Sử dụng {X} làm số trang hiện tại và {Y} làm tổng số trang",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setError(null);

		try {
			const arrayBuffer = await f.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			setFile(f);
			setFileName(f.name);
			setTotalPages(pdfDoc.getPageCount());
			setPageSize(formatFileSize(f.size));
		} catch (e) {
			setError(`Failed to load PDF: ${(e as Error).message}`);
		}
	}, []);

	const handleAddNumbers = async () => {
		if (!file) return;
		setProcessing(true);
		setError(null);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
			const pages = pdfDoc.getPages();

			for (let i = 0; i < pages.length; i++) {
				if (skipFirstPage && i === 0) continue;

				const page = pages[i];
				const { width, height } = page.getSize();

				// Build the page number string
				const pageNumber = i + startNumber - (skipFirstPage ? 1 : 0);
				const label = formatPattern
					.replace("{X}", String(pageNumber))
					.replace("{Y}", String(pages.length - (skipFirstPage ? 1 : 0)));

				const textWidth = font.widthOfTextAtSize(label, fontSize);
				const textHeight = font.heightAtSize(fontSize);

				let x = margin;
				let y = margin;

				// Compute X
				if (position.includes("center")) {
					x = (width - textWidth) / 2;
				} else if (position.includes("right")) {
					x = width - margin - textWidth;
				}

				// Compute Y
				if (position.startsWith("header")) {
					y = height - margin - textHeight;
				}

				// Draw the text
				page.drawText(label, {
					x,
					y,
					size: fontSize,
					font,
					color: rgb(0.2, 0.2, 0.2), // Dark grey
				});
			}

			const pdfBytes = await pdfDoc.save();
			const blob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-numbered.pdf`);
		} catch (err) {
			console.error(err);
			setError("Failed to add page numbers to PDF.");
		} finally {
			setProcessing(false);
		}
	};

	const handleReset = () => {
		setFile(null);
		setFileName("");
		setPageSize("");
		setTotalPages(0);
		setError(null);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblSettings}
					</h3>

					{!file ? (
						<FileDropZone
							accept=".pdf"
							multiple={false}
							onFiles={handleFiles}
							label="Drop a PDF file here to add page numbers"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">
									{totalPages} pages • {pageSize}
								</div>
							</div>

							{/* Format Pattern */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblPattern}</label>
								<input
									type="text"
									class="input w-full"
									value={formatPattern}
									onInput={(e) => setFormatPattern((e.target as HTMLInputElement).value)}
								/>
								<span class="text-[10px] text-muted block leading-normal">{t.patternHelp}</span>
							</div>

							{/* Position */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblPosition}</label>
								<select
									class="input w-full"
									value={position}
									onChange={(e) => setPosition((e.target as HTMLSelectElement).value as any)}
								>
									<option value="footer-center">Footer Center</option>
									<option value="footer-left">Footer Left</option>
									<option value="footer-right">Footer Right</option>
									<option value="header-center">Header Center</option>
									<option value="header-left">Header Left</option>
									<option value="header-right">Header Right</option>
								</select>
							</div>

							{/* Custom start value */}
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label class="text-body-sm-strong text-ink block">{t.lblStartNumber}</label>
									<input
										type="number"
										class="input w-full font-bold"
										min="1"
										value={startNumber}
										onInput={(e) =>
											setStartNumber(
												Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
											)
										}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm-strong text-ink block">{t.lblFontSize}</label>
									<input
										type="number"
										class="input w-full font-bold"
										min="6"
										max="24"
										value={fontSize}
										onInput={(e) =>
											setFontSize(
												Math.max(6, Number.parseInt((e.target as HTMLInputElement).value) || 10),
											)
										}
									/>
								</div>
							</div>

							{/* Margin */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblMargin}</label>
								<input
									type="number"
									class="input w-full font-bold"
									min="5"
									max="100"
									value={margin}
									onInput={(e) =>
										setMargin(
											Math.max(5, Number.parseInt((e.target as HTMLInputElement).value) || 20),
										)
									}
								/>
							</div>

							{/* Skip cover page */}
							<div>
								<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
									<input
										type="checkbox"
										class="accent-primary"
										checked={skipFirstPage}
										onChange={(e) => setSkipFirstPage((e.target as HTMLInputElement).checked)}
									/>
									{t.lblSkipFirst}
								</label>
							</div>

							<button
								class="btn-primary w-full py-2.5"
								onClick={handleAddNumbers}
								disabled={processing}
							>
								{processing ? t.processingText : t.btnProcess}
							</button>

							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Preview / Instructions */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold">Standard Coordinates Reference</h4>
						<p class="text-body-sm text-muted leading-relaxed">
							PDF documents use points (pt) as default coordinates: <strong>72 pt = 1 inch</strong>.
							This tool uses standard Helvetica typography, computing bounding boxes dynamically to
							format the numbering placement.
						</p>
						<div class="text-xs text-muted border-t border-hairline pt-3 space-y-1.5">
							<p class="font-bold text-ink">Tips:</p>
							<ul class="list-disc pl-5 space-y-1">
								<li>Standard margins are usually 20-30 pt from the page edge.</li>
								<li>If your PDF has a colored footer, try selecting a header position instead.</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
