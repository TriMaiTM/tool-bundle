import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface QAResult {
	answer: string;
	score: number;
	start: number;
	end: number;
}

export default function QuestionAnswering() {
	const [context, setContext] = useState("");
	const [question, setQuestion] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [result, setResult] = useState<QAResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleAsk = useCallback(async () => {
		if (!context.trim() || !question.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setResult(null);
		setCopied(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading QA model (~270MB)...");

			const qa = await pipeline(
				"question-answering",
				"Xenova/distilbert-base-cased-distilled-squad",
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
			setStatusText("Finding answer...");

			const output = await qa(question, context);

			setResult({
				answer: (output as any).answer,
				score: (output as any).score,
				start: (output as any).start,
				end: (output as any).end,
			});
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to find answer. Check your context and question.",
			);
			setStatus("error");
		}
	}, [context, question]);

	const handleCopy = useCallback(async () => {
		if (!result?.answer) return;
		try {
			await navigator.clipboard.writeText(result.answer);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [result]);

	const isProcessing = status === "loading-model" || status === "processing";

	// Highlight answer in context
	const highlightedContext = result
		? `${context.slice(0, result.start)}【${context.slice(result.start, result.end)}】${context.slice(result.end)}`
		: context;

	return (
		<div>
			{/* Context */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Context (Passage)</label>
				<textarea
					class="textarea"
					style="min-height: 150px"
					placeholder="Paste the passage or article containing the answer... e.g. 'The Eiffel Tower is located in Paris, France. It was built in 1889 and stands 330 meters tall.'"
					value={context}
					onInput={(e) => {
						setContext((e.target as HTMLTextAreaElement).value);
						if (status === "done") {
							setStatus("idle");
							setResult(null);
						}
					}}
					disabled={isProcessing}
				/>
				<div class="text-caption text-muted mt-1">
					{context.trim().split(/\s+/).filter(Boolean).length} words
				</div>
			</div>

			{/* Question */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Question</label>
				<input
					class="input"
					placeholder="e.g. 'Where is the Eiffel Tower located?'"
					value={question}
					onInput={(e) => {
						setQuestion((e.target as HTMLInputElement).value);
						if (status === "done") {
							setStatus("idle");
							setResult(null);
						}
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" && context.trim() && question.trim() && !isProcessing) {
							handleAsk();
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
						onClick={handleAsk}
						disabled={!context.trim() || !question.trim() || isProcessing}
					>
						{isProcessing ? "Finding..." : "Find Answer"}
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

			{/* Result */}
			{status === "done" && result && (
				<div>
					{/* Answer */}
					<div class="card mb-4">
						<div class="text-caption-uppercase text-muted mb-2">Answer</div>
						<div class="flex items-start gap-3">
							<div class="text-display-sm" style={{ color: "#faff69", lineHeight: 1.2 }}>
								💡
							</div>
							<div class="flex-1">
								<div class="text-title-md text-on-dark mb-1">{result.answer}</div>
								<div class="text-caption text-muted">
									Confidence: {(result.score * 100).toFixed(1)}%
								</div>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors flex-shrink-0"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						{/* Confidence bar */}
						<div class="mt-3">
							<div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
								<div
									class="h-2 rounded-full transition-all duration-500"
									style={{
										width: `${result.score * 100}%`,
										background:
											result.score > 0.7 ? "#22c55e" : result.score > 0.3 ? "#faff69" : "#ef4444",
									}}
								/>
							</div>
						</div>
					</div>

					{/* Context with highlighted answer */}
					<div class="mb-4">
						<div class="text-caption-uppercase text-muted mb-2">
							Context with Answer Highlighted
						</div>
						<div class="bg-surface-elevated rounded-lg p-4">
							<p class="text-body-sm text-body" style="line-height: 1.8">
								{highlightedContext.split("【").map((part, i) => {
									if (i === 0) return <span key={i}>{part}</span>;
									const [answer, rest] = part.split("】");
									return (
										<span key={i}>
											<mark
												style={{
													background: "#faff69",
													color: "#0a0a0a",
													padding: "1px 4px",
													borderRadius: "3px",
													fontWeight: 600,
												}}
											>
												{answer}
											</mark>
											{rest}
										</span>
									);
								})}
							</p>
						</div>
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy}>
							{copied ? "Copied!" : "Copy Answer"}
						</button>
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setResult(null);
								setCopied(false);
							}}
						>
							Ask Another Question
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
