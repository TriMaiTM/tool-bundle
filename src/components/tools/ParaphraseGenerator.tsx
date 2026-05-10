import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

export default function ParaphraseGenerator() {
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [results, setResults] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [numResults, setNumResults] = useState(3);

	const handleGenerate = useCallback(async () => {
		if (!input.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setResults([]);
		setCopiedIndex(null);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading T5 model (~250MB)...");

			const generator = await pipeline("text2text-generation", "Xenova/t5-small", {
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
			setStatusText("Generating paraphrases...");

			const output = await generator(`paraphrase: ${input}`, {
				num_return_sequences: numResults,
				num_beams: numResults,
				max_length: Math.max(input.length * 2, 200),
			});

			const texts = (Array.isArray(output) ? output : [output]).map(
				(item: any) => item.generated_text as string,
			);

			// Deduplicate
			const unique = [...new Set(texts)].filter((t) => t.trim() !== input.trim());
			setResults(unique.length > 0 ? unique : texts);
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate paraphrases. Try shorter text.",
			);
			setStatus("error");
		}
	}, [input, numResults]);

	const handleCopy = useCallback(async (text: string, index: number) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch {
			/* ignore */
		}
	}, []);

	const handleCopyAll = useCallback(async () => {
		if (results.length === 0) return;
		try {
			await navigator.clipboard.writeText(results.join("\n\n"));
			setCopiedIndex(-1);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch {
			/* ignore */
		}
	}, [results]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{/* Controls */}
			<div class="flex flex-wrap items-end gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Number of Variants</label>
					<select
						class="input"
						value={numResults}
						onChange={(e) => setNumResults(Number((e.target as HTMLSelectElement).value))}
						disabled={isProcessing}
					>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
					</select>
				</div>
			</div>

			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 160px"
					placeholder="Enter text to paraphrase... e.g. 'The quick brown fox jumps over the lazy dog.'"
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
						onClick={handleGenerate}
						disabled={!input.trim() || isProcessing}
					>
						{isProcessing ? "Generating..." : "Generate Paraphrases"}
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
						First time: downloading model (~250MB). Cached after that.
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
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">
							Paraphrased Versions ({results.length})
						</span>
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleCopyAll}
						>
							{copiedIndex === -1 ? "Copied!" : "Copy All"}
						</button>
					</div>

					<div class="space-y-3 mb-4">
						{results.map((text, i) => (
							<div key={i} class="card">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<div class="text-caption-uppercase text-muted mb-2">Variant {i + 1}</div>
										<p class="text-body-sm text-on-dark">{text}</p>
									</div>
									<button
										class="text-body-sm text-primary hover:text-primary-active transition-colors flex-shrink-0"
										onClick={() => handleCopy(text, i)}
									>
										{copiedIndex === i ? "Copied!" : "Copy"}
									</button>
								</div>
							</div>
						))}
					</div>

					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopyAll}>
							{copiedIndex === -1 ? "Copied!" : "Copy All"}
						</button>
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setResults([]);
								setCopiedIndex(null);
							}}
						>
							Generate More
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
