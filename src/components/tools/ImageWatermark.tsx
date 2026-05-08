import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { downloadBlob } from "../../utils/download";
import { type ImageFormat, canvasToBlob, getExtension, loadImage } from "../../utils/image";
import FileDropZone from "../ui/FileDropZone";

type Position = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right" | "tile";

export default function ImageWatermark() {
	const [file, setFile] = useState<File | null>(null);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [text, setText] = useState("© My Watermark");
	const [fontSize, setFontSize] = useState(32);
	const [opacity, setOpacity] = useState(30);
	const [color, setColor] = useState("#ffffff");
	const [position, setPosition] = useState<Position>("bottom-right");
	const [angle, setAngle] = useState(-30);
	const [format, setFormat] = useState<ImageFormat>("image/png");
	const [quality, setQuality] = useState(92);
	const [processing, setProcessing] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		const img = await loadImage(f);
		setImage(img);
	}, []);

	// Render canvas
	useEffect(() => {
		if (!image || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d")!;
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;

		// Draw original image
		ctx.drawImage(image, 0, 0);

		// Apply watermark
		ctx.save();
		ctx.globalAlpha = opacity / 100;
		ctx.fillStyle = color;
		ctx.font = `${fontSize}px sans-serif`;

		const rad = (angle * Math.PI) / 180;

		if (position === "tile") {
			// Tile/repeat watermark across the entire image
			const metrics = ctx.measureText(text);
			const textWidth = metrics.width;
			const spacingX = textWidth + 80;
			const spacingY = fontSize * 4;

			for (let y = -canvas.height; y < canvas.height * 2; y += spacingY) {
				for (let x = -canvas.width; x < canvas.width * 2; x += spacingX) {
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(rad);
					ctx.fillText(text, 0, 0);
					ctx.restore();
				}
			}
		} else {
			// Single watermark at position
			const padding = 30;
			const metrics = ctx.measureText(text);
			const textWidth = metrics.width;
			const textHeight = fontSize;

			let x = 0;
			let y = 0;

			switch (position) {
				case "top-left":
					x = padding;
					y = padding + textHeight;
					break;
				case "top-right":
					x = canvas.width - textWidth - padding;
					y = padding + textHeight;
					break;
				case "center":
					x = (canvas.width - textWidth) / 2;
					y = (canvas.height + textHeight) / 2;
					break;
				case "bottom-left":
					x = padding;
					y = canvas.height - padding;
					break;
				case "bottom-right":
					x = canvas.width - textWidth - padding;
					y = canvas.height - padding;
					break;
			}

			ctx.translate(x, y);
			ctx.rotate(rad);
			ctx.fillText(text, 0, 0);
		}

		ctx.restore();
	}, [image, text, fontSize, opacity, color, position, angle]);

	const handleDownload = useCallback(async () => {
		if (!canvasRef.current || !file) return;
		setProcessing(true);
		try {
			const blob = await canvasToBlob(canvasRef.current, format, quality / 100);
			const ext = getExtension(format);
			const baseName = file.name.replace(/\.[^.]+$/, "");
			downloadBlob(blob, `${baseName}-watermarked.${ext}`);
		} catch (e) {
			alert(`Export failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, format, quality]);

	const handleReset = useCallback(() => {
		setFile(null);
		setImage(null);
		setText("© My Watermark");
		setFontSize(32);
		setOpacity(30);
		setColor("#ffffff");
		setPosition("bottom-right");
		setAngle(-30);
	}, []);

	return (
		<div>
			{!file ? (
				<FileDropZone
					onFiles={handleFiles}
					label="Drop an image here to add a watermark"
					sublabel="Supports PNG, JPG, WebP up to 50MB"
				/>
			) : (
				<div>
					{/* Canvas Preview */}
					<div class="bg-surface-elevated rounded-lg p-4 mb-6" style="overflow: hidden">
						<div class="text-caption-uppercase text-muted mb-3">Preview</div>
						<div style="display: flex; justify-content: center; overflow: auto">
							<canvas
								ref={canvasRef}
								style="max-width: 100%; max-height: 400px; object-fit: contain"
							/>
						</div>
					</div>

					{/* Watermark Settings */}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						{/* Text Input */}
						<div class="bg-surface-elevated rounded-lg p-3">
							<label class="text-caption-uppercase text-muted block mb-2">Watermark Text</label>
							<input
								type="text"
								class="input w-full"
								value={text}
								onInput={(e) => setText((e.target as HTMLInputElement).value)}
								placeholder="Enter watermark text..."
							/>
						</div>

						{/* Color */}
						<div class="bg-surface-elevated rounded-lg p-3">
							<label class="text-caption-uppercase text-muted block mb-2">Text Color</label>
							<div class="flex items-center gap-3">
								<input
									type="color"
									value={color}
									onInput={(e) => setColor((e.target as HTMLInputElement).value)}
									style="width: 48px; height: 36px; border: none; cursor: pointer"
								/>
								<span class="text-body-sm text-primary font-mono">{color}</span>
							</div>
						</div>
					</div>

					{/* Sliders */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4 space-y-4">
						{/* Font Size */}
						<div>
							<label class="flex items-center justify-between text-body-sm mb-2">
								<span class="text-caption-uppercase text-muted">Font Size</span>
								<span class="text-primary font-semibold">{fontSize}px</span>
							</label>
							<input
								type="range"
								min="10"
								max="100"
								step="1"
								value={fontSize}
								onInput={(e) => setFontSize(Number((e.target as HTMLInputElement).value))}
								class="w-full"
								style="accent-color: var(--color-primary)"
							/>
						</div>

						{/* Opacity */}
						<div>
							<label class="flex items-center justify-between text-body-sm mb-2">
								<span class="text-caption-uppercase text-muted">Opacity</span>
								<span class="text-primary font-semibold">{opacity}%</span>
							</label>
							<input
								type="range"
								min="0"
								max="100"
								step="1"
								value={opacity}
								onInput={(e) => setOpacity(Number((e.target as HTMLInputElement).value))}
								class="w-full"
								style="accent-color: var(--color-primary)"
							/>
						</div>

						{/* Rotation */}
						<div>
							<label class="flex items-center justify-between text-body-sm mb-2">
								<span class="text-caption-uppercase text-muted">Rotation Angle</span>
								<span class="text-primary font-semibold">{angle}°</span>
							</label>
							<input
								type="range"
								min="-180"
								max="180"
								step="1"
								value={angle}
								onInput={(e) => setAngle(Number((e.target as HTMLInputElement).value))}
								class="w-full"
								style="accent-color: var(--color-primary)"
							/>
						</div>
					</div>

					{/* Position */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Position</div>
						<div class="flex flex-wrap gap-2">
							{(
								[
									"top-left",
									"top-right",
									"center",
									"bottom-left",
									"bottom-right",
									"tile",
								] as Position[]
							).map((pos) => (
								<button
									key={pos}
									class={`btn-secondary text-body-sm ${position === pos ? "!bg-primary !text-on-primary" : ""}`}
									onClick={() => setPosition(pos)}
								>
									{pos === "tile"
										? "Tile / Repeat"
										: pos
												.split("-")
												.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
												.join(" ")}
								</button>
							))}
						</div>
					</div>

					{/* Output Format */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Output</div>
						<div class="flex flex-col gap-4">
							<div class="flex items-center gap-4">
								<label class="text-caption-uppercase text-muted whitespace-nowrap">Format</label>
								<select
									class="input"
									style="width: 140px; height: 36px"
									value={format}
									onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageFormat)}
								>
									<option value="image/png">PNG</option>
									<option value="image/jpeg">JPG</option>
									<option value="image/webp">WebP</option>
								</select>
							</div>
							{format !== "image/png" && (
								<div>
									<label class="flex items-center justify-between text-body-sm mb-2">
										<span class="text-caption-uppercase text-muted">Quality</span>
										<span class="text-primary font-semibold">{quality}%</span>
									</label>
									<input
										type="range"
										min="10"
										max="100"
										step="1"
										value={quality}
										onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
										class="w-full"
										style="accent-color: var(--color-primary)"
									/>
								</div>
							)}
						</div>
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleDownload} disabled={processing}>
							{processing ? "Exporting..." : "Download Watermarked Image"}
						</button>
						<button class="btn-secondary" onClick={handleReset}>
							Choose Another File
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
