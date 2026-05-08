import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface SentimentResult {
	label: string;
	score: number;
}

export default function SentimentAnalysis() {
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [results, setResults] = useState<SentimentResult[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleAnalyze = useCallback(async () => {
		if (!input.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setResults([]);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading sentiment model (~270MB)...");

			const classifier = await pipeline(
				"sentiment-analysis",
				"Xenova/distilbert-base-uncased-finetuned-sst-2-english",
				{
					progress_callback: (progressData: any) => {
						if (progressData.status === "progress" && progressData.progress) {
							setProgress(0.1 + (progressData.progress / 100) * 0.7);
						} else if (progressData.status === "done") {
							setProgress(0.8);
						}
					},
				} as any,
			);

			setStatus("processing");
			setProgress(0.85);
			setStatusText("Analyzing sentiment...");

			// Split into sentences for multi-sentence analysis
			const sentences = input
				.split(/[.!?]+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			if (sentences.length === 0) {
				throw new Error("No valid sentences found.");
			}

			const output = await classifier(sentences.length === 1 ? input : sentences);

			const mapped = (Array.isArray(output) ? output : [output]).map((item: any) => ({
				label: item.label as string,
				score: item.score as number,
			}));

			setResults(mapped);
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to analyze sentiment. Try shorter text.",
			);
			setStatus("error");
		}
	}, [input]);

	const overallSentiment =
		results.length > 0
			? results.reduce(
					(acc, r) => ({
						positive: acc.positive + (r.label === "POSITIVE" ? r.score : 0),
						negative: acc.negative + (r.label === "NEGATIVE" ? r.score : 0),
					}),
					{ positive: 0, negative: 0 },
				)
			: null;

	const overallLabel = overallSentiment
		? overallSentiment.positive >= overallSentiment.negative
			? "POSITIVE"
			: "NEGATIVE"
		: null;

	const overallScore = overallSentiment
		? Math.max(overallSentiment.positive, overallSentiment.negative) / results.length
		: 0;

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 160px"
					placeholder="Enter text to analyze sentiment... e.g. 'I love this product! It works perfectly. But the delivery was slow.'"
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						if (status === "done") {
							setStatus("idle");
							setResults([]);
						}
					}}
					disabled={isProcessing}
				/>
			</div>

			{/* Action */}
			{status !== "done" && (
				<div class="mb-4">
					<button
						class="btn-primary"
						onClick={handleAnalyze}
						disabled={!input.trim() || isProcessing}
					>
						{isProcessing ? "Analyzing..." : "Analyze Sentiment"}
					</button>
				</div>
			)}

			{/* Progress */}
			{isProcessing && (
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<span class="text-body-sm text-body">{statusText}</span>
						<span class="text-body-sm text-primary font-mono">{Math.round(progress * 100)}%</span>
					</div>
					<div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
						<div
							class="bg-primary h-2 rounded-full transition-all duration-300"
							style={{ width: `${Math.round(progress * 100)}%` }}
						/>
					</div>
					<p class="text-caption text-muted mt-1">
						First time: downloading model (~270MB). Cached after that.
					</p>
				</div>
			)}

			{/* Error */}
			{error && (
				<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
					<p class="text-body-sm text-accent-rose">{error}</p>
					<button
						class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
						onClick={() => {
							setError(null);
							setStatus("idle");
						}}
					>
						Try again
					</button>
				</div>
			)}

			{/* Results */}
			{status === "done" && results.length > 0 && (
				<div>
					{/* Overall sentiment */}
					{overallLabel && (
						<div class="card mb-4">
							<div class="text-caption-uppercase text-muted mb-3">Overall Sentiment</div>
							<div class="flex items-center gap-4">
								<div
									class="text-display-sm"
									style={{
										color: overallLabel === "POSITIVE" ? "#22c55e" : "#ef4444",
									}}
								>
									{overallLabel === "POSITIVE" ? "😊" : "😞"}
								</div>
								<div>
									<div
										class="text-title-md"
										style={{
											color: overallLabel === "POSITIVE" ? "#22c55e" : "#ef4444",
										}}
									>
										{overallLabel}
									</div>
									<div class="text-body-sm text-muted">
										Confidence: {(overallScore * 100).toFixed(1)}%
									</div>
								</div>
							</div>
							{/* Visual bar */}
							<div class="mt-4">
								<div class="flex h-3 rounded-full overflow-hidden bg-surface-card">
									<div
										class="transition-all duration-500"
										style={{
											width: `${(overallSentiment?.positive / (overallSentiment?.positive + overallSentiment?.negative)) * 100}%`,
											background: "#22c55e",
										}}
									/>
									<div
										class="transition-all duration-500"
										style={{
											width: `${(overallSentiment?.negative / (overallSentiment?.positive + overallSentiment?.negative)) * 100}%`,
											background: "#ef4444",
										}}
									/>
								</div>
								<div class="flex justify-between mt-1">
									<span class="text-caption text-accent-emerald">
										Positive {((overallSentiment?.positive / results.length) * 100).toFixed(0)}%
									</span>
									<span class="text-caption text-accent-rose">
										Negative {((overallSentiment?.negative / results.length) * 100).toFixed(0)}%
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Per-sentence results */}
					{results.length > 1 && (
						<div>
							<div class="text-caption-uppercase text-muted mb-3">
								Sentence Breakdown ({results.length} sentences)
							</div>
							<div class="space-y-2">
								{results.map((r, i) => (
									<div key={i} class="bg-surface-elevated rounded-lg p-3 flex items-center gap-3">
										<span
											class="text-lg"
											style={{
												color: r.label === "POSITIVE" ? "#22c55e" : "#ef4444",
											}}
										>
											{r.label === "POSITIVE" ? "✅" : "❌"}
										</span>
										<div class="flex-1">
											<span class="text-body-sm text-on-dark">
												{input
													.split(/[.!?]+/)
													.map((s) => s.trim())
													.filter((s) => s.length > 0)[i] || ""}
											</span>
										</div>
										<div class="text-right flex-shrink-0">
											<div
												class="text-body-sm font-medium"
												style={{
													color: r.label === "POSITIVE" ? "#22c55e" : "#ef4444",
												}}
											>
												{r.label}
											</div>
											<div class="text-caption text-muted font-mono">
												{(r.score * 100).toFixed(1)}%
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Action */}
					<div class="mt-4">
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setResults([]);
							}}
						>
							Analyze Again
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
