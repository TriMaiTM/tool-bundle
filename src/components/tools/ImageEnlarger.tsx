import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

export default function ImageEnlarger() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Image state
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
	const [imgNaturalHeight, setImgNaturalHeight] = useState(0);

	// Processing settings
	const [scale, setScale] = useState<number>(2); // 2x, 3x, 4x
	const [sharpness, setSharpness] = useState<number>(30); // 0 to 100
	const [denoise, setDenoise] = useState<number>(20); // 0 to 100
	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [resultUrl, setResultUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image Enlarger & Upscaler",
			scaleFactor: "Scale Factor",
			sharpness: "Sharpness Strength",
			denoise: "Denoise Strength",
			processBtn: "Enlarge & Optimize Image",
			download: "Download Enlarged Image",
			reset: "Choose Another Image",
			originalSize: "Original Size",
			targetSize: "Enlarged Size",
			statusProcessing: "Resampling & filtering image...",
			dropzoneLabel: "Drop image to enlarge",
			dropzoneSub: "JPG, PNG, WebP up to 10MB",
			compareTitle: "Before / After Preview",
		},
		vi: {
			title: "Bộ phóng to & Nâng cấp ảnh",
			scaleFactor: "Tỷ lệ phóng to",
			sharpness: "Độ sắc nét",
			denoise: "Khử nhiễu / Làm mịn",
			processBtn: "Bắt đầu phóng to & Tối ưu",
			download: "Tải ảnh phóng to về",
			reset: "Chọn ảnh khác",
			originalSize: "Kích thước gốc",
			targetSize: "Kích thước phóng to",
			statusProcessing: "Đang nội suy và xử lý ảnh...",
			dropzoneLabel: "Thả hình ảnh vào đây để phóng to",
			dropzoneSub: "JPG, PNG, WebP tối đa 10MB",
			compareTitle: "Xem trước trước và sau khi phóng",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Cleanup URLs on unmount
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);
		};
	}, [previewUrl, resultUrl]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);

			setFile(f);
			setResultUrl(null);
			setStatus("idle");

			const url = URL.createObjectURL(f);
			setPreviewUrl(url);

			const tempImg = new Image();
			tempImg.onload = () => {
				setImgNaturalWidth(tempImg.naturalWidth);
				setImgNaturalHeight(tempImg.naturalHeight);
			};
			tempImg.src = url;
		},
		[previewUrl, resultUrl],
	);

	// Apply convolution filter for sharpening and denoise
	const applyFilters = (
		ctx: CanvasRenderingContext2D,
		w: number,
		h: number,
		sharpVal: number,
		denoiseVal: number,
	) => {
		if (sharpVal === 0 && denoiseVal === 0) return;

		const imgData = ctx.getImageData(0, 0, w, h);
		const src = imgData.data;

		// Create a backup of pixels
		const backup = new Uint8ClampedArray(src);

		// Denoise (Gaussian-like Blur on backup first)
		if (denoiseVal > 0) {
			const blurRadius = Math.max(1, Math.round((denoiseVal / 100) * 2));
			// Simple box blur approximation
			for (let y = blurRadius; y < h - blurRadius; y++) {
				for (let x = blurRadius; x < w - blurRadius; x++) {
					let r = 0;
					let g = 0;
					let b = 0;
					let count = 0;
					for (let ky = -blurRadius; ky <= blurRadius; ky++) {
						for (let kx = -blurRadius; kx <= blurRadius; kx++) {
							const idx = ((y + ky) * w + (x + kx)) * 4;
							r += backup[idx];
							g += backup[idx + 1];
							b += backup[idx + 2];
							count++;
						}
					}
					const targetIdx = (y * w + x) * 4;
					// Blend original and blurred based on denoiseVal
					const factor = denoiseVal / 100;
					src[targetIdx] = Math.round(backup[targetIdx] * (1 - factor) + (r / count) * factor);
					src[targetIdx + 1] = Math.round(
						backup[targetIdx + 1] * (1 - factor) + (g / count) * factor,
					);
					src[targetIdx + 2] = Math.round(
						backup[targetIdx + 2] * (1 - factor) + (b / count) * factor,
					);
				}
			}
			// Update backup with blurred result for sharpening phase
			backup.set(src);
		}

		// Sharpening via Laplacian Kernel
		if (sharpVal > 0) {
			const amount = sharpVal / 100;
			// Sharpen kernel matrix:
			//  [ 0, -a,  0 ]
			//  [-a, 1+4a, -a]
			//  [ 0, -a,  0 ]
			for (let y = 1; y < h - 1; y++) {
				for (let x = 1; x < w - 1; x++) {
					const idx = (y * w + x) * 4;

					const top = ((y - 1) * w + x) * 4;
					const bottom = ((y + 1) * w + x) * 4;
					const left = (y * w + (x - 1)) * 4;
					const right = (y * w + (x + 1)) * 4;

					for (let c = 0; c < 3; c++) {
						// R, G, B channels
						const centerVal = backup[idx + c];
						const neighborsVal =
							backup[top + c] + backup[bottom + c] + backup[left + c] + backup[right + c];

						// Apply laplacian sharpening formula
						const sharpPixel = centerVal * (1 + 4 * amount) - neighborsVal * amount;
						src[idx + c] = Math.min(255, Math.max(0, sharpPixel));
					}
				}
			}
		}

		ctx.putImageData(imgData, 0, 0);
	};

	// Execute upscaling
	const handleEnlarge = async () => {
		if (!previewUrl) return;
		setStatus("processing");

		// Timeout to let DOM status updates render first
		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = canvasRef.current;
					if (!canvas) return;
					const ctx = canvas.getContext("2d");
					if (!ctx) return;

					const targetW = imgNaturalWidth * scale;
					const targetH = imgNaturalHeight * scale;
					canvas.width = targetW;
					canvas.height = targetH;

					// 1. Bicubic Resizing approximation (Step-up scaling)
					// We step scale (by 1.5x jumps) for smoother results
					let currentW = imgNaturalWidth;
					let currentH = imgNaturalHeight;

					const tempCanvas = document.createElement("canvas");
					const tempCtx = tempCanvas.getContext("2d")!;
					tempCanvas.width = currentW;
					tempCanvas.height = currentH;
					tempCtx.drawImage(img, 0, 0);

					while (currentW * 1.5 < targetW) {
						const nextW = Math.round(currentW * 1.5);
						const nextH = Math.round(currentH * 1.5);

						const stepCanvas = document.createElement("canvas");
						stepCanvas.width = nextW;
						stepCanvas.height = nextH;
						const stepCtx = stepCanvas.getContext("2d")!;

						// Draw stretched
						stepCtx.drawImage(tempCanvas, 0, 0, currentW, currentH, 0, 0, nextW, nextH);

						// Prepare for next loop
						tempCanvas.width = nextW;
						tempCanvas.height = nextH;
						tempCtx.drawImage(stepCanvas, 0, 0);

						currentW = nextW;
						currentH = nextH;
					}

					// Final scale draw onto main canvas
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";
					ctx.drawImage(tempCanvas, 0, 0, currentW, currentH, 0, 0, targetW, targetH);

					// 2. Apply Sharpen & Denoise Kernels
					applyFilters(ctx, targetW, targetH, sharpness, denoise);

					// 3. Output URL
					canvas.toBlob((blob) => {
						if (blob) {
							if (resultUrl) URL.revokeObjectURL(resultUrl);
							setResultUrl(URL.createObjectURL(blob));
							setStatus("done");
						} else {
							setStatus("error");
						}
					}, file?.type || "image/png");
				};
				img.onerror = () => setStatus("error");
				img.src = previewUrl;
			} catch (e) {
				console.error(e);
				setStatus("error");
			}
		}, 100);
	};

	const handleDownload = () => {
		if (!resultUrl) return;
		const a = document.createElement("a");
		a.href = resultUrl;
		a.download = `upscaled-${scale}x-${file?.name || "image.png"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		setFile(null);
		setPreviewUrl(null);
		setResultUrl(null);
		setStatus("idle");
	};

	return (
		<div class="space-y-6">
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label={t.dropzoneLabel}
					sublabel={t.dropzoneSub}
				/>
			)}

			{file && (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Panel: Settings */}
					<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-6">
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
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
								<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
								<line x1="12" y1="22.08" x2="12" y2="12" />
							</svg>
							Upscale Settings
						</h3>

						{/* Scale selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.scaleFactor}</label>
							<div class="grid grid-cols-3 gap-2">
								{[2, 3, 4].map((factor) => (
									<button
										key={factor}
										class={`py-2 px-3 rounded-full text-caption-uppercase font-bold border transition-colors ${
											scale === factor
												? "bg-primary border-primary text-white"
												: "bg-surface-soft border-hairline text-ink hover:border-primary"
										}`}
										onClick={() => setScale(factor)}
									>
										{factor}x
									</button>
								))}
							</div>
						</div>

						{/* Sharpness */}
						<div>
							<label class="text-caption text-muted block mb-1">
								{t.sharpness} ({sharpness}%)
							</label>
							<input
								type="range"
								min="0"
								max="100"
								class="w-full accent-primary"
								value={sharpness}
								onInput={(e) => setSharpness(Number.parseInt((e.target as HTMLInputElement).value))}
							/>
						</div>

						{/* Denoise */}
						<div>
							<label class="text-caption text-muted block mb-1">
								{t.denoise} ({denoise}%)
							</label>
							<input
								type="range"
								min="0"
								max="100"
								class="w-full accent-primary"
								value={denoise}
								onInput={(e) => setDenoise(Number.parseInt((e.target as HTMLInputElement).value))}
							/>
						</div>

						{/* Dimensions summary */}
						<div class="bg-surface-soft p-3 rounded-lg border border-hairline space-y-2 text-caption">
							<div class="flex justify-between">
								<span class="text-muted">{t.originalSize}:</span>
								<span class="font-bold text-ink">
									{imgNaturalWidth} x {imgNaturalHeight}px
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted">{t.targetSize}:</span>
								<span class="font-bold text-primary">
									{imgNaturalWidth * scale} x {imgNaturalHeight * scale}px
								</span>
							</div>
						</div>

						{/* Action Buttons */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={handleEnlarge}>
									{t.processBtn}
								</button>
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						)}

						{status === "processing" && (
							<div class="text-center py-4 space-y-2">
								<span class="text-body-sm text-primary font-medium block animate-pulse">
									{t.statusProcessing}
								</span>
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Preview Area */}
					<div class="lg:col-span-8 space-y-6">
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.compareTitle}
							</h3>

							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline overflow-hidden max-h-[450px]">
								{resultUrl ? (
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
										<div class="space-y-1">
											<span class="text-caption text-white bg-black/60 px-2 py-0.5 rounded absolute z-10 m-2">
												Original
											</span>
											<img
												src={previewUrl}
												class="w-full h-full object-contain rounded bg-black/10"
												style="max-height: 400px"
											/>
										</div>
										<div class="space-y-1">
											<span class="text-caption text-primary bg-primary/10 px-2 py-0.5 rounded absolute z-10 m-2 font-bold">
												Upscaled ({scale}x)
											</span>
											<img
												src={resultUrl}
												class="w-full h-full object-contain rounded bg-black/10"
												style="max-height: 400px"
											/>
										</div>
									</div>
								) : (
									<img src={previewUrl} class="max-w-full max-h-[400px] object-contain rounded" />
								)}
							</div>

							{status === "done" && resultUrl && (
								<button
									class="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2"
									onClick={handleDownload}
								>
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
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="7 10 12 15 17 10" />
										<line x1="12" y1="15" x2="12" y2="3" />
									</svg>
									{t.download}
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Hidden Canvas for computation */}
			<canvas ref={canvasRef} class="hidden" />
		</div>
	);
}
