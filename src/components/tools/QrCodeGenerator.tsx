import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
	const [text, setText] = useState("https://toolbundle.dev");
	const [size, setSize] = useState(256);
	const [fgColor, setFgColor] = useState("#0a0a0a");
	const [bgColor, setBgColor] = useState("#ffffff");
	const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const generate = useCallback(async () => {
		if (!text.trim() || !canvasRef.current) return;
		try {
			await QRCode.toCanvas(canvasRef.current, text, {
				width: size,
				margin: 2,
				color: { dark: fgColor, light: bgColor },
				errorCorrectionLevel: errorLevel,
			});
		} catch (err) {
			console.error("QR generation failed:", err);
		}
	}, [text, size, fgColor, bgColor, errorLevel]);

	useEffect(() => {
		generate();
	}, [generate]);

	const handleDownload = useCallback(
		(format: "png" | "svg") => {
			if (!canvasRef.current) return;
			if (format === "png") {
				const url = canvasRef.current.toDataURL("image/png");
				const a = document.createElement("a");
				a.href = url;
				a.download = "qrcode.png";
				a.click();
			} else {
				QRCode.toString(text, {
					type: "svg",
					width: size,
					margin: 2,
					color: { dark: fgColor, light: bgColor },
					errorCorrectionLevel: errorLevel,
				}).then((svg) => {
					const blob = new Blob([svg], { type: "image/svg+xml" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "qrcode.svg";
					a.click();
					URL.revokeObjectURL(url);
				});
			}
		},
		[text, size, fgColor, bgColor, errorLevel],
	);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					{/* Content */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Content</label>
						<textarea
							class="textarea"
							style="min-height: 80px"
							placeholder="Enter URL or text..."
							value={text}
							onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Size */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Size: {size}px</label>
						<input
							type="range"
							min={128}
							max={512}
							step={32}
							value={size}
							onInput={(e) => setSize(Number((e.target as HTMLInputElement).value))}
							class="w-full"
						/>
					</div>

					{/* Colors */}
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">Foreground</label>
							<div class="flex gap-2">
								<input
									type="color"
									value={fgColor}
									onInput={(e) => setFgColor((e.target as HTMLInputElement).value)}
									class="w-10 h-10 rounded cursor-pointer border border-hairline"
								/>
								<input
									class="input"
									value={fgColor}
									onInput={(e) => setFgColor((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">Background</label>
							<div class="flex gap-2">
								<input
									type="color"
									value={bgColor}
									onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
									class="w-10 h-10 rounded cursor-pointer border border-hairline"
								/>
								<input
									class="input"
									value={bgColor}
									onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					</div>

					{/* Error correction */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Error Correction</label>
						<div class="flex gap-2">
							{(["L", "M", "Q", "H"] as const).map((level) => (
								<button
									key={level}
									class={`px-4 py-2 text-body-sm rounded-lg border ${errorLevel === level ? "bg-primary text-on-primary border-primary" : "bg-surface-elevated text-body border-hairline hover:text-on-dark"}`}
									onClick={() => setErrorLevel(level)}
								>
									{level} —{" "}
									{level === "L" ? "7%" : level === "M" ? "15%" : level === "Q" ? "25%" : "30%"}
								</button>
							))}
						</div>
					</div>

					{/* Download */}
					<div class="flex gap-3">
						<button class="btn-primary" onClick={() => handleDownload("png")}>
							Download PNG
						</button>
						<button class="btn-secondary" onClick={() => handleDownload("svg")}>
							Download SVG
						</button>
					</div>
				</div>

				{/* Preview */}
				<div class="flex items-center justify-center">
					<div class="bg-white rounded-lg p-4">
						<canvas ref={canvasRef} />
					</div>
				</div>
			</div>
		</div>
	);
}
