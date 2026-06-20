import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface PdfPageItem {
	id: string;
	originalIndex: number;
	previewUrl: string;
	selected: boolean; // true = keep, false = delete
}

export default function PdfDeletePages() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "error">("idle");
	const [errorMsg, setErrorMsg] = useState("");
	const [pages, setPages] = useState<PdfPageItem[]>([]);

	const t = {
		en: {
			title: "PDF Page Remover Tool",
			lblSettings: "Document Control",
			btnSave: "Export PDF (Without Deleted Pages)",
			clearBtn: "Choose Another File",
			statusEngine: "Loading pages previews...",
			statusSaving: "Saving new PDF...",
			colPages: "Pages Selection",
			statusKeep: "Keep Page",
			statusDelete: "Delete Page",
			summaryText: "Selected to keep: ",
			summaryDeleted: "To be deleted: ",
			errorLoading: "Failed to render PDF previews.",
			errorSaving: "Failed to generate PDF.",
			errorZeroPages: "You must keep at least one page in the document.",
		},
		vi: {
			title: "Xóa trang PDF",
			lblSettings: "Trạng thái tệp",
			btnSave: "Xuất tệp PDF đã xóa trang",
			clearBtn: "Chọn tệp khác",
			statusEngine: "Đang tải bản xem trước...",
			statusSaving: "Đang lưu tệp PDF mới...",
			colPages: "Lựa chọn trang",
			statusKeep: "Giữ lại",
			statusDelete: "Xóa đi",
			summaryText: "Số trang giữ lại: ",
			summaryDeleted: "Số trang sẽ xóa: ",
			errorLoading: "Không thể kết xuất bản xem trước trang.",
			errorSaving: "Không thể xuất tệp PDF mới.",
			errorZeroPages: "Bạn phải giữ lại ít nhất một trang trong tài liệu.",
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
					const viewport = page.getViewport({ scale: 0.5 });

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
						originalIndex: pageNum - 1,
						previewUrl: canvas.toDataURL("image/png"),
						selected: true, // Selected to KEEP by default
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

	const togglePage = (id: string) => {
		setPages((prev) =>
			prev.map((p) => {
				if (p.id === id) {
					return { ...p, selected: !p.selected };
				}
				return p;
			}),
		);
		setErrorMsg("");
	};

	const handleSave = async () => {
		if (!file || pages.length === 0) return;

		const keptPages = pages.filter((p) => p.selected);
		if (keptPages.length === 0) {
			setErrorMsg(t.errorZeroPages);
			return;
		}

		setStatus("saving");
		setErrorMsg("");

		try {
			const arrayBuffer = await file.arrayBuffer();
			const srcDoc = await PDFDocument.load(arrayBuffer);
			const newDoc = await PDFDocument.create();

			const copiedPages = await newDoc.copyPages(
				srcDoc,
				keptPages.map((p) => p.originalIndex),
			);
			copiedPages.forEach((page) => newDoc.addPage(page));

			const pdfBytes = await newDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(pdfBlob, `${baseName}-cleaned.pdf`);
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

	const keptCount = pages.filter((p) => p.selected).length;
	const deletedCount = pages.length - keptCount;

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
							label="Drop a PDF file here to delete pages"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
								<div class="text-muted">Total: {pages.length} pages</div>
							</div>

							{/* Summary Counts */}
							{status === "ready" && (
								<div class="space-y-1.5 text-xs">
									<div class="flex justify-between font-bold text-accent-emerald">
										<span>{t.summaryText}</span>
										<span>{keptCount}</span>
									</div>
									<div class="flex justify-between font-bold text-accent-rose">
										<span>{t.summaryDeleted}</span>
										<span>{deletedCount}</span>
									</div>
								</div>
							)}

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

					{errorMsg && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5 text-body-sm text-accent-rose font-bold">
							{errorMsg}
						</div>
					)}

					{status === "ready" && pages.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.colPages}
							</h3>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
								{pages.map((img, index) => (
									<button
										key={img.id}
										class={`bg-surface-soft border rounded-lg p-3 text-left space-y-2 relative block w-full transition-all cursor-pointer ${
											img.selected
												? "border-hairline"
												: "border-accent-rose bg-accent-rose/5 opacity-70"
										}`}
										onClick={() => togglePage(img.id)}
										type="button"
									>
										<div class="aspect-[3/4] w-full rounded overflow-hidden bg-white border border-hairline flex items-center justify-center relative">
											<img
												src={img.previewUrl}
												alt={`Page ${index + 1}`}
												class="max-h-36 object-contain shadow-sm"
											/>
											{!img.selected && (
												<div class="absolute inset-0 bg-accent-rose/20 flex items-center justify-center font-bold text-accent-rose text-sm">
													DELETED
												</div>
											)}
										</div>
										<div class="flex items-center justify-between text-xs">
											<span class="font-mono font-bold text-ink">Page {index + 1}</span>
											<span
												class={`font-bold ${img.selected ? "text-accent-emerald" : "text-accent-rose"}`}
											>
												{img.selected ? t.statusKeep : t.statusDelete}
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
