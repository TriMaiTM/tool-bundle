import { useEffect, useState } from "preact/hooks";

export default function SerpPreview() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [title, setTitle] = useState("My Awesome Website - SEO ToolBundle");
	const [desc, setDesc] = useState(
		"Discover high-quality, client-side web tools for development, design, and SEO audits on our online portal.",
	);
	const [url, setUrl] = useState("https://toolbundle.org/seo/serp-preview");
	const [showDate, setShowDate] = useState(false);
	const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const t = {
		en: {
			title: "SERP Preview Tool",
			desc: "Simulate how your webpage snippet will display in Google search results on desktop and mobile viewports.",
			lblTitle: "Meta Title",
			lblDesc: "Meta Description",
			lblUrl: "Page URL",
			lblOptions: "Options",
			optDate: "Include date in description snippet",
			lblDesktop: "Desktop View",
			lblMobile: "Mobile View",
			copied: "Copied!",
			copy: "Copy",
			characters: "characters",
		},
		vi: {
			title: "Giả lập kết quả Google SERP",
			desc: "Mô phỏng cách hiển thị của thẻ tiêu đề và mô tả của website trên kết quả tìm kiếm Google (máy tính và điện thoại).",
			lblTitle: "Tiêu đề Meta Title",
			lblDesc: "Mô tả Meta Description",
			lblUrl: "Đường dẫn URL",
			lblOptions: "Tùy chọn hiển thị",
			optDate: "Hiển thị ngày tháng trong mô tả",
			lblDesktop: "Giao diện máy tính",
			lblMobile: "Giao diện điện thoại",
			copied: "Đã chép!",
			copy: "Sao chép",
			characters: "ký tự",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleCopy = (val: string, field: string) => {
		navigator.clipboard.writeText(val);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 1500);
	};

	const formattedDate = new Date().toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// Get domain and breadcrumb structure
	const getUrlParts = () => {
		try {
			let cleanUrl = url.trim();
			if (!/^https?:\/\//i.test(cleanUrl)) {
				cleanUrl = `https://${cleanUrl}`;
			}
			const parsed = new URL(cleanUrl);
			return {
				domain: parsed.hostname,
				path: parsed.pathname
					.replace(/^\/|\/$/g, "")
					.split("/")
					.join(" › "),
			};
		} catch (e) {
			return { domain: "domain.com", path: "page" };
		}
	};

	const { domain, path } = getUrlParts();

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						viewMode === "desktop"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setViewMode("desktop")}
				>
					{t.lblDesktop}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						viewMode === "mobile"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setViewMode("mobile")}
				>
					{t.lblMobile}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Left Controllers panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Title input */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-xs">
							<label class="text-ink font-bold">{t.lblTitle}</label>
							<span
								class={`font-mono ${title.length > 60 ? "text-accent-rose font-bold" : "text-muted"}`}
							>
								{title.length} / 60 {t.characters}
							</span>
						</div>
						<div class="flex gap-2">
							<input
								type="text"
								class="input w-full"
								value={title}
								onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
							/>
							<button class="btn-secondary text-xs px-3" onClick={() => handleCopy(title, "title")}>
								{copiedField === "title" ? t.copied : t.copy}
							</button>
						</div>
					</div>

					{/* Description input */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-xs">
							<label class="text-ink font-bold">{t.lblDesc}</label>
							<span
								class={`font-mono ${desc.length > 160 ? "text-accent-rose font-bold" : "text-muted"}`}
							>
								{desc.length} / 160 {t.characters}
							</span>
						</div>
						<div class="flex gap-2">
							<textarea
								class="input w-full h-24 text-body-sm"
								value={desc}
								onInput={(e) => setDesc((e.target as HTMLTextAreaElement).value)}
							/>
							<button
								class="btn-secondary text-xs px-3 align-top"
								onClick={() => handleCopy(desc, "desc")}
							>
								{copiedField === "desc" ? t.copied : t.copy}
							</button>
						</div>
					</div>

					{/* URL Input */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblUrl}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={url}
							onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Options check */}
					<div class="border-t border-hairline pt-3 flex items-center gap-2">
						<input
							type="checkbox"
							id="showDate"
							checked={showDate}
							onChange={(e) => setShowDate((e.target as HTMLInputElement).checked)}
							class="w-4 h-4 rounded text-primary focus:ring-primary"
						/>
						<label htmlFor="showDate" class="text-body-sm text-ink cursor-pointer select-none">
							{t.optDate}
						</label>
					</div>
				</div>

				{/* Right Preview panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						Preview ({viewMode === "desktop" ? "Desktop" : "Mobile"})
					</h3>

					{viewMode === "desktop" ? (
						/* Desktop Mockup */
						<div class="bg-surface border border-hairline rounded-lg p-6 font-sans text-left space-y-1.5 shadow-xs max-w-2xl">
							{/* Domain URL bar */}
							<div class="text-[14px] text-[#202124] flex items-center gap-1 leading-normal">
								<span class="truncate">{domain}</span>
								{path && <span class="text-muted text-[12px]"> › {path}</span>}
							</div>
							{/* Title link */}
							<div class="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight font-medium font-sans">
								{title.substring(0, 70)}
							</div>
							{/* Snippet */}
							<div class="text-[14px] text-[#4d5156] leading-relaxed font-sans">
								{showDate && <span class="text-[#70757a] text-[13px] mr-1">{formattedDate} —</span>}
								{desc.substring(0, 160)}
							</div>
						</div>
					) : (
						/* Mobile Mockup */
						<div class="bg-surface border border-hairline rounded-lg p-4 font-sans text-left space-y-1 shadow-xs max-w-sm mx-auto">
							{/* Mobile domain details */}
							<div class="flex items-center gap-2 text-[12px] text-[#202124]">
								<div class="w-6 h-6 rounded-full bg-surface-soft border border-hairline flex items-center justify-center font-bold text-muted text-[10px]">
									{domain.charAt(0).toUpperCase()}
								</div>
								<div>
									<div class="font-bold leading-none">{domain}</div>
									<div class="text-[10px] text-[#70757a] font-mono leading-tight">{url}</div>
								</div>
							</div>
							{/* Title */}
							<div class="text-[18px] text-[#1a0dab] hover:underline cursor-pointer leading-normal font-sans pt-1">
								{title}
							</div>
							{/* Snippet */}
							<div class="text-[12px] text-[#4d5156] leading-relaxed font-sans">
								{showDate && <span class="text-[#70757a] text-[11px] mr-1">{formattedDate} —</span>}
								{desc}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
