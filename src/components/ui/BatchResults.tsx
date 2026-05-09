import { useState, useCallback } from "preact/hooks";
import { formatFileSize, downloadAsZip, downloadBlob } from "../../utils/batch";

interface Result {
	name: string;
	blob: Blob;
}

interface Props {
	results: Result[];
	processing: boolean;
	totalCount: number;
	errorCount: number;
	zipName?: string;
}

export default function BatchResults({
	results,
	processing,
	totalCount,
	errorCount,
	zipName = "toolbundle-batch.zip",
}: Props) {
	const [downloading, setDownloading] = useState(false);

	const handleDownloadAll = useCallback(async () => {
		if (results.length === 0) return;
		setDownloading(true);
		try {
			await downloadAsZip(results, zipName);
		} finally {
			setDownloading(false);
		}
	}, [results, zipName]);

	const completedCount = results.length;
	const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	if (totalCount === 0) return null;

	return (
		<div>
			{/* Progress bar */}
			{processing && (
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<span class="text-body-sm text-muted">Processing...</span>
						<span class="text-body-sm text-muted">
							{completedCount}/{totalCount}
						</span>
					</div>
					<div style="height: 6px; background: var(--color-surface-card); border-radius: 9999px; overflow: hidden;">
						<div
							style={`height: 100%; width: ${progressPercent}%; background: var(--color-primary); border-radius: 9999px; transition: width 0.3s ease;`}
						/>
					</div>
				</div>
			)}

			{/* Summary */}
			{!processing && completedCount > 0 && (
				<div class="flex flex-wrap items-center gap-3 mb-4">
					<div class="bg-surface-card rounded-lg px-4 py-2">
						<span class="text-body-sm-strong text-on-dark">{completedCount}</span>
						<span class="text-body-sm text-muted ml-1">completed</span>
					</div>
					{errorCount > 0 && (
						<div class="bg-surface-card rounded-lg px-4 py-2">
							<span class="text-body-sm-strong" style="color: var(--color-error);">
								{errorCount}
							</span>
							<span class="text-body-sm text-muted ml-1">failed</span>
						</div>
					)}
					<button
						class="btn-primary"
						onClick={handleDownloadAll}
						disabled={downloading || results.length === 0}
					>
						{downloading ? "Creating zip..." : `Download All (${results.length})`}
					</button>
				</div>
			)}

			{/* File list */}
			<div class="space-y-2">
				{results.map((result, index) => (
					<div class="flex items-center gap-3 bg-surface-card rounded-lg px-4 py-3">
						<div class="w-8 h-8 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center shrink-0">
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
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-body-sm text-on-dark truncate">{result.name}</div>
							<div class="text-caption text-muted">{formatFileSize(result.blob.size)}</div>
						</div>
						<button
							class="btn-secondary"
							style="padding: 4px 12px; font-size: 12px;"
							onClick={() => downloadBlob(result.blob, result.name)}
						>
							Download
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
