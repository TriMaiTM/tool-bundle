import { PDFDocument } from "pdf-lib";
import { useCallback, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfCompressor() {
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [originalSize, setOriginalSize] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [processing, setProcessing] = useState(false);
	const [compressedSize, setCompressedSize] = useState<number | null>(null);
	const [removeMetadata, setRemoveMetadata] = useState(true);
	const [removeUnusedObjects, setRemoveUnusedObjects] = useState(true);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setCompressedSize(null);

		try {
			const arrayBuffer = await f.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			setFile(f);
			setFileName(f.name);
			setOriginalSize(f.size);
			setPageCount(pdfDoc.getPageCount());
		} catch (e) {
			alert(`Failed to load PDF: ${(e as Error).message}`);
		}
	}, []);

	const handleCompress = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		setCompressedSize(null);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer, {
				updateMetadata: !removeMetadata,
			});

			// Remove metadata if selected
			if (removeMetadata) {
				pdfDoc.setTitle("");
				pdfDoc.setAuthor("");
				pdfDoc.setSubject("");
				pdfDoc.setKeywords([]);
				pdfDoc.setProducer("");
				pdfDoc.setCreator("");
				pdfDoc.setCreationDate(new Date(0));
				pdfDoc.setModificationDate(new Date(0));
			}

			// Save with object streams enabled for better compression
			const compressedBytes = await pdfDoc.save({
				useObjectStreams: removeUnusedObjects,
				addDefaultPage: false,
			});

			const blob = new Blob([compressedBytes], { type: "application/pdf" });
			setCompressedSize(blob.size);

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-compressed.pdf`);
		} catch (e) {
			alert(`Compression failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, fileName, removeMetadata, removeUnusedObjects]);

	const handleReset = useCallback(() => {
		setFile(null);
		setFileName("");
		setOriginalSize(0);
		setPageCount(0);
		setCompressedSize(null);
	}, []);

	const savedBytes = compressedSize !== null ? originalSize - compressedSize : 0;
	const savedPercent =
		compressedSize !== null && originalSize > 0
			? ((savedBytes / originalSize) * 100).toFixed(1)
			: "0";

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept=".pdf"
					multiple={false}
					onFiles={handleFiles}
					label="Drop a PDF file here to compress"
					sublabel="Reduce PDF file size by removing metadata and optimizing"
				/>
			) : (
				<div>
					{/* Before / After comparison */}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
						<div class="bg-surface-elevated rounded-lg p-4">
							<div class="text-caption-uppercase text-muted mb-3">Original</div>
							<div class="text-body text-primary truncate mb-2">{fileName}</div>
							<div class="text-body-sm text-body">
								<div>
									<strong>Size:</strong> {formatFileSize(originalSize)}
								</div>
								<div>
									<strong>Pages:</strong> {pageCount}
								</div>
							</div>
						</div>
						<div
							class={`rounded-lg p-4 ${compressedSize !== null ? "bg-accent-emerald/10 border border-accent-emerald/30" : "bg-surface-elevated"}`}
						>
							<div
								class={`text-caption-uppercase mb-3 ${compressedSize !== null ? "text-accent-emerald" : "text-muted"}`}
							>
								Compressed
							</div>
							{compressedSize !== null ? (
								<div class="text-body-sm text-body">
									<div class="text-display-sm text-accent-emerald mb-2">
										{savedBytes > 0 ? `-${savedPercent}%` : "Same size"}
									</div>
									<div>
										<strong>Size:</strong> {formatFileSize(compressedSize)}
									</div>
									<div>
										<strong>Saved:</strong> {savedBytes > 0 ? formatFileSize(savedBytes) : "0 B"}
									</div>
								</div>
							) : (
								<div class="text-body-sm text-muted py-8 text-center">
									Click Compress to see results
								</div>
							)}
						</div>
					</div>

					{/* Options */}
					<div class="bg-surface-elevated rounded-lg p-4 mb-6">
						<div class="text-caption-uppercase text-muted mb-3">Compression Options</div>
						<div class="space-y-3">
							<label class="flex items-center gap-3 text-body-sm cursor-pointer">
								<input
									type="checkbox"
									checked={removeMetadata}
									onChange={(e) => setRemoveMetadata((e.target as HTMLInputElement).checked)}
									class="w-4 h-4"
									style="accent-color: var(--color-primary)"
								/>
								<div>
									<div class="text-body text-primary">Remove metadata</div>
									<div class="text-caption text-muted">
										Strip title, author, keywords, and other document properties
									</div>
								</div>
							</label>
							<label class="flex items-center gap-3 text-body-sm cursor-pointer">
								<input
									type="checkbox"
									checked={removeUnusedObjects}
									onChange={(e) => setRemoveUnusedObjects((e.target as HTMLInputElement).checked)}
									class="w-4 h-4"
									style="accent-color: var(--color-primary)"
								/>
								<div>
									<div class="text-body text-primary">Use object streams</div>
									<div class="text-caption text-muted">
										Optimize internal PDF structure for smaller file size
									</div>
								</div>
							</label>
						</div>
					</div>

					{/* Info note */}
					<div class="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-4 mb-6 text-body-sm text-accent-amber">
						<strong>Note:</strong> pdf-lib provides basic compression through metadata removal and
						object stream optimization. For advanced image compression, consider using a dedicated
						PDF optimization service.
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCompress} disabled={processing}>
							{processing ? "Compressing..." : "Compress & Download"}
						</button>
						<button class="btn-secondary" onClick={handleReset}>
							Choose Another File
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
