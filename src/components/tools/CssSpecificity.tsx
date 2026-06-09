import { useCallback, useEffect, useState } from "preact/hooks";

interface SpecificityScore {
	ids: number;
	classes: number;
	elements: number;
	matchedIds: string[];
	matchedClasses: string[];
	matchedAttributes: string[];
	matchedPseudoClasses: string[];
	matchedPseudoElements: string[];
	matchedElements: string[];
}

export default function CssSpecificity() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [selectorA, setSelectorA] = useState("ul#menu-primary > li.active a:hover::after");
	const [selectorB, setSelectorB] = useState("div.container .nav-item a");

	const [scoreA, setScoreA] = useState<SpecificityScore | null>(null);
	const [scoreB, setScoreB] = useState<SpecificityScore | null>(null);

	const t = {
		en: {
			title: "CSS Specificity Calculator",
			lblSelector: "CSS Selector",
			lblScore: "Specificity Score",
			colIds: "IDs",
			colClasses: "Classes, Attributes & Pseudo-classes",
			colElements: "Elements & Pseudo-elements",
			lblBreakdown: "Matched Tokens Breakdown",
			lblCompare: "Selector Override Comparison",
			winnerMsg: "Selector A overrides Selector B",
			loserMsg: "Selector B overrides Selector A",
			tieMsg:
				"Selectors have equal specificity. Cascade order (which rule appears last in the stylesheet) will determine precedence.",
			exTitle: "Preset Selectors",
		},
		vi: {
			title: "Bộ tính độ ưu tiên CSS (Specificity)",
			lblSelector: "Bộ chọn CSS (Selector)",
			lblScore: "Điểm độ ưu tiên (Specificity Score)",
			colIds: "Số lượng ID (A)",
			colClasses: "Số lượng Class, Attribute & Pseudo-class (B)",
			colElements: "Số lượng Element & Pseudo-element (C)",
			lblBreakdown: "Chi tiết các thẻ đóng góp",
			lblCompare: "So sánh độ ưu tiên bộ chọn",
			winnerMsg: "Bộ chọn A sẽ ghi đè (override) bộ chọn B",
			loserMsg: "Bộ chọn B sẽ ghi đè (override) bộ chọn A",
			tieMsg:
				"Hai bộ chọn có độ ưu tiên ngang nhau. Độ ưu tiên thực tế phụ thuộc vào thứ tự xuất hiện trong stylesheet (Cascade order).",
			exTitle: "Các ví dụ sẵn có",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const calculateSpecificity = (selector: string): SpecificityScore => {
		let ids = 0;
		let classes = 0;
		let elements = 0;

		let workingSelector = selector.trim();
		workingSelector = workingSelector.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove comments

		const matchedIds: string[] = [];
		const matchedClasses: string[] = [];
		const matchedAttributes: string[] = [];
		const matchedPseudoClasses: string[] = [];
		const matchedPseudoElements: string[] = [];
		const matchedElements: string[] = [];

		// Attributes [...]
		workingSelector = workingSelector.replace(/\[([^\]]+)\]/g, (match) => {
			classes++;
			matchedAttributes.push(match);
			return " ";
		});

		// Double-colon pseudo-elements
		workingSelector = workingSelector.replace(/::([a-zA-Z0-9_-]+)/g, (match) => {
			elements++;
			matchedPseudoElements.push(match);
			return " ";
		});

		// Legacy pseudo-elements
		const legacyPseudo = [":before", ":after", ":first-line", ":first-letter"];
		for (const lp of legacyPseudo) {
			if (workingSelector.includes(lp)) {
				workingSelector = workingSelector.replace(new RegExp(lp, "g"), () => {
					elements++;
					matchedPseudoElements.push(lp);
					return " ";
				});
			}
		}

		// IDs
		workingSelector = workingSelector.replace(/#([a-zA-Z0-9_-]+)/g, (match) => {
			ids++;
			matchedIds.push(match);
			return " ";
		});

		// Classes
		workingSelector = workingSelector.replace(/\.([a-zA-Z0-9_-]+)/g, (match) => {
			classes++;
			matchedClasses.push(match);
			return " ";
		});

		// Remaining pseudo-classes
		workingSelector = workingSelector.replace(/:([a-zA-Z0-9_-]+)/g, (match) => {
			classes++;
			matchedPseudoClasses.push(match);
			return " ";
		});

		// Remove combinators
		workingSelector = workingSelector.replace(/[\+>~\|]/g, " ");

		// Tokenize elements
		const tokens = workingSelector.split(/\s+/);
		for (const token of tokens) {
			const clean = token.trim();
			if (clean && /^[a-zA-Z0-9_-]+$/.test(clean) && clean !== "*") {
				elements++;
				matchedElements.push(clean);
			}
		}

		return {
			ids,
			classes,
			elements,
			matchedIds,
			matchedClasses,
			matchedAttributes,
			matchedPseudoClasses,
			matchedPseudoElements,
			matchedElements,
		};
	};

	const handleCalculate = useCallback(() => {
		setScoreA(calculateSpecificity(selectorA));
		setScoreB(calculateSpecificity(selectorB));
	}, [selectorA, selectorB]);

	useEffect(() => {
		handleCalculate();
	}, [handleCalculate]);

	// Compare which selector wins
	const getComparisonResult = (): "A" | "B" | "tie" => {
		if (!scoreA || !scoreB) return "tie";
		if (scoreA.ids !== scoreB.ids) {
			return scoreA.ids > scoreB.ids ? "A" : "B";
		}
		if (scoreA.classes !== scoreB.classes) {
			return scoreA.classes > scoreB.classes ? "A" : "B";
		}
		if (scoreA.elements !== scoreB.elements) {
			return scoreA.elements > scoreB.elements ? "A" : "B";
		}
		return "tie";
	};

	const compareResult = getComparisonResult();

	return (
		<div class="space-y-6">
			{/* Preset Examples */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex items-center flex-wrap gap-3">
				<span class="text-body-sm-strong text-muted">{t.exTitle}:</span>
				<button
					class="btn-secondary py-1 px-3 text-xs"
					onClick={() => {
						setSelectorA("ul#menu-primary > li.active a:hover::after");
						setSelectorB("div.container .nav-item a");
					}}
				>
					#1 Nested Menus
				</button>
				<button
					class="btn-secondary py-1 px-3 text-xs"
					onClick={() => {
						setSelectorA("form input[type='text']:focus");
						setSelectorB("input#user-name");
					}}
				>
					#2 Input States
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Selector A Panel */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block font-bold">Selector A</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm text-primary font-bold"
							value={selectorA}
							onInput={(e) => setSelectorA((e.target as HTMLInputElement).value)}
						/>
					</div>

					{scoreA && (
						<div class="space-y-4 pt-2 border-t border-hairline">
							<span class="text-xs text-muted font-bold uppercase block">{t.lblScore}</span>

							{/* Triple score indicators */}
							<div class="grid grid-cols-3 gap-3 font-mono text-center">
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">{t.colIds}</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreA.ids}</div>
								</div>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">Classes (B)</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreA.classes}</div>
								</div>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">Elements (C)</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreA.elements}</div>
								</div>
							</div>

							{/* Breakdown list */}
							<div class="space-y-2 pt-2 text-xs font-mono">
								<span class="text-xs text-muted font-bold uppercase block">{t.lblBreakdown}</span>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg space-y-2 text-ink">
									{scoreA.matchedIds.length > 0 && (
										<div>
											<span class="text-primary font-bold">IDs:</span>{" "}
											{scoreA.matchedIds.join(", ")}
										</div>
									)}
									{(scoreA.matchedClasses.length > 0 ||
										scoreA.matchedAttributes.length > 0 ||
										scoreA.matchedPseudoClasses.length > 0) && (
										<div>
											<span class="text-indigo-500 font-bold">Classes/Attrs/Pseudo:</span>{" "}
											{[
												...scoreA.matchedClasses,
												...scoreA.matchedAttributes,
												...scoreA.matchedPseudoClasses,
											].join(", ")}
										</div>
									)}
									{(scoreA.matchedElements.length > 0 ||
										scoreA.matchedPseudoElements.length > 0) && (
										<div>
											<span class="text-muted font-bold">Elements/Pseudos:</span>{" "}
											{[...scoreA.matchedElements, ...scoreA.matchedPseudoElements].join(", ")}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Selector B Panel */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="space-y-2">
						<label class="text-body-sm-strong text-ink block font-bold">Selector B</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm text-indigo-500 font-bold"
							value={selectorB}
							onInput={(e) => setSelectorB((e.target as HTMLInputElement).value)}
						/>
					</div>

					{scoreB && (
						<div class="space-y-4 pt-2 border-t border-hairline">
							<span class="text-xs text-muted font-bold uppercase block">{t.lblScore}</span>

							{/* Triple score indicators */}
							<div class="grid grid-cols-3 gap-3 font-mono text-center">
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">{t.colIds}</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreB.ids}</div>
								</div>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">Classes (B)</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreB.classes}</div>
								</div>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg">
									<div class="text-[10px] text-muted font-bold uppercase">Elements (C)</div>
									<div class="text-title-sm font-bold text-ink mt-1">{scoreB.elements}</div>
								</div>
							</div>

							{/* Breakdown list */}
							<div class="space-y-2 pt-2 text-xs font-mono">
								<span class="text-xs text-muted font-bold uppercase block">{t.lblBreakdown}</span>
								<div class="p-3 bg-surface-soft border border-hairline rounded-lg space-y-2 text-ink">
									{scoreB.matchedIds.length > 0 && (
										<div>
											<span class="text-primary font-bold">IDs:</span>{" "}
											{scoreB.matchedIds.join(", ")}
										</div>
									)}
									{(scoreB.matchedClasses.length > 0 ||
										scoreB.matchedAttributes.length > 0 ||
										scoreB.matchedPseudoClasses.length > 0) && (
										<div>
											<span class="text-indigo-500 font-bold">Classes/Attrs/Pseudo:</span>{" "}
											{[
												...scoreB.matchedClasses,
												...scoreB.matchedAttributes,
												...scoreB.matchedPseudoClasses,
											].join(", ")}
										</div>
									)}
									{(scoreB.matchedElements.length > 0 ||
										scoreB.matchedPseudoElements.length > 0) && (
										<div>
											<span class="text-muted font-bold">Elements/Pseudos:</span>{" "}
											{[...scoreB.matchedElements, ...scoreB.matchedPseudoElements].join(", ")}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Precedence comparison banner */}
			{scoreA && scoreB && (
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
					<h3 class="text-body-strong text-ink font-bold">{t.lblCompare}</h3>
					<div
						class={`p-4 rounded-lg text-sm font-bold text-center border ${
							compareResult === "A"
								? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
								: compareResult === "B"
									? "bg-primary/10 border-primary/20 text-primary"
									: "bg-surface-soft border-hairline text-ink"
						}`}
					>
						{compareResult === "A" ? t.winnerMsg : compareResult === "B" ? t.loserMsg : t.tieMsg}
					</div>
				</div>
			)}
		</div>
	);
}
