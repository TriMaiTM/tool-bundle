import { useEffect, useState } from "preact/hooks";

interface TitlePreset {
	type: "list" | "guide" | "question" | "catchy";
	template: string;
	templateVi: string;
}

const TITLE_TEMPLATES: TitlePreset[] = [
	{
		type: "list",
		template: "10 Simple Ways to Master [Keyword] for [Audience]",
		templateVi: "10 Cách Đơn Giản Để Làm Chủ [Keyword] Cho [Audience]",
	},
	{
		type: "list",
		template: "7 Secrets About [Keyword] That Experts Hide",
		templateVi: "7 Bí Mật Về [Keyword] Mà Các Chuyên Gia Thường Giấu",
	},
	{
		type: "list",
		template: "5 Common Mistakes in [Keyword] and How to Avoid Them",
		templateVi: "5 Sai Lầm Thường Gặp Khi [Keyword] Và Cách Khắc Phục",
	},
	{
		type: "list",
		template: "12 Best [Keyword] Tools Every [Audience] Needs",
		templateVi: "12 Công Cụ [Keyword] Tốt Nhất Mọi [Audience] Đều Cần",
	},

	{
		type: "guide",
		template: "The Ultimate Step-by-Step Guide to [Keyword]",
		templateVi: "Hướng Dẫn Từng Bước A-Z Về [Keyword] Hiệu Quả",
	},
	{
		type: "guide",
		template: "How to Build a Successful [Keyword] Strategy from Scratch",
		templateVi: "Cách Xây Dựng Chiến Lược [Keyword] Thành Công Từ Con Số 0",
	},
	{
		type: "guide",
		template: "[Keyword] 101: A Beginner's Guide for [Audience]",
		templateVi: "[Keyword] Nhập Môn: Hướng Dẫn Cho [Audience]",
	},
	{
		type: "guide",
		template: "Mastering [Keyword]: Tips and Best Practices",
		templateVi: "Làm Chủ [Keyword]: Mẹo Và Phương Pháp Thực Thi Tốt Nhất",
	},

	{
		type: "question",
		template: "Why is [Keyword] So Important for [Audience] Today?",
		templateVi: "Tại Sao [Keyword] Lại Cực Kỳ Quan Trọng Với [Audience] Hiện Nay?",
	},
	{
		type: "question",
		template: "Is [Keyword] Still Worth It in 2026?",
		templateVi: "[Keyword] Có Còn Thực Sự Đáng Giá Trong Năm 2026?",
	},
	{
		type: "question",
		template: "What No One Tells You About [Keyword]",
		templateVi: "Điều Không Ai Nói Cho Bạn Biết Về [Keyword]",
	},
	{
		type: "question",
		template: "How Does [Keyword] Affect Your Business Growth?",
		templateVi: "[Keyword] Ảnh Hưởng Thế Nào Đến Tăng Trưởng Doanh Nghiệp?",
	},

	{
		type: "catchy",
		template: "The Shocking Truth About [Keyword] Exposed",
		templateVi: "Sự Thật Bất Ngờ Về [Keyword] Vừa Được Tiết Lộ",
	},
	{
		type: "catchy",
		template: "Boost Your Sales Fast Using These [Keyword] Hacks",
		templateVi: "Tăng Doanh Số Cực Nhanh Bằng Các Mẹo [Keyword] Này",
	},
	{
		type: "catchy",
		template: "Unlocking the Hidden Power of [Keyword]",
		templateVi: "Khai Phá Sức Mạnh Ẩn Giấu Của [Keyword]",
	},
	{
		type: "catchy",
		template: "Transform Your Skills: The [Keyword] Revolution",
		templateVi: "Thay Đổi Kỹ Năng Của Bạn: Cuộc Cách Mạng [Keyword]",
	},
];

export default function BlogTitleGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [keyword, setKeyword] = useState("Digital Marketing");
	const [audience, setAudience] = useState("Beginners");
	const [activeTab, setActiveTab] = useState<"list" | "guide" | "question" | "catchy">("list");
	const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
	const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);

	const t = {
		en: {
			title: "SEO Blog Title Generator",
			desc: "Enter target keywords and audience definitions to instantly compile 20+ catchy, high-CTR article titles.",
			lblKeyword: "Target Keyword / Topic",
			lblAudience: "Target Audience (optional)",
			lblResults: "Catchy Title Gợi ý",
			copied: "Copied!",
			copy: "Copy Title",
			tabList: "Listicles",
			tabGuide: "How-tos & Guides",
			tabQuestion: "Questions",
			tabCatchy: "Clickbaits & Catchy",
		},
		vi: {
			title: "Sinh tiêu đề bài viết blog SEO",
			desc: "Nhập từ khóa chủ đề và đối tượng mục tiêu để tự động tạo ra hơn 20 tiêu đề bài viết blog thu hút, tăng tỷ lệ nhấp chuột CTR.",
			lblKeyword: "Từ khóa chủ đề",
			lblAudience: "Đối tượng độc giả hướng tới",
			lblResults: "Ý tưởng tiêu đề hấp dẫn",
			copied: "Đã chép!",
			copy: "Sao chép",
			tabList: "Dạng danh sách",
			tabGuide: "Dạng hướng dẫn",
			tabQuestion: "Dạng câu hỏi",
			tabCatchy: "Tạo sự tò mò",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generate titles based on active tab and inputs
	useEffect(() => {
		const keyVal = keyword.trim() || (lang === "en" ? "SEO" : "Làm SEO");
		const audVal = audience.trim() || (lang === "en" ? "Beginners" : "Người mới");

		const filtered = TITLE_TEMPLATES.filter((tpl) => tpl.type === activeTab);
		const result = filtered.map((tpl) => {
			const text = lang === "en" ? tpl.template : tpl.templateVi;
			return text.replace(/\[Keyword\]/gi, keyVal).replace(/\[Audience\]/gi, audVal);
		});

		setGeneratedTitles(result);
	}, [keyword, audience, activeTab, lang]);

	const handleCopy = (text: string, idx: number) => {
		navigator.clipboard.writeText(text);
		setCopiedIdx(idx);
		setTimeout(() => setCopiedIdx(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Keyword input */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblKeyword}</label>
						<input
							type="text"
							class="input w-full"
							value={keyword}
							onInput={(e) => setKeyword((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Audience input */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblAudience}</label>
						<input
							type="text"
							class="input w-full"
							value={audience}
							onInput={(e) => setAudience((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>

				{/* Title lists panel */}
				<div class="lg:col-span-7 space-y-4">
					{/* Navigation category tabs */}
					<div class="flex gap-1.5 bg-surface-soft p-1 rounded-lg border border-hairline">
						{[
							{ key: "list", name: t.tabList },
							{ key: "guide", name: t.tabGuide },
							{ key: "question", name: t.tabQuestion },
							{ key: "catchy", name: t.tabCatchy },
						].map((item) => (
							<button
								key={item.key}
								class={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
									activeTab === item.key
										? "bg-primary text-white shadow-sm"
										: "text-muted hover:text-ink"
								}`}
								onClick={() => setActiveTab(item.key as "list" | "guide" | "question" | "catchy")}
							>
								{item.name}
							</button>
						))}
					</div>

					{/* Results list */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h3>

						<div class="space-y-2">
							{generatedTitles.map((titleText, idx) => (
								<div
									key={idx}
									class="flex items-center justify-between bg-surface-soft p-3 rounded-lg border border-hairline hover:border-primary/30 transition-all gap-4"
								>
									<span class="text-body-sm font-semibold text-ink leading-relaxed">
										{titleText}
									</span>

									<button
										class="btn-secondary text-[10px] py-1.5 px-3 whitespace-nowrap shrink-0"
										onClick={() => handleCopy(titleText, idx)}
									>
										{copiedIdx === idx ? t.copied : t.copy}
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
