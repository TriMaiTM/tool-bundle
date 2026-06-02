import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

interface SocialPreset {
	key: string;
	platform: "Facebook" | "Instagram" | "YouTube" | "TikTok";
	nameEn: string;
	nameVi: string;
	width: number;
	height: number;
}

const SOCIAL_PRESETS: SocialPreset[] = [
	{
		key: "fb-profile",
		platform: "Facebook",
		nameEn: "Profile Picture",
		nameVi: "Ảnh đại diện",
		width: 360,
		height: 360,
	},
	{
		key: "fb-cover",
		platform: "Facebook",
		nameEn: "Cover Photo",
		nameVi: "Ảnh bìa trang",
		width: 820,
		height: 312,
	},
	{
		key: "fb-post",
		platform: "Facebook",
		nameEn: "Shared Post",
		nameVi: "Ảnh bài viết",
		width: 1200,
		height: 630,
	},
	{
		key: "ig-square",
		platform: "Instagram",
		nameEn: "Square Post (1:1)",
		nameVi: "Bài viết vuông (1:1)",
		width: 1080,
		height: 1080,
	},
	{
		key: "ig-portrait",
		platform: "Instagram",
		nameEn: "Portrait Post (4:5)",
		nameVi: "Bài viết dọc (4:5)",
		width: 1080,
		height: 1350,
	},
	{
		key: "ig-story",
		platform: "Instagram",
		nameEn: "Story / Reel (9:16)",
		nameVi: "Story / Reels (9:16)",
		width: 1080,
		height: 1920,
	},
	{
		key: "yt-thumb",
		platform: "YouTube",
		nameEn: "Video Thumbnail",
		nameVi: "Hình thu nhỏ (Thumbnail)",
		width: 1280,
		height: 720,
	},
	{
		key: "yt-banner",
		platform: "YouTube",
		nameEn: "Channel Banner",
		nameVi: "Ảnh bìa kênh",
		width: 2048,
		height: 1152,
	},
	{
		key: "tt-cover",
		platform: "TikTok",
		nameEn: "Video Cover (9:16)",
		nameVi: "Ảnh bìa Video (9:16)",
		width: 1080,
		height: 1920,
	},
];

export default function SocialMediaResizer() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
	const [imgNaturalHeight, setImgNaturalHeight] = useState(0);

	// Selected Preset
	const [selectedPresetKey, setSelectedPresetKey] = useState<string>("ig-square");

	// Crop / Adjustments
	const [scale, setScale] = useState(1.0);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const [fillMode, setFillMode] = useState<"cover" | "contain">("cover");
	const [bgColor, setBgColor] = useState("#000000");

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [resultUrl, setResultUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Social Media Image Resizer",
			presetLabel: "Select Social Media Platform & Size",
			fillLabel: "Scale Mode",
			fillCover: "Fill / Crop (Cover)",
			fillContain: "Fit Entire Image (Contain)",
			bgColor: "Background Color (for Fit Mode)",
			scaleLabel: "Scale (Zoom)",
			positionX: "Position X Offset",
			positionY: "Position Y Offset",
			processBtn: "Export & Resize Image",
			download: "Download Resized Image",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to resize for social media",
			dropzoneSub: "Supports JPG, PNG, WebP",
			previewTitle: "Live Crop Preview",
			autoScaleBtn: "Auto Fit / Center",
		},
		vi: {
			title: "Cắt ảnh chuẩn khung mạng xã hội",
			presetLabel: "Chọn kênh & kích thước mạng xã hội",
			fillLabel: "Chế độ vừa khung",
			fillCover: "Lấp đầy / Cắt mép (Cover)",
			fillContain: "Nhìn toàn bộ ảnh (Contain)",
			bgColor: "Màu nền phụ (Cho chế độ Contain)",
			scaleLabel: "Phóng to / Thu nhỏ",
			positionX: "Dịch ngang (X)",
			positionY: "Dịch dọc (Y)",
			processBtn: "Xuất ảnh đã cắt",
			download: "Tải ảnh về máy",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để cắt/đổi kích thước",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP",
			previewTitle: "Xem trước khung cắt",
			autoScaleBtn: "Tự động căn giữa",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Cleanup URLs
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);
		};
	}, [previewUrl, resultUrl]);

	const currentPreset =
		SOCIAL_PRESETS.find((p) => p.key === selectedPresetKey) || SOCIAL_PRESETS[3];

	const resetAdjustments = (
		imgW: number,
		imgH: number,
		preset: SocialPreset,
		mode: "cover" | "contain",
	) => {
		// Calculate default scale
		const targetW = preset.width;
		const targetH = preset.height;

		const ratioW = targetW / imgW;
		const ratioH = targetH / imgH;

		let defaultScale = 1.0;
		if (mode === "cover") {
			defaultScale = Math.max(ratioW, ratioH);
		} else {
			defaultScale = Math.min(ratioW, ratioH);
		}

		setScale(defaultScale);
		setOffsetX(0);
		setOffsetY(0);
	};

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
				resetAdjustments(tempImg.naturalWidth, tempImg.naturalHeight, currentPreset, fillMode);
			};
			tempImg.src = url;
		},
		[previewUrl, resultUrl, currentPreset, fillMode],
	);

	// Draw cropped image onto canvas
	const drawCanvas = (img: HTMLImageElement) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = currentPreset.width;
		canvas.height = currentPreset.height;

		// Fill background if contain mode
		if (fillMode === "contain") {
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		} else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}

		ctx.save();
		// Translate to center of crop canvas
		ctx.translate(canvas.width / 2, canvas.height / 2);
		// Translate offset
		ctx.translate(offsetX, offsetY);
		// Scale
		ctx.scale(scale, scale);
		// Draw image centered
		ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
		ctx.restore();
	};

	// Trigger redraw on adjustment changes
	useEffect(() => {
		if (!previewUrl) return;
		const img = new Image();
		img.onload = () => {
			drawCanvas(img);
		};
		img.src = previewUrl;
	}, [previewUrl, selectedPresetKey, scale, offsetX, offsetY, fillMode, bgColor]);

	// When preset changes, recalculate scale
	const handlePresetChange = (key: string) => {
		setSelectedPresetKey(key);
		const preset = SOCIAL_PRESETS.find((p) => p.key === key) || SOCIAL_PRESETS[3];
		if (imgNaturalWidth && imgNaturalHeight) {
			resetAdjustments(imgNaturalWidth, imgNaturalHeight, preset, fillMode);
		}
	};

	const handleFillModeChange = (mode: "cover" | "contain") => {
		setFillMode(mode);
		if (imgNaturalWidth && imgNaturalHeight) {
			resetAdjustments(imgNaturalWidth, imgNaturalHeight, currentPreset, mode);
		}
	};

	const handleAutoScale = () => {
		if (imgNaturalWidth && imgNaturalHeight) {
			resetAdjustments(imgNaturalWidth, imgNaturalHeight, currentPreset, fillMode);
		}
	};

	const processImage = () => {
		if (!previewUrl) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					drawCanvas(img);
					const canvas = canvasRef.current;
					if (canvas) {
						canvas.toBlob((blob) => {
							if (blob) {
								if (resultUrl) URL.revokeObjectURL(resultUrl);
								setResultUrl(URL.createObjectURL(blob));
								setStatus("done");
							} else {
								setStatus("error");
							}
						}, file?.type || "image/png");
					} else {
						setStatus("error");
					}
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
		a.download = `social-${selectedPresetKey}-${file?.name || "image.png"}`;
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
					{/* Left Panel: Controls */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
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
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<line x1="9" y1="3" x2="9" y2="21" />
								<line x1="15" y1="3" x2="15" y2="21" />
								<line x1="3" y1="9" x2="21" y2="9" />
								<line x1="3" y1="15" x2="21" y2="15" />
							</svg>
							Resizer Controls
						</h3>

						{/* Social Media Preset Select */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.presetLabel}</label>
							<select
								class="input w-full"
								value={selectedPresetKey}
								onChange={(e) => handlePresetChange((e.target as HTMLSelectElement).value)}
							>
								{/* Grouping presets by platform */}
								{["Facebook", "Instagram", "YouTube", "TikTok"].map((platform) => (
									<optgroup label={platform} key={platform}>
										{SOCIAL_PRESETS.filter((p) => p.platform === platform).map((p) => (
											<option key={p.key} value={p.key}>
												{p.platform} - {lang === "vi" ? p.nameVi : p.nameEn} ({p.width}x{p.height})
											</option>
										))}
									</optgroup>
								))}
							</select>
						</div>

						{/* Fill Mode selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.fillLabel}</label>
							<div class="grid grid-cols-2 gap-2">
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										fillMode === "cover"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => handleFillModeChange("cover")}
								>
									{t.fillCover}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										fillMode === "contain"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => handleFillModeChange("contain")}
								>
									{t.fillContain}
								</button>
							</div>
						</div>

						{/* Background color for Fit Mode */}
						{fillMode === "contain" && (
							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.bgColor}</label>
								<div class="flex gap-2 items-center">
									<input
										type="color"
										class="w-10 h-10 rounded border border-hairline cursor-pointer"
										value={bgColor}
										onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
									/>
									<span class="text-body-sm uppercase font-mono">{bgColor}</span>
								</div>
							</div>
						)}

						{/* Manual Alignment Sliders */}
						<div class="space-y-4 bg-surface-soft p-4 rounded-lg border border-hairline">
							<div class="flex justify-between items-center mb-1">
								<h4 class="text-xs font-bold text-ink">Fine-tune Crop Position</h4>
								<button
									class="text-xs text-primary font-bold hover:underline"
									onClick={handleAutoScale}
								>
									{t.autoScaleBtn}
								</button>
							</div>

							<div>
								<label class="text-xs text-muted block mb-1">
									{t.scaleLabel} ({Math.round(scale * 100)}%)
								</label>
								<input
									type="range"
									min="0.05"
									max="5.0"
									step="0.02"
									class="w-full accent-primary"
									value={scale}
									onInput={(e) => setScale(Number.parseFloat((e.target as HTMLInputElement).value))}
								/>
							</div>

							<div>
								<label class="text-xs text-muted block mb-1">
									{t.positionX} ({offsetX}px)
								</label>
								<input
									type="range"
									min="-1000"
									max="1000"
									class="w-full accent-primary"
									value={offsetX}
									onInput={(e) => setOffsetX(Number.parseInt((e.target as HTMLInputElement).value))}
								/>
							</div>

							<div>
								<label class="text-xs text-muted block mb-1">
									{t.positionY} ({offsetY}px)
								</label>
								<input
									type="range"
									min="-1000"
									max="1000"
									class="w-full accent-primary"
									value={offsetY}
									onInput={(e) => setOffsetY(Number.parseInt((e.target as HTMLInputElement).value))}
								/>
							</div>
						</div>

						{/* Actions */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={processImage}>
									{t.processBtn}
								</button>
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						)}

						{status === "processing" && (
							<div class="text-center py-4 space-y-2">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Live Crop Preview */}
					<div class="lg:col-span-7 space-y-6">
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.previewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-4 rounded-lg border border-hairline overflow-hidden max-h-[500px]">
								<div
									class="flex items-center justify-center bg-surface-soft rounded border border-hairline shadow"
									style={{
										width: "100%",
										maxWidth: "400px",
										aspectRatio: `${currentPreset.width} / ${currentPreset.height}`,
									}}
								>
									<canvas ref={canvasRef} class="w-full h-full object-contain rounded" />
								</div>
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
		</div>
	);
}
