import { useCallback, useEffect, useRef, useState } from "preact/hooks";

interface Point {
	x: number;
	y: number;
}

interface Stroke {
	points: Point[];
	color: string;
	width: number;
}

const PEN_COLORS = [
	{ name: "Black", value: "#000000" },
	{ name: "Dark Gray", value: "#333333" },
	{ name: "Blue", value: "#1a56db" },
	{ name: "Red", value: "#cc001f" },
];

const PRESET_SIGNATURES: Record<string, { text: string; font: string }> = {
	cursive: { text: "John Smith", font: "cursive" },
	print: { text: "JOHN SMITH", font: "sans-serif" },
	initials: { text: "JS", font: "serif" },
};

export default function SignatureGenerator() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [strokes, setStrokes] = useState<Stroke[]>([]);
	const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [penColor, setPenColor] = useState(PEN_COLORS[0].value);
	const [penWidth, setPenWidth] = useState(2);
	const [transparentBg, setTransparentBg] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const canvasWidth = 500;
	const canvasHeight = 150;

	// Redraw canvas
	const redraw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		if (!transparentBg) {
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		}

		// Draw all completed strokes
		for (const stroke of strokes) {
			if (stroke.points.length < 2) continue;
			ctx.beginPath();
			ctx.strokeStyle = stroke.color;
			ctx.lineWidth = stroke.width;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
			for (let i = 1; i < stroke.points.length; i++) {
				ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
			}
			ctx.stroke();
		}

		// Draw current stroke
		if (currentStroke.length >= 2) {
			ctx.beginPath();
			ctx.strokeStyle = penColor;
			ctx.lineWidth = penWidth;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
			for (let i = 1; i < currentStroke.length; i++) {
				ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
			}
			ctx.stroke();
		}
	}, [strokes, currentStroke, penColor, penWidth, transparentBg]);

	useEffect(() => {
		redraw();
	}, [redraw]);

	const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent): Point | null => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvasWidth / rect.width;
		const scaleY = canvasHeight / rect.height;
		if ("touches" in e) {
			const touch = e.touches[0];
			if (!touch) return null;
			return {
				x: (touch.clientX - rect.left) * scaleX,
				y: (touch.clientY - rect.top) * scaleY,
			};
		}
		return {
			x: ((e as MouseEvent).clientX - rect.left) * scaleX,
			y: ((e as MouseEvent).clientY - rect.top) * scaleY,
		};
	}, []);

	const handlePointerDown = useCallback(
		(e: MouseEvent | TouchEvent) => {
			e.preventDefault();
			const point = getCanvasPoint(e);
			if (!point) return;
			setIsDrawing(true);
			setCurrentStroke([point]);
		},
		[getCanvasPoint],
	);

	const handlePointerMove = useCallback(
		(e: MouseEvent | TouchEvent) => {
			if (!isDrawing) return;
			e.preventDefault();
			const point = getCanvasPoint(e);
			if (!point) return;
			setCurrentStroke((prev) => [...prev, point]);
		},
		[isDrawing, getCanvasPoint],
	);

	const handlePointerUp = useCallback(() => {
		if (!isDrawing) return;
		setIsDrawing(false);
		if (currentStroke.length > 0) {
			setStrokes((prev) => [...prev, { points: currentStroke, color: penColor, width: penWidth }]);
		}
		setCurrentStroke([]);
	}, [isDrawing, currentStroke, penColor, penWidth]);

	// Mouse events on canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const onMouseDown = (e: MouseEvent) => handlePointerDown(e);
		const onMouseMove = (e: MouseEvent) => handlePointerMove(e);
		const onMouseUp = () => handlePointerUp();
		const onTouchStart = (e: TouchEvent) => handlePointerDown(e);
		const onTouchMove = (e: TouchEvent) => handlePointerMove(e);
		const onTouchEnd = () => handlePointerUp();

		canvas.addEventListener("mousedown", onMouseDown);
		canvas.addEventListener("mousemove", onMouseMove);
		canvas.addEventListener("mouseup", onMouseUp);
		canvas.addEventListener("mouseleave", onMouseUp);
		canvas.addEventListener("touchstart", onTouchStart, { passive: false });
		canvas.addEventListener("touchmove", onTouchMove, { passive: false });
		canvas.addEventListener("touchend", onTouchEnd);

		return () => {
			canvas.removeEventListener("mousedown", onMouseDown);
			canvas.removeEventListener("mousemove", onMouseMove);
			canvas.removeEventListener("mouseup", onMouseUp);
			canvas.removeEventListener("mouseleave", onMouseUp);
			canvas.removeEventListener("touchstart", onTouchStart);
			canvas.removeEventListener("touchmove", onTouchMove);
			canvas.removeEventListener("touchend", onTouchEnd);
		};
	}, [handlePointerDown, handlePointerMove, handlePointerUp]);

	const handleClear = useCallback(() => {
		setStrokes([]);
		setCurrentStroke([]);
	}, []);

	const handleUndo = useCallback(() => {
		setStrokes((prev) => prev.slice(0, -1));
	}, []);

	const handlePreset = useCallback(
		(preset: string) => {
			const config = PRESET_SIGNATURES[preset];
			if (!config) return;

			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Draw preset text as strokes (render to canvas, then capture)
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			if (!transparentBg) {
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, canvasWidth, canvasHeight);
			}
			ctx.fillStyle = penColor;
			ctx.font = `48px ${config.font}`;
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.fillText(config.text, canvasWidth / 2, canvasHeight / 2);

			// Capture as image stroke (convert canvas to points is complex, so we just render directly)
			// For presets, we'll keep the canvas content as-is
			setStrokes([]);
			setCurrentStroke([]);
		},
		[penColor, transparentBg],
	);

	const downloadPNG = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const url = canvas.toDataURL("image/png");
		const a = document.createElement("a");
		a.href = url;
		a.download = "signature.png";
		a.click();
	}, []);

	const downloadSVG = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Build SVG from strokes
		let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">`;
		if (!transparentBg) {
			svgContent += `<rect width="100%" height="100%" fill="white"/>`;
		}
		for (const stroke of strokes) {
			if (stroke.points.length < 2) continue;
			const pathData = stroke.points
				.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
				.join(" ");
			svgContent += `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
		}
		svgContent += "</svg>";

		const blob = new Blob([svgContent], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "signature.svg";
		a.click();
		URL.revokeObjectURL(url);
	}, [strokes]);

	const copyToClipboard = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			const ta = document.createElement("textarea");
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		}
	}, []);

	const handleCopyBase64 = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const dataUrl = canvas.toDataURL("image/png");
		copyToClipboard(dataUrl, "base64");
	}, [copyToClipboard]);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					{/* Pen Color */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Pen Color</label>
						<div class="flex gap-2">
							{PEN_COLORS.map((color) => (
								<button
									key={color.value}
									class="flex items-center justify-center"
									style={`width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${penColor === color.value ? "var(--color-ink)" : "var(--color-hairline)"}; background-color: ${color.value}; cursor: pointer`}
									onClick={() => setPenColor(color.value)}
									title={color.name}
								/>
							))}
						</div>
					</div>

					{/* Pen Width */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">
							Pen Thickness: {penWidth}px
						</label>
						<input
							type="range"
							min="1"
							max="5"
							step="0.5"
							value={penWidth}
							onInput={(e) => setPenWidth(Number.parseFloat((e.target as HTMLInputElement).value))}
							class="w-full"
						/>
					</div>

					{/* Transparent BG */}
					<div class="mb-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={transparentBg}
								onChange={(e) => setTransparentBg((e.target as HTMLInputElement).checked)}
							/>
							<span class="text-body-sm">Transparent background</span>
						</label>
					</div>

					{/* Presets */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Style Presets</label>
						<div class="flex gap-2 flex-wrap">
							{Object.entries(PRESET_SIGNATURES).map(([key, config]) => (
								<button
									key={key}
									class="btn-secondary"
									style={`font-family: ${config.font}; height: 36px; font-size: 13px`}
									onClick={() => handlePreset(key)}
								>
									{config.text}
								</button>
							))}
						</div>
					</div>

					{/* Actions */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Actions</label>
						<div class="flex gap-2 flex-wrap">
							<button class="btn-secondary" onClick={handleUndo} disabled={strokes.length === 0}>
								Undo
							</button>
							<button
								class="btn-secondary"
								onClick={handleClear}
								disabled={strokes.length === 0 && currentStroke.length === 0}
							>
								Clear
							</button>
						</div>
					</div>

					{/* Download */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Download</label>
						<div class="flex gap-2 flex-wrap">
							<button class="btn-primary" onClick={downloadPNG} disabled={strokes.length === 0}>
								Download PNG
							</button>
							<button class="btn-secondary" onClick={downloadSVG} disabled={strokes.length === 0}>
								Download SVG
							</button>
							<button
								class="btn-secondary"
								onClick={handleCopyBase64}
								disabled={strokes.length === 0}
							>
								{copiedField === "base64" ? "✓ Copied!" : "Copy Base64"}
							</button>
						</div>
					</div>

					{/* Info */}
					<div class="card mt-4" style="background-color: var(--color-surface-card)">
						<p class="text-body-sm" style="color: var(--color-mute)">
							Draw your signature above using mouse or touch. Use Undo to remove the last stroke, or
							Clear to start over. Download as PNG for images or SVG for scalable graphics.
						</p>
					</div>
				</div>

				{/* Canvas */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Signature Canvas</label>
					<div
						class="card"
						style={`padding: 16px; background-color: ${transparentBg ? "var(--color-surface-card)" : "white"}; background-image: ${transparentBg ? "linear-gradient(45deg, var(--color-hairline-soft) 25%, transparent 25%), linear-gradient(-45deg, var(--color-hairline-soft) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-hairline-soft) 75%), linear-gradient(-45deg, transparent 75%, var(--color-hairline-soft) 75%)" : "none"}; background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px`}
					>
						<canvas
							ref={canvasRef}
							width={canvasWidth}
							height={canvasHeight}
							style="width: 100%; height: auto; border: 1px solid var(--color-hairline); border-radius: 8px; cursor: crosshair; touch-action: none"
						/>
						<p class="text-caption mt-2" style="color: var(--color-ash); text-align: center">
							Draw here with mouse or touch
						</p>
					</div>

					{/* Stroke count */}
					{strokes.length > 0 && (
						<p class="text-caption mt-2" style="color: var(--color-mute)">
							{strokes.length} stroke{strokes.length !== 1 ? "s" : ""} drawn
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
