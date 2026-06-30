import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

interface RGB {
	r: number;
	g: number;
	b: number;
}

export default function PaletteFromImage() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [colorsCount, setColorsCount] = useState<number>(6); // 4 to 12
	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [palette, setPalette] = useState<RGB[]>([]);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
	const [exportFormat, setExportFormat] = useState<"hex" | "css" | "json" | "scss">("hex");

	const t = {
		en: {
			title: "Palette From Image Extractor",
			desc: "Upload an image to extract a dominant, harmonious color palette using quantization, then export it to CSS, JSON, or SCSS.",
			colorsCountLabel: "Colors to Extract",
			processBtn: "Extract Palette",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to extract color palette",
			dropzoneSub: "Supports JPG, PNG, WebP up to 10MB",
			previewTitle: "Image Preview",
			paletteTitle: "Extracted Color Palette",
			clickToCopy: "Click to copy code",
			copied: "Copied!",
			copy: "Copy",
			lblExport: "Export Code Format",
			downloadText: "Download Palette (.json)",
		},
		vi: {
			title: "Trích xuất bảng màu từ ảnh",
			desc: "Tải hình ảnh lên để trích xuất bảng màu chủ đạo hài hòa sử dụng thuật toán lượng tử hóa, sau đó xuất ra CSS, JSON hoặc SCSS.",
			colorsCountLabel: "Số lượng màu cần trích",
			processBtn: "Trích xuất bảng màu",
			reset: "Chọn hình ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để trích xuất",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP tới 10MB",
			previewTitle: "Hình ảnh xem trước",
			paletteTitle: "Bảng màu trích xuất được",
			clickToCopy: "Click để sao chép mã",
			copied: "Đã chép!",
			copy: "Sao chép",
			lblExport: "Định dạng xuất bản mã",
			downloadText: "Tải xuống bảng màu (.json)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			setFile(f);
			setPalette([]);
			setStatus("idle");
			setPreviewUrl(URL.createObjectURL(f));
		},
		[previewUrl],
	);

	const rgbToHex = ({ r, g, b }: RGB) => {
		return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
	};

	const extractPalette = () => {
		if (!previewUrl) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = 50;
					canvas.height = 50;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						setStatus("error");
						return;
					}

					ctx.drawImage(img, 0, 0, 50, 50);
					const imgData = ctx.getImageData(0, 0, 50, 50);
					const data = imgData.data;

					const pixels: RGB[] = [];
					for (let i = 0; i < data.length; i += 4) {
						const r = data[i];
						const g = data[i + 1];
						const b = data[i + 2];
						const a = data[i + 3];
						if (a > 125) {
							pixels.push({ r, g, b });
						}
					}

					if (pixels.length === 0) {
						setStatus("error");
						return;
					}

					const boxes = [pixels];

					while (boxes.length < colorsCount) {
						let maxRangeBoxIndex = -1;
						let maxRange = -1;
						let splitChannel: "r" | "g" | "b" = "r";

						for (let i = 0; i < boxes.length; i++) {
							const box = boxes[i];
							if (box.length <= 1) continue;

							let minR = 255;
							let maxR = 0;
							let minG = 255;
							let maxG = 0;
							let minB = 255;
							let maxB = 0;

							for (const p of box) {
								if (p.r < minR) minR = p.r;
								if (p.r > maxR) maxR = p.r;
								if (p.g < minG) minG = p.g;
								if (p.g > maxG) maxG = p.g;
								if (p.b < minB) minB = p.b;
								if (p.b > maxB) maxB = p.b;
							}

							const rangeR = maxR - minR;
							const rangeG = maxG - minG;
							const rangeB = maxB - minB;

							const largestRange = Math.max(rangeR, rangeG, rangeB);
							if (largestRange > maxRange) {
								maxRange = largestRange;
								maxRangeBoxIndex = i;
								splitChannel =
									rangeR >= rangeG && rangeR >= rangeB ? "r" : rangeG >= rangeB ? "g" : "b";
							}
						}

						if (maxRangeBoxIndex === -1) break;

						const boxToSplit = boxes[maxRangeBoxIndex];
						boxToSplit.sort((a, b) => a[splitChannel] - b[splitChannel]);

						const median = Math.floor(boxToSplit.length / 2);
						const box1 = boxToSplit.slice(0, median);
						const box2 = boxToSplit.slice(median);

						boxes.splice(maxRangeBoxIndex, 1, box1, box2);
					}

					const resultColors = boxes.map((box) => {
						let rSum = 0;
						let gSum = 0;
						let bSum = 0;
						for (const p of box) {
							rSum += p.r;
							gSum += p.g;
							bSum += p.b;
						}
						return {
							r: Math.round(rSum / box.length),
							g: Math.round(gSum / box.length),
							b: Math.round(bSum / box.length),
						};
					});

					setPalette(resultColors);
					setStatus("done");
				};
				img.onerror = () => setStatus("error");
				img.src = previewUrl;
			} catch (e) {
				console.error(e);
				setStatus("error");
			}
		}, 100);
	};

	const getExportCode = () => {
		const hexCodes = palette.map((c) => rgbToHex(c));
		if (exportFormat === "json") {
			return JSON.stringify(hexCodes, null, 2);
		}
		if (exportFormat === "css") {
			return `:root {\n${hexCodes
				.map((h, i) => `  --color-primary-${i + 1}: ${h};`)
				.join("\n")}\n}`;
		}
		if (exportFormat === "scss") {
			return hexCodes.map((h, i) => `$color-primary-${i + 1}: ${h};`).join("\n");
		}
		return hexCodes.join(", ");
	};

	const downloadPalette = () => {
		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
			JSON.stringify(
				palette.map((c) => rgbToHex(c)),
				null,
				2,
			),
		)}`;
		const dlAnchorElem = document.createElement("a");
		dlAnchorElem.setAttribute("href", dataStr);
		dlAnchorElem.setAttribute("download", "extracted_palette.json");
		dlAnchorElem.click();
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopiedFormat("export");
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setFile(null);
		setPreviewUrl(null);
		setPalette([]);
		setStatus("idle");
	};

	return (
		<div class="space-y-6">
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label={t.dropzoneLabel}
					sublabel={t.dropzoneSub}
				/>
			)}

			{file && (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Configuration Panel */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 flex items-center gap-2">
							{t.title}
						</h3>
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.colorsCountLabel}</label>
							<select
								class="input w-full"
								value={colorsCount}
								onChange={(e) => setColorsCount(Number((e.target as HTMLSelectElement).value))}
							>
								{[4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
									<option key={num} value={num}>
										{num} {lang === "vi" ? "Màu" : "Colors"}
									</option>
								))}
							</select>
						</div>

						{status !== "processing" ? (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={extractPalette}>
									{t.processBtn}
								</button>
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						) : (
							<div class="text-center py-4">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Swatches and Previews */}
					<div class="lg:col-span-7 space-y-6">
						{/* Image Swatch Preview */}
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-4">
								{t.previewTitle}
							</h3>
							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline max-h-64 overflow-hidden">
								{previewUrl && (
									<img
										src={previewUrl}
										alt="Preview"
										class="max-w-full max-h-56 object-contain rounded bg-surface-soft"
									/>
								)}
							</div>
						</div>

						{/* Palette Output */}
						{status === "done" && palette.length > 0 && (
							<div class="space-y-6">
								<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
									<h3 class="text-body-strong text-ink border-b border-hairline pb-2">
										{t.paletteTitle}
									</h3>
									<div class="flex flex-wrap gap-2">
										{palette.map((color, idx) => {
											const hex = rgbToHex(color);
											return (
												<div key={idx} class="flex flex-col items-center">
													<button
														class="w-14 h-14 rounded border border-hairline shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
														style={{ backgroundColor: hex }}
														onClick={() => navigator.clipboard.writeText(hex)}
														title="Copy HEX"
													/>
													<span class="text-[10px] font-mono mt-1 text-muted">{hex}</span>
												</div>
											);
										})}
									</div>
								</div>

								{/* Export Panel */}
								<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
									<h3 class="text-body-strong text-ink border-b border-hairline pb-2">
										{t.lblExport}
									</h3>
									<div class="flex gap-2">
										{(["hex", "css", "json", "scss"] as const).map((fmt) => (
											<button
												key={fmt}
												class={`btn-secondary py-1 px-3 text-xs capitalize ${
													exportFormat === fmt ? "bg-primary/10 border-primary text-primary" : ""
												}`}
												onClick={() => setExportFormat(fmt)}
											>
												{fmt}
											</button>
										))}
									</div>

									<div class="relative">
										<textarea
											readOnly
											class="input w-full h-32 font-mono text-body-sm bg-surface-soft"
											value={getExportCode()}
										/>
										<button
											class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
											onClick={() => handleCopy(getExportCode())}
										>
											{copiedFormat === "export" ? t.copied : t.copy}
										</button>
									</div>

									<button class="btn-secondary w-full py-2.5" onClick={downloadPalette}>
										{t.downloadText}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
