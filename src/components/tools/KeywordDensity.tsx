import { useEffect, useState } from "preact/hooks";

interface PhraseCount {
	phrase: string;
	count: number;
	density: number;
}

const STOPWORDS_EN = new Set([
	"the",
	"is",
	"and",
	"to",
	"in",
	"at",
	"of",
	"for",
	"a",
	"on",
	"that",
	"with",
	"as",
	"this",
	"it",
	"by",
	"an",
	"be",
	"are",
	"from",
	"your",
	"our",
	"you",
	"we",
	"i",
	"they",
	"he",
	"she",
	"it",
]);
const STOPWORDS_VI = new Set([
	"và",
	"là",
	"của",
	"để",
	"trong",
	"cho",
	"các",
	"được",
	"có",
	"tại",
	"một",
	"về",
	"những",
	"này",
	"khi",
	"như",
	"ra",
	"vào",
	"lên",
	"xuống",
	"đến",
	"đi",
	"lại",
	"với",
	"cho",
	"bởi",
	"vì",
]);

export default function KeywordDensity() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [inputText, setInputText] = useState(
		"Enter your article or webpage content text here to check for keywords density. Search engine optimization tools help analyze structural keywords to make sure text layout is optimal and not stuffed with repeated keywords.",
	);
	const [excludeStopwords, setExcludeStopwords] = useState(true);

	const [singleWords, setSingleWords] = useState<PhraseCount[]>([]);
	const [doubleWords, setDoubleWords] = useState<PhraseCount[]>([]);
	const [tripleWords, setTripleWords] = useState<PhraseCount[]>([]);
	const [totalWordCount, setTotalWordCount] = useState(0);

	const t = {
		en: {
			title: "Keyword Density Checker",
			desc: "Paste article body text to extract top single words, 2-grams, and 3-grams. High density (> 3.5%) is flagged as stuffing.",
			lblInput: "Paste Content Body Text",
			lblExclude: "Exclude common stopwords",
			lblResults: "Density Analysis",
			colWord: "Keyword / Phrase",
			colCount: "Count",
			colDensity: "Density",
			tabSingle: "Single Words",
			tabDouble: "2-Word Phrases",
			tabTriple: "3-Word Phrases",
			stuffed: "High (Potential Stuffing)",
			normal: "Normal",
			totalWords: "Total Word Count",
		},
		vi: {
			title: "Kiểm tra mật độ từ khóa",
			desc: "Dán đoạn văn bản nội dung để lọc các từ đơn, từ đôi, từ ba xuất hiện nhiều nhất. Mật độ cao (> 3.5%) sẽ cảnh báo spam.",
			lblInput: "Dán đoạn văn bản cần phân tích",
			lblExclude: "Loại bỏ hư từ thông dụng (Stopwords)",
			lblResults: "Phân tích mật độ từ khóa",
			colWord: "Từ khóa / Cụm từ",
			colCount: "Số lần",
			colDensity: "Mật độ",
			tabSingle: "Từ đơn",
			tabDouble: "Cụm 2 từ",
			tabTriple: "Cụm 3 từ",
			stuffed: "Quá cao (Cảnh báo nhồi nhét)",
			normal: "An toàn",
			totalWords: "Tổng số từ",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run text analytics
	useEffect(() => {
		// Clean and tokenize text
		const words = inputText
			.toLowerCase()
			.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n]/g, " ")
			.split(/\s+/)
			.filter((w) => w.length > 1);

		setTotalWordCount(words.length);
		if (words.length === 0) {
			setSingleWords([]);
			setDoubleWords([]);
			setTripleWords([]);
			return;
		}

		const stopwords = lang === "en" ? STOPWORDS_EN : STOPWORDS_VI;

		// 1-Gram (Single Words)
		const singlesMap: Record<string, number> = {};
		for (const w of words) {
			if (excludeStopwords && stopwords.has(w)) continue;
			singlesMap[w] = (singlesMap[w] || 0) + 1;
		}

		// 2-Gram
		const doublesMap: Record<string, number> = {};
		for (let i = 0; i < words.length - 1; i++) {
			const w1 = words[i];
			const w2 = words[i + 1];
			if (excludeStopwords && (stopwords.has(w1) || stopwords.has(w2))) continue;
			const key = `${w1} ${w2}`;
			doublesMap[key] = (doublesMap[key] || 0) + 1;
		}

		// 3-Gram
		const triplesMap: Record<string, number> = {};
		for (let i = 0; i < words.length - 2; i++) {
			const w1 = words[i];
			const w2 = words[i + 1];
			const w3 = words[i + 2];
			if (excludeStopwords && (stopwords.has(w1) || stopwords.has(w2) || stopwords.has(w3)))
				continue;
			const key = `${w1} ${w2} ${w3}`;
			triplesMap[key] = (triplesMap[key] || 0) + 1;
		}

		const mapToSortedList = (map: Record<string, number>): PhraseCount[] => {
			return Object.keys(map)
				.map((phrase) => ({
					phrase,
					count: map[phrase],
					density: Number(((map[phrase] / words.length) * 100).toFixed(2)),
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);
		};

		setSingleWords(mapToSortedList(singlesMap));
		setDoubleWords(mapToSortedList(doublesMap));
		setTripleWords(mapToSortedList(triplesMap));
	}, [inputText, excludeStopwords, lang]);

	const [activeTab, setActiveTab] = useState<"single" | "double" | "triple">("single");

	const getActiveList = () => {
		if (activeTab === "double") return doubleWords;
		if (activeTab === "triple") return tripleWords;
		return singleWords;
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Text Input Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<textarea
							class="input w-full h-80 text-body-sm font-sans"
							value={inputText}
							onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					<div class="flex items-center gap-2 pt-2 border-t border-hairline">
						<input
							type="checkbox"
							id="excludeStopwords"
							checked={excludeStopwords}
							onChange={(e) => setExcludeStopwords((e.target as HTMLInputElement).checked)}
							class="w-4 h-4 rounded text-primary focus:ring-primary"
						/>
						<label
							htmlFor="excludeStopwords"
							class="text-body-sm text-ink cursor-pointer select-none"
						>
							{t.lblExclude}
						</label>
					</div>
				</div>

				{/* Results Analytics Panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex justify-between items-center border-b border-hairline pb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.lblResults}</h3>
						<span class="text-xs text-muted">
							{t.totalWords}: <strong class="text-primary font-mono">{totalWordCount}</strong>
						</span>
					</div>

					{/* Unit Selection tabs */}
					<div class="flex gap-2 bg-surface-soft p-1 rounded-lg border border-hairline">
						{[
							{ key: "single", name: t.tabSingle },
							{ key: "double", name: t.tabDouble },
							{ key: "triple", name: t.tabTriple },
						].map((tabItem) => (
							<button
								key={tabItem.key}
								class={`flex-1 text-[11px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
									activeTab === tabItem.key
										? "bg-primary text-white shadow-sm"
										: "text-muted hover:text-ink"
								}`}
								onClick={() => setActiveTab(tabItem.key as "single" | "double" | "triple")}
							>
								{tabItem.name}
							</button>
						))}
					</div>

					{/* Table Grid */}
					<div class="border border-hairline rounded-lg overflow-hidden bg-surface-soft">
						<table class="w-full text-left text-body-sm border-collapse">
							<thead>
								<tr class="bg-surface-elevated text-ink font-bold border-b border-hairline">
									<th class="p-3">{t.colWord}</th>
									<th class="p-3 text-center">{t.colCount}</th>
									<th class="p-3 text-right">{t.colDensity}</th>
									<th class="p-3 text-center">Status</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-hairline">
								{getActiveList().length === 0 ? (
									<tr>
										<td colSpan={4} class="p-6 text-center text-muted italic">
											No keywords parsed.
										</td>
									</tr>
								) : (
									getActiveList().map((item, idx) => {
										const isStuffed = item.density > 3.5;
										return (
											<tr key={idx} class="hover:bg-surface-elevated/40">
												<td class="p-3 font-medium text-ink font-mono">{item.phrase}</td>
												<td class="p-3 text-center font-mono text-muted">{item.count}</td>
												<td class="p-3 text-right font-mono text-primary font-bold">
													{item.density}%
												</td>
												<td class="p-3 text-center">
													<span
														class={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
															isStuffed
																? "bg-accent-rose/10 text-accent-rose border border-accent-rose/20"
																: "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
														}`}
													>
														{isStuffed ? t.stuffed : t.normal}
													</span>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
