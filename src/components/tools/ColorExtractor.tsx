import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

interface RGB {
	r: number;
	g: number;
	b: number;
}

export default function ColorExtractor() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [colorsCount, setColorsCount] = useState<number>(6); // 4 to 12

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [palette, setPalette] = useState<RGB[]>([]);
	const [copiedColor, setCopiedColor] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image Color Palette Extractor",
			colorsCountLabel: "Number of Colors to Extract",
			processBtn: "Extract Color Palette",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to extract color palette",
			dropzoneSub: "Supports JPG, PNG, WebP",
			previewTitle: "Image Preview",
			paletteTitle: "Extracted Color Palette",
			clickToCopy: "Click to copy HEX code",
			copied: "Copied!",
		},
		vi: {
			title: "Trích xuất bảng màu từ hình ảnh",
			colorsCountLabel: "Số lượng màu cần trích xuất",
			processBtn: "Trích xuất bảng màu",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để trích xuất bảng màu",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP",
			previewTitle: "Hình ảnh xem trước",
			paletteTitle: "Bảng màu trích xuất được",
			clickToCopy: "Click để sao chép mã màu HEX",
			copied: "Đã copy!",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Cleanup URLs
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

			const url = URL.createObjectURL(f);
			setPreviewUrl(url);
		},
		[previewUrl],
	);

	// Convert RGB to Hex
	const rgbToHex = ({ r, g, b }: RGB) => {
		return `#${[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? `0${hex}` : hex;
			})
			.join("")}`;
	};

	// Median Cut color quantization
	const extractPalette = () => {
		if (!previewUrl) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					// Shrink to 50x50 to speed up and smooth out high frequency noise
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

						// Only extract non-transparent pixels (alpha > 125)
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

						if (maxRangeBoxIndex === -1) break; // Cannot split further

						const boxToSplit = boxes[maxRangeBoxIndex];
						boxToSplit.sort((a, b) => a[splitChannel] - b[splitChannel]);

						const median = Math.floor(boxToSplit.length / 2);
						const box1 = boxToSplit.slice(0, median);
						const box2 = boxToSplit.slice(median);

						boxes.splice(maxRangeBoxIndex, 1, box1, box2);
					}

					// Map boxes to average colors
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

	const handleCopy = (hex: string) => {
		navigator.clipboard.writeText(hex).then(() => {
			setCopiedColor(hex);
			setTimeout(() => setCopiedColor(null), 2000);
		});
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
					{/* Left Panel: Configuration */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
						<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
								<path d="M12 8C14.2091 8 16 6.20914 16 4C16 1.79086 14.2091 0 12 0C9.79086 0 8 1.79086 8 4C8 6.20914 9.79086 8 12 8Z" />
								<path d="M5 14C6.65685 14 8 12.6569 8 11C8 9.34315 6.65685 8 5 8C3.34315 8 2 9.34315 2 11C2 12.6569 3.34315 14 5 14Z" />
								<path d="M19 14C20.6569 14 22 12.6569 22 11C22 9.34315 20.6569 8 19 8C17.3431 8 16 9.34315 16 11C16 12.6569 17.3431 14 19 14Z" />
								<path d="M12 20C13.6569 20 15 18.6569 15 17C15 15.3431 13.6569 14 12 14C10.3431 14 9 15.3431 9 17C9 18.6569 10.3431 20 12 20Z" />
							</svg>
							Palette Settings
						</h3>

						{/* Number of colors to extract */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.colorsCountLabel}</label>
							<select
								class="input w-full"
								value={colorsCount}
								onChange={(e) =>
									setColorsCount(Number.parseInt((e.target as HTMLSelectElement).value))
								}
							>
								{[4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
									<option key={num} value={num}>
										{num} {lang === "vi" ? "Màu" : "Colors"}
									</option>
								))}
							</select>
						</div>

						{/* Actions */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={extractPalette}>
									{t.processBtn}
								</button>
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						)}

						{status === "processing" && (
							<div class="text-center py-4 space-y-2">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Previews */}
					<div class="lg:col-span-7 space-y-6">
						{/* Image Preview */}
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.previewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline overflow-hidden max-h-[350px]">
								{previewUrl && (
									<img
										src={previewUrl}
										alt="Preview"
										class="max-w-full max-h-[300px] object-contain rounded bg-surface-soft"
									/>
								)}
							</div>
						</div>

						{/* Palette Output */}
						{status === "done" && palette.length > 0 && (
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
								<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
									{t.paletteTitle}
								</h3>

								{/* Palette Cards Grid */}
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
									{palette.map((color, idx) => {
										const hex = rgbToHex(color);
										const rgbString = `rgb(${color.r}, ${color.g}, ${color.b})`;
										const isCopied = copiedColor === hex;

										return (
											<button
												key={idx}
												class="w-full text-left bg-surface-soft border border-hairline rounded-lg overflow-hidden shadow-sm hover:border-primary active:scale-[0.98] transition-all cursor-pointer group flex flex-col focus:outline-none"
												onClick={() => handleCopy(hex)}
												title={t.clickToCopy}
											>
												{/* Swatch */}
												<div
													class="w-full h-20 transition-transform duration-200 group-hover:scale-105"
													style={{ backgroundColor: hex }}
												/>

												{/* Swatch Details */}
												<div class="p-3 space-y-1">
													<div class="flex justify-between items-center">
														<span class="text-body-sm font-mono font-bold uppercase text-ink">
															{hex}
														</span>
														{isCopied ? (
															<span class="text-xs text-accent-emerald font-bold flex items-center gap-1">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="12"
																	height="12"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="3"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																>
																	<polyline points="20 6 9 17 4 12" />
																</svg>
																{t.copied}
															</span>
														) : (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="14"
																height="14"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
																class="text-muted group-hover:text-primary transition-colors"
															>
																<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
																<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
															</svg>
														)}
													</div>
													<div class="text-[11px] font-mono text-muted">{rgbString}</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
