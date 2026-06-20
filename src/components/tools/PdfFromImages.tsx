import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface ImageItem {
	id: string;
	file: File;
	preview: string;
}

export default function PdfFromImages() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [images, setImages] = useState<ImageItem[]>([]);
	const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("fit");
	const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
	const [margin, setMargin] = useState<"none" | "small" | "medium" | "large">("none");
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image to PDF Converter",
			settingsTitle: "PDF Settings",
			lblPageSize: "Page Size",
			lblOrientation: "Orientation",
			lblMargin: "Page Margins",
			optFit: "Fit Image Size",
			optPortrait: "Portrait",
			optLandscape: "Landscape",
			optMarginNone: "No Margin (0px)",
			optMarginSmall: "Small Margin (15px)",
			optMarginMedium: "Medium Margin (30px)",
			optMarginLarge: "Large Margin (50px)",
			btnConvert: "Convert to PDF",
			clearBtn: "Clear All",
			moveUp: "Move Up",
			moveDown: "Move Down",
			remove: "Remove",
			errorLoad: "Failed to load one or more images.",
			placeholder: "Drag & drop images here, or click to browse",
			sublabel: "Supports JPG, PNG, WebP, SVG, BMP, GIF",
		},
		vi: {
			title: "Chuyển ảnh thành PDF",
			settingsTitle: "Cấu hình PDF",
			lblPageSize: "Kích thước trang",
			lblOrientation: "Hướng trang",
			lblMargin: "Căn lề trang",
			optFit: "Tự động khít ảnh",
			optPortrait: "Dọc (Portrait)",
			optLandscape: "Ngang (Landscape)",
			optMarginNone: "Không lề (0px)",
			optMarginSmall: "Lề nhỏ (15px)",
			optMarginMedium: "Lề vừa (30px)",
			optMarginLarge: "Lề lớn (50px)",
			btnConvert: "Chuyển thành PDF",
			clearBtn: "Xóa toàn bộ",
			moveUp: "Lên",
			moveDown: "Xuống",
			remove: "Xóa",
			errorLoad: "Không thể tải một hoặc nhiều hình ảnh.",
			placeholder: "Kéo thả hình ảnh vào đây, hoặc click để chọn",
			sublabel: "Hỗ trợ các định dạng JPG, PNG, WebP, SVG, BMP, GIF",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleFiles = useCallback((files: File[]) => {
		const newItems: ImageItem[] = files.map((file) => ({
			id: Math.random().toString(36).substr(2, 9),
			file,
			preview: URL.createObjectURL(file),
		}));
		setImages((prev) => [...prev, ...newItems]);
		setError(null);
	}, []);

	const handleRemove = (id: string) => {
		setImages((prev) => {
			const item = prev.find((x) => x.id === id);
			if (item) URL.revokeObjectURL(item.preview);
			return prev.filter((x) => x.id !== id);
		});
	};

	const moveItem = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= images.length) return;

		setImages((prev) => {
			const updated = [...prev];
			const temp = updated[index];
			updated[index] = updated[newIndex];
			updated[newIndex] = temp;
			return updated;
		});
	};

	const convertImageToJpg = (
		file: File,
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
				// Draw white background
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
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
					"image/jpeg",
					0.85,
				);
			};
			img.onerror = () => reject(new Error("Load image failed"));
			img.src = URL.createObjectURL(file);
		});
	};

	const handleConvert = async () => {
		if (images.length === 0) return;
		setProcessing(true);
		setError(null);

		try {
			const pdfDoc = await PDFDocument.create();

			let marginPx = 0;
			if (margin === "small") marginPx = 15;
			if (margin === "medium") marginPx = 30;
			if (margin === "large") marginPx = 50;

			// Define base sizes
			const sizeMap = {
				a4: { w: 595.27, h: 841.89 },
				letter: { w: 612.0, h: 792.0 },
			};

			for (const imgItem of images) {
				const { width, height, bytes } = await convertImageToJpg(imgItem.file);
				const embeddedImage = await pdfDoc.embedJpg(bytes);

				let pageW = width;
				let pageH = height;

				if (pageSize !== "fit") {
					const standardSize = sizeMap[pageSize as keyof typeof sizeMap];
					if (orientation === "landscape") {
						pageW = standardSize.h;
						pageH = standardSize.w;
					} else {
						pageW = standardSize.w;
						pageH = standardSize.h;
					}
				}

				const page = pdfDoc.addPage([pageW, pageH]);

				// Compute dynamic dimensions of fitting drawing image
				const contentW = pageW - marginPx * 2;
				const contentH = pageH - marginPx * 2;

				const imgRatio = width / height;
				const contentRatio = contentW / contentH;

				let drawW = contentW;
				let drawH = contentH;

				if (imgRatio > contentRatio) {
					drawH = contentW / imgRatio;
				} else {
					drawW = contentH * imgRatio;
				}

				const drawX = marginPx + (contentW - drawW) / 2;
				const drawY = marginPx + (contentH - drawH) / 2;

				page.drawImage(embeddedImage, {
					x: drawX,
					y: drawY,
					width: drawW,
					height: drawH,
				});
			}

			const pdfBytes = await pdfDoc.save();
			const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
			downloadBlob(pdfBlob, "converted-images.pdf");
		} catch (err) {
			console.error(err);
			setError(t.errorLoad);
		} finally {
			setProcessing(false);
		}
	};

	const handleClearAll = () => {
		for (const img of images) {
			URL.revokeObjectURL(img.preview);
		}
		setImages([]);
		setError(null);
	};

	return (
		<div class="space-y-6">
			{/* Configurations and drop zone */}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.settingsTitle}
					</h3>

					{/* Page size select */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblPageSize}</label>
						<select
							class="input w-full"
							value={pageSize}
							onChange={(e) => setPageSize((e.target as HTMLSelectElement).value as any)}
						>
							<option value="fit">{t.optFit}</option>
							<option value="a4">A4 (595 x 842 pt)</option>
							<option value="letter">Letter (612 x 792 pt)</option>
						</select>
					</div>

					{/* Orientation select */}
					{pageSize !== "fit" && (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblOrientation}</label>
							<select
								class="input w-full"
								value={orientation}
								onChange={(e) => setOrientation((e.target as HTMLSelectElement).value as any)}
							>
								<option value="portrait">{t.optPortrait}</option>
								<option value="landscape">{t.optLandscape}</option>
							</select>
						</div>
					)}

					{/* Margin select */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblMargin}</label>
						<select
							class="input w-full"
							value={margin}
							onChange={(e) => setMargin((e.target as HTMLSelectElement).value as any)}
						>
							<option value="none">{t.optMarginNone}</option>
							<option value="small">{t.optMarginSmall}</option>
							<option value="medium">{t.optMarginMedium}</option>
							<option value="large">{t.optMarginLarge}</option>
						</select>
					</div>

					{images.length > 0 && (
						<div class="flex gap-2 pt-2">
							<button
								class="btn-primary flex-1 py-2.5"
								onClick={handleConvert}
								disabled={processing}
							>
								{processing ? "Converting..." : t.btnConvert}
							</button>
							<button class="btn-secondary py-2.5 px-4" onClick={handleClearAll}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Upload and Thumbnails List */}
				<div class="lg:col-span-7 space-y-4">
					<FileDropZone
						accept="image/*"
						multiple={true}
						onFiles={handleFiles}
						label={t.placeholder}
						sublabel={t.sublabel}
					/>

					{error && <p class="text-xs font-bold text-accent-rose mt-1">{error}</p>}

					{/* Thumbnails grid */}
					{images.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
								{images.map((item, index) => (
									<div
										key={item.id}
										class="bg-surface-soft border border-hairline rounded-lg p-3 space-y-2 relative"
									>
										<div class="aspect-video w-full rounded overflow-hidden bg-white border border-hairline flex items-center justify-center">
											<img src={item.preview} alt="Preview" class="max-h-24 object-contain" />
										</div>
										<div class="text-[10px] text-muted truncate">{item.file.name}</div>
										{/* Actions */}
										<div class="flex justify-between items-center pt-1 border-t border-hairline">
											<div class="flex gap-1">
												<button
													class="px-1.5 py-0.5 bg-surface-elevated hover:bg-surface-hover rounded text-[9px] font-bold text-ink cursor-pointer"
													disabled={index === 0}
													onClick={() => moveItem(index, "up")}
												>
													▲
												</button>
												<button
													class="px-1.5 py-0.5 bg-surface-elevated hover:bg-surface-hover rounded text-[9px] font-bold text-ink cursor-pointer"
													disabled={index === images.length - 1}
													onClick={() => moveItem(index, "down")}
												>
													▼
												</button>
											</div>
											<button
												class="text-accent-rose hover:text-error-deep text-[10px] font-bold cursor-pointer"
												onClick={() => handleRemove(item.id)}
											>
												{t.remove}
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
