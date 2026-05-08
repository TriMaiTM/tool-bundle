import { useCallback, useState } from "preact/hooks";
import { formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

type OutputMode = "data-uri" | "raw" | "css";

export default function ImageToBase64() {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [dataUri, setDataUri] = useState<string>("");
	const [rawBase64, setRawBase64] = useState<string>("");
	const [outputMode, setOutputMode] = useState<OutputMode>("data-uri");
	const [imageInfo, setImageInfo] = useState<{
		name: string;
		size: number;
		width: number;
		height: number;
		type: string;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		setCopied(false);

		const url = URL.createObjectURL(f);
		setPreview(url);

		const img = new Image();
		img.onload = () => {
			setImageInfo({
				name: f.name,
				size: f.size,
				width: img.naturalWidth,
				height: img.naturalHeight,
				type: f.type,
			});
		};
		img.src = url;

		// Read as data URL
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			setDataUri(result);
			// Extract raw base64 (strip the data:...;base64, prefix)
			const base64 = result.replace(/^data:[^;]+;base64,/, "");
			setRawBase64(base64);
		};
		reader.readAsDataURL(f);
	}, []);

	const getOutput = useCallback((): string => {
		if (!dataUri) return "";
		switch (outputMode) {
			case "data-uri":
				return dataUri;
			case "raw":
				return rawBase64;
			case "css":
				return `url(${dataUri})`;
		}
	}, [dataUri, rawBase64, outputMode]);

	const output = getOutput();
	const outputSize = new Blob([output]).size;

	const handleCopy = useCallback(async () => {
		if (!output) return;
		try {
			await navigator.clipboard.writeText(output);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// fallback
			const ta = document.createElement("textarea");
			ta.value = output;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [output]);

	const handleReset = useCallback(() => {
		setFile(null);
		setPreview(null);
		setDataUri("");
		setRawBase64("");
		setImageInfo(null);
		setCopied(false);
	}, []);

	return (
		<div>
			{!file ? (
				<FileDropZone
					onFiles={handleFiles}
					label="Drop an image here to convert to Base64"
					sublabel="Supports PNG, JPG, GIF, SVG, WebP up to 50MB"
				/>
			) : (
				<div>
					{/* Image Preview & Info */}
					<div class="flex flex-col sm:flex-row gap-6 mb-6">
						<div class="flex-shrink-0">
							{preview && (
								<div
									class="bg-surface-elevated rounded-lg overflow-hidden"
									style="max-width: 300px"
								>
									<img
										src={preview}
										alt="Preview"
										class="w-full object-contain"
										style="max-height: 200px"
									/>
								</div>
							)}
						</div>
						<div class="flex-1">
							{imageInfo && (
								<div class="bg-surface-elevated rounded-lg p-3">
									<div class="text-caption-uppercase text-muted mb-2">Image Info</div>
									<div class="text-body-sm text-body space-y-1">
										<div>
											<strong>Name:</strong> {imageInfo.name}
										</div>
										<div>
											<strong>Size:</strong> {formatFileSize(imageInfo.size)}
										</div>
										<div>
											<strong>Dimensions:</strong> {imageInfo.width} &times; {imageInfo.height}
										</div>
										<div>
											<strong>Type:</strong> {imageInfo.type}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Output Mode Toggle */}
					<div class="mb-4">
						<div class="text-caption-uppercase text-muted mb-2">Output Format</div>
						<div
							class="flex rounded-md overflow-hidden border border-hairline"
							style="width: fit-content"
						>
							<button
								class={`px-4 py-2 text-body-sm font-medium transition-colors ${outputMode === "data-uri" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
								onClick={() => setOutputMode("data-uri")}
							>
								Data URI
							</button>
							<button
								class={`px-4 py-2 text-body-sm font-medium transition-colors ${outputMode === "raw" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
								onClick={() => setOutputMode("raw")}
							>
								Raw Base64
							</button>
							<button
								class={`px-4 py-2 text-body-sm font-medium transition-colors ${outputMode === "css" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
								onClick={() => setOutputMode("css")}
							>
								CSS url()
							</button>
						</div>
					</div>

					{/* Output Size */}
					{output && (
						<div class="flex items-center gap-3 mb-3">
							<span class="text-caption-uppercase text-muted">Output Size</span>
							<span class="badge badge-yellow">{formatFileSize(outputSize)}</span>
							{imageInfo && (
								<span class="text-caption text-muted">
									({((outputSize / imageInfo.size - 1) * 100).toFixed(1)}% larger than original)
								</span>
							)}
						</div>
					)}

					{/* Output Textarea */}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">
								{outputMode === "data-uri"
									? "Base64 Data URI"
									: outputMode === "raw"
										? "Raw Base64"
										: "CSS Background"}
							</label>
							{output && (
								<button
									class="text-body-sm text-primary hover:text-primary-active transition-colors"
									onClick={handleCopy}
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							)}
						</div>
						<textarea
							class="textarea code-block"
							style="min-height: 180px; font-family: var(--font-mono); font-size: 12px"
							value={output}
							readOnly
							placeholder="Base64 output will appear here..."
						/>
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy} disabled={!output}>
							{copied ? "Copied!" : "Copy to Clipboard"}
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
