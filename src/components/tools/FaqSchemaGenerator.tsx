import { useEffect, useState } from "preact/hooks";

interface FaqItem {
	question: string;
	answer: string;
}

export default function FaqSchemaGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [faqList, setFaqList] = useState<FaqItem[]>([
		{
			question: "What is search engine optimization?",
			answer:
				"SEO stands for search engine optimization, which is the process of improving site visibility.",
		},
		{
			question: "How long does SEO take to work?",
			answer:
				"SEO usually takes 3 to 6 months to start showing noticeable results depending on keyword difficulty.",
		},
	]);

	const [newQuestion, setNewQuestion] = useState("");
	const [newAnswer, setNewAnswer] = useState("");
	const [copied, setCopied] = useState<"json" | "html" | null>(null);

	const t = {
		en: {
			title: "JSON-LD FAQ Schema Generator",
			desc: "Build Google-compatible FAQ structured schema block by filling in questions and answers. Generates both JSON-LD and HTML formats.",
			lblAdd: "Add Question & Answer",
			lblQ: "Question",
			lblA: "Answer",
			btnAdd: "Add FAQ Item",
			lblResults: "Generated FAQ Formats",
			lblJson: "JSON-LD Schema Script",
			lblHtml: "HTML Accordion Code",
			copied: "Copied!",
			copy: "Copy Code",
			empty: "Add questions and answers to generate FAQ code.",
		},
		vi: {
			title: "Tạo Schema câu hỏi thường gặp (FAQ)",
			desc: "Xây dựng khối dữ liệu cấu trúc FAQ tương thích của Google bằng cách điền danh sách câu hỏi và trả lời. Hỗ trợ xuất cả JSON-LD và HTML.",
			lblAdd: "Thêm Câu hỏi & Câu trả lời",
			lblQ: "Câu hỏi",
			lblA: "Câu trả lời",
			btnAdd: "Thêm vào danh sách",
			lblResults: "Mã FAQ tạo được",
			lblJson: "Mã cấu trúc JSON-LD",
			lblHtml: "Mã nguồn HTML Accordion",
			copied: "Đã chép!",
			copy: "Sao chép mã",
			empty: "Hãy thêm các câu hỏi và câu trả lời để bắt đầu sinh mã.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const addFaqItem = () => {
		if (newQuestion.trim() && newAnswer.trim()) {
			setFaqList((prev) => [...prev, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
			setNewQuestion("");
			setNewAnswer("");
		}
	};

	const removeFaqItem = (idx: number) => {
		setFaqList((prev) => prev.filter((_, i) => i !== idx));
	};

	const generateJsonLd = () => {
		if (faqList.length === 0) return "";
		const schema = {
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: faqList.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: item.answer,
				},
			})),
		};

		return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
	};

	const generateHtml = () => {
		if (faqList.length === 0) return "";
		return faqList
			.map(
				(item) =>
					`<details class="faq-item">\n  <summary class="faq-question">${item.question}</summary>\n  <p class="faq-answer">${item.answer}</p>\n</details>`,
			)
			.join("\n\n");
	};

	const handleCopy = (codeText: string, typeStr: "json" | "html") => {
		navigator.clipboard.writeText(codeText);
		setCopied(typeStr);
		setTimeout(() => setCopied(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input controllers panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Add form */}
					<div class="space-y-3 pt-2">
						<span class="text-body-sm-strong text-ink block">{t.lblAdd}</span>
						<div class="space-y-2">
							<input
								type="text"
								class="input w-full text-body-sm"
								placeholder={t.lblQ}
								value={newQuestion}
								onInput={(e) => setNewQuestion((e.target as HTMLInputElement).value)}
							/>
							<textarea
								class="input w-full h-20 text-body-sm"
								placeholder={t.lblA}
								value={newAnswer}
								onInput={(e) => setNewAnswer((e.target as HTMLTextAreaElement).value)}
							/>
							<button class="btn-primary w-full py-2" onClick={addFaqItem}>
								{t.btnAdd}
							</button>
						</div>
					</div>

					{/* Manage list */}
					{faqList.length > 0 && (
						<div class="border-t border-hairline pt-3 space-y-2">
							<span class="text-body-xs font-bold text-ink block">Manage Items</span>
							<div class="space-y-2 max-h-48 overflow-y-auto">
								{faqList.map((item, idx) => (
									<div
										key={idx}
										class="flex items-center justify-between bg-surface-soft p-2.5 rounded border border-hairline gap-4"
									>
										<div class="truncate text-body-xs">
											<span class="font-bold text-ink block truncate">{item.question}</span>
											<span class="text-muted block truncate">{item.answer}</span>
										</div>
										<button
											class="text-xs text-accent-rose font-bold shrink-0"
											onClick={() => removeFaqItem(idx)}
										>
											{lang === "en" ? "Remove" : "Xóa"}
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Code Output panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-6">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{faqList.length === 0 ? (
						<div class="text-center py-12 text-muted text-body-sm italic">{t.empty}</div>
					) : (
						<div class="space-y-6">
							{/* JSON-LD Output */}
							<div class="space-y-1.5">
								<label class="text-caption-uppercase text-muted block">{t.lblJson}</label>
								<div class="flex gap-2">
									<textarea
										readOnly
										class="input w-full h-44 font-mono text-xs bg-surface-soft"
										value={generateJsonLd()}
									/>
									<button
										class="btn-secondary text-xs px-3 align-top py-2"
										onClick={() => handleCopy(generateJsonLd(), "json")}
									>
										{copied === "json" ? t.copied : t.copy}
									</button>
								</div>
							</div>

							{/* HTML Output */}
							<div class="space-y-1.5 pt-4 border-t border-hairline">
								<label class="text-caption-uppercase text-muted block">{t.lblHtml}</label>
								<div class="flex gap-2">
									<textarea
										readOnly
										class="input w-full h-44 font-mono text-xs bg-surface-soft"
										value={generateHtml()}
									/>
									<button
										class="btn-secondary text-xs px-3 align-top py-2"
										onClick={() => handleCopy(generateHtml(), "html")}
									>
										{copied === "html" ? t.copied : t.copy}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
