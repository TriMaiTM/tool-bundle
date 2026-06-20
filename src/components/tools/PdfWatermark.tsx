import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfWatermark() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");
	const [totalPages, setTotalPages] = useState(0);

	const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");

	// Text parameters
	const [text, setText] = useState("CONFIDENTIAL");
	const [textColor, setTextColor] = useState("#ef4444"); // default red
	const [fontSize, setFontSize] = useState(50);
	const [angle, setAngle] = useState(45);
	const [opacity, setOpacity] = useState(0.25);

	// Image parameters
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageName, setImageName] = useState("");
	const [imageScale, setImageScale] = useState(30); // in percent

	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Add Watermark to PDF",
			lblSettings: "Watermark Settings",
			lblType: "Watermark Type",
			typeText: "Text",
			typeImage: "Image logo",
			lblText: "Watermark Text",
			lblColor: "Text Color",
			lblFontSize: "Font Size (pt)",
			lblAngle: "Rotation Angle (degrees)",
			lblOpacity: "Opacity (0.1 to 1.0)",
			lblImage: "Choose Watermark Logo Image",
			lblImageScale: "Image Scale",
			btnProcess: "Apply Watermark & Download",
			clearBtn: "Choose Another File",
			processingText: "Applying watermark...",
			errorLoading: "Failed to load PDF file.",
			errorImage: "Failed to process logo image. Ensure it is PNG/JPG/WebP.",
			errorSave: "Failed to save PDF document.",
		},
		vi: {
			title: "Đóng dấu bản quyền PDF (Watermark)",
			lblSettings: "Cấu hình dấu đóng",
			lblType: "Loại đóng dấu",
			typeText: "Văn bản",
			typeImage: "Hình ảnh logo",
			lblText: "Nội dung chữ",
			lblColor: "Màu chữ",
			lblFontSize: "Cỡ chữ (pt)",
			lblAngle: "Góc xoay (độ)",
			lblOpacity: "Độ mờ / trong suốt (0.1 - 1.0)",
			lblImage: "Chọn ảnh logo đóng dấu",
			lblImageScale: "Tỷ lệ kích thước ảnh",
			btnProcess: "Đóng dấu & Tải về",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang tiến hành đóng dấu...",
			errorLoading: "Không thể tải tệp PDF.",
			errorImage: "Không thể xử lý ảnh logo. Đảm bảo ảnh định dạng PNG/JPG/WebP.",
			errorSave: "Không thể lưu tệp PDF mới.",
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

	const handleImageChange = (e: Event) => {
		const files = (e.target as HTMLInputElement).files;
		if (files && files.length > 0) {
			setImageFile(files[0]);
			setImageName(files[0].name);
		}
	};

	const convertImageToJpg = (
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
				// Preserve transparency for PNG logo by NOT drawing white background
				ctx.drawImage(img, 0, 0);

				canvas.toBlob(
					(blob) => {
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
					},
					"image/png", // Use PNG format to keep alpha channels!
				);
			};
			img.onerror = () => reject(new Error("Load image failed"));
			img.src = URL.createObjectURL(imgFile);
		});
	};

	const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
		const cleanHex = hex.replace("#", "");
		const bigint = Number.parseInt(cleanHex, 16);
		const r = ((bigint >> 16) & 255) / 255;
		const g = ((bigint >> 8) & 255) / 255;
		const b = (bigint & 255) / 255;
		return { r, g, b };
	};

	const handleApplyWatermark = async () => {
		if (!file) return;
		if (watermarkType === "image" && !imageFile) return;

		setProcessing(true);
		setError(null);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const pages = pdfDoc.getPages();

			if (watermarkType === "text") {
				const font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
				const { r, g, b } = hexToRgb(textColor);

				for (const page of pages) {
					const { width, height } = page.getSize();
					const textWidth = font.widthOfTextAtSize(text, fontSize);
					const textHeight = font.heightAtSize(fontSize);

					// Center with custom rotation angle
					const x = (width - textWidth) / 2;
					const y = (height - textHeight) / 2;

					page.drawText(text, {
						x,
						y,
						size: fontSize,
						font,
						color: rgb(r, g, b),
						opacity,
						rotate: degrees(angle),
					});
				}
			} else if (watermarkType === "image" && imageFile) {
				let width = 0;
				let height = 0;
				let imgBytes: ArrayBuffer;

				try {
					const res = await convertImageToJpg(imageFile);
					width = res.width;
					height = res.height;
					imgBytes = res.bytes;
				} catch {
					setError(t.errorImage);
					setProcessing(false);
					return;
				}

				const embeddedImage = await pdfDoc.embedPng(imgBytes);

				for (const page of pages) {
					const { width: pageW, height: pageH } = page.getSize();
					const scaleFactor = imageScale / 100;
					const drawW = width * scaleFactor;
					const drawH = height * scaleFactor;

					const x = (pageW - drawW) / 2;
					const y = (pageH - drawH) / 2;

					page.drawImage(embeddedImage, {
						x,
						y,
						width: drawW,
						height: drawH,
						opacity,
					});
				}
			}

			const pdfBytes = await pdfDoc.save();
			const blob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-watermarked.pdf`);
		} catch (err) {
			console.error(err);
			setError(t.errorSave);
		} finally {
			setProcessing(false);
		}
	};

	const handleReset = () => {
		setFile(null);
		setFileName("");
		setPageSize("");
		setTotalPages(0);
		setImageFile(null);
		setImageName("");
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
							label="Drop a PDF file here to add a watermark"
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

							{/* Type select */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblType}</label>
								<div class="flex gap-2">
									<button
										type="button"
										class={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-1 text-center ${
											watermarkType === "text"
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setWatermarkType("text")}
									>
										{t.typeText}
									</button>
									<button
										type="button"
										class={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-1 text-center ${
											watermarkType === "image"
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setWatermarkType("image")}
									>
										{t.typeImage}
									</button>
								</div>
							</div>

							{/* Text Fields */}
							{watermarkType === "text" && (
								<div class="space-y-4">
									<div class="space-y-1.5">
										<label class="text-body-sm-strong text-ink block">{t.lblText}</label>
										<input
											type="text"
											class="input w-full"
											value={text}
											onInput={(e) => setText((e.target as HTMLInputElement).value)}
										/>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">{t.lblColor}</label>
											<div class="flex gap-2">
												<input
													type="color"
													value={textColor}
													onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
													class="w-10 h-10 rounded cursor-pointer border border-hairline"
												/>
												<input
													class="input w-full text-xs"
													value={textColor}
													onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
												/>
											</div>
										</div>
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">{t.lblFontSize}</label>
											<input
												type="number"
												class="input w-full font-bold"
												min="10"
												max="150"
												value={fontSize}
												onInput={(e) =>
													setFontSize(
														Math.max(
															10,
															Number.parseInt((e.target as HTMLInputElement).value) || 30,
														),
													)
												}
											/>
										</div>
									</div>

									<div class="grid grid-cols-2 gap-4">
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">{t.lblAngle}</label>
											<input
												type="number"
												class="input w-full font-bold"
												min="-90"
												max="90"
												value={angle}
												onInput={(e) =>
													setAngle(
														Math.max(
															-90,
															Math.min(
																90,
																Number.parseInt((e.target as HTMLInputElement).value) || 0,
															),
														),
													)
												}
											/>
										</div>
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">
												{t.lblOpacity} ({opacity})
											</label>
											<input
												type="range"
												min="0.05"
												max="1.0"
												step="0.05"
												class="w-full accent-primary"
												value={opacity}
												onInput={(e) =>
													setOpacity(Number.parseFloat((e.target as HTMLInputElement).value))
												}
											/>
										</div>
									</div>
								</div>
							)}

							{/* Image fields */}
							{watermarkType === "image" && (
								<div class="space-y-4">
									<div class="space-y-1.5">
										<label class="text-body-sm-strong text-ink block">{t.lblImage}</label>
										<div class="flex items-center gap-2">
											<button
												type="button"
												class="btn-secondary text-xs py-1.5 px-3"
												onClick={() => document.getElementById("watermark-image-file")?.click()}
											>
												Choose Image
											</button>
											<span class="text-xs text-muted truncate max-w-xs">
												{imageName || "No file selected"}
											</span>
											<input
												id="watermark-image-file"
												type="file"
												accept="image/png, image/jpeg, image/webp"
												class="hidden"
												onChange={handleImageChange}
											/>
										</div>
									</div>

									<div class="grid grid-cols-2 gap-4">
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">
												{t.lblImageScale} ({imageScale}%)
											</label>
											<input
												type="range"
												min="5"
												max="100"
												step="5"
												class="w-full accent-primary"
												value={imageScale}
												onInput={(e) =>
													setImageScale(Number.parseInt((e.target as HTMLInputElement).value) || 30)
												}
											/>
										</div>
										<div class="space-y-1.5">
											<label class="text-body-sm-strong text-ink block">
												{t.lblOpacity} ({opacity})
											</label>
											<input
												type="range"
												min="0.05"
												max="1.0"
												step="0.05"
												class="w-full accent-primary"
												value={opacity}
												onInput={(e) =>
													setOpacity(Number.parseFloat((e.target as HTMLInputElement).value))
												}
											/>
										</div>
									</div>
								</div>
							)}

							<button
								class="btn-primary w-full py-2.5"
								onClick={handleApplyWatermark}
								disabled={processing || (watermarkType === "image" && !imageFile)}
							>
								{processing ? t.processingText : t.btnProcess}
							</button>

							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Description / Guide */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold">Client-Side Watermarking</h4>
						<p class="text-body-sm text-muted leading-relaxed">
							This utility edits your PDF structure natively in JavaScript. Text watermarks are
							drawn in HelveticaBold with precise transformation matrix adjustments, ensuring clean
							rendering at any zoom level.
						</p>
						<p class="text-body-sm text-muted leading-relaxed">
							For image watermarks, using transparent PNG logos is recommended.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
