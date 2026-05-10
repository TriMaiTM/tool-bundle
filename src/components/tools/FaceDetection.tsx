import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface Detection {
	label: string;
	score: number;
	box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

export default function FaceDetection() {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [detections, setDetections] = useState<Detection[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [blurred, setBlurred] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (preview) URL.revokeObjectURL(preview);
			setFile(f);
			setPreview(URL.createObjectURL(f));
			setDetections([]);
			setError(null);
			setStatus("idle");
			setProgress(0);
			setBlurred(false);
		},
		[preview],
	);

	// Draw bounding boxes on canvas
	const drawDetections = useCallback(
		(dets: Detection[], img: HTMLImageElement, applyBlur: boolean) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d")!;
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			ctx.drawImage(img, 0, 0);

			dets.forEach((det) => {
				const { xmin, ymin, xmax, ymax } = det.box;
				const w = xmax - xmin;
				const h = ymax - ymin;

				if (applyBlur) {
					// Pixelate the detected region
					const pixelSize = Math.max(8, Math.round(Math.min(w, h) / 10));
					const tempCanvas = document.createElement("canvas");
					const tempCtx = tempCanvas.getContext("2d")!;
					tempCanvas.width = w;
					tempCanvas.height = h;
					tempCtx.drawImage(canvas, xmin, ymin, w, h, 0, 0, w, h);

					// Scale down then up to pixelate
					const smallW = Math.max(1, Math.round(w / pixelSize));
					const smallH = Math.max(1, Math.round(h / pixelSize));
					const tinyCanvas = document.createElement("canvas");
					const tinyCtx = tinyCanvas.getContext("2d")!;
					tinyCanvas.width = smallW;
					tinyCanvas.height = smallH;
					tinyCtx.drawImage(tempCanvas, 0, 0, smallW, smallH);

					ctx.drawImage(tinyCanvas, 0, 0, smallW, smallH, xmin, ymin, w, h);
				} else {
					// Draw bounding box
					ctx.strokeStyle = "var(--accent-blue, #3b82f6)";
					ctx.lineWidth = 3;
					ctx.strokeRect(xmin, ymin, w, h);

					// Draw label background
					const label = `${det.label} ${(det.score * 100).toFixed(0)}%`;
					ctx.font = "bold 14px Inter, sans-serif";
					const textW = ctx.measureText(label).width;
					ctx.fillStyle = "rgba(59, 130, 246, 0.85)";
					ctx.fillRect(xmin, ymin - 24, textW + 12, 24);

					// Draw label text
					ctx.fillStyle = "#ffffff";
					ctx.fillText(label, xmin + 6, ymin - 7);
				}
			});
		},
		[],
	);

	// Redraw when detections change
	useEffect(() => {
		if (detections.length > 0 && imgRef.current && imgRef.current.complete) {
			drawDetections(detections, imgRef.current, blurred);
		}
	}, [detections, blurred, drawDetections]);

	const handleProcess = useCallback(async () => {
		if (!file) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setDetections([]);
		setBlurred(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading object detection model (~50MB)...");

			const detector = await pipeline("object-detection", "Xenova/detr-resnet-50", {
				progress_callback: (progressData: any) => {
					if (progressData.status === "progress" && progressData.progress) {
						setProgress(0.1 + (progressData.progress / 100) * 0.7);
					} else if (progressData.status === "done") {
						setProgress(0.8);
					}
				},
			} as any);

			setStatus("processing");
			setProgress(0.85);
			setStatusText("Detecting faces and people...");

			const imageUrl = URL.createObjectURL(file);
			const output = await detector(imageUrl, {
				threshold: 0.5,
				percentage: true,
			});
			URL.revokeObjectURL(imageUrl);

			const img = imgRef.current;
			if (!img || !img.complete) {
				throw new Error("Image not loaded");
			}

			// Filter for person-related detections
			const personLabels = ["person", "people", "man", "woman", "boy", "girl", "child"];
			const dets: Detection[] = (output as any[])
				.filter((item) => personLabels.some((l) => item.label.toLowerCase().includes(l)))
				.map((item) => ({
					label: item.label,
					score: item.score,
					box: {
						xmin: Math.round(item.box.xmin * img.naturalWidth),
						ymin: Math.round(item.box.ymin * img.naturalHeight),
						xmax: Math.round(item.box.xmax * img.naturalWidth),
						ymax: Math.round(item.box.ymax * img.naturalHeight),
					},
				}));

			setDetections(dets);
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to detect faces. Try a different image.",
			);
			setStatus("error");
		}
	}, [file]);

	const handleToggleBlur = useCallback(() => {
		setBlurred((prev) => !prev);
	}, []);

	const handleDownload = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = blurred ? "face-blurred.png" : "face-detection.png";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, "image/png");
	}, [blurred]);

	const handleReset = useCallback(() => {
		if (preview) URL.revokeObjectURL(preview);
		setFile(null);
		setPreview(null);
		setDetections([]);
		setError(null);
		setStatus("idle");
		setProgress(0);
		setBlurred(false);
	}, [preview]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label="Drop an image to detect faces"
					sublabel="PNG, JPG, WebP — group photos work best"
				/>
			)}

			{file && (
				<div>
					{/* Image with canvas overlay */}
					<div class="relative mb-6" style="max-width: 640px">
						<div class="text-caption-uppercase text-muted mb-2">
							{detections.length > 0 ? `${detections.length} person(s) detected` : "Image Preview"}
						</div>
						<div class="bg-surface-elevated rounded-lg overflow-hidden relative">
							{/* Hidden image for sizing */}
							<img
								ref={imgRef}
								src={preview!}
								alt="Uploaded"
								class="w-full object-contain block"
								style="max-height: 500px"
								crossOrigin="anonymous"
								onLoad={() => {
									if (detections.length > 0 && imgRef.current) {
										drawDetections(detections, imgRef.current, blurred);
									}
								}}
							/>
							{/* Canvas overlay for bounding boxes / blur */}
							{detections.length > 0 && (
								<canvas
									ref={canvasRef}
									class="absolute inset-0 w-full h-full pointer-events-none"
									style="object-fit: contain"
								/>
							)}
						</div>
						{file && <div class="text-caption text-muted mt-1">{formatFileSize(file.size)}</div>}
					</div>

					{/* Actions */}
					{!isProcessing && status !== "done" && (
						<div class="flex flex-wrap gap-3 mb-4">
							<button class="btn-primary" onClick={handleProcess}>
								Detect Faces
							</button>
							<button class="btn-secondary" onClick={handleReset}>
								Choose Another Image
							</button>
						</div>
					)}

					{/* Progress */}
					{isProcessing && (
						<div class="mb-6">
							<div class="flex items-center justify-between mb-2">
								<span class="text-body-sm text-body">{statusText}</span>
								<span class="text-body-sm text-primary font-mono">
									{Math.round(progress * 100)}%
								</span>
							</div>
							<div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
								<div
									class="bg-primary h-2 rounded-full transition-all duration-300"
									style={{ width: `${Math.round(progress * 100)}%` }}
								/>
							</div>
							<p class="text-caption text-muted mt-1">
								First time: downloading model (~50MB). Cached after that.
							</p>
						</div>
					)}

					{/* Error */}
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
							<p class="text-body-sm text-accent-rose">{error}</p>
							<button
								class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
								onClick={handleReset}
							>
								Try again
							</button>
						</div>
					)}

					{/* Detection results */}
					{status === "done" && detections.length > 0 && (
						<div class="mb-6">
							<div class="text-caption-uppercase text-muted mb-3">Detected People</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{detections.map((det, i) => (
									<div key={i} class="bg-surface-elevated rounded-lg p-3 flex items-center gap-3">
										<div
											class="w-3 h-3 rounded-full flex-shrink-0"
											style={{ background: "var(--accent-blue, #3b82f6)" }}
										/>
										<div class="flex-1">
											<span class="text-body-sm text-on-dark font-medium capitalize">
												{det.label}
											</span>
										</div>
										<span class="text-caption text-muted font-mono">
											{(det.score * 100).toFixed(1)}%
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{status === "done" && detections.length === 0 && (
						<div class="bg-surface-elevated rounded-lg p-4 mb-6 text-center">
							<p class="text-body-sm text-muted">
								No people detected with confidence &ge; 50%. Try a photo with visible people.
							</p>
						</div>
					)}

					{/* Result actions */}
					{status === "done" && (
						<div class="flex flex-wrap gap-3">
							{detections.length > 0 && (
								<>
									<button class="btn-primary" onClick={handleToggleBlur}>
										{blurred ? "Show Original" : "Blur Faces"}
									</button>
									<button class="btn-secondary" onClick={handleDownload}>
										Download {blurred ? "Blurred" : "Annotated"} Image
									</button>
								</>
							)}
							<button class="btn-secondary" onClick={handleReset}>
								Process Another Image
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
