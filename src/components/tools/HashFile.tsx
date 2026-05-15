import { useCallback, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function HashFile() {
	const [selectedAlgorithms, setSelectedAlgorithms] = useState<HashAlgorithm[]>(["SHA-256"]);
	const [hashes, setHashes] = useState<Record<string, string>>({});
	const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(
		null,
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

	const handleAlgorithmToggle = useCallback((algo: HashAlgorithm) => {
		setSelectedAlgorithms((prev) => {
			if (prev.includes(algo)) {
				if (prev.length === 1) return prev; // Keep at least one
				return prev.filter((a) => a !== algo);
			}
			return [...prev, algo];
		});
	}, []);

	const processFile = useCallback(
		async (files: File[]) => {
			const file = files[0];
			if (!file) return;

			if (file.size > MAX_FILE_SIZE) {
				setError(`File exceeds 100MB limit (${formatFileSize(file.size)})`);
				return;
			}

			setError(null);
			setHashes({});
			setIsProcessing(true);
			setFileInfo({
				name: file.name,
				size: file.size,
				type: file.type || "unknown",
			});

			try {
				const buffer = await file.arrayBuffer();
				const data = new Uint8Array(buffer);

				const results: Record<string, string> = {};
				for (const algo of selectedAlgorithms) {
					const hashBuffer = await crypto.subtle.digest(algo, data);
					const hashArray = Array.from(new Uint8Array(hashBuffer));
					results[algo] = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
				}

				setHashes(results);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to process file");
			} finally {
				setIsProcessing(false);
			}
		},
		[selectedAlgorithms],
	);

	const handleCopy = useCallback(
		async (algo: string) => {
			const hash = hashes[algo];
			if (hash) {
				await navigator.clipboard.writeText(hash);
				setCopiedAlgo(algo);
				setTimeout(() => setCopiedAlgo(null), 1500);
			}
		},
		[hashes],
	);

	const handleCopyAll = useCallback(async () => {
		const allHashes = Object.entries(hashes)
			.map(([algo, hash]) => `${algo}: ${hash}`)
			.join("\n");
		await navigator.clipboard.writeText(allHashes);
		setCopiedAlgo("all");
		setTimeout(() => setCopiedAlgo(null), 1500);
	}, [hashes]);

	return (
		<div class="space-y-6">
			{/* Algorithm selection */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<label class="text-caption-uppercase text-muted block mb-3">Select Algorithms</label>
				<div class="flex flex-wrap gap-3">
					{ALGORITHMS.map((algo) => (
						<label
							key={algo}
							class={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
								selectedAlgorithms.includes(algo)
									? "border-primary bg-primary/10"
									: "border-hairline hover:border-primary/50"
							}`}
						>
							<input
								type="checkbox"
								checked={selectedAlgorithms.includes(algo)}
								onChange={() => handleAlgorithmToggle(algo)}
								class="hidden"
							/>
							<span class="text-body-sm text-body">{algo}</span>
						</label>
					))}
				</div>
			</div>

			{/* File drop zone */}
			<FileDropZone
				accept="*"
				multiple={false}
				maxSize={MAX_FILE_SIZE}
				onFiles={processFile}
				label="Drop a file here or click to browse"
				sublabel={`Max file size: ${formatFileSize(MAX_FILE_SIZE)}`}
			/>

			{/* Processing indicator */}
			{isProcessing && (
				<div class="bg-surface-elevated rounded-lg p-4">
					<div class="flex items-center gap-3">
						<div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<span class="text-body-sm text-muted">Processing file...</span>
					</div>
				</div>
			)}

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
				</div>
			)}

			{/* File info */}
			{fileInfo && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<label class="text-caption-uppercase text-muted block mb-3">File Information</label>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="bg-surface-soft rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-1">Name</div>
							<div class="text-body-sm text-body-strong truncate" title={fileInfo.name}>
								{fileInfo.name}
							</div>
						</div>
						<div class="bg-surface-soft rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-1">Size</div>
							<div class="text-body-sm text-body-strong">{formatFileSize(fileInfo.size)}</div>
						</div>
						<div class="bg-surface-soft rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-1">Type</div>
							<div class="text-body-sm text-body-strong truncate" title={fileInfo.type}>
								{fileInfo.type}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Hashes */}
			{Object.keys(hashes).length > 0 && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<label class="text-caption-uppercase text-muted">File Hashes</label>
						<button class="btn-secondary text-body-sm" onClick={handleCopyAll}>
							{copiedAlgo === "all" ? "Copied!" : "Copy All"}
						</button>
					</div>
					<div class="space-y-3">
						{Object.entries(hashes).map(([algo, hash]) => (
							<div key={algo} class="bg-surface-soft rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<span class="text-caption-uppercase text-muted">{algo}</span>
									<button
										class="text-body-sm text-primary hover:text-primary-active transition-colors"
										onClick={() => handleCopy(algo)}
									>
										{copiedAlgo === algo ? "Copied!" : "Copy"}
									</button>
								</div>
								<code
									class="text-body-sm text-body-strong break-all"
									style="font-family: var(--font-mono)"
								>
									{hash}
								</code>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
