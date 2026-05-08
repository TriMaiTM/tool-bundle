import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const PRESET_SIZES: { name: string; width: number; height: number }[] = [
	{ name: "Instagram Square", width: 1080, height: 1080 },
	{ name: "Instagram Story", width: 1080, height: 1920 },
	{ name: "Facebook Cover", width: 820, height: 312 },
	{ name: "Twitter Header", width: 1500, height: 500 },
	{ name: "YouTube Thumbnail", width: 1280, height: 720 },
	{ name: "HD", width: 1920, height: 1080 },
	{ name: "Social Card", width: 1200, height: 630 },
];

export default function PlaceholderImage() {
	const [width, setWidth] = useState(400);
	const [height, setHeight] = useState(300);
	const [bgColor, setBgColor] = useState("#cccccc");
	const [textColor, setTextColor] = useState("#666666");
	const [customText, setCustomText] = useState("");
	const [fontSize, setFontSize] = useState(24);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [copied, setCopied] = useState(false);

	const displayText = customText || `${width}×${height}`;

	const drawPreview = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const previewW = 500;
		const previewH = Math.round((height / width) * previewW) || 300;
		canvas.width = previewW;
		canvas.height = previewH;

		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, previewW, previewH);

		// Draw grid lines
		ctx.strokeStyle = `${textColor}33`;
		ctx.lineWidth = 1;
		const gridSize = 40;
		for (let x = gridSize; x < previewW; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, previewH);
			ctx.stroke();
		}
		for (let y = gridSize; y < previewH; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(previewW, y);
			ctx.stroke();
		}

		// Draw border
		ctx.strokeStyle = `${textColor}66`;
		ctx.lineWidth = 2;
		ctx.strokeRect(1, 1, previewW - 2, previewH - 2);

		// Draw text
		const scaledFontSize = Math.round((fontSize / width) * previewW);
		ctx.fillStyle = textColor;
		ctx.font = `bold ${Math.max(12, scaledFontSize)}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(displayText, previewW / 2, previewH / 2);
	}, [width, height, bgColor, textColor, fontSize, displayText]);

	useEffect(() => {
		drawPreview();
	}, [drawPreview]);

	const downloadPng = useCallback(() => {
		const offscreen = document.createElement("canvas");
		offscreen.width = width;
		offscreen.height = height;
		const ctx = offscreen.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);

		// Grid
		ctx.strokeStyle = `${textColor}33`;
		ctx.lineWidth = 1;
		const gridSize = Math.max(20, Math.round(width / 20));
		for (let x = gridSize; x < width; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		for (let y = gridSize; y < height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		ctx.strokeStyle = `${textColor}66`;
		ctx.lineWidth = 2;
		ctx.strokeRect(1, 1, width - 2, height - 2);

		ctx.fillStyle = textColor;
		ctx.font = `bold ${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(displayText, width / 2, height / 2);

		const link = document.createElement("a");
		link.download = `placeholder-${width}x${height}.png`;
		link.href = offscreen.toDataURL("image/png");
		link.click();
	}, [width, height, bgColor, textColor, fontSize, displayText]);

	const copyDataUrl = useCallback(async () => {
		const offscreen = document.createElement("canvas");
		offscreen.width = width;
		offscreen.height = height;
		const ctx = offscreen.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = textColor;
		ctx.font = `bold ${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(displayText, width / 2, height / 2);

		await navigator.clipboard.writeText(offscreen.toDataURL("image/png"));
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [width, height, bgColor, textColor, fontSize, displayText]);

	return (
		<div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Width (px)</label>
					<input
						type="number"
						class="input w-full"
						value={width}
						min={1}
						max={4000}
						onInput={(e) =>
							setWidth(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
						}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Height (px)</label>
					<input
						type="number"
						class="input w-full"
						value={height}
						min={1}
						max={4000}
						onInput={(e) =>
							setHeight(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
						}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Font Size</label>
					<input
						type="range"
						min="8"
						max="120"
						value={fontSize}
						onInput={(e) => setFontSize(Number.parseInt((e.target as HTMLInputElement).value))}
						class="w-full"
					/>
					<span class="text-body-sm text-muted-soft">{fontSize}px</span>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Background Color</label>
					<div class="flex gap-2 items-center">
						<input
							type="color"
							value={bgColor}
							onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
							style="width: 40px; height: 36px; border: none; cursor: pointer;"
						/>
						<input
							type="text"
							class="input flex-1"
							value={bgColor}
							onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Text Color</label>
					<div class="flex gap-2 items-center">
						<input
							type="color"
							value={textColor}
							onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
							style="width: 40px; height: 36px; border: none; cursor: pointer;"
						/>
						<input
							type="text"
							class="input flex-1"
							value={textColor}
							onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Custom Text</label>
					<input
						type="text"
						class="input w-full"
						placeholder={`${width}×${height}`}
						value={customText}
						onInput={(e) => setCustomText((e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Preset Sizes</label>
				<div class="flex flex-wrap gap-2">
					{PRESET_SIZES.map((preset) => (
						<button
							class="btn-secondary text-body-sm"
							key={preset.name}
							onClick={() => {
								setWidth(preset.width);
								setHeight(preset.height);
							}}
						>
							{preset.name} ({preset.width}×{preset.height})
						</button>
					))}
				</div>
			</div>

			<div class="mb-6">
				<span class="text-caption-uppercase text-muted block mb-3">Preview</span>
				<div class="bg-surface-elevated rounded-lg p-3 flex justify-center">
					<canvas
						ref={canvasRef}
						style="max-width: 100%; border-radius: 8px; border: 1px solid var(--color-hairline, #333);"
					/>
				</div>
				<div class="text-body-sm text-muted-soft mt-2 text-center">
					{width} × {height} · Displayed at preview scale
				</div>
			</div>

			<div class="flex gap-2">
				<button class="btn-primary" onClick={downloadPng}>
					Download PNG
				</button>
				<button class="btn-secondary" onClick={copyDataUrl}>
					{copied ? "Copied!" : "Copy Data URL"}
				</button>
			</div>
		</div>
	);
}
