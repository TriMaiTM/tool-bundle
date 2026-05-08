import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

export default function GrammarChecker() {
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [result, setResult] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleCheck = useCallback(async () => {
		if (!input.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setResult("");
		setCopied(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading grammar model (~250MB)...");

			const corrector = await pipeline("text2text-generation", "Xenova/t5-small", {
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
			setStatusText("Checking grammar...");

			const output = await corrector(`grammar: ${input}`, {
				max_new_tokens: 256,
			});

			const corrected = Array.isArray(output)
				? (output[0] as any).generated_text
				: (output as any).generated_text;

			setResult(corrected || input);
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to check grammar. Try shorter text.");
			setStatus("error");
		}
	}, [input]);

	const handleCopy = useCallback(async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			const ta = document.createElement("textarea");
			ta.value = result;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [result]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 180px"
					placeholder="Paste text with grammar mistakes here... e.g. 'She don't like to going to the store yesterday.'"
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						if (status === "done") {
							setStatus("idle");
							setResult("");
						}
					}}
					disabled={isProcessing}
				/>
				<div class="text-caption text-muted mt-1">
					{input.trim().split(/\s+/).filter(Boolean).length} words
				</div>
			</div>

			{/* Action */}
			{status !== "done" && (
				<div class="mb-4">
					<button
						class="btn-primary"
						onClick={handleCheck}
						disabled={!input.trim() || isProcessing}
					>
						{isProcessing ? "Checking..." : "Check Grammar"}
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

			{/* Result */}
			{status === "done" && result && (
				<div>
					<div class="flex items-center gap-3 mb-3">
						<span class="text-caption-uppercase text-muted">Corrected Text</span>
						{result.trim() !== input.trim() && (
							<span class="badge badge-yellow">Changes found</span>
						)}
						{result.trim() === input.trim() && <span class="badge">No changes</span>}
					</div>

					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">Output</label>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<textarea class="textarea" style="min-height: 180px" value={result} readOnly />
					</div>

					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy}>
							{copied ? "Copied!" : "Copy to Clipboard"}
						</button>
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setResult("");
								setCopied(false);
							}}
						>
							Check Again
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
