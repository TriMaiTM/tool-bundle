import { useCallback, useMemo, useState } from "preact/hooks";

export default function TextStatistics() {
	const [text, setText] = useState("");

	const stats = useMemo(() => {
		const empty = {
			totalChars: 0,
			charsNoSpaces: 0,
			charsNoPunctuation: 0,
			totalWords: 0,
			uniqueWords: 0,
			avgWordLength: 0,
			totalSentences: 0,
			avgSentenceLength: 0,
			paragraphs: 0,
			totalLines: 0,
			blankLines: 0,
			nonBlankLines: 0,
			readingTime: "0 min",
			speakingTime: "0 min",
			longestWord: "—",
			shortestWord: "—",
			mostFrequentWord: "—",
		};

		const trimmed = text.trim();
		if (!trimmed) return empty;

		const totalChars = text.length;
		const charsNoSpaces = text.replace(/\s/g, "").length;
		const charsNoPunctuation = text.replace(/[\s\p{P}]/gu, "").length;

		const words = trimmed.split(/\s+/).filter(Boolean);
		const totalWords = words.length;
		const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
		const avgWordLength =
			totalWords > 0
				? Number.parseFloat((words.reduce((sum, w) => sum + w.length, 0) / totalWords).toFixed(1))
				: 0;

		const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
		const totalSentences = sentences.length;
		const avgSentenceLength =
			totalSentences > 0 ? Number.parseFloat((totalWords / totalSentences).toFixed(1)) : 0;

		const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

		const lines = text.split("\n");
		const totalLines = lines.length;
		const blankLines = lines.filter((l) => l.trim() === "").length;
		const nonBlankLines = totalLines - blankLines;

		const readingMinutes = totalWords / 200;
		const readingTime =
			readingMinutes < 1
				? `${Math.ceil(readingMinutes * 60)} sec`
				: `${Math.ceil(readingMinutes)} min`;

		const speakingMinutes = totalWords / 150;
		const speakingTime =
			speakingMinutes < 1
				? `${Math.ceil(speakingMinutes * 60)} sec`
				: `${Math.ceil(speakingMinutes)} min`;

		let longestWord = "";
		let shortestWord = words[0] || "";
		for (const w of words) {
			const clean = w.replace(/[^\w]/g, "");
			if (clean.length > longestWord.length) longestWord = clean;
			if (clean.length > 0 && clean.length < shortestWord.length) shortestWord = clean;
		}

		const freq = new Map<string, number>();
		for (const w of words) {
			const lower = w.toLowerCase().replace(/[^\w]/g, "");
			if (lower) freq.set(lower, (freq.get(lower) || 0) + 1);
		}
		let mostFrequentWord = "—";
		let maxCount = 0;
		for (const [word, count] of freq) {
			if (count > maxCount) {
				maxCount = count;
				mostFrequentWord = `${word} (${count}×)`;
			}
		}

		return {
			totalChars,
			charsNoSpaces,
			charsNoPunctuation,
			totalWords,
			uniqueWords,
			avgWordLength,
			totalSentences,
			avgSentenceLength,
			paragraphs,
			totalLines,
			blankLines,
			nonBlankLines,
			readingTime,
			speakingTime,
			longestWord: longestWord || "—",
			shortestWord: shortestWord || "—",
			mostFrequentWord,
		};
	}, [text]);

	const statGroups = [
		{
			title: "Characters",
			items: [
				{ label: "Total", value: stats.totalChars },
				{ label: "No Spaces", value: stats.charsNoSpaces },
				{ label: "No Punctuation", value: stats.charsNoPunctuation },
			],
		},
		{
			title: "Words",
			items: [
				{ label: "Total", value: stats.totalWords },
				{ label: "Unique", value: stats.uniqueWords },
				{ label: "Avg Length", value: stats.avgWordLength },
			],
		},
		{
			title: "Sentences",
			items: [
				{ label: "Total", value: stats.totalSentences },
				{ label: "Avg Words", value: stats.avgSentenceLength },
			],
		},
		{
			title: "Lines",
			items: [
				{ label: "Total", value: stats.totalLines },
				{ label: "Blank", value: stats.blankLines },
				{ label: "Non-Blank", value: stats.nonBlankLines },
			],
		},
		{
			title: "Timing",
			items: [
				{ label: "Reading", value: stats.readingTime },
				{ label: "Speaking", value: stats.speakingTime },
				{ label: "Paragraphs", value: stats.paragraphs },
			],
		},
		{
			title: "Word Insights",
			items: [
				{ label: "Longest", value: stats.longestWord },
				{ label: "Shortest", value: stats.shortestWord },
				{ label: "Most Frequent", value: stats.mostFrequentWord },
			],
		},
	];

	const handleCopyStats = useCallback(async () => {
		const lines = statGroups.flatMap((group) =>
			group.items.map((item) => `${item.label}: ${item.value}`),
		);
		await navigator.clipboard.writeText(lines.join("\n"));
	}, [statGroups]);

	return (
		<div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
				{statGroups.map((group) => (
					<div class="bg-surface-elevated rounded-lg p-4">
						<div class="text-body-sm font-semibold mb-3">{group.title}</div>
						<div class="flex flex-col gap-2">
							{group.items.map((item) => (
								<div class="flex items-center justify-between">
									<span class="text-caption text-muted">{item.label}</span>
									<span class="text-body-sm font-medium">{item.value}</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Input</label>
					<div class="flex gap-3">
						{text && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopyStats}
							>
								Copy Stats
							</button>
						)}
						{text && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => setText("")}
							>
								Clear
							</button>
						)}
					</div>
				</div>
				<textarea
					class="textarea"
					style="min-height: 300px"
					placeholder="Start typing or paste your text here..."
					value={text}
					onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
				/>
			</div>
		</div>
	);
}
