import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface Keyword {
	text: string;
	score: number;
}

// Simple n-gram extraction
function extractCandidates(text: string): string[] {
	// Clean and tokenize
	const sentences = text.split(/[.!?;:\n]+/).filter((s) => s.trim().length > 0);
	const candidates = new Set<string>();

	for (const sentence of sentences) {
		const words = sentence
			.toLowerCase()
			.replace(/[^\w\s]/g, "")
			.split(/\s+/)
			.filter((w) => w.length > 2);

		// Stop words (common English)
		const stopWords = new Set([
			"the",
			"and",
			"for",
			"are",
			"but",
			"not",
			"you",
			"all",
			"can",
			"had",
			"her",
			"was",
			"one",
			"our",
			"out",
			"has",
			"his",
			"how",
			"its",
			"may",
			"new",
			"now",
			"old",
			"see",
			"way",
			"who",
			"did",
			"get",
			"let",
			"say",
			"she",
			"too",
			"use",
			"this",
			"that",
			"with",
			"have",
			"from",
			"they",
			"been",
			"said",
			"each",
			"which",
			"their",
			"will",
			"other",
			"about",
			"many",
			"then",
			"them",
			"would",
			"make",
			"like",
			"just",
			"over",
			"such",
			"take",
			"than",
			"some",
			"very",
			"when",
			"come",
			"could",
			"more",
			"also",
			"into",
			"what",
			"only",
			"most",
			"some",
			"these",
		]);

		const filtered = words.filter((w) => !stopWords.has(w));

		// Unigrams
		for (const word of filtered) {
			candidates.add(word);
		}

		// Bigrams
		for (let i = 0; i < filtered.length - 1; i++) {
			candidates.add(`${filtered[i]} ${filtered[i + 1]}`);
		}

		// Trigrams
		for (let i = 0; i < filtered.length - 2; i++) {
			candidates.add(`${filtered[i]} ${filtered[i + 1]} ${filtered[i + 2]}`);
		}
	}

	return Array.from(candidates);
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	if (normA === 0 || normB === 0) return 0;
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default function KeywordExtractor() {
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [keywords, setKeywords] = useState<Keyword[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [numKeywords, setNumKeywords] = useState(10);

	const handleExtract = useCallback(async () => {
		if (!input.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setKeywords([]);
		setCopied(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading embedding model (~20MB)...");

			const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
				progress_callback: (progressData: any) => {
					if (progressData.status === "progress" && progressData.progress) {
						setProgress(0.1 + (progressData.progress / 100) * 0.5);
					} else if (progressData.status === "done") {
						setProgress(0.6);
					}
				},
			} as any);

			setStatus("processing");
			setProgress(0.65);
			setStatusText("Extracting candidates...");

			// Get candidates
			const candidates = extractCandidates(input);
			if (candidates.length === 0) {
				throw new Error("No valid candidates found. Try longer text.");
			}

			setProgress(0.7);
			setStatusText(`Computing embeddings for ${candidates.length} candidates...`);

			// Get full text embedding
			const textEmbedding = await extractor(input, { pooling: "mean", normalize: true });
			const textVec = Array.from(textEmbedding.data as Float32Array);

			// Get embeddings for each candidate (batch processing)
			const scoredKeywords: Keyword[] = [];
			const batchSize = 50;

			for (let i = 0; i < candidates.length; i += batchSize) {
				const batch = candidates.slice(i, i + batchSize);
				const batchTexts = batch.join(" [SEP] ");

				try {
					// Process each candidate individually for better accuracy
					for (const candidate of batch) {
						const candidateEmbedding = await extractor(candidate, {
							pooling: "mean",
							normalize: true,
						});
						const candidateVec = Array.from(candidateEmbedding.data as Float32Array);
						const score = cosineSimilarity(textVec, candidateVec);
						scoredKeywords.push({ text: candidate, score });
					}
				} catch {
					// Skip problematic candidates
				}

				const progressVal = 0.7 + (i / candidates.length) * 0.25;
				setProgress(Math.min(0.95, progressVal));
				setStatusText(
					`Scoring candidates... (${Math.min(i + batchSize, candidates.length)}/${candidates.length})`,
				);
			}

			// Sort by score descending
			scoredKeywords.sort((a, b) => b.score - a.score);

			// Remove duplicates and near-duplicates
			const seen = new Set<string>();
			const uniqueKeywords: Keyword[] = [];
			for (const kw of scoredKeywords) {
				const normalized = kw.text.toLowerCase().trim();
				if (!seen.has(normalized)) {
					// Also check if it's a substring of an already-added keyword
					const isSubstring = uniqueKeywords.some(
						(existing) =>
							existing.text.toLowerCase().includes(normalized) ||
							normalized.includes(existing.text.toLowerCase()),
					);
					if (!isSubstring) {
						seen.add(normalized);
						uniqueKeywords.push(kw);
					}
				}
			}

			setKeywords(uniqueKeywords.slice(0, numKeywords));
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to extract keywords. Try different text.",
			);
			setStatus("error");
		}
	}, [input, numKeywords]);

	const handleCopy = useCallback(async () => {
		if (keywords.length === 0) return;
		const text = keywords.map((kw) => kw.text).join(", ");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [keywords]);

	const handleCopyScored = useCallback(async () => {
		if (keywords.length === 0) return;
		const text = keywords.map((kw) => `${kw.text} (${(kw.score * 100).toFixed(1)}%)`).join("\n");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [keywords]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{/* Controls */}
			<div class="flex flex-wrap items-end gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Number of Keywords</label>
					<select
						class="input"
						value={numKeywords}
						onChange={(e) => setNumKeywords(Number((e.target as HTMLSelectElement).value))}
						disabled={isProcessing}
					>
						<option value="5">5</option>
						<option value="10">10</option>
						<option value="15">15</option>
						<option value="20">20</option>
					</select>
				</div>
			</div>

			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 200px"
					placeholder="Paste an article, essay, or document to extract keywords... The longer the text, the better the results."
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						if (status === "done") {
							setStatus("idle");
							setKeywords([]);
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
						onClick={handleExtract}
						disabled={!input.trim() || isProcessing}
					>
						{isProcessing ? "Extracting..." : "Extract Keywords"}
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
						First time: downloading model (~20MB). Cached after that.
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
			{status === "done" && keywords.length > 0 && (
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">Top {keywords.length} Keywords</span>
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleCopy}
						>
							{copied ? "Copied!" : "Copy Keywords"}
						</button>
					</div>

					{/* Keyword cloud visualization */}
					<div class="card mb-4">
						<div class="flex flex-wrap gap-2">
							{keywords.map((kw, i) => {
								const maxScore = keywords[0].score;
								const minScore = keywords[keywords.length - 1].score;
								const range = maxScore - minScore || 1;
								const normalized = (kw.score - minScore) / range;
								const fontSize = 0.75 + normalized * 0.75;
								const opacity = 0.5 + normalized * 0.5;

								return (
									<span
										key={i}
										class="badge"
										style={{
											fontSize: `${fontSize}rem`,
											opacity: opacity,
										}}
									>
										{kw.text}
									</span>
								);
							})}
						</div>
					</div>

					{/* Ranked list */}
					<div class="mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Ranked by Relevance</div>
						<div class="space-y-2">
							{keywords.map((kw, i) => (
								<div key={i} class="bg-surface-elevated rounded-lg p-3 flex items-center gap-3">
									<span class="text-caption text-muted font-mono w-6 text-right flex-shrink-0">
										{i + 1}
									</span>
									<div class="flex-1">
										<span class="text-body-sm text-on-dark font-medium">{kw.text}</span>
									</div>
									<div class="flex items-center gap-2 flex-shrink-0">
										<div class="w-20 bg-surface-card rounded-full h-1.5 overflow-hidden">
											<div
												class="bg-primary h-1.5 rounded-full transition-all duration-300"
												style={{ width: `${Math.round(kw.score * 100)}%` }}
											/>
										</div>
										<span class="text-caption text-muted font-mono w-12 text-right">
											{(kw.score * 100).toFixed(1)}%
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy}>
							{copied ? "Copied!" : "Copy Keywords"}
						</button>
						<button class="btn-secondary" onClick={handleCopyScored}>
							Copy with Scores
						</button>
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setKeywords([]);
								setCopied(false);
							}}
						>
							Extract Again
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
