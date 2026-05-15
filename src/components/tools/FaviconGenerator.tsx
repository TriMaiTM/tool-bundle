import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const ICON_SIZES = [
	{ label: "16×16", size: 16 },
	{ label: "32×32", size: 32 },
	{ label: "48×48", size: 48 },
	{ label: "180×180", size: 180 },
	{ label: "192×192", size: 192 },
	{ label: "512×512", size: 512 },
];

const SHAPE_OPTIONS = [
	{ label: "Square", value: "square" },
	{ label: "Rounded", value: "rounded" },
	{ label: "Circle", value: "circle" },
];

const FONT_OPTIONS = [
	{ label: "Sans-serif", value: "sans-serif" },
	{ label: "Serif", value: "serif" },
	{ label: "Monospace", value: "monospace" },
];

const EMOJI_OPTIONS = ["🔥", "⭐", "🚀", "💎", "🎯", "🌟", "💡", "🎨", "📦", "🛠️", "❤️", "✨"];

export default function FaviconGenerator() {
	const [inputText, setInputText] = useState("TB");
	const [inputMode, setInputMode] = useState<"text" | "emoji" | "image">("text");
	const [selectedEmoji, setSelectedEmoji] = useState("🔥");
	const [bgColor, setBgColor] = useState("#e60023");
	const [textColor, setTextColor] = useState("#ffffff");
	const [fontSize, setFontSize] = useState(60);
	const [shape, setShape] = useState<"square" | "rounded" | "circle">("rounded");
	const [fontFamily, setFontFamily] = useState("sans-serif");
	const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

	const drawFavicon = useCallback(
		(targetCanvas: HTMLCanvasElement, size: number) => {
			const ctx = targetCanvas.getContext("2d");
			if (!ctx) return;

			targetCanvas.width = size;
			targetCanvas.height = size;
			ctx.clearRect(0, 0, size, size);

			const radius = shape === "circle" ? size / 2 : shape === "rounded" ? size * 0.2 : 0;

			// Draw shape
			ctx.beginPath();
			if (shape === "circle") {
				ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
			} else if (shape === "rounded") {
				ctx.roundRect(0, 0, size, size, radius);
			} else {
				ctx.rect(0, 0, size, size);
			}
			ctx.fillStyle = bgColor;
			ctx.fill();

			// Clip for circle/rounded
			ctx.save();
			if (shape === "circle") {
				ctx.beginPath();
				ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
				ctx.clip();
			} else if (shape === "rounded") {
				ctx.beginPath();
				ctx.roundRect(0, 0, size, size, radius);
				ctx.clip();
			}

			if (inputMode === "image" && uploadedImage) {
				// Draw uploaded image to fit
				const imgAspect = uploadedImage.width / uploadedImage.height;
				let drawW = size;
				let drawH = size;
				let drawX = 0;
				let drawY = 0;
				if (imgAspect > 1) {
					drawH = size / imgAspect;
					drawY = (size - drawH) / 2;
				} else {
					drawW = size * imgAspect;
					drawX = (size - drawW) / 2;
				}
				ctx.drawImage(uploadedImage, drawX, drawY, drawW, drawH);
			} else if (inputMode === "emoji") {
				const scaledSize = size * 0.6;
				ctx.font = `${scaledSize}px serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(selectedEmoji, size / 2, size / 2);
			} else {
				const scaledFontSize = (fontSize / 100) * size;
				ctx.fillStyle = textColor;
				ctx.font = `bold ${scaledFontSize}px ${fontFamily}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(inputText.slice(0, 2), size / 2, size / 2);
			}

			ctx.restore();
		},
		[
			inputText,
			inputMode,
			selectedEmoji,
			bgColor,
			textColor,
			fontSize,
			shape,
			fontFamily,
			uploadedImage,
		],
	);

	// Draw main canvas
	useEffect(() => {
		if (canvasRef.current) {
			drawFavicon(canvasRef.current, 512);
		}
	}, [drawFavicon]);

	// Draw preview canvases
	useEffect(() => {
		for (const [size, canvas] of previewRefs.current.entries()) {
			drawFavicon(canvas, size);
		}
	}, [drawFavicon]);

	const handleImageUpload = useCallback((e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => setUploadedImage(img);
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	}, []);

	const downloadSingle = useCallback(
		(size: number) => {
			const tempCanvas = document.createElement("canvas");
			drawFavicon(tempCanvas, size);
			const url = tempCanvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.href = url;
			a.download = `favicon-${size}x${size}.png`;
			a.click();
		},
		[drawFavicon],
	);

	const downloadAll = useCallback(() => {
		for (const { size } of ICON_SIZES) {
			setTimeout(() => downloadSingle(size), 100);
		}
	}, [downloadSingle]);

	const generateHTML = useCallback((): string => {
		return `<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA Icons -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Web Manifest -->
<link rel="manifest" href="/site.webmanifest">`;
	}, []);

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

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					{/* Input Mode */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Input Method</label>
						<div class="flex gap-2">
							<button
								class={inputMode === "text" ? "btn-primary" : "btn-secondary"}
								onClick={() => setInputMode("text")}
							>
								Text
							</button>
							<button
								class={inputMode === "emoji" ? "btn-primary" : "btn-secondary"}
								onClick={() => setInputMode("emoji")}
							>
								Emoji
							</button>
							<button
								class={inputMode === "image" ? "btn-primary" : "btn-secondary"}
								onClick={() => setInputMode("image")}
							>
								Image
							</button>
						</div>
					</div>

					{/* Text Input */}
					{inputMode === "text" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">
								Text (1-2 characters)
							</label>
							<input
								class="input"
								maxLength={2}
								placeholder="TB"
								value={inputText}
								onInput={(e) => setInputText((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{/* Emoji Select */}
					{inputMode === "emoji" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">Select Emoji</label>
							<div class="flex gap-2 flex-wrap">
								{EMOJI_OPTIONS.map((emoji) => (
									<button
										key={emoji}
										class="flex items-center justify-center"
										style={`width: 40px; height: 40px; font-size: 24px; border-radius: 8px; border: 2px solid ${selectedEmoji === emoji ? "var(--color-ink)" : "var(--color-hairline)"}; background: var(--color-canvas); cursor: pointer`}
										onClick={() => setSelectedEmoji(emoji)}
									>
										{emoji}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Image Upload */}
					{inputMode === "image" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">Upload Image</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								class="input"
								style="padding: 8px"
							/>
							{uploadedImage && (
								<p class="text-caption mt-1" style="color: var(--color-success)">
									✓ Image loaded ({uploadedImage.width}×{uploadedImage.height})
								</p>
							)}
						</div>
					)}

					{/* Background Color */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Background Color</label>
						<div class="flex gap-2">
							<input
								type="color"
								value={bgColor}
								onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
								style="width: 44px; height: 44px; border-radius: 8px; cursor: pointer; border: 1px solid var(--color-hairline)"
							/>
							<input
								class="input"
								value={bgColor}
								onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					{/* Text Color (only for text mode) */}
					{inputMode === "text" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">Text Color</label>
							<div class="flex gap-2">
								<input
									type="color"
									value={textColor}
									onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
									style="width: 44px; height: 44px; border-radius: 8px; cursor: pointer; border: 1px solid var(--color-hairline)"
								/>
								<input
									class="input"
									value={textColor}
									onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{/* Font Size (only for text mode) */}
					{inputMode === "text" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">
								Font Size: {fontSize}%
							</label>
							<input
								type="range"
								min="30"
								max="90"
								value={fontSize}
								onInput={(e) => setFontSize(Number((e.target as HTMLInputElement).value))}
								class="w-full"
							/>
						</div>
					)}

					{/* Font (only for text mode) */}
					{inputMode === "text" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">Font</label>
							<select
								class="input"
								value={fontFamily}
								onChange={(e) => setFontFamily((e.target as HTMLSelectElement).value)}
							>
								{FONT_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Shape */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Shape</label>
						<div class="flex gap-2">
							{SHAPE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									class={shape === opt.value ? "btn-primary" : "btn-secondary"}
									onClick={() => setShape(opt.value as "square" | "rounded" | "circle")}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* Download Actions */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Download</label>
						<div class="flex gap-2 flex-wrap">
							{ICON_SIZES.map(({ label, size }) => (
								<button
									key={size}
									class="btn-secondary"
									style="height: 32px; font-size: 12px"
									onClick={() => downloadSingle(size)}
								>
									{label}
								</button>
							))}
						</div>
						<button class="btn-primary mt-2" onClick={downloadAll}>
							Download All Sizes
						</button>
					</div>

					{/* HTML Code */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">HTML Code</label>
						<div class="relative">
							<pre class="code-block" style="font-size: 12px; max-height: 160px; overflow: auto">
								{generateHTML()}
							</pre>
							<button
								class="btn-secondary"
								style="position: absolute; top: 8px; right: 8px; height: 28px; font-size: 11px"
								onClick={() => copyToClipboard(generateHTML(), "html")}
							>
								{copiedField === "html" ? "✓" : "Copy"}
							</button>
						</div>
					</div>
				</div>

				{/* Preview */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Preview</label>

					{/* Main large preview */}
					<div class="flex justify-center mb-6">
						<div
							class="card"
							style="padding: 24px; display: inline-flex; flex-direction: column; align-items: center"
						>
							<canvas ref={canvasRef} style="width: 192px; height: 192px; border-radius: 8px" />
							<p class="text-caption mt-2" style="color: var(--color-mute)">
								512×512 (preview)
							</p>
						</div>
					</div>

					{/* Size previews */}
					<label class="text-caption-uppercase text-muted block mb-2">All Sizes</label>
					<div class="flex flex-wrap gap-4 items-end">
						{ICON_SIZES.map(({ label, size }) => (
							<div key={size} class="flex flex-col items-center">
								<canvas
									ref={(el) => {
										if (el) {
											previewRefs.current.set(size, el);
											drawFavicon(el, size);
										}
									}}
									style={`width: ${Math.min(size, 64)}px; height: ${Math.min(size, 64)}px; border: 1px solid var(--color-hairline); border-radius: 4px`}
								/>
								<p class="text-caption mt-1" style="color: var(--color-ash)">
									{label}
								</p>
							</div>
						))}
					</div>

					{/* File naming guide */}
					<div class="card mt-6" style="background-color: var(--color-surface-card)">
						<p class="text-body-sm" style="color: var(--color-mute)">
							<strong>File naming guide:</strong>
						</p>
						<ul
							class="text-body-sm mt-1"
							style="color: var(--color-mute); padding-left: 16px; list-style: disc"
						>
							<li>
								<code>favicon-16x16.png</code> — Browser tab icon
							</li>
							<li>
								<code>favicon-32x32.png</code> — Taskbar shortcut
							</li>
							<li>
								<code>apple-touch-icon.png</code> — iOS home screen (180×180)
							</li>
							<li>
								<code>android-chrome-192x192.png</code> — PWA icon
							</li>
							<li>
								<code>android-chrome-512x512.png</code> — PWA splash screen
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
