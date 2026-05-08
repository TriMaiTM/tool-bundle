import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { downloadBlob } from "../../utils/download";
import { type ImageFormat, canvasToBlob, getExtension, loadImage } from "../../utils/image";
import FileDropZone from "../ui/FileDropZone";

export default function ImageRotator() {
	const [file, setFile] = useState<File | null>(null);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [rotation, setRotation] = useState(0);
	const [flipH, setFlipH] = useState(false);
	const [flipV, setFlipV] = useState(false);
	const [customAngle, setCustomAngle] = useState(0);
	const [format, setFormat] = useState<ImageFormat>("image/png");
	const [quality, setQuality] = useState(92);
	const [processing, setProcessing] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		setRotation(0);
		setFlipH(false);
		setFlipV(false);
		setCustomAngle(0);

		const img = await loadImage(f);
		setImage(img);
	}, []);

	// Render to canvas whenever transformations change
	useEffect(() => {
		if (!image || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d")!;

		const totalAngle = rotation + customAngle;
		const rad = (totalAngle * Math.PI) / 180;

		// For 90/270 degree rotations, swap width/height
		const isRotated90 = Math.abs(totalAngle % 180) === 90 || Math.abs(totalAngle % 180) === 270;
		const cw = isRotated90 ? image.naturalHeight : image.naturalWidth;
		const ch = isRotated90 ? image.naturalWidth : image.naturalHeight;

		canvas.width = cw;
		canvas.height = ch;

		ctx.clearRect(0, 0, cw, ch);
		ctx.save();

		// Move to center, apply transforms, then draw centered
		ctx.translate(cw / 2, ch / 2);
		ctx.rotate(rad);
		ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
		ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

		ctx.restore();
	}, [image, rotation, flipH, flipV, customAngle]);

	const handleRotateCW = useCallback(() => {
		setRotation((prev) => (prev + 90) % 360);
	}, []);

	const handleRotateCCW = useCallback(() => {
		setRotation((prev) => (prev - 90 + 360) % 360);
	}, []);

	const handleRotate180 = useCallback(() => {
		setRotation((prev) => (prev + 180) % 360);
	}, []);

	const handleDownload = useCallback(async () => {
		if (!canvasRef.current || !file) return;
		setProcessing(true);
		try {
			const blob = await canvasToBlob(canvasRef.current, format, quality / 100);
			const ext = getExtension(format);
			const baseName = file.name.replace(/\.[^.]+$/, "");
			downloadBlob(blob, `${baseName}-rotated.${ext}`);
		} catch (e) {
			alert(`Export failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, format, quality]);

	const handleReset = useCallback(() => {
		setFile(null);
		setImage(null);
		setRotation(0);
		setFlipH(false);
		setFlipV(false);
		setCustomAngle(0);
	}, []);

	return (
		<div>
			{!file ? (
				<FileDropZone
					onFiles={handleFiles}
					label="Drop an image here to rotate & flip"
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

					{/* Rotation Controls */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Rotation</div>
						<div class="flex flex-wrap gap-3 mb-4">
							<button class="btn-secondary" onClick={handleRotateCCW}>
								↺ 90° CCW
							</button>
							<button class="btn-secondary" onClick={handleRotate180}>
								↻ 180°
							</button>
							<button class="btn-secondary" onClick={handleRotateCW}>
								↻ 90° CW
							</button>
						</div>
						<div class="mb-2">
							<label class="flex items-center justify-between text-body-sm mb-2">
								<span class="text-caption-uppercase text-muted">Custom Angle</span>
								<span class="text-primary font-semibold">{customAngle}°</span>
							</label>
							<input
								type="range"
								min="0"
								max="360"
								step="1"
								value={customAngle}
								onInput={(e) => setCustomAngle(Number((e.target as HTMLInputElement).value))}
								class="w-full"
								style="accent-color: var(--color-primary)"
							/>
						</div>
						<div class="flex items-center gap-3 text-body-sm text-muted">
							<span class="badge badge-yellow">{rotation + customAngle}° total</span>
						</div>
					</div>

					{/* Flip Controls */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Flip</div>
						<div class="flex gap-3">
							<button
								class={`btn-secondary ${flipH ? "!bg-primary !text-on-primary" : ""}`}
								onClick={() => setFlipH((prev) => !prev)}
							>
								⇔ Flip Horizontal
							</button>
							<button
								class={`btn-secondary ${flipV ? "!bg-primary !text-on-primary" : ""}`}
								onClick={() => setFlipV((prev) => !prev)}
							>
								⇕ Flip Vertical
							</button>
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
							{processing ? "Exporting..." : "Download"}
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
