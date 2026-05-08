import { useCallback, useEffect, useState } from "preact/hooks";
import { formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

export default function ImageCaptioning() {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [result, setResult] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (preview) URL.revokeObjectURL(preview);
			setFile(f);
			setPreview(URL.createObjectURL(f));
			setResult("");
			setError(null);
			setStatus("idle");
			setProgress(0);
			setCopied(false);
		},
		[preview],
	);

	const handleProcess = useCallback(async () => {
		if (!file) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setResult("");
		setCopied(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading captioning model (~1.2GB)...");

			const captioner = await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning", {
				progress_callback: (progressData: any) => {
					if (progressData.status === "progress" && progressData.progress) {
						setProgress(0.1 + (progressData.progress / 100) * 0.7);
					} else if (progressData.status === "done") {
						setProgress(0.8);
					}
				},
			} as any);

			setStatus("processing");
			setProgress(0.85);
			setStatusText("Generating caption...");

			const imageUrl = URL.createObjectURL(file);
			const output = await captioner(imageUrl);
			URL.revokeObjectURL(imageUrl);

			const caption = Array.isArray(output)
				? (output[0] as any).generated_text
				: (output as any).generated_text;

			setResult(caption || "Could not generate caption.");
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate caption. Try a different image.",
			);
			setStatus("error");
		}
	}, [file]);

	const handleCopy = useCallback(async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [result]);

	const handleReset = useCallback(() => {
		if (preview) URL.revokeObjectURL(preview);
		setFile(null);
		setPreview(null);
		setResult("");
		setError(null);
		setStatus("idle");
		setProgress(0);
		setCopied(false);
	}, [preview]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label="Drop an image to get a description"
					sublabel="PNG, JPG, WebP — photos work best"
				/>
			)}

			{file && (
				<div>
					{/* Preview */}
					<div class="mb-6" style="max-width: 500px">
						{preview && (
							<div class="bg-surface-elevated rounded-lg overflow-hidden">
								<img
									src={preview}
									alt="Uploaded"
									class="w-full object-contain"
									style="max-height: 350px"
								/>
							</div>
						)}
						<div class="text-caption text-muted mt-1">
							{file.name} — {formatFileSize(file.size)}
						</div>
					</div>

					{/* Actions */}
					{!isProcessing && status !== "done" && (
						<div class="flex flex-wrap gap-3 mb-4">
							<button class="btn-primary" onClick={handleProcess}>
								Generate Caption
							</button>
							<button class="btn-secondary" onClick={handleReset}>
								Choose Another Image
							</button>
						</div>
					)}

					{/* Progress */}
					{isProcessing && (
						<div class="mb-6">
							<div class="flex items-center justify-between mb-2">
								<span class="text-body-sm text-body">{statusText}</span>
								<span class="text-body-sm text-primary font-mono">
									{Math.round(progress * 100)}%
								</span>
							</div>
							<div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
								<div
									class="bg-primary h-2 rounded-full transition-all duration-300"
									style={{ width: `${Math.round(progress * 100)}%` }}
								/>
							</div>
							<p class="text-caption text-muted mt-1">
								First time: downloading model (~1.2GB). Cached after that.
							</p>
						</div>
					)}

					{/* Error */}
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
							<p class="text-body-sm text-accent-rose">{error}</p>
							<button
								class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
								onClick={handleReset}
							>
								Try again
							</button>
						</div>
					)}

					{/* Result */}
					{status === "done" && result && (
						<div>
							<div class="text-caption-uppercase text-muted mb-2">AI Description</div>
							<div class="bg-surface-elevated rounded-lg p-4 mb-4">
								<p class="text-body-md text-on-dark">{result}</p>
							</div>
							<div class="flex flex-wrap gap-3">
								<button class="btn-primary" onClick={handleCopy}>
									{copied ? "Copied!" : "Copy Description"}
								</button>
								<button class="btn-secondary" onClick={handleReset}>
									Process Another Image
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
