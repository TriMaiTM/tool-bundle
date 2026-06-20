import JSZip from "jszip";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface ImagePage {
	pageNum: number;
	dataUrl: string;
}

export default function PdfToImages() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");
	const [totalPages, setTotalPages] = useState(0);

	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState<"idle" | "loading-engine" | "rendering" | "done" | "error">(
		"idle",
	);
	const [errorMsg, setErrorMsg] = useState("");

	const [renderedImages, setRenderedImages] = useState<ImagePage[]>([]);
	const [format, setFormat] = useState<"png" | "jpeg">("png");
	const [zipDownload, setZipDownload] = useState(false);

	const t = {
		en: {
			title: "PDF to Images Extractor",
			lblSettings: "Extraction Settings",
			lblFormat: "Image Format",
			btnExtract: "Extract Pages",
			btnDownloadAll: "Download All (ZIP)",
			btnDownloadPage: "Download",
			clearBtn: "Choose Another File",
			statusEngine: "Loading PDF rendering engine...",
			statusRendering: "Rendering page ",
			statusDone: "Extraction completed successfully!",
			errorLoading: "Failed to parse PDF document. Ensure it is not password protected.",
			errorEngine: "Failed to load PDF engine. Check internet connection.",
		},
		vi: {
			title: "Chuyển PDF thành ảnh",
			lblSettings: "Cấu hình trích xuất",
			lblFormat: "Định dạng hình ảnh",
			btnExtract: "Bắt đầu trích xuất",
			btnDownloadAll: "Tải toàn bộ (ZIP)",
			btnDownloadPage: "Tải về",
			clearBtn: "Chọn tệp khác",
			statusEngine: "Đang tải thư viện xử lý PDF...",
			statusRendering: "Đang chuyển đổi trang ",
			statusDone: "Trích xuất ảnh thành công!",
			errorLoading: "Không thể phân tích tệp PDF. Đảm bảo tệp không bị khóa mật khẩu.",
			errorEngine: "Không thể tải trình dựng PDF. Kiểm tra kết nối internet.",
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

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setFileName(f.name);
		setPageSize(formatFileSize(f.size));
		setTotalPages(0);
		setRenderedImages([]);
		setStatus("idle");
		setProgress(0);
		setErrorMsg("");
	}, []);

	const handleExtract = async () => {
		if (!file) return;

		setStatus("loading-engine");
		setProgress(0);
		setErrorMsg("");
		setRenderedImages([]);

		let pdfjs: any;
		try {
			pdfjs = await loadPdfJS();
		} catch {
			setStatus("error");
			setErrorMsg(t.errorEngine);
			return;
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
			const pdf = await loadingTask.promise;

			const pagesCount = pdf.numPages;
			setTotalPages(pagesCount);
			setStatus("rendering");

			const imagesList: ImagePage[] = [];

			for (let pageNum = 1; pageNum <= pagesCount; pageNum++) {
				setProgress(Math.round((pageNum / pagesCount) * 100));

				const page = await pdf.getPage(pageNum);
				const viewport = page.getViewport({ scale: 2.0 }); // Render at 2x scale for high quality

				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				if (!context) continue;

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				await page.render({
					canvasContext: context,
					viewport: viewport,
				}).promise;

				const imgType = format === "png" ? "image/png" : "image/jpeg";
				const dataUrl = canvas.toDataURL(imgType);
				imagesList.push({ pageNum, dataUrl });
			}

			setRenderedImages(imagesList);
			setStatus("done");
		} catch (err) {
			console.error(err);
			setStatus("error");
			setErrorMsg(t.errorLoading);
		}
	};

	const handleDownloadPage = (img: ImagePage) => {
		const baseName = fileName.replace(/\.pdf$/i, "");
		const type = format === "png" ? "png" : "jpg";
		const byteCharacters = atob(img.dataUrl.split(",")[1]);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: format === "png" ? "image/png" : "image/jpeg" });
		downloadBlob(blob, `${baseName}-page-${img.pageNum}.${type}`);
	};

	const handleDownloadZip = async () => {
		if (renderedImages.length === 0) return;
		setZipDownload(true);

		try {
			const zip = new JSZip();
			const baseName = fileName.replace(/\.pdf$/i, "");
			const type = format === "png" ? "png" : "jpg";

			for (const img of renderedImages) {
				const base64Data = img.dataUrl.split(",")[1];
				zip.file(`page-${img.pageNum}.${type}`, base64Data, { base64: true });
			}

			const zipBlob = await zip.generateAsync({ type: "blob" });
			downloadBlob(zipBlob, `${baseName}-images.zip`);
		} catch (err) {
			console.error(err);
		} finally {
			setZipDownload(false);
		}
	};

	const handleReset = () => {
		setFile(null);
		setFileName("");
		setPageSize("");
		setTotalPages(0);
		setRenderedImages([]);
		setStatus("idle");
		setProgress(0);
		setErrorMsg("");
	};

	const isProcessing = status === "loading-engine" || status === "rendering";

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
							label="Drop a PDF file here to extract images"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
							</div>

							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblFormat}</label>
								<select
									class="input w-full"
									value={format}
									onChange={(e) => setFormat((e.target as HTMLSelectElement).value as any)}
									disabled={isProcessing}
								>
									<option value="png">PNG (Lossless)</option>
									<option value="jpeg">JPEG (Lossy)</option>
								</select>
							</div>

							{!isProcessing && status !== "done" && (
								<button class="btn-primary w-full py-2.5" onClick={handleExtract}>
									{t.btnExtract}
								</button>
							)}

							{status === "done" && (
								<button
									class="btn-primary w-full py-2.5"
									onClick={handleDownloadZip}
									disabled={zipDownload}
								>
									{zipDownload ? "Zipping..." : t.btnDownloadAll}
								</button>
							)}

							{file && !isProcessing && (
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.clearBtn}
								</button>
							)}
						</div>
					)}
				</div>

				{/* Preview Column */}
				<div class="lg:col-span-7 space-y-4">
					{/* Progress and status message */}
					{isProcessing && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
							<div class="flex justify-between items-center text-body-sm">
								<span class="text-ink">
									{status === "loading-engine"
										? t.statusEngine
										: `${t.statusRendering} ${progress}%`}
								</span>
								<span class="text-primary font-mono font-bold">{progress}%</span>
							</div>
							<div class="w-full bg-surface-soft rounded-full h-2 overflow-hidden">
								<div
									class="bg-primary h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}

					{status === "error" && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5">
							<h4 class="text-body-sm-strong text-accent-rose font-bold mb-1">Error</h4>
							<p class="text-body-sm text-muted">{errorMsg}</p>
						</div>
					)}

					{status === "done" && renderedImages.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-accent-emerald font-bold">{t.statusDone}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
								{renderedImages.map((img) => (
									<div
										key={img.pageNum}
										class="bg-surface-soft border border-hairline rounded-lg p-3 space-y-2 relative"
									>
										<div class="aspect-[3/4] w-full rounded overflow-hidden bg-white border border-hairline flex items-center justify-center">
											<img
												src={img.dataUrl}
												alt={`Page ${img.pageNum}`}
												class="max-h-44 object-contain shadow-sm"
											/>
										</div>
										<div class="flex justify-between items-center text-xs">
											<span class="font-mono text-muted">Page {img.pageNum}</span>
											<button
												class="text-primary hover:text-primary-active font-bold cursor-pointer"
												onClick={() => handleDownloadPage(img)}
											>
												{t.btnDownloadPage}
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
