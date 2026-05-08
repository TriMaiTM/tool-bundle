import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { downloadBlob } from "../../utils/download";
import { type ImageFormat, cropImage, loadImage } from "../../utils/image";
import FileDropZone from "../ui/FileDropZone";

const ASPECT_PRESETS = [
	{ label: "Free", ratio: null },
	{ label: "1:1", ratio: 1 },
	{ label: "4:3", ratio: 4 / 3 },
	{ label: "3:2", ratio: 3 / 2 },
	{ label: "16:9", ratio: 16 / 9 },
	{ label: "9:16", ratio: 9 / 16 },
	{ label: "2:3", ratio: 2 / 3 },
	{ label: "3:4", ratio: 3 / 4 },
];

export default function ImageCropper() {
	const [file, setFile] = useState<File | null>(null);
	const [imgUrl, setImgUrl] = useState<string | null>(null);
	const [imgWidth, setImgWidth] = useState(0);
	const [imgHeight, setImgHeight] = useState(0);
	const [x, setX] = useState(0);
	const [y, setY] = useState(0);
	const [cropWidth, setCropWidth] = useState(0);
	const [cropHeight, setCropHeight] = useState(0);
	const [aspectRatio, setAspectRatio] = useState<number | null>(null);
	const [format, setFormat] = useState<ImageFormat>("image/png");
	const [quality, setQuality] = useState(92);
	const [processing, setProcessing] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		const img = await loadImage(f);
		setImgWidth(img.naturalWidth);
		setImgHeight(img.naturalHeight);
		setX(0);
		setY(0);
		setCropWidth(img.naturalWidth);
		setCropHeight(img.naturalHeight);
		setImgUrl(URL.createObjectURL(f));
	}, []);

	// Draw crop overlay on canvas
	useEffect(() => {
		if (!imgUrl || !canvasRef.current) return;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d")!;
		const img = new Image();
		img.onload = () => {
			// Scale to fit canvas display
			const maxW = 600;
			const maxH = 400;
			const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
			canvas.width = Math.round(img.naturalWidth * scale);
			canvas.height = Math.round(img.naturalHeight * scale);

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			// Draw dark overlay
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Clear crop area
			const sx = x * scale;
			const sy = y * scale;
			const sw = cropWidth * scale;
			const sh = cropHeight * scale;
			ctx.clearRect(sx, sy, sw, sh);
			ctx.drawImage(img, x, y, cropWidth, cropHeight, sx, sy, sw, sh);

			// Draw border
			ctx.strokeStyle = "#faff69";
			ctx.lineWidth = 2;
			ctx.strokeRect(sx, sy, sw, sh);

			// Draw corner handles
			const hs = 8;
			ctx.fillStyle = "#faff69";
			ctx.fillRect(sx - hs / 2, sy - hs / 2, hs, hs);
			ctx.fillRect(sx + sw - hs / 2, sy - hs / 2, hs, hs);
			ctx.fillRect(sx - hs / 2, sy + sh - hs / 2, hs, hs);
			ctx.fillRect(sx + sw - hs / 2, sy + sh - hs / 2, hs, hs);
		};
		img.src = imgUrl;
	}, [imgUrl, x, y, cropWidth, cropHeight]);

	const handleCropWidthChange = useCallback(
		(val: number) => {
			const w = Math.min(val, imgWidth - x);
			setCropWidth(w);
			if (aspectRatio) {
				const h = Math.min(Math.round(w / aspectRatio), imgHeight - y);
				setCropHeight(h);
			}
		},
		[x, imgWidth, imgHeight, aspectRatio],
	);

	const handleCropHeightChange = useCallback(
		(val: number) => {
			const h = Math.min(val, imgHeight - y);
			setCropHeight(h);
			if (aspectRatio) {
				const w = Math.min(Math.round(h * aspectRatio), imgWidth - x);
				setCropWidth(w);
			}
		},
		[y, imgWidth, imgHeight, aspectRatio],
	);

	const handleXChange = useCallback(
		(val: number) => {
			const newX = Math.max(0, Math.min(val, imgWidth - cropWidth));
			setX(newX);
		},
		[cropWidth, imgWidth],
	);

	const handleYChange = useCallback(
		(val: number) => {
			const newY = Math.max(0, Math.min(val, imgHeight - cropHeight));
			setY(newY);
		},
		[cropHeight, imgHeight],
	);

	const applyAspect = useCallback(
		(ratio: number | null) => {
			setAspectRatio(ratio);
			if (ratio && imgWidth > 0 && imgHeight > 0) {
				// Fit within current image
				let w = cropWidth;
				let h = Math.round(w / ratio);
				if (h > imgHeight - y) {
					h = imgHeight - y;
					w = Math.round(h * ratio);
				}
				if (w > imgWidth - x) {
					w = imgWidth - x;
					h = Math.round(w / ratio);
				}
				setCropWidth(w);
				setCropHeight(h);
			}
		},
		[imgWidth, imgHeight, cropWidth, x, y],
	);

	const handleCrop = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		try {
			const blob = await cropImage(file, x, y, cropWidth, cropHeight, format, quality / 100);
			const ext = format.split("/")[1];
			const baseName = file.name.replace(/\.[^.]+$/, "");
			downloadBlob(blob, `${baseName}-cropped.${ext}`);
		} catch (e) {
			alert(`Crop failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, x, y, cropWidth, cropHeight, format, quality]);

	const handleReset = useCallback(() => {
		setFile(null);
		setImgUrl(null);
		setImgWidth(0);
		setImgHeight(0);
	}, []);

	return (
		<div>
			{!file ? (
				<FileDropZone
					onFiles={handleFiles}
					label="Drop an image here to crop"
					sublabel="Supports PNG, JPG, WebP up to 50MB"
				/>
			) : (
				<div>
					{/* Canvas preview with crop overlay */}
					<div class="flex justify-center mb-6 bg-surface-elevated rounded-lg p-4 overflow-auto">
						<canvas ref={canvasRef} class="rounded-md" />
					</div>

					{/* Aspect ratio presets */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Aspect Ratio</label>
						<div class="flex flex-wrap gap-2">
							{ASPECT_PRESETS.map((p) => (
								<button
									key={p.label}
									class={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
										aspectRatio === p.ratio
											? "bg-primary text-on-primary"
											: "bg-surface-elevated text-body hover:text-on-dark"
									}`}
									onClick={() => applyAspect(p.ratio)}
								>
									{p.label}
								</button>
							))}
						</div>
					</div>

					{/* Crop position & size */}
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
						<div>
							<label class="text-caption text-muted block mb-1">X Position</label>
							<input
								type="number"
								class="input"
								min={0}
								max={imgWidth - cropWidth}
								value={x}
								onInput={(e) => handleXChange(Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Y Position</label>
							<input
								type="number"
								class="input"
								min={0}
								max={imgHeight - cropHeight}
								value={y}
								onInput={(e) => handleYChange(Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Width</label>
							<input
								type="number"
								class="input"
								min={1}
								max={imgWidth - x}
								value={cropWidth}
								onInput={(e) =>
									handleCropWidthChange(Number((e.target as HTMLInputElement).value) || 1)
								}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Height</label>
							<input
								type="number"
								class="input"
								min={1}
								max={imgHeight - y}
								value={cropHeight}
								onInput={(e) =>
									handleCropHeightChange(Number((e.target as HTMLInputElement).value) || 1)
								}
							/>
						</div>
					</div>

					{/* Output settings */}
					<div class="flex flex-wrap items-center gap-4 mb-6">
						<label class="flex items-center gap-2 text-body-sm">
							<span class="text-caption text-muted">Format:</span>
							<select
								class="input"
								style="width: auto; height: 36px"
								value={format}
								onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageFormat)}
							>
								<option value="image/png">PNG</option>
								<option value="image/jpeg">JPG</option>
								<option value="image/webp">WebP</option>
							</select>
						</label>
						{format !== "image/png" && (
							<label class="flex items-center gap-2 text-body-sm">
								<span class="text-caption text-muted">Quality:</span>
								<span class="text-primary">{quality}%</span>
								<input
									type="range"
									min="10"
									max="100"
									value={quality}
									onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
									style="width: 120px; accent-color: var(--color-primary)"
								/>
							</label>
						)}
					</div>

					{/* Crop info */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-6 text-body-sm text-muted">
						Cropping: {cropWidth} × {cropHeight} from position ({x}, {y})
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCrop} disabled={processing}>
							{processing ? "Cropping..." : "Crop & Download"}
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
