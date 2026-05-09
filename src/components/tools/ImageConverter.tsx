import { useCallback, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import { type ImageFormat, convertImage, getExtension, loadImage } from "../../utils/image";
import { type BatchFile, createBatchId, getFileNameWithoutExt } from "../../utils/batch";
import FileDropZone from "../ui/FileDropZone";
import BatchResults from "../ui/BatchResults";

interface Props {
	fromFormat: string;
	toFormat: string;
	targetMime: ImageFormat;
	accept?: string;
}

export default function ImageConverter({ fromFormat, toFormat, targetMime, accept }: Props) {
	// Single mode state
	const [file, setFile] = useState<File | null>(null);
	const [quality, setQuality] = useState(92);
	const [processing, setProcessing] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [originalInfo, setOriginalInfo] = useState<{
		name: string;
		size: string;
		dims: string;
	} | null>(null);
	const [resultInfo, setResultInfo] = useState<{
		size: string;
		dims: string;
	} | null>(null);

	// Batch mode state
	const [batchMode, setBatchMode] = useState(false);
	const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
	const [batchProcessing, setBatchProcessing] = useState(false);
	const [batchResults, setBatchResults] = useState<{ name: string; blob: Blob }[]>([]);
	const [batchErrors, setBatchErrors] = useState(0);

	// ─── Single Mode Handlers ──────────────────────────────────────────────

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		setResultInfo(null);

		const img = await loadImage(f);
		setOriginalInfo({
			name: f.name,
			size: formatFileSize(f.size),
			dims: `${img.naturalWidth} × ${img.naturalHeight}`,
		});

		const url = URL.createObjectURL(f);
		setPreview(url);
	}, []);

	const handleConvert = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		try {
			const blob = await convertImage(file, targetMime, quality / 100);

			const img = await loadImage(new File([blob], "tmp"));
			setResultInfo({
				size: formatFileSize(blob.size),
				dims: `${img.naturalWidth} × ${img.naturalHeight}`,
			});

			const ext = getExtension(targetMime);
			const baseName = file.name.replace(/\.[^.]+$/, "");
			downloadBlob(blob, `${baseName}.${ext}`);
		} catch (e) {
			alert(`Conversion failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, targetMime, quality]);

	const handleReset = useCallback(() => {
		setFile(null);
		setPreview(null);
		setOriginalInfo(null);
		setResultInfo(null);
	}, []);

	// ─── Batch Mode Handlers ───────────────────────────────────────────────

	const handleBatchFiles = useCallback((files: File[]) => {
		const newBatchFiles: BatchFile[] = files.map((f) => ({
			id: createBatchId(),
			file: f,
			name: f.name,
			size: f.size,
			status: "pending" as const,
			progress: 0,
		}));
		setBatchFiles((prev) => [...prev, ...newBatchFiles]);
		setBatchResults([]);
		setBatchErrors(0);
	}, []);

	const handleRemoveBatchFile = useCallback((id: string) => {
		setBatchFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	const handleClearBatch = useCallback(() => {
		setBatchFiles([]);
		setBatchResults([]);
		setBatchErrors(0);
	}, []);

	const handleBatchConvert = useCallback(async () => {
		if (batchFiles.length === 0) return;
		setBatchProcessing(true);
		setBatchResults([]);
		setBatchErrors(0);

		const ext = getExtension(targetMime);
		const results: { name: string; blob: Blob }[] = [];
		let errors = 0;

		// Process files sequentially to avoid memory issues
		for (let i = 0; i < batchFiles.length; i++) {
			const batchFile = batchFiles[i];
			setBatchFiles((prev) =>
				prev.map((f) => (f.id === batchFile.id ? { ...f, status: "processing" } : f)),
			);

			try {
				const blob = await convertImage(batchFile.file, targetMime, quality / 100);
				const baseName = getFileNameWithoutExt(batchFile.name);
				const resultName = `${baseName}.${ext}`;
				results.push({ name: resultName, blob });

				setBatchFiles((prev) =>
					prev.map((f) =>
						f.id === batchFile.id
							? { ...f, status: "done", result: { blob, name: resultName } }
							: f,
					),
				);
			} catch (e) {
				errors++;
				setBatchFiles((prev) =>
					prev.map((f) =>
						f.id === batchFile.id ? { ...f, status: "error", error: (e as Error).message } : f,
					),
				);
			}
		}

		setBatchResults(results);
		setBatchErrors(errors);
		setBatchProcessing(false);
	}, [batchFiles, targetMime, quality]);

	// ─── Mode Toggle ───────────────────────────────────────────────────────

	const toggleBatchMode = useCallback(() => {
		setBatchMode((prev) => !prev);
		// Reset state when switching modes
		setFile(null);
		setPreview(null);
		setOriginalInfo(null);
		setResultInfo(null);
		setBatchFiles([]);
		setBatchResults([]);
		setBatchErrors(0);
	}, []);

	const ext = getExtension(targetMime);

	return (
		<div>
			{/* Mode Toggle */}
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<button
						class={!batchMode ? "btn-primary" : "btn-secondary"}
						onClick={() => batchMode && toggleBatchMode()}
						style="padding: 6px 14px; font-size: 13px;"
					>
						Single File
					</button>
					<button
						class={batchMode ? "btn-primary" : "btn-secondary"}
						onClick={() => !batchMode && toggleBatchMode()}
						style="padding: 6px 14px; font-size: 13px;"
					>
						Batch Mode
					</button>
				</div>
				{batchMode && batchFiles.length > 0 && (
					<span class="text-caption text-muted">
						{batchFiles.length} file{batchFiles.length !== 1 ? "s" : ""} selected
					</span>
				)}
			</div>

			{/* ─── Single Mode ──────────────────────────────────────────────── */}
			{!batchMode && (
				<div>
					{!file ? (
						<FileDropZone
							accept={accept ?? "image/*"}
							onFiles={handleFiles}
							label={`Drop ${fromFormat} files here or click to browse`}
							sublabel={`Supports ${fromFormat} files up to 50MB`}
						/>
					) : (
						<div>
							{/* Preview & Info */}
							<div class="flex flex-col sm:flex-row gap-6 mb-6">
								<div class="flex-shrink-0">
									{preview && (
										<div
											class="bg-surface-elevated rounded-lg overflow-hidden"
											style="max-width: 300px; max-height: 200px"
										>
											<img
												src={preview}
												alt="Preview"
												class="w-full h-full object-contain"
												style="max-height: 200px"
											/>
										</div>
									)}
								</div>
								<div class="flex-1 space-y-3">
									{originalInfo && (
										<div class="bg-surface-elevated rounded-lg p-4">
											<div class="text-caption-uppercase text-muted mb-2">Original</div>
											<div class="text-body-sm text-body">
												<div>
													<strong>Name:</strong> {originalInfo.name}
												</div>
												<div>
													<strong>Size:</strong> {originalInfo.size}
												</div>
												<div>
													<strong>Dimensions:</strong> {originalInfo.dims}
												</div>
											</div>
										</div>
									)}
									{resultInfo && (
										<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4">
											<div class="text-caption-uppercase text-accent-emerald mb-2">Converted</div>
											<div class="text-body-sm text-body">
												<div>
													<strong>Size:</strong> {resultInfo.size}
												</div>
												<div>
													<strong>Dimensions:</strong> {resultInfo.dims}
												</div>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Quality slider (for lossy formats) */}
							{targetMime !== "image/png" && (
								<div class="mb-6">
									<label class="flex items-center justify-between text-body-sm text-body mb-2">
										<span class="text-caption-uppercase text-muted">Quality</span>
										<span class="text-primary">{quality}%</span>
									</label>
									<input
										type="range"
										min="10"
										max="100"
										step="1"
										value={quality}
										onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
										class="w-full"
										style="accent-color: var(--color-primary)"
									/>
									<div class="flex justify-between text-caption text-muted mt-1">
										<span>Smaller file</span>
										<span>Better quality</span>
									</div>
								</div>
							)}

							{/* Actions */}
							<div class="flex flex-wrap gap-3">
								<button class="btn-primary" onClick={handleConvert} disabled={processing}>
									{processing ? "Converting..." : `Convert to ${toFormat}`}
								</button>
								<button class="btn-secondary" onClick={handleReset}>
									Choose Another File
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ─── Batch Mode ─────────────────────────────────────────────── */}
			{batchMode && (
				<div>
					{/* File upload */}
					{batchFiles.length === 0 && !batchProcessing && (
						<FileDropZone
							accept={accept ?? "image/*"}
							multiple={true}
							onFiles={handleBatchFiles}
							label={`Drop multiple ${fromFormat} files here or click to browse`}
							sublabel={`Select multiple ${fromFormat} files to convert at once`}
						/>
					)}

					{/* Quality slider (for lossy formats) */}
					{batchFiles.length > 0 && targetMime !== "image/png" && (
						<div class="mb-4">
							<label class="flex items-center justify-between text-body-sm text-body mb-2">
								<span class="text-caption-uppercase text-muted">Quality (all files)</span>
								<span class="text-primary">{quality}%</span>
							</label>
							<input
								type="range"
								min="10"
								max="100"
								step="1"
								value={quality}
								onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
								class="w-full"
								style="accent-color: var(--color-primary)"
							/>
						</div>
					)}

					{/* File list */}
					{batchFiles.length > 0 && (
						<div class="mb-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="text-body-sm-strong text-on-dark">Files ({batchFiles.length})</h3>
								{!batchProcessing && (
									<div class="flex gap-2">
										<button
											class="btn-secondary"
											style="padding: 4px 12px; font-size: 12px;"
											onClick={() => {
												const input = document.createElement("input");
												input.type = "file";
												input.multiple = true;
												input.accept = accept ?? "image/*";
												input.onchange = (e) => {
													const files = Array.from((e.target as HTMLInputElement).files || []);
													if (files.length > 0) handleBatchFiles(files);
												};
												input.click();
											}}
										>
											Add More
										</button>
										<button
											class="btn-secondary"
											style="padding: 4px 12px; font-size: 12px;"
											onClick={handleClearBatch}
										>
											Clear All
										</button>
									</div>
								)}
							</div>

							<div class="space-y-2" style="max-height: 300px; overflow-y: auto;">
								{batchFiles.map((bf) => (
									<div
										key={bf.id}
										class="flex items-center gap-3 bg-surface-card rounded-lg px-4 py-3"
									>
										{/* Status icon */}
										<div
											class={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
												bf.status === "done"
													? "bg-accent-emerald/10 text-accent-emerald"
													: bf.status === "error"
														? "bg-error/10 text-error"
														: bf.status === "processing"
															? "bg-primary/10 text-primary"
															: "bg-surface-elevated text-muted"
											}`}
										>
											{bf.status === "done" && (
												<svg
													class="w-4 h-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
											)}
											{bf.status === "error" && (
												<svg
													class="w-4 h-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											)}
											{bf.status === "processing" && (
												<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
											)}
											{bf.status === "pending" && (
												<span class="text-caption text-muted">{batchFiles.indexOf(bf) + 1}</span>
											)}
										</div>

										{/* File info */}
										<div class="flex-1 min-w-0">
											<div class="text-body-sm text-on-dark truncate">{bf.name}</div>
											<div class="text-caption text-muted">
												{formatFileSize(bf.size)}
												{bf.status === "error" && bf.error && (
													<span class="text-error ml-2">— {bf.error}</span>
												)}
											</div>
										</div>

										{/* Remove button */}
										{!batchProcessing && bf.status === "pending" && (
											<button
												class="text-muted hover:text-on-dark transition-colors"
												onClick={() => handleRemoveBatchFile(bf.id)}
												style="padding: 4px; background: none; border: none; cursor: pointer;"
											>
												<svg
													class="w-4 h-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Actions */}
					{batchFiles.length > 0 && !batchProcessing && batchResults.length === 0 && (
						<div class="flex flex-wrap gap-3 mb-6">
							<button
								class="btn-primary"
								onClick={handleBatchConvert}
								disabled={batchFiles.length === 0}
							>
								Convert All to {toFormat} ({batchFiles.length} files)
							</button>
						</div>
					)}

					{/* Results */}
					{(batchProcessing || batchResults.length > 0) && (
						<BatchResults
							results={batchResults}
							processing={batchProcessing}
							totalCount={batchFiles.length}
							errorCount={batchErrors}
							zipName={`${fromFormat}-to-${ext}-batch.zip`}
						/>
					)}

					{/* Start over */}
					{!batchProcessing && batchResults.length > 0 && (
						<div class="mt-4">
							<button class="btn-secondary" onClick={handleClearBatch}>
								Convert More Files
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
