import { useCallback, useState } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface Entity {
	entity: string;
	word: string;
	score: number;
	start: number;
	end: number;
}

interface EntityGroup {
	type: string;
	entities: { word: string; score: number }[];
}

const ENTITY_COLORS: Record<string, string> = {
	PER: "var(--accent-blue, #3b82f6)",
	LOC: "var(--accent-yellow, #eab308)",
	ORG: "var(--accent-rose, #ef4444)",
	MISC: "var(--accent-purple, #a855f7)",
};

const ENTITY_BG: Record<string, string> = {
	PER: "rgba(59, 130, 246, 0.15)",
	LOC: "rgba(234, 179, 8, 0.15)",
	ORG: "rgba(239, 68, 68, 0.15)",
	MISC: "rgba(168, 85, 247, 0.15)",
};

const ENTITY_LABELS: Record<string, string> = {
	PER: "Person",
	LOC: "Location",
	ORG: "Organization",
	MISC: "Miscellaneous",
};

function getEntityType(entityTag: string): string {
	// entityTag like "B-PER", "I-PER", "B-LOC", etc.
	const parts = entityTag.split("-");
	return parts.length > 1 ? parts[1] : "MISC";
}

export default function NamedEntityRecognition() {
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");
	const [entities, setEntities] = useState<Entity[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleAnalyze = useCallback(async () => {
		if (!input.trim()) return;
		setStatus("loading-model");
		setProgress(0);
		setError(null);
		setEntities([]);
		setCopied(false);

		try {
			const { pipeline } = await import("@huggingface/transformers");

			setStatus("loading-model");
			setProgress(0.1);
			setStatusText("Loading NER model (~400MB)...");

			const ner = await pipeline("token-classification", "Xenova/bert-base-NER", {
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
			setStatusText("Recognizing entities...");

			const output = await ner(input);

			const mapped: Entity[] = (Array.isArray(output) ? output : [output]).map((item: any) => ({
				entity: item.entity as string,
				word: item.word as string,
				score: item.score as number,
				start: item.start as number,
				end: item.end as number,
			}));

			setEntities(mapped);
			setStatus("done");
			setProgress(1);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to recognize entities. Try shorter text.",
			);
			setStatus("error");
		}
	}, [input]);

	// Group entities by type, merging sub-tokens
	const groupedEntities: EntityGroup[] = (() => {
		const groups: Record<string, { word: string; score: number }[]> = {};
		let currentEntity: { type: string; word: string; scores: number[] } | null = null;

		for (const ent of entities) {
			const type = getEntityType(ent.entity);
			if (ent.entity.startsWith("B-")) {
				// Flush previous
				if (currentEntity) {
					if (!groups[currentEntity.type]) groups[currentEntity.type] = [];
					const avgScore =
						currentEntity.scores.reduce((a, b) => a + b, 0) / currentEntity.scores.length;
					groups[currentEntity.type].push({
						word: currentEntity.word,
						score: avgScore,
					});
				}
				currentEntity = {
					type,
					word: ent.word.replace(/^##/, ""),
					scores: [ent.score],
				};
			} else if (ent.entity.startsWith("I-") && currentEntity && currentEntity.type === type) {
				// Continuation token
				const token = ent.word.startsWith("##") ? ent.word.slice(2) : ` ${ent.word}`;
				currentEntity.word += token;
				currentEntity.scores.push(ent.score);
			} else {
				// Flush and start new
				if (currentEntity) {
					if (!groups[currentEntity.type]) groups[currentEntity.type] = [];
					const avgScore =
						currentEntity.scores.reduce((a, b) => a + b, 0) / currentEntity.scores.length;
					groups[currentEntity.type].push({
						word: currentEntity.word,
						score: avgScore,
					});
				}
				currentEntity = {
					type,
					word: ent.word.replace(/^##/, ""),
					scores: [ent.score],
				};
			}
		}
		if (currentEntity) {
			if (!groups[currentEntity.type]) groups[currentEntity.type] = [];
			const avgScore =
				currentEntity.scores.reduce((a, b) => a + b, 0) / currentEntity.scores.length;
			groups[currentEntity.type].push({
				word: currentEntity.word,
				score: avgScore,
			});
		}

		return Object.entries(groups).map(([type, ents]) => ({
			type,
			entities: ents,
		}));
	})();

	// Build highlighted text
	const highlightedText = (() => {
		if (entities.length === 0) return input;

		// Collect merged entity spans
		const spans: { start: number; end: number; type: string }[] = [];
		let currentSpan: { start: number; end: number; type: string } | null = null;

		for (const ent of entities) {
			const type = getEntityType(ent.entity);
			if (ent.entity.startsWith("B-")) {
				if (currentSpan) spans.push(currentSpan);
				currentSpan = { start: ent.start, end: ent.end, type };
			} else if (ent.entity.startsWith("I-") && currentSpan && currentSpan.type === type) {
				currentSpan.end = ent.end;
			} else {
				if (currentSpan) spans.push(currentSpan);
				currentSpan = { start: ent.start, end: ent.end, type };
			}
		}
		if (currentSpan) spans.push(currentSpan);

		if (spans.length === 0) return input;

		const parts: any[] = [];
		let lastIndex = 0;
		for (const span of spans) {
			if (span.start > lastIndex) {
				parts.push(input.slice(lastIndex, span.start));
			}
			parts.push(
				<span
					key={span.start}
					style={{
						background: ENTITY_BG[span.type] || ENTITY_BG.MISC,
						color: ENTITY_COLORS[span.type] || ENTITY_COLORS.MISC,
						borderRadius: "3px",
						padding: "1px 3px",
						fontWeight: 500,
					}}
				>
					{input.slice(span.start, span.end)}
				</span>,
			);
			lastIndex = span.end;
		}
		if (lastIndex < input.length) {
			parts.push(input.slice(lastIndex));
		}
		return parts;
	})();

	const handleCopyEntities = useCallback(async () => {
		if (groupedEntities.length === 0) return;
		const text = groupedEntities
			.map(
				(g) =>
					`${ENTITY_LABELS[g.type]}:\n${g.entities
						.map((e) => `  ${e.word} (${(e.score * 100).toFixed(1)}%)`)
						.join("\n")}`,
			)
			.join("\n\n");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [groupedEntities]);

	const isProcessing = status === "loading-model" || status === "processing";

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 160px"
					placeholder="Enter text to detect entities... e.g. 'John works at Google in New York and met with Maria from Microsoft in London.'"
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						if (status === "done") {
							setStatus("idle");
							setEntities([]);
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
						{isProcessing ? "Analyzing..." : "Recognize Entities"}
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
						First time: downloading model (~400MB). Cached after that.
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
			{status === "done" && (
				<div>
					{/* Highlighted text */}
					<div class="card mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Highlighted Text</div>
						<div
							class="text-body-sm text-on-dark"
							style="line-height: 1.8; white-space: pre-wrap; word-break: break-word;"
						>
							{highlightedText}
						</div>
						{/* Legend */}
						<div
							class="flex flex-wrap gap-3 mt-3 pt-3"
							style="border-top: 1px solid var(--border-subtle)"
						>
							{Object.entries(ENTITY_COLORS).map(([type, color]) => (
								<div key={type} class="flex items-center gap-1">
									<div
										style={{
											width: "10px",
											height: "10px",
											borderRadius: "2px",
											background: ENTITY_BG[type],
											border: `1px solid ${color}`,
										}}
									/>
									<span class="text-caption text-muted">{ENTITY_LABELS[type]}</span>
								</div>
							))}
						</div>
					</div>

					{/* Entity groups */}
					{groupedEntities.length > 0 && (
						<div class="mb-4">
							<div class="text-caption-uppercase text-muted mb-3">
								Entities Found ({groupedEntities.reduce((acc, g) => acc + g.entities.length, 0)})
							</div>
							<div class="space-y-3">
								{groupedEntities.map((group) => (
									<div key={group.type} class="bg-surface-elevated rounded-lg p-3">
										<div class="flex items-center gap-2 mb-2">
											<div
												style={{
													width: "10px",
													height: "10px",
													borderRadius: "2px",
													background: ENTITY_BG[group.type],
													border: `1px solid ${ENTITY_COLORS[group.type] || ENTITY_COLORS.MISC}`,
												}}
											/>
											<span
												class="text-body-sm font-medium"
												style={{
													color: ENTITY_COLORS[group.type] || ENTITY_COLORS.MISC,
												}}
											>
												{ENTITY_LABELS[group.type] || group.type}
											</span>
											<span class="badge">{group.entities.length}</span>
										</div>
										<div class="space-y-1">
											{group.entities.map((ent, i) => (
												<div key={i} class="flex items-center justify-between">
													<span class="text-body-sm text-on-dark">{ent.word}</span>
													<span class="text-caption text-muted font-mono">
														{(ent.score * 100).toFixed(1)}%
													</span>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{groupedEntities.length === 0 && (
						<div class="bg-surface-elevated rounded-lg p-4 mb-4 text-center">
							<p class="text-body-sm text-muted">
								No entities detected. Try text with names, places, or organizations.
							</p>
						</div>
					)}

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						{groupedEntities.length > 0 && (
							<button class="btn-primary" onClick={handleCopyEntities}>
								{copied ? "Copied!" : "Copy Entities"}
							</button>
						)}
						<button
							class="btn-secondary"
							onClick={() => {
								setStatus("idle");
								setEntities([]);
								setCopied(false);
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
