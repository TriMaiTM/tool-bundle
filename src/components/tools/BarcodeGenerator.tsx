import JsBarcode from "jsbarcode";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const FORMATS = [
	{ id: "CODE128", label: "CODE 128" },
	{ id: "EAN13", label: "EAN-13" },
	{ id: "EAN8", label: "EAN-8" },
	{ id: "UPC", label: "UPC-A" },
	{ id: "CODE39", label: "CODE 39" },
	{ id: "ITF14", label: "ITF-14" },
	{ id: "MSI", label: "MSI" },
	{ id: "pharmacode", label: "Pharmacode" },
];

export default function BarcodeGenerator() {
	const [text, setText] = useState("123456789");
	const [format, setFormat] = useState("CODE128");
	const [width, setWidth] = useState(2);
	const [height, setHeight] = useState(100);
	const [showText, setShowText] = useState(true);
	const [lineColor, setLineColor] = useState("#0a0a0a");
	const [bgColor, setBgColor] = useState("#ffffff");
	const svgRef = useRef<SVGSVGElement>(null);

	const generate = useCallback(() => {
		if (!text.trim() || !svgRef.current) return;
		try {
			JsBarcode(svgRef.current, text, {
				format: format as any,
				width,
				height,
				displayValue: showText,
				lineColor,
				background: bgColor,
				font: "monospace",
				fontSize: 16,
				margin: 10,
			});
		} catch (err) {
			console.error("Barcode generation failed:", err);
		}
	}, [text, format, width, height, showText, lineColor, bgColor]);

	useEffect(() => {
		generate();
	}, [generate]);

	const handleDownload = useCallback(() => {
		if (!svgRef.current) return;
		const svgData = new XMLSerializer().serializeToString(svgRef.current);
		const blob = new Blob([svgData], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "barcode.svg";
		a.click();
		URL.revokeObjectURL(url);
	}, []);

	const handleCopy = useCallback(async () => {
		if (!svgRef.current) return;
		const svgData = new XMLSerializer().serializeToString(svgRef.current);
		const blob = new Blob([svgData], { type: "image/svg+xml" });
		try {
			await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": blob })]);
		} catch {
			/* ignore */
		}
	}, []);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					{/* Content */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Barcode Value</label>
						<input
							class="input font-mono"
							value={text}
							onInput={(e) => setText((e.target as HTMLInputElement).value)}
							placeholder="Enter value..."
						/>
					</div>

					{/* Format */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Format</label>
						<select
							class="input"
							value={format}
							onChange={(e) => setFormat((e.target as HTMLSelectElement).value)}
						>
							{FORMATS.map((f) => (
								<option key={f.id} value={f.id}>
									{f.label}
								</option>
							))}
						</select>
					</div>

					{/* Width */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Bar Width: {width}px</label>
						<input
							type="range"
							min={1}
							max={5}
							value={width}
							onInput={(e) => setWidth(Number((e.target as HTMLInputElement).value))}
							class="w-full"
						/>
					</div>

					{/* Height */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Height: {height}px</label>
						<input
							type="range"
							min={30}
							max={200}
							value={height}
							onInput={(e) => setHeight(Number((e.target as HTMLInputElement).value))}
							class="w-full"
						/>
					</div>

					{/* Show text */}
					<div class="mb-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showText}
								onChange={(e) => setShowText((e.target as HTMLInputElement).checked)}
								class="w-4 h-4"
							/>
							<span class="text-body-sm">Show text below barcode</span>
						</label>
					</div>

					{/* Colors */}
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">Line Color</label>
							<input
								type="color"
								value={lineColor}
								onInput={(e) => setLineColor((e.target as HTMLInputElement).value)}
								class="w-full h-10 rounded cursor-pointer border border-hairline"
							/>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">Background</label>
							<input
								type="color"
								value={bgColor}
								onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
								class="w-full h-10 rounded cursor-pointer border border-hairline"
							/>
						</div>
					</div>

					{/* Download */}
					<div class="flex gap-3">
						<button class="btn-primary" onClick={handleDownload}>
							Download SVG
						</button>
						<button class="btn-secondary" onClick={handleCopy}>
							Copy SVG
						</button>
					</div>
				</div>

				{/* Preview */}
				<div class="flex items-center justify-center bg-white rounded-lg p-6">
					<svg ref={svgRef} />
				</div>
			</div>
		</div>
	);
}
