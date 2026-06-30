import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	const r = Number.parseInt(clean.substring(0, 2), 16) || 0;
	const g = Number.parseInt(clean.substring(2, 4), 16) || 0;
	const b = Number.parseInt(clean.substring(4, 6), 16) || 0;
	return [r, g, b];
}

export default function DuotoneGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [shadowColor, setShadowColor] = useState("#0A2540"); // Dark indigo
	const [highlightColor, setHighlightColor] = useState("#00D4B2"); // Neon cyan
	const [duotoneSrc, setDuotoneSrc] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);

	const t = {
		en: {
			title: "Duotone Image Generator",
			desc: "Map the highlights and shadows of any image to a custom two-tone color gradient. Processes 100% locally in your browser.",
			lblShadow: "Shadow Color (Dark areas)",
			lblHighlight: "Highlight Color (Light areas)",
			btnDownload: "Download Processed Image",
			dropzoneLabel: "Drop image to apply duotone filter",
			dropzoneSub: "Supports JPG, PNG, WebP up to 10MB",
			btnReset: "Choose Another Image",
			lblPreview: "Duotone Preview",
		},
		vi: {
			title: "Bộ tạo ảnh Duotone",
			desc: "Ánh xạ vùng sáng và vùng tối của bức ảnh vào một hệ hai tông màu tùy chọn. Xử lý 100% cục bộ trên trình duyệt.",
			lblShadow: "Màu vùng tối (Shadows)",
			lblHighlight: "Màu vùng sáng (Highlights)",
			btnDownload: "Tải xuống hình ảnh",
			dropzoneLabel: "Thả hình ảnh vào đây để tạo duotone",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP tới 10MB",
			btnReset: "Chọn hình ảnh khác",
			lblPreview: "Ảnh xem trước Duotone",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Clean up URLs
	useEffect(() => {
		return () => {
			if (imageSrc) URL.revokeObjectURL(imageSrc);
		};
	}, [imageSrc]);

	// Apply duotone filter to the image on canvas
	const applyDuotone = useCallback(() => {
		if (!imageSrc) return;
		setProcessing(true);

		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				setProcessing(false);
				return;
			}

			// Downscale large files slightly for fluid client processing while keeping resolution high enough
			const maxDim = 1200;
			let scale = 1;
			if (img.width > maxDim || img.height > maxDim) {
				scale = Math.min(maxDim / img.width, maxDim / img.height);
			}

			canvas.width = img.width * scale;
			canvas.height = img.height * scale;
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const pixels = imgData.data;

			const [shR, shG, shB] = hexToRgb(shadowColor);
			const [hiR, hiG, hiB] = hexToRgb(highlightColor);

			for (let i = 0; i < pixels.length; i += 4) {
				const r = pixels[i];
				const g = pixels[i + 1];
				const b = pixels[i + 2];

				// Relative luminance formula (standard grayscale mapping)
				const gray = 0.299 * r + 0.587 * g + 0.114 * b;
				const ratio = gray / 255;

				// Map gray ratio to the duotone gradient
				pixels[i] = Math.round(shR * (1 - ratio) + hiR * ratio);
				pixels[i + 1] = Math.round(shG * (1 - ratio) + hiG * ratio);
				pixels[i + 2] = Math.round(shB * (1 - ratio) + hiB * ratio);
			}

			ctx.putImageData(imgData, 0, 0);
			setDuotoneSrc(canvas.toDataURL("image/jpeg", 0.9));
			setProcessing(false);
		};
		img.src = imageSrc;
	}, [imageSrc, shadowColor, highlightColor]);

	// Apply filter whenever colors change
	useEffect(() => {
		if (imageSrc) {
			applyDuotone();
		}
	}, [shadowColor, highlightColor, imageSrc, applyDuotone]);

	const handleFiles = (files: File[]) => {
		if (files[0]) {
			setImageFile(files[0]);
			const url = URL.createObjectURL(files[0]);
			setImageSrc(url);
		}
	};

	const handleReset = () => {
		setImageFile(null);
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(null);
		setDuotoneSrc(null);
	};

	const downloadImage = () => {
		if (!duotoneSrc) return;
		const a = document.createElement("a");
		a.href = duotoneSrc;
		a.download = `duotone_${imageFile?.name || "image.jpg"}`;
		a.click();
	};

	return (
		<div class="space-y-6">
			{!imageFile && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label={t.dropzoneLabel}
					sublabel={t.dropzoneSub}
				/>
			)}

			{imageFile && (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Settings Panel */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="flex justify-between items-center border-b border-hairline pb-2 mb-2">
							<h3 class="text-body-strong text-ink font-bold">{t.title}</h3>
							<button class="btn-secondary py-1 px-2.5 text-[10px]" onClick={handleReset}>
								{t.btnReset}
							</button>
						</div>

						{/* Shadow Color */}
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblShadow}</label>
							<div class="flex gap-2">
								<input
									type="color"
									class="w-10 h-10 border border-hairline rounded cursor-pointer shrink-0"
									value={shadowColor}
									onInput={(e) => setShadowColor((e.target as HTMLInputElement).value)}
								/>
								<input
									type="text"
									class="input w-full font-mono text-body-sm"
									value={shadowColor}
									onInput={(e) => setShadowColor((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>

						{/* Highlight Color */}
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblHighlight}</label>
							<div class="flex gap-2">
								<input
									type="color"
									class="w-10 h-10 border border-hairline rounded cursor-pointer shrink-0"
									value={highlightColor}
									onInput={(e) => setHighlightColor((e.target as HTMLInputElement).value)}
								/>
								<input
									type="text"
									class="input w-full font-mono text-body-sm"
									value={highlightColor}
									onInput={(e) => setHighlightColor((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>

						{duotoneSrc && !processing && (
							<button class="btn-primary w-full py-2.5 mt-2" onClick={downloadImage}>
								{t.btnDownload}
							</button>
						)}
					</div>

					{/* Right Preview Panel */}
					<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblPreview}
						</h3>

						{processing ? (
							<div class="flex flex-col items-center py-20 gap-3">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
								<span class="text-body-sm text-muted">Applying duotone filter...</span>
							</div>
						) : (
							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline max-h-[450px] overflow-hidden">
								{duotoneSrc && (
									<img
										src={duotoneSrc}
										alt="Duotone Preview"
										class="max-w-full max-h-[400px] object-contain rounded bg-surface-soft shadow-sm"
									/>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
