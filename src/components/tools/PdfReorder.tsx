import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface PdfPageItem {
	id: string;
	originalIndex: number;
	previewUrl: string;
}

export default function PdfReorder() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "error">("idle");
	const [errorMsg, setErrorMsg] = useState("");
	const [pages, setPages] = useState<PdfPageItem[]>([]);

	const t = {
		en: {
			title: "PDF Page Reorder Tool",
			lblSettings: "Document Status",
			btnSave: "Export Reordered PDF",
			clearBtn: "Choose Another File",
			statusEngine: "Loading pages previews...",
			statusSaving: "Saving new PDF...",
			colPages: "Pages Grid",
			moveLeft: "Left",
			moveRight: "Right",
			errorLoading: "Failed to render PDF previews.",
			errorSaving: "Failed to generate reordered PDF.",
		},
		vi: {
			title: "Sắp xếp lại trang PDF",
			lblSettings: "Trạng thái tệp",
			btnSave: "Xuất tệp PDF mới",
			clearBtn: "Chọn tệp khác",
			statusEngine: "Đang tải bản xem trước...",
			statusSaving: "Đang lưu tệp PDF mới...",
			colPages: "Danh sách trang",
			moveLeft: "Trái",
			moveRight: "Phải",
			errorLoading: "Không thể kết xuất bản xem trước trang.",
			errorSaving: "Không thể xuất tệp PDF mới.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Dynamic script loader for pdf.js
	const loadPdfJS = (): Promise<any> => {
		return new Promise((resolve, reject) => {
			if ((window as any).pdfjsLib) {
				resolve((window as any).pdfjsLib);
				return;
			}
			const script = document.createElement("script");
			script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
			script.onload = () => {
				const pdfjs = (window as any).pdfjsLib;
				pdfjs.GlobalWorkerOptions.workerSrc =
					"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
				resolve(pdfjs);
			};
			script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
			document.head.appendChild(script);
		});
	};

	const loadPagePreviews = useCallback(
		async (f: File) => {
			setStatus("loading");
			setErrorMsg("");
			setPages([]);

			let pdfjs: any;
			try {
				pdfjs = await loadPdfJS();
			} catch {
				setStatus("error");
				setErrorMsg("Failed to load PDF preview engine from CDN.");
				return;
			}

			try {
				const arrayBuffer = await f.arrayBuffer();
				const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
				const pdf = await loadingTask.promise;
				const numPages = pdf.numPages;

				const items: PdfPageItem[] = [];
				for (let pageNum = 1; pageNum <= numPages; pageNum++) {
					const page = await pdf.getPage(pageNum);
					const viewport = page.getViewport({ scale: 0.5 }); // Lower scale for thumbnails

					const canvas = document.createElement("canvas");
					const context = canvas.getContext("2d");
					if (!context) continue;

					canvas.height = viewport.height;
					canvas.width = viewport.width;

					await page.render({
						canvasContext: context,
						viewport: viewport,
					}).promise;

					items.push({
						id: Math.random().toString(36).substr(2, 9),
						originalIndex: pageNum - 1, // 0-indexed
						previewUrl: canvas.toDataURL("image/png"),
					});
				}

				setPages(items);
				setStatus("ready");
			} catch (err) {
				console.error(err);
				setStatus("error");
				setErrorMsg(t.errorLoading);
			}
		},
		[t.errorLoading],
	);

	const handleFiles = (files: File[]) => {
		const f = files[0];
		setFile(f);
		setFileName(f.name);
		setPageSize(formatFileSize(f.size));
		loadPagePreviews(f);
	};

	const handleMove = (index: number, direction: "left" | "right") => {
		const targetIndex = direction === "left" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= pages.length) return;

		setPages((prev) => {
			const updated = [...prev];
			const temp = updated[index];
			updated[index] = updated[targetIndex];
			updated[targetIndex] = temp;
			return updated;
		});
	};

	const handleSave = async () => {
		if (!file || pages.length === 0) return;
		setStatus("saving");

		try {
			const arrayBuffer = await file.arrayBuffer();
			const srcDoc = await PDFDocument.load(arrayBuffer);
			const newDoc = await PDFDocument.create();

			// Copy pages in the specified order
			const copiedPages = await newDoc.copyPages(
				srcDoc,
				pages.map((p) => p.originalIndex),
			);
			copiedPages.forEach((page) => newDoc.addPage(page));

			const pdfBytes = await newDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(pdfBlob, `${baseName}-reordered.pdf`);
			setStatus("ready");
		} catch (err) {
			console.error(err);
			setStatus("error");
			setErrorMsg(t.errorSaving);
		}
	};

	const handleReset = () => {
		setFile(null);
		setFileName("");
		setPageSize("");
		setPages([]);
		setStatus("idle");
		setErrorMsg("");
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblSettings}
					</h3>

					{!file ? (
						<FileDropZone
							accept=".pdf"
							multiple={false}
							onFiles={handleFiles}
							label="Drop a PDF file here to reorder pages"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
								<div class="text-muted">Pages: {pages.length}</div>
							</div>

							{status === "ready" && (
								<button class="btn-primary w-full py-2.5" onClick={handleSave}>
									{t.btnSave}
								</button>
							)}

							{file && status !== "loading" && status !== "saving" && (
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.clearBtn}
								</button>
							)}
						</div>
					)}
				</div>

				{/* Preview Column */}
				<div class="lg:col-span-8 space-y-4">
					{status === "loading" && (
						<div class="bg-surface-elevated rounded-lg p-10 border border-hairline shadow-sm text-center text-muted text-body-sm">
							{t.statusEngine}
						</div>
					)}

					{status === "saving" && (
						<div class="bg-surface-elevated rounded-lg p-10 border border-hairline shadow-sm text-center text-muted text-body-sm">
							{t.statusSaving}
						</div>
					)}

					{status === "error" && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5">
							<h4 class="text-body-sm-strong text-accent-rose font-bold mb-1">Error</h4>
							<p class="text-body-sm text-muted">{errorMsg}</p>
						</div>
					)}

					{status === "ready" && pages.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.colPages}
							</h3>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
								{pages.map((img, index) => (
									<div
										key={img.id}
										class="bg-surface-soft border border-hairline rounded-lg p-3 space-y-2 relative"
									>
										<div class="aspect-[3/4] w-full rounded overflow-hidden bg-white border border-hairline flex items-center justify-center">
											<img
												src={img.previewUrl}
												alt={`Page ${index + 1}`}
												class="max-h-36 object-contain shadow-sm"
											/>
										</div>
										<div class="flex items-center justify-between">
											<span class="text-xs font-mono font-bold text-ink">Page {index + 1}</span>
											<span class="text-[10px] text-muted">(Orig: {img.originalIndex + 1})</span>
										</div>
										<div class="flex gap-2">
											<button
												class="btn-secondary py-1 px-2 text-[10px] flex-1 text-center font-bold"
												disabled={index === 0}
												onClick={() => handleMove(index, "left")}
											>
												{t.moveLeft}
											</button>
											<button
												class="btn-secondary py-1 px-2 text-[10px] flex-1 text-center font-bold"
												disabled={index === pages.length - 1}
												onClick={() => handleMove(index, "right")}
											>
												{t.moveRight}
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
