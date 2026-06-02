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

export default function HeicConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [targetFormat, setTargetFormat] = useState<string>("image/jpeg"); // image/jpeg or image/png
	const [quality, setQuality] = useState<number>(0.85);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);

	const t = {
		en: {
			title: "HEIC to JPG/PNG Converter",
			targetFormat: "Output Format",
			quality: "Quality",
			convertBtn: "Convert HEIC Images",
			downloadZip: "Download All (ZIP)",
			clearQueue: "Clear All",
			statusPending: "Ready",
			statusProcessing: "Decoding HEIC...",
			statusDone: "Converted",
			statusError: "Failed",
			qualityWarning: "Quality setting only applies to JPEG output.",
			dropzoneLabel: "Drop HEIC images here",
			dropzoneSub: "Supports .heic, .heif files from iPhone/iPad",
			errorRead: "Invalid HEIC file or decryption error.",
		},
		vi: {
			title: "Bộ chuyển đổi HEIC sang JPG/PNG",
			targetFormat: "Định dạng đầu ra",
			quality: "Chất lượng ảnh",
			convertBtn: "Bắt đầu chuyển đổi",
			downloadZip: "Tải toàn bộ (ZIP)",
			clearQueue: "Xóa danh sách",
			statusPending: "Sẵn sàng",
			statusProcessing: "Đang giải mã HEIC...",
			statusDone: "Hoàn thành",
			statusError: "Lỗi",
			qualityWarning: "Thanh chất lượng chỉ áp dụng khi chuyển sang JPEG.",
			dropzoneLabel: "Thả các file ảnh HEIC vào đây",
			dropzoneSub: "Hỗ trợ file định dạng .heic, .heif từ iPhone/iPad",
			errorRead: "File HEIC không hợp lệ hoặc lỗi giải mã.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Filter and accept only HEIC/HEIF files
	const handleFiles = useCallback((files: File[]) => {
		const newItems: QueueItem[] = files.map((f) => ({
			id: Math.random().toString(36).substring(2, 9),
			file: f,
			status: "pending",
		}));
		setQueue((prev) => [...prev, ...newItems]);
	}, []);

	// Convert single HEIC file using heic2any library
	const convertSingleHeic = async (item: QueueItem, format: string, q: number): Promise<Blob> => {
		// Dynamically import heic2any on the client side to avoid node compilation crashes
		const heic2anyModule = await import("heic2any");
		const heic2any = heic2anyModule.default || heic2anyModule;

		// heic2any requires a Blob input
		const result = await heic2any({
			blob: item.file,
			toType: format,
			quality: q,
		});

		// heic2any can return Blob or Blob[] (for animation/burst containers)
		if (Array.isArray(result)) {
			if (result.length > 0) return result[0];
			throw new Error("Empty image container returned");
		}
		return result;
	};

	// Convert all HEIC images in queue
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
				const blob = await convertSingleHeic(item, targetFormat, quality);
				updatedQueue[i] = {
					...item,
					status: "done",
					resultBlob: blob,
					resultUrl: URL.createObjectURL(blob),
				};
			} catch (err) {
				updatedQueue[i] = {
					...item,
					status: "error",
					error: err instanceof Error ? err.message : t.errorRead,
				};
			}

			setQueue([...updatedQueue]);
			setProgress(Math.round(((i + 1) / updatedQueue.length) * 100));
		}

		setIsProcessing(false);
	};

	const handleDownloadSingle = (item: QueueItem) => {
		if (!item.resultBlob || !item.resultUrl) return;
		const extension = targetFormat === "image/png" ? "png" : "jpg";
		const baseName = item.file.name.substring(0, item.file.name.lastIndexOf("."));
		const a = document.createElement("a");
		a.href = item.resultUrl;
		a.download = `${baseName}.${extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleDownloadZip = async () => {
		const completed = queue.filter((item) => item.status === "done" && item.resultBlob);
		if (completed.length === 0) return;

		const zip = new JSZip();
		const extension = targetFormat === "image/png" ? "png" : "jpg";

		completed.forEach((item) => {
			const baseName = item.file.name.substring(0, item.file.name.lastIndexOf("."));
			zip.file(`${baseName}.${extension}`, item.resultBlob!);
		});

		const content = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(content);
		const a = document.createElement("a");
		a.href = url;
		a.download = `heic-converted-${Date.now()}.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleClearQueue = () => {
		queue.forEach((item) => {
			if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
		});
		setQueue([]);
		setProgress(0);
	};

	const hasDoneItems = queue.some((item) => item.status === "done");

	return (
		<div class="space-y-6">
			{/* Configurations Card */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.targetFormat}</label>
						<select
							class="input w-full"
							value={targetFormat}
							onChange={(e) => setTargetFormat((e.target as HTMLSelectElement).value)}
						>
							<option value="image/jpeg">JPEG (JPG)</option>
							<option value="image/png">PNG (Lossless)</option>
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
			</div>

			{/* Drop Zone */}
			<FileDropZone
				accept=".heic,.heif"
				onFiles={handleFiles}
				label={t.dropzoneLabel}
				sublabel={t.dropzoneSub}
			/>

			{/* Queue status */}
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

					{/* File queue items list */}
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

					{/* Process Action Bar */}
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
									<span class="text-muted">Conversion Progress</span>
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
