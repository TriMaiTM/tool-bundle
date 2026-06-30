import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type BlindnessType = "deuteranopia" | "protanopia" | "tritanopia" | "achromatopsia";

interface ColorSim {
	hex: string;
	deuteranopia: string;
	protanopia: string;
	tritanopia: string;
	achromatopsia: string;
}

// Vienot / Brettel Color Blindness Matrices approximations
function simulateColor(
	r: number,
	g: number,
	b: number,
	type: BlindnessType,
): [number, number, number] {
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	switch (type) {
		case "protanopia":
			return [
				clamp(0.567 * r + 0.433 * g),
				clamp(0.558 * r + 0.442 * g),
				clamp(0.242 * g + 0.758 * b),
			];
		case "deuteranopia":
			return [
				clamp(0.625 * r + 0.375 * g),
				clamp(Math.LN2 * r + 0.3 * g),
				clamp(0.3 * g + Math.LN2 * b),
			];
		case "tritanopia":
			return [
				clamp(0.95 * r + 0.05 * g),
				clamp(0.433 * r + 0.567 * g),
				clamp(0.475 * g + 0.525 * b),
			];
		case "achromatopsia": {
			const gray = clamp(0.299 * r + 0.587 * g + 0.114 * b);
			return [gray, gray, gray];
		}
		default:
			return [r, g, b];
	}
}

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	const r = Number.parseInt(clean.substring(0, 2), 16) || 0;
	const g = Number.parseInt(clean.substring(2, 4), 16) || 0;
	const b = Number.parseInt(clean.substring(4, 6), 16) || 0;
	return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorBlindnessSimulator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"image" | "color">("color");

	// Swatch mode
	const [colorInput, setColorInput] = useState("#FF5733");
	const [swatches, setSwatches] = useState<string[]>([
		"#FF5733",
		"#33FF57",
		"#3357FF",
		"#F1C40F",
		"#9B59B6",
	]);
	const [simulatedSwatches, setSimulatedSwatches] = useState<ColorSim[]>([]);

	// Image mode
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [simulatedImages, setSimulatedImages] = useState<Record<BlindnessType, string | null>>({
		deuteranopia: null,
		protanopia: null,
		tritanopia: null,
		achromatopsia: null,
	});
	const [processingImage, setProcessingImage] = useState(false);

	const t = {
		en: {
			title: "Color Blindness Simulator",
			desc: "Simulate color vision deficiencies on uploaded images or custom color swatches to check accessibility.",
			tabColor: "Color Palette",
			tabImage: "Image Simulator",
			lblInput: "Add Color to Palette",
			btnAdd: "Add Color",
			lblNormal: "Normal Vision",
			lblDeuter: "Deuteranopia (Green Blind)",
			lblProt: "Protanopia (Red Blind)",
			lblTrit: "Tritanopia (Blue Blind)",
			lblAchro: "Achromatopsia (Monochromacy)",
			dropzoneLabel: "Drop image to simulate color vision",
			dropzoneSub: "Supports JPG, PNG, WebP up to 10MB",
			btnReset: "Choose Another Image",
			copied: "Copied!",
		},
		vi: {
			title: "Giả lập mù màu",
			desc: "Mô phỏng tật khúc xạ mù màu trên hình ảnh tải lên hoặc bảng màu tùy chọn để kiểm tra khả năng tiếp cận.",
			tabColor: "Bảng màu sắc",
			tabImage: "Mô phỏng hình ảnh",
			lblInput: "Thêm màu vào bảng",
			btnAdd: "Thêm màu",
			lblNormal: "Mắt bình thường",
			lblDeuter: "Deuteranopia (Mù màu lục)",
			lblProt: "Protanopia (Mù màu đỏ)",
			lblTrit: "Tritanopia (Mù màu lam)",
			lblAchro: "Achromatopsia (Mù toàn sắc)",
			dropzoneLabel: "Thả hình ảnh vào đây để mô phỏng",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP tới 10MB",
			btnReset: "Chọn hình ảnh khác",
			copied: "Đã chép!",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Process swatches whenever list changes
	useEffect(() => {
		const result = swatches.map((hex) => {
			const [r, g, b] = hexToRgb(hex);
			return {
				hex,
				deuteranopia: rgbToHex(...simulateColor(r, g, b, "deuteranopia")),
				protanopia: rgbToHex(...simulateColor(r, g, b, "protanopia")),
				tritanopia: rgbToHex(...simulateColor(r, g, b, "tritanopia")),
				achromatopsia: rgbToHex(...simulateColor(r, g, b, "achromatopsia")),
			};
		});
		setSimulatedSwatches(result);
	}, [swatches]);

	const addSwatch = () => {
		if (/^#[0-9A-F]{6}$/i.test(colorInput)) {
			setSwatches((prev) => [...prev, colorInput.toUpperCase()]);
		}
	};

	const removeSwatch = (index: number) => {
		setSwatches((prev) => prev.filter((_, i) => i !== index));
	};

	// Clean up image preview URL
	useEffect(() => {
		return () => {
			if (imageSrc) URL.revokeObjectURL(imageSrc);
		};
	}, [imageSrc]);

	// Image processor helper using OffscreenCanvas or temporary canvas elements
	const processImage = useCallback(
		(file: File) => {
			setProcessingImage(true);
			if (imageSrc) URL.revokeObjectURL(imageSrc);

			const srcUrl = URL.createObjectURL(file);
			setImageSrc(srcUrl);

			const img = new Image();
			img.onload = () => {
				const tempCanvas = document.createElement("canvas");
				const ctx = tempCanvas.getContext("2d");
				if (!ctx) {
					setProcessingImage(false);
					return;
				}

				// Shrink large images to max width of 600px to maintain performant canvas loop
				const scale = Math.min(1, 600 / img.width);
				tempCanvas.width = img.width * scale;
				tempCanvas.height = img.height * scale;
				ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

				const types: BlindnessType[] = [
					"deuteranopia",
					"protanopia",
					"tritanopia",
					"achromatopsia",
				];
				const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

				const results: Record<BlindnessType, string | null> = {
					deuteranopia: null,
					protanopia: null,
					tritanopia: null,
					achromatopsia: null,
				};

				// Process each type
				for (const type of types) {
					const destCanvas = document.createElement("canvas");
					destCanvas.width = tempCanvas.width;
					destCanvas.height = tempCanvas.height;
					const destCtx = destCanvas.getContext("2d");
					if (!destCtx) continue;

					const destData = destCtx.createImageData(tempCanvas.width, tempCanvas.height);
					const srcPixels = imgData.data;
					const destPixels = destData.data;

					for (let i = 0; i < srcPixels.length; i += 4) {
						const r = srcPixels[i];
						const g = srcPixels[i + 1];
						const b = srcPixels[i + 2];
						const a = srcPixels[i + 3];

						const [sr, sg, sb] = simulateColor(r, g, b, type);
						destPixels[i] = sr;
						destPixels[i + 1] = sg;
						destPixels[i + 2] = sb;
						destPixels[i + 3] = a;
					}

					destCtx.putImageData(destData, 0, 0);
					results[type] = destCanvas.toDataURL("image/jpeg", 0.85);
				}

				setSimulatedImages(results);
				setProcessingImage(false);
			};
			img.src = srcUrl;
		},
		[imageSrc],
	);

	const handleFiles = (files: File[]) => {
		if (files[0]) {
			setImageFile(files[0]);
			processImage(files[0]);
		}
	};

	const handleReset = () => {
		setImageFile(null);
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(null);
		setSimulatedImages({
			deuteranopia: null,
			protanopia: null,
			tritanopia: null,
			achromatopsia: null,
		});
	};

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "color"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("color")}
				>
					{t.tabColor}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "image"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("image")}
				>
					{t.tabImage}
				</button>
			</div>

			{/* Description */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
				<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 mb-2">
					{t.title}
				</h3>
				<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
			</div>

			{mode === "color" ? (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Panel: Palette Inputs */}
					<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.tabColor}
						</h3>
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
								<div class="flex gap-2">
									<input
										type="color"
										class="w-10 h-10 border border-hairline rounded cursor-pointer shrink-0"
										value={colorInput}
										onInput={(e) => setColorInput((e.target as HTMLInputElement).value)}
									/>
									<input
										type="text"
										class="input w-full font-mono text-body-sm"
										value={colorInput}
										onInput={(e) => setColorInput((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
							<button class="btn-primary w-full py-2" onClick={addSwatch}>
								{t.btnAdd}
							</button>
						</div>

						{/* Interactive Swatch Stack */}
						<div class="border-t border-hairline pt-3 mt-3 space-y-2">
							<div class="flex flex-wrap gap-2">
								{swatches.map((hex, idx) => (
									<div key={idx} class="relative group">
										<div
											class="w-10 h-10 rounded border border-hairline shadow-sm cursor-pointer"
											style={{ backgroundColor: hex }}
											title={hex}
										/>
										<button
											class="absolute -top-1 -right-1 w-4 h-4 bg-accent-rose text-white text-[9px] rounded-full flex items-center justify-center border border-white opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => removeSwatch(idx)}
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Right Panel: Simulators */}
					<div class="lg:col-span-8 space-y-4">
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							{/* Grid showing side-by-side simulations of the swatches list */}
							<div class="space-y-4">
								{/* Normal Vision */}
								<div class="space-y-1.5">
									<span class="text-body-sm-strong text-ink font-bold block">{t.lblNormal}</span>
									<div class="flex flex-wrap gap-2.5">
										{simulatedSwatches.map((sim, idx) => (
											<div key={idx} class="flex flex-col items-center">
												<div
													class="w-12 h-12 rounded shadow-sm border border-hairline"
													style={{ backgroundColor: sim.hex }}
												/>
												<span class="text-[10px] font-mono mt-1 text-muted">{sim.hex}</span>
											</div>
										))}
									</div>
								</div>

								{/* Deuteranopia */}
								<div class="space-y-1.5 border-t border-hairline pt-3">
									<span class="text-body-sm-strong text-ink font-bold block">{t.lblDeuter}</span>
									<div class="flex flex-wrap gap-2.5">
										{simulatedSwatches.map((sim, idx) => (
											<div key={idx} class="flex flex-col items-center">
												<div
													class="w-12 h-12 rounded shadow-sm border border-hairline"
													style={{ backgroundColor: sim.deuteranopia }}
												/>
												<span class="text-[10px] font-mono mt-1 text-muted">
													{sim.deuteranopia}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Protanopia */}
								<div class="space-y-1.5 border-t border-hairline pt-3">
									<span class="text-body-sm-strong text-ink font-bold block">{t.lblProt}</span>
									<div class="flex flex-wrap gap-2.5">
										{simulatedSwatches.map((sim, idx) => (
											<div key={idx} class="flex flex-col items-center">
												<div
													class="w-12 h-12 rounded shadow-sm border border-hairline"
													style={{ backgroundColor: sim.protanopia }}
												/>
												<span class="text-[10px] font-mono mt-1 text-muted">{sim.protanopia}</span>
											</div>
										))}
									</div>
								</div>

								{/* Tritanopia */}
								<div class="space-y-1.5 border-t border-hairline pt-3">
									<span class="text-body-sm-strong text-ink font-bold block">{t.lblTrit}</span>
									<div class="flex flex-wrap gap-2.5">
										{simulatedSwatches.map((sim, idx) => (
											<div key={idx} class="flex flex-col items-center">
												<div
													class="w-12 h-12 rounded shadow-sm border border-hairline"
													style={{ backgroundColor: sim.tritanopia }}
												/>
												<span class="text-[10px] font-mono mt-1 text-muted">{sim.tritanopia}</span>
											</div>
										))}
									</div>
								</div>

								{/* Achromatopsia */}
								<div class="space-y-1.5 border-t border-hairline pt-3">
									<span class="text-body-sm-strong text-ink font-bold block">{t.lblAchro}</span>
									<div class="flex flex-wrap gap-2.5">
										{simulatedSwatches.map((sim, idx) => (
											<div key={idx} class="flex flex-col items-center">
												<div
													class="w-12 h-12 rounded shadow-sm border border-hairline"
													style={{ backgroundColor: sim.achromatopsia }}
												/>
												<span class="text-[10px] font-mono mt-1 text-muted">
													{sim.achromatopsia}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
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
						<div class="space-y-6">
							<div class="flex justify-between items-center bg-surface-elevated p-4 rounded-lg border border-hairline">
								<div class="text-body-sm text-ink truncate pr-4">
									<span class="font-bold">{imageFile.name}</span> (
									{(imageFile.size / 1024 / 1024).toFixed(2)} MB)
								</div>
								<button class="btn-secondary py-1.5 px-3 text-xs" onClick={handleReset}>
									{t.btnReset}
								</button>
							</div>

							{processingImage ? (
								<div class="flex flex-col items-center py-12 gap-3 bg-surface-elevated border border-hairline rounded-lg">
									<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
									<span class="text-body-sm text-muted">Simulating color vision...</span>
								</div>
							) : (
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Original */}
									<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm space-y-2">
										<span class="text-body-sm-strong text-ink font-bold block">{t.lblNormal}</span>
										<div class="aspect-video bg-stone rounded-lg overflow-hidden flex items-center justify-center border border-hairline max-h-60">
											{imageSrc && (
												<img
													src={imageSrc}
													alt="Normal"
													class="max-w-full max-h-full object-contain"
												/>
											)}
										</div>
									</div>

									{/* Deuteranopia */}
									<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm space-y-2">
										<span class="text-body-sm-strong text-ink font-bold block">{t.lblDeuter}</span>
										<div class="aspect-video bg-stone rounded-lg overflow-hidden flex items-center justify-center border border-hairline max-h-60">
											{simulatedImages.deuteranopia && (
												<img
													src={simulatedImages.deuteranopia}
													alt="Deuteranopia"
													class="max-w-full max-h-full object-contain"
												/>
											)}
										</div>
									</div>

									{/* Protanopia */}
									<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm space-y-2">
										<span class="text-body-sm-strong text-ink font-bold block">{t.lblProt}</span>
										<div class="aspect-video bg-stone rounded-lg overflow-hidden flex items-center justify-center border border-hairline max-h-60">
											{simulatedImages.protanopia && (
												<img
													src={simulatedImages.protanopia}
													alt="Protanopia"
													class="max-w-full max-h-full object-contain"
												/>
											)}
										</div>
									</div>

									{/* Tritanopia */}
									<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm space-y-2">
										<span class="text-body-sm-strong text-ink font-bold block">{t.lblTrit}</span>
										<div class="aspect-video bg-stone rounded-lg overflow-hidden flex items-center justify-center border border-hairline max-h-60">
											{simulatedImages.tritanopia && (
												<img
													src={simulatedImages.tritanopia}
													alt="Tritanopia"
													class="max-w-full max-h-full object-contain"
												/>
											)}
										</div>
									</div>

									{/* Achromatopsia */}
									<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm space-y-2 md:col-span-2">
										<span class="text-body-sm-strong text-ink font-bold block">{t.lblAchro}</span>
										<div class="aspect-video bg-stone rounded-lg overflow-hidden flex items-center justify-center border border-hairline max-h-60">
											{simulatedImages.achromatopsia && (
												<img
													src={simulatedImages.achromatopsia}
													alt="Achromatopsia"
													class="max-w-full max-h-full object-contain"
												/>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
