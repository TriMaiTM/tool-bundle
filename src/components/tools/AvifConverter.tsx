import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";
import JSZip from "jszip";

interface QueueItem {
	id: string;
	file: File;
	status: "pending" | "processing" | "done" | "error";
	resultUrl?: string;
	resultBlob?: Blob;
	error?: string;
}

export default function AvifConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [targetFormat, setTargetFormat] = useState<string>("image/webp"); // webp or png or jpeg or avif
	const [quality, setQuality] = useState<number>(0.8);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);

	const t = {
		en: {
			title: "AVIF & Image Converter",
			targetFormat: "Target Format",
			quality: "Quality",
			convertBtn: "Convert All Images",
			downloadZip: "Download All (ZIP)",
			clearQueue: "Clear All",
			statusPending: "Ready",
			statusProcessing: "Converting...",
			statusDone: "Converted",
			statusError: "Error",
			qualityWarning: "Quality setting only applies to lossy formats (JPEG, WebP, AVIF).",
			dropzoneLabel: "Drop images to convert",
			dropzoneSub: "Supports JPG, PNG, WebP, AVIF",
			avifBrowserNotice:
				"AVIF output format requires a browser that supports AVIF encoding (e.g. Chrome/Chromium 121+). Fallback format is WebP if unsupported.",
			failedDecode: "Failed to read image file.",
			unsupportedFormat: "Format unsupported by browser.",
		},
		vi: {
			title: "Bộ chuyển đổi ảnh AVIF",
			targetFormat: "Định dạng đích",
			quality: "Chất lượng ảnh",
			convertBtn: "Bắt đầu chuyển đổi",
			downloadZip: "Tải toàn bộ (ZIP)",
			clearQueue: "Xóa danh sách",
			statusPending: "Sẵn sàng",
			statusProcessing: "Đang chuyển...",
			statusDone: "Hoàn thành",
			statusError: "Lỗi",
			qualityWarning: "Thanh chất lượng chỉ áp dụng cho JPEG, WebP và AVIF.",
			dropzoneLabel: "Thả hình ảnh vào đây để chuyển đổi",
			dropzoneSub: "Hỗ trợ JPG, PNG, WebP, AVIF",
			avifBrowserNotice:
				"Định dạng AVIF yêu cầu trình duyệt hỗ trợ mã hóa AVIF (ví dụ Chrome 121+). Nếu không hỗ trợ, ảnh sẽ tự động được chuyển sang WebP.",
			failedDecode: "Không thể giải mã file ảnh.",
			unsupportedFormat: "Định dạng này không được trình duyệt hỗ trợ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Handle selected files
	const handleFiles = useCallback((files: File[]) => {
		const newItems: QueueItem[] = files.map((f) => ({
			id: Math.random().toString(36).substring(2, 9),
			file: f,
			status: "pending",
		}));
		setQueue((prev) => [...prev, ...newItems]);
	}, []);

	// Convert single file
	const convertFile = async (
		item: QueueItem,
		format: string,
		q: number,
	): Promise<{ blob: Blob; url: string }> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Could not create canvas 2D context"));
						return;
					}

					ctx.drawImage(img, 0, 0);

					// Helper to output blob
					const outputFormat = format;
					canvas.toBlob(
						(blob) => {
							if (blob) {
								// Check fallback if browser falls back to png/jpeg internally due to lack of AVIF encoder support
								if (outputFormat === "image/avif" && blob.type !== "image/avif") {
									// Try fallback to webp
									canvas.toBlob(
										(webpBlob) => {
											if (webpBlob) {
												resolve({
													blob: webpBlob,
													url: URL.createObjectURL(webpBlob),
												});
											} else {
												reject(new Error(t.unsupportedFormat));
											}
										},
										"image/webp",
										q,
									);
								} else {
									resolve({
										blob,
										url: URL.createObjectURL(blob),
									});
								}
							} else {
								reject(new Error(t.unsupportedFormat));
							}
						},
						outputFormat,
						outputFormat === "image/png" ? undefined : q,
					);
				};
				img.onerror = () => reject(new Error(t.failedDecode));
				img.src = e.target?.result as string;
			};
			reader.onerror = () => reject(new Error("File reading error"));
			reader.readAsDataURL(item.file);
		});
	};

	// Convert All Queue
	const handleConvertAll = async () => {
		if (queue.length === 0 || isProcessing) return;
		setIsProcessing(true);
		setProgress(0);

		const updatedQueue = [...queue];

		for (let i = 0; i < updatedQueue.length; i++) {
			const item = updatedQueue[i];
			if (item.status === "done") continue;

			updatedQueue[i] = { ...item, status: "processing" };
			setQueue([...updatedQueue]);

			try {
				const result = await convertFile(item, targetFormat, quality);
				updatedQueue[i] = {
					...item,
					status: "done",
					resultBlob: result.blob,
					resultUrl: result.url,
				};
			} catch (err) {
				updatedQueue[i] = {
					...item,
					status: "error",
					error: err instanceof Error ? err.message : String(err),
				};
			}

			setQueue([...updatedQueue]);
			setProgress(Math.round(((i + 1) / updatedQueue.length) * 100));
		}

		setIsProcessing(false);
	};

	// Download ZIP of all completed conversions
	const handleDownloadZip = async () => {
		const completed = queue.filter((item) => item.status === "done" && item.resultBlob);
		if (completed.length === 0) return;

		const zip = new JSZip();
		const extension = targetFormat.split("/")[1] === "jpeg" ? "jpg" : targetFormat.split("/")[1];

		completed.forEach((item) => {
			const baseName = item.file.name.substring(0, item.file.name.lastIndexOf("."));
			zip.file(`${baseName}.${extension}`, item.resultBlob!);
		});

		const content = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(content);
		const a = document.createElement("a");
		a.href = url;
		a.download = `converted-images-${Date.now()}.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Download single converted image
	const handleDownloadSingle = (item: QueueItem) => {
		if (!item.resultBlob || !item.resultUrl) return;
		const extension = targetFormat.split("/")[1] === "jpeg" ? "jpg" : targetFormat.split("/")[1];
		const baseName = item.file.name.substring(0, item.file.name.lastIndexOf("."));
		const a = document.createElement("a");
		a.href = item.resultUrl;
		a.download = `${baseName}.${extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleClearQueue = () => {
		// Revoke previous URLs
		queue.forEach((item) => {
			if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
		});
		setQueue([]);
		setProgress(0);
	};

	const hasDoneItems = queue.some((item) => item.status === "done");

	return (
		<div class="space-y-6">
			{/* Settings Panel */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.targetFormat}</label>
						<select
							class="input w-full"
							value={targetFormat}
							onChange={(e) => setTargetFormat((e.target as HTMLSelectElement).value)}
						>
							<option value="image/webp">WebP</option>
							<option value="image/png">PNG (Lossless)</option>
							<option value="image/jpeg">JPEG (JPG)</option>
							<option value="image/avif">AVIF (Modern)</option>
						</select>
					</div>
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">
							{t.quality} ({Math.round(quality * 100)}%)
						</label>
						<input
							type="range"
							min="0.1"
							max="1.0"
							step="0.05"
							class="w-full accent-primary mt-3"
							value={quality}
							disabled={targetFormat === "image/png"}
							onInput={(e) => setQuality(Number.parseFloat((e.target as HTMLInputElement).value))}
						/>
						{targetFormat === "image/png" && (
							<span class="text-caption text-muted block mt-1">{t.qualityWarning}</span>
						)}
					</div>
				</div>

				{targetFormat === "image/avif" && (
					<div class="p-3 bg-primary/5 rounded border border-primary/20 text-caption text-primary flex gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
						<p>{t.avifBrowserNotice}</p>
					</div>
				)}
			</div>

			{/* Drop Zone */}
			<FileDropZone
				accept="image/*"
				onFiles={handleFiles}
				label={t.dropzoneLabel}
				sublabel={t.dropzoneSub}
			/>

			{/* Queue List */}
			{queue.length > 0 && (
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex justify-between items-center border-b border-hairline pb-3">
						<h3 class="text-body-strong text-ink">Files ({queue.length})</h3>
						<div class="flex gap-2">
							<button
								class="btn-secondary text-xs"
								onClick={handleClearQueue}
								disabled={isProcessing}
							>
								{t.clearQueue}
							</button>
							{hasDoneItems && (
								<button class="btn-secondary text-xs" onClick={handleDownloadZip}>
									{t.downloadZip}
								</button>
							)}
						</div>
					</div>

					{/* File Rows */}
					<div class="divide-y divide-hairline max-h-[350px] overflow-y-auto pr-1">
						{queue.map((item) => {
							let statusText = t.statusPending;
							let statusClass = "text-muted";
							if (item.status === "processing") {
								statusText = t.statusProcessing;
								statusClass = "text-primary animate-pulse";
							} else if (item.status === "done") {
								statusText = t.statusDone;
								statusClass = "text-success-deep font-bold";
							} else if (item.status === "error") {
								statusText = `${t.statusError}`;
								statusClass = "text-error font-bold";
							}

							return (
								<div key={item.id} class="flex items-center justify-between py-3 text-body-sm">
									<div class="flex-1 min-w-0 pr-4">
										<p class="truncate font-medium text-ink">{item.file.name}</p>
										<p class="text-caption text-muted">{formatFileSize(item.file.size)}</p>
									</div>
									<div class="flex items-center gap-4">
										<span class={`font-medium ${statusClass}`}>{statusText}</span>
										{item.status === "done" && (
											<button
												class="btn-primary py-1 px-3 text-xs"
												onClick={() => handleDownloadSingle(item)}
											>
												Download
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Convert Action Bar */}
					<div class="pt-3 border-t border-hairline flex flex-col sm:flex-row gap-4 items-center">
						<button
							class="btn-primary w-full sm:w-auto py-2.5 px-6 flex items-center justify-center gap-2"
							onClick={handleConvertAll}
							disabled={isProcessing || queue.every((q) => q.status === "done")}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
								<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
								<line x1="12" y1="22.08" x2="12" y2="12" />
							</svg>
							{t.convertBtn}
						</button>

						{isProcessing && (
							<div class="flex-1 w-full">
								<div class="flex items-center justify-between mb-1 text-caption">
									<span class="text-muted">Progress</span>
									<span class="font-bold text-primary">{progress}%</span>
								</div>
								<div class="w-full bg-surface-card rounded-full h-1.5 overflow-hidden">
									<div
										class="bg-primary h-1.5 rounded-full transition-all duration-300"
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
