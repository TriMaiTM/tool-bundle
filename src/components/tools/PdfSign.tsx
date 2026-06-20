import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface PageMeta {
	pageNum: number;
	width: number;
	height: number;
}

export default function PdfSign() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [status, setStatus] = useState<"idle" | "loading" | "ready" | "signing" | "error">("idle");
	const [errorMsg, setErrorMsg] = useState("");

	// Pages info
	const [pages, setPages] = useState<PageMeta[]>([]);
	const [selectedPage, setSelectedPage] = useState(1);
	const [pagePreviewUrl, setPagePreviewUrl] = useState("");

	// Signature drawing pad state
	const padCanvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [inkColor, setInkColor] = useState("#000000"); // default black
	const [sigType, setSigType] = useState<"draw" | "image">("draw");
	const [sigImageFile, setSigImageFile] = useState<File | null>(null);
	const [sigImagePreview, setSigImagePreview] = useState("");

	// Signed placement positions (relative ratios)
	const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
	const previewContainerRef = useRef<HTMLDivElement>(null);

	const t = {
		en: {
			title: "PDF Signature Tool",
			lblSettings: "Sign Settings",
			lblPage: "Target Page",
			lblType: "Signature Source",
			optDraw: "Draw Signature",
			optImage: "Upload Image",
			lblDrawPad: "Draw Signature below",
			lblUploadImage: "Choose Signature Image (transparent PNG recommended)",
			lblInstruction: "Click on the PDF page preview on the right to position your signature.",
			btnSave: "Apply Signature & Download",
			clearBtn: "Choose Another File",
			clearPad: "Clear Pad",
			statusEngine: "Loading pages previews...",
			statusSaving: "Applying signature to PDF...",
			errorLoading: "Failed to render PDF page previews.",
			errorSaving: "Failed to sign PDF.",
		},
		vi: {
			title: "Ký tên lên tài liệu PDF",
			lblSettings: "Cấu hình chữ ký",
			lblPage: "Trang cần ký",
			lblType: "Nguồn chữ ký",
			optDraw: "Vẽ chữ ký tay",
			optImage: "Tải ảnh chữ ký lên",
			lblDrawPad: "Vẽ chữ ký của bạn vào khung bên dưới",
			lblUploadImage: "Chọn tệp ảnh chữ ký (khuyên dùng ảnh PNG trong suốt)",
			lblInstruction: "Click chuột vào vị trí bất kỳ trên hình xem trước trang PDF để đặt chữ ký.",
			btnSave: "Áp dụng chữ ký & Tải về",
			clearBtn: "Chọn tệp khác",
			clearPad: "Vẽ lại",
			statusEngine: "Đang tải bản xem trước...",
			statusSaving: "Đang chèn chữ ký vào PDF...",
			errorLoading: "Không thể kết xuất bản xem trước trang.",
			errorSaving: "Không thể chèn chữ ký vào PDF.",
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

	const pdfRef = useRef<any>(null);

	const renderSelectedPagePreview = useCallback(
		async (pageNum: number) => {
			if (!pdfRef.current) return;
			try {
				const page = await pdfRef.current.getPage(pageNum);
				const viewport = page.getViewport({ scale: 1.0 });

				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				if (!context) return;

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				await page.render({
					canvasContext: context,
					viewport: viewport,
				}).promise;

				setPagePreviewUrl(canvas.toDataURL("image/png"));
			} catch {
				setErrorMsg(t.errorLoading);
			}
		},
		[t.errorLoading],
	);

	const loadPdfDocument = useCallback(
		async (f: File) => {
			setStatus("loading");
			setErrorMsg("");
			setPages([]);
			setClickPos(null);

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
				pdfRef.current = pdf;

				const numPages = pdf.numPages;
				const meta: PageMeta[] = [];

				for (let i = 1; i <= numPages; i++) {
					const page = await pdf.getPage(i);
					const viewport = page.getViewport({ scale: 1.0 });
					meta.push({
						pageNum: i,
						width: viewport.width,
						height: viewport.height,
					});
				}

				setPages(meta);
				setSelectedPage(1);
				setStatus("ready");
				renderSelectedPagePreview(1);
			} catch (err) {
				console.error(err);
				setStatus("error");
				setErrorMsg(t.errorLoading);
			}
		},
		[t.errorLoading, renderSelectedPagePreview],
	);

	const handleFiles = (files: File[]) => {
		const f = files[0];
		setFile(f);
		setFileName(f.name);
		setPageSize(formatFileSize(f.size));
		loadPdfDocument(f);
	};

	useEffect(() => {
		if (file && selectedPage) {
			renderSelectedPagePreview(selectedPage);
			setClickPos(null);
		}
	}, [selectedPage, file, renderSelectedPagePreview]);

	// Drawing canvas handlers
	useEffect(() => {
		if (status === "ready" && sigType === "draw" && padCanvasRef.current) {
			const canvas = padCanvasRef.current;
			const context = canvas.getContext("2d");
			if (context) {
				// Clear with transparent bg
				context.clearRect(0, 0, canvas.width, canvas.height);
			}
		}
	}, [status, sigType]);

	const getMousePos = (e: MouseEvent | TouchEvent) => {
		if (!padCanvasRef.current) return { x: 0, y: 0 };
		const rect = padCanvasRef.current.getBoundingClientRect();
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
	};

	const startDrawing = (e: MouseEvent | TouchEvent) => {
		e.preventDefault();
		const canvas = padCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		setIsDrawing(true);
		const pos = getMousePos(e);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
	};

	const draw = (e: MouseEvent | TouchEvent) => {
		if (!isDrawing) return;
		e.preventDefault();
		const canvas = padCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const pos = getMousePos(e);
		ctx.lineTo(pos.x, pos.y);
		ctx.strokeStyle = inkColor;
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.stroke();
	};

	const stopDrawing = () => {
		setIsDrawing(false);
	};

	const clearDrawingPad = () => {
		const canvas = padCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (canvas && ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
	};

	const handleImageChange = (e: Event) => {
		const files = (e.target as HTMLInputElement).files;
		if (files && files.length > 0) {
			setSigImageFile(files[0]);
			setSigImagePreview(URL.createObjectURL(files[0]));
		}
	};

	// Track click coordinates on PDF preview
	const handlePreviewClick = (e: MouseEvent) => {
		if (!previewContainerRef.current) return;
		const rect = previewContainerRef.current.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		setClickPos({
			x: clickX / rect.width,
			y: clickY / rect.height,
		});
	};

	// Embed drawn signature image or file image using canvas and export signed PDF
	const convertCanvasToPngBytes = (canvas: HTMLCanvasElement): Promise<ArrayBuffer> => {
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error("Blob failed"));
					return;
				}
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as ArrayBuffer);
				reader.onerror = () => reject(reader.error);
				reader.readAsArrayBuffer(blob);
			}, "image/png");
		});
	};

	const convertImageToPngBytes = (
		imgFile: File,
	): Promise<{ width: number; height: number; bytes: ArrayBuffer }> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Canvas context failed"));
					return;
				}
				ctx.drawImage(img, 0, 0);

				canvas.toBlob((blob) => {
					if (!blob) {
						reject(new Error("Blob failed"));
						return;
					}
					const reader = new FileReader();
					reader.onload = () => {
						resolve({
							width: img.naturalWidth,
							height: img.naturalHeight,
							bytes: reader.result as ArrayBuffer,
						});
					};
					reader.onerror = () => reject(reader.error);
					reader.readAsArrayBuffer(blob);
				}, "image/png");
			};
			img.onerror = () => reject(new Error("Load image failed"));
			img.src = URL.createObjectURL(imgFile);
		});
	};

	const handleSave = async () => {
		if (!file || !clickPos) return;
		setStatus("signing");

		try {
			let sigBytes: ArrayBuffer;
			let sigW = 150;
			const sigH = 60;

			if (sigType === "draw") {
				const canvas = padCanvasRef.current;
				if (!canvas) throw new Error("Canvas is missing");
				sigBytes = await convertCanvasToPngBytes(canvas);
			} else {
				if (!sigImageFile) throw new Error("Image missing");
				const res = await convertImageToPngBytes(sigImageFile);
				sigBytes = res.bytes;
				const ratio = res.width / res.height;
				// Maintain scale ratio
				sigW = sigH * ratio;
			}

			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const embeddedSig = await pdfDoc.embedPng(sigBytes);

			const targetPageObj = pdfDoc.getPage(selectedPage - 1);
			const { width: pageW, height: pageH } = targetPageObj.getSize();

			// Map clicked coordinates (relative ratios) back to PDF points
			// PDF Y starts from the bottom left!
			const pdfX = clickPos.x * pageW - sigW / 2;
			const pdfY = (1 - clickPos.y) * pageH - sigH / 2;

			targetPageObj.drawImage(embeddedSig, {
				x: Math.max(0, Math.min(pageW - sigW, pdfX)),
				y: Math.max(0, Math.min(pageH - sigH, pdfY)),
				width: sigW,
				height: sigH,
			});

			const pdfBytes = await pdfDoc.save();
			const blob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-signed.pdf`);
			setStatus("ready");
			setClickPos(null);
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
		setClickPos(null);
		setSigImageFile(null);
		setSigImagePreview("");
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
							label="Drop a PDF file here to sign"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
								<div class="text-muted">Total: {pages.length} pages</div>
							</div>

							{/* Select Target Page */}
							{pages.length > 0 && (
								<div class="space-y-1.5">
									<label class="text-body-sm-strong text-ink block">{t.lblPage}</label>
									<select
										class="input w-full"
										value={selectedPage}
										onChange={(e) =>
											setSelectedPage(Number.parseInt((e.target as HTMLSelectElement).value))
										}
									>
										{pages.map((p) => (
											<option key={p.pageNum} value={p.pageNum}>
												Page {p.pageNum}
											</option>
										))}
									</select>
								</div>
							)}

							{/* Select Sig Type */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblType}</label>
								<div class="flex gap-2">
									<button
										type="button"
										class={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-1 text-center ${
											sigType === "draw"
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setSigType("draw")}
									>
										{t.optDraw}
									</button>
									<button
										type="button"
										class={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-1 text-center ${
											sigType === "image"
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setSigType("image")}
									>
										{t.optImage}
									</button>
								</div>
							</div>

							{/* Drawing canvas pad */}
							{sigType === "draw" && (
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-xs font-bold text-muted">{t.lblDrawPad}</span>
										<button class="btn-tertiary text-xs py-0.5" onClick={clearDrawingPad}>
											{t.clearPad}
										</button>
									</div>
									<canvas
										ref={padCanvasRef}
										width="300"
										height="150"
										class="border border-hairline bg-white rounded-lg cursor-crosshair w-full h-[150px] touch-none"
										onMouseDown={startDrawing}
										onMouseMove={draw}
										onMouseUp={stopDrawing}
										onMouseLeave={stopDrawing}
										onTouchStart={startDrawing}
										onTouchMove={draw}
										onTouchEnd={stopDrawing}
									/>
									{/* Color selector */}
									<div class="flex items-center gap-2 mt-1.5">
										{["#000000", "#0000ff", "#ff0000"].map((color) => (
											<button
												key={color}
												type="button"
												class={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
													inkColor === color ? "scale-110 border-primary" : "border-transparent"
												}`}
												style={{ backgroundColor: color }}
												onClick={() => setInkColor(color)}
											/>
										))}
									</div>
								</div>
							)}

							{/* Image upload */}
							{sigType === "image" && (
								<div class="space-y-2">
									<label class="text-xs font-bold text-muted block">{t.lblUploadImage}</label>
									<div class="flex items-center gap-2">
										<button
											type="button"
											class="btn-secondary text-xs py-1.5 px-3"
											onClick={() => document.getElementById("signature-upload-input")?.click()}
										>
											Choose Image
										</button>
										<span class="text-xs text-muted truncate max-w-xs">
											{imageName || "No file selected"}
										</span>
										<input
											id="signature-upload-input"
											type="file"
											accept="image/png, image/jpeg, image/webp"
											class="hidden"
											onChange={handleImageChange}
										/>
									</div>
									{sigImagePreview && (
										<div class="bg-white p-3 rounded-lg border border-hairline max-h-24 overflow-hidden flex items-center justify-center">
											<img
												src={sigImagePreview}
												alt="Sig Preview"
												class="max-h-20 object-contain"
											/>
										</div>
									)}
								</div>
							)}

							{clickPos && (
								<button class="btn-primary w-full py-2.5 font-bold" onClick={handleSave}>
									{t.btnSave}
								</button>
							)}

							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Preview Column */}
				<div class="lg:col-span-7 space-y-4">
					{status === "loading" && (
						<div class="bg-surface-elevated rounded-lg p-10 border border-hairline shadow-sm text-center text-muted text-body-sm">
							{t.statusEngine}
						</div>
					)}

					{status === "signing" && (
						<div class="bg-surface-elevated rounded-lg p-10 border border-hairline shadow-sm text-center text-muted text-body-sm">
							{t.statusSaving}
						</div>
					)}

					{errorMsg && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5">
							<h4 class="text-body-sm-strong text-accent-rose font-bold mb-1">Error</h4>
							<p class="text-body-sm text-muted">{errorMsg}</p>
						</div>
					)}

					{status === "ready" && pagePreviewUrl && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<span class="text-xs font-bold text-muted block leading-normal">
								{t.lblInstruction}
							</span>

							{/* Interactive Preview Container */}
							<div
								ref={previewContainerRef}
								class="border border-hairline rounded-lg overflow-hidden bg-white max-h-[500px] overflow-y-auto relative shadow-inner cursor-crosshair mx-auto flex items-center justify-center"
								onClick={handlePreviewClick}
							>
								<img
									src={pagePreviewUrl}
									alt={`Page ${selectedPage} Preview`}
									class="max-w-full h-auto max-h-[480px] object-contain shadow-sm select-none"
								/>

								{/* Click indicator signature overlay preview box */}
								{clickPos && (
									<div
										class="absolute border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center font-bold text-primary pointer-events-none"
										style={{
											left: `${clickPos.x * 100}%`,
											top: `${clickPos.y * 100}%`,
											transform: "translate(-50%, -50%)",
											width: "100px",
											height: "40px",
											fontSize: "8px",
										}}
									>
										SIGN HERE
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
