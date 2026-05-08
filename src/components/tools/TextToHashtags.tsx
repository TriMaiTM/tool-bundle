import { useCallback, useMemo, useState } from "preact/hooks";

const STOP_WORDS = new Set([
	"a",
	"an",
	"the",
	"and",
	"or",
	"but",
	"in",
	"on",
	"at",
	"to",
	"for",
	"of",
	"with",
	"by",
	"from",
	"as",
	"is",
	"was",
	"are",
	"were",
	"been",
	"be",
	"have",
	"has",
	"had",
	"do",
	"does",
	"did",
	"will",
	"would",
	"could",
	"should",
	"may",
	"might",
	"shall",
	"can",
	"this",
	"that",
	"these",
	"those",
	"i",
	"me",
	"my",
	"myself",
	"we",
	"our",
	"ours",
	"ourselves",
	"you",
	"your",
	"yours",
	"yourself",
	"yourselves",
	"he",
	"him",
	"his",
	"himself",
	"she",
	"her",
	"hers",
	"herself",
	"it",
	"its",
	"itself",
	"they",
	"them",
	"their",
	"theirs",
	"themselves",
	"what",
	"which",
	"who",
	"whom",
	"when",
	"where",
	"why",
	"how",
	"all",
	"each",
	"every",
	"both",
	"few",
	"more",
	"most",
	"other",
	"some",
	"such",
	"no",
	"nor",
	"not",
	"only",
	"own",
	"same",
	"so",
	"than",
	"too",
	"very",
	"s",
	"t",
	"just",
	"don",
	"now",
	"here",
	"there",
	"then",
	"also",
	"about",
	"up",
	"out",
	"if",
	"into",
	"over",
	"after",
	"before",
	"between",
	"through",
	"during",
	"without",
	"again",
	"further",
	"once",
	"while",
	"because",
	"until",
	"after",
	"above",
	"below",
	"under",
	"since",
	"along",
	"among",
	"around",
	"behind",
	"beside",
	"beyond",
	"near",
	"toward",
	"upon",
	"against",
	"within",
	"even",
	"still",
	"already",
	"much",
	"many",
	"well",
	"back",
	"down",
	"off",
	"away",
	"quite",
	"really",
	"always",
	"never",
	"often",
	"sometimes",
	"usually",
	"almost",
	"enough",
	"however",
	"although",
	"though",
	"yet",
	"either",
	"neither",
	"whether",
	"while",
	"whose",
	"whichever",
	"whatever",
	"anything",
	"everything",
	"nothing",
	"something",
	"anyone",
	"everyone",
	"someone",
	"each",
	"everybody",
	"anybody",
	"somebody",
	"nobody",
	"let",
	"make",
	"made",
	"like",
	"going",
	"get",
	"got",
	"new",
	"one",
	"two",
	"three",
	"first",
	"last",
	"long",
	"great",
	"little",
	"old",
	"right",
	"big",
	"high",
	"different",
	"small",
	"large",
	"next",
	"early",
	"young",
	"important",
	"few",
	"public",
	"bad",
	"same",
	"able",
	"using",
	"used",
	"use",
	"per",
	"via",
]);

const SAMPLE_TEXT = `Artificial intelligence is transforming the way we interact with technology. From machine learning algorithms that power recommendation systems to natural language processing models that understand human speech, AI is becoming an integral part of our daily lives.

The rise of large language models has opened new possibilities in content creation, code generation, and automated customer support. Companies across industries are investing heavily in AI research and development to stay competitive in the rapidly evolving digital landscape.

However, the rapid advancement of AI technology also raises important ethical questions about privacy, job displacement, and the responsible use of automated decision-making systems. As we move forward, it is crucial to balance innovation with thoughtful regulation and human oversight.`;

type MaxHashtags = 5 | 10 | 15 | 20 | 30;
type StyleOption = "lowercase" | "uppercase" | "camelCase" | "titleCase";
type SeparatorOption = "spaces" | "commas" | "newline";

interface KeywordCount {
	word: string;
	count: number;
}

function extractKeywords(text: string, removeStopWords: boolean): KeywordCount[] {
	const cleaned = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length >= 2);

	const filtered = removeStopWords ? cleaned.filter((w) => !STOP_WORDS.has(w)) : cleaned;

	const freq: Record<string, number> = {};
	for (const word of filtered) {
		freq[word] = (freq[word] || 0) + 1;
	}

	return Object.entries(freq)
		.map(([word, count]) => ({ word, count }))
		.sort((a, b) => b.count - a.count);
}

function toHashtag(word: string, style: StyleOption): string {
	switch (style) {
		case "lowercase":
			return word.toLowerCase();
		case "uppercase":
			return word.toUpperCase();
		case "camelCase":
			return word.charAt(0).toLowerCase() + word.slice(1);
		case "titleCase":
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		default:
			return word;
	}
}

function joinHashtags(hashtags: string[], separator: SeparatorOption): string {
	switch (separator) {
		case "spaces":
			return hashtags.join(" ");
		case "commas":
			return hashtags.join(", ");
		case "newline":
			return hashtags.join("\n");
		default:
			return hashtags.join(" ");
	}
}

export default function TextToHashtags() {
	const [text, setText] = useState("");
	const [maxHashtags, setMaxHashtags] = useState<MaxHashtags>(10);
	const [style, setStyle] = useState<StyleOption>("lowercase");
	const [separator, setSeparator] = useState<SeparatorOption>("spaces");
	const [removeStopWords, setRemoveStopWords] = useState(true);
	const [copied, setCopied] = useState(false);

	const keywords = useMemo(() => extractKeywords(text, removeStopWords), [text, removeStopWords]);

	const hashtags = useMemo(() => {
		const top = keywords.slice(0, maxHashtags);
		return top.map((kw) => `#${toHashtag(kw.word, style)}`);
	}, [keywords, maxHashtags, style]);

	const output = useMemo(() => joinHashtags(hashtags, separator), [hashtags, separator]);

	const handleCopy = useCallback(async () => {
		if (output) {
			await navigator.clipboard.writeText(output);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}, [output]);

	const handleSampleText = useCallback(() => {
		setText(SAMPLE_TEXT);
	}, []);

	return (
		<div>
			<div class="mb-4">
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Input Text</label>
					<button class="btn-secondary text-body-sm" onClick={handleSampleText}>
						Load Sample
					</button>
				</div>
				<textarea
					class="textarea"
					style="min-height: 160px"
					placeholder="Paste an article, blog post, or any text here..."
					value={text}
					onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div class="flex flex-wrap items-end gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Max Hashtags</label>
					<select
						class="input"
						style="width: auto; height: 40px"
						value={maxHashtags}
						onChange={(e) =>
							setMaxHashtags(Number((e.target as HTMLSelectElement).value) as MaxHashtags)
						}
					>
						{[5, 10, 15, 20, 30].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Style</label>
					<select
						class="input"
						style="width: auto; height: 40px"
						value={style}
						onChange={(e) => setStyle((e.target as HTMLSelectElement).value as StyleOption)}
					>
						<option value="lowercase">lowercase</option>
						<option value="uppercase">UPPERCASE</option>
						<option value="camelCase">camelCase</option>
						<option value="titleCase">Title Case</option>
					</select>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Separator</label>
					<select
						class="input"
						style="width: auto; height: 40px"
						value={separator}
						onChange={(e) => setSeparator((e.target as HTMLSelectElement).value as SeparatorOption)}
					>
						<option value="spaces">Spaces</option>
						<option value="commas">Commas</option>
						<option value="newline">Newline</option>
					</select>
				</div>

				<div>
					<label class="flex items-center gap-2 cursor-pointer" style="height: 40px">
						<input
							type="checkbox"
							checked={removeStopWords}
							onChange={(e) => setRemoveStopWords((e.target as HTMLInputElement).checked)}
						/>
						<span class="text-caption-uppercase text-muted">Remove stop words</span>
					</label>
				</div>
			</div>

			{text.trim() && keywords.length > 0 && (
				<div class="mb-4">
					<label class="text-caption-uppercase text-muted block mb-2">
						Top Keywords by Frequency
					</label>
					<div class="bg-surface-elevated rounded-lg p-3">
						<div class="flex flex-wrap gap-2">
							{keywords.slice(0, 30).map((kw) => (
								<span key={kw.word} class="badge badge-yellow" style="font-size: 12px">
									{kw.word} ({kw.count})
								</span>
							))}
						</div>
					</div>
				</div>
			)}

			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">
						Generated Hashtags {text.trim() ? `(${hashtags.length})` : ""}
					</label>
					{output && (
						<button
							class={copied ? "btn-secondary text-body-sm" : "btn-primary text-body-sm"}
							onClick={handleCopy}
						>
							{copied ? "✓ Copied!" : "Copy"}
						</button>
					)}
				</div>
				<textarea
					class="textarea code-block"
					style="min-height: 100px; font-family: var(--font-mono); font-size: 13px"
					value={output}
					readOnly
					placeholder="Hashtags will appear here..."
				/>
			</div>
		</div>
	);
}
