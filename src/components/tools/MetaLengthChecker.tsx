import { useEffect, useState } from "preact/hooks";

export default function MetaLengthChecker() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [title, setTitle] = useState("Awesome Title For SEO Audits");
	const [desc, setDesc] = useState(
		"Enter your description copy here to verify if it cuts off in search result layouts.",
	);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const t = {
		en: {
			title: "Meta Length Validator",
			desc: "Write and optimize your page metadata fields. Visual bars warn when text exceeds Google limits.",
			lblTitle: "Meta Title Target (Ideal: 30-60 chars)",
			lblDesc: "Meta Description Target (Ideal: 110-160 chars)",
			lblPreview: "Cutoff Search Engine View Mockup",
			copied: "Copied!",
			copy: "Copy",
			statusShort: "Too Short",
			statusIdeal: "Optimal Length",
			statusLong: "Too Long (Will cut off)",
		},
		vi: {
			title: "Đo độ dài thẻ Meta SEO",
			desc: "Viết và tối ưu hóa các tiêu đề, mô tả của bạn. Biểu đồ cảnh báo khi độ dài vượt quá giới hạn hiển thị của Google.",
			lblTitle: "Tiêu đề Meta Title (Chuẩn: 30-60 ký tự)",
			lblDesc: "Mô tả Meta Description (Chuẩn: 110-160 ký tự)",
			lblPreview: "Mô phỏng hiển thị bị cắt ngắn",
			copied: "Đã chép!",
			copy: "Sao chép",
			statusShort: "Quá ngắn",
			statusIdeal: "Độ dài tối ưu",
			statusLong: "Quá dài (Sẽ bị cắt bớt)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleCopy = (text: string, field: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 1500);
	};

	const getTitleStatus = () => {
		const len = title.length;
		if (len < 30)
			return {
				label: t.statusShort,
				color: "bg-accent-amber text-ink",
				progressColor: "bg-accent-amber",
			};
		if (len <= 60)
			return {
				label: t.statusIdeal,
				color: "bg-accent-emerald text-white",
				progressColor: "bg-accent-emerald",
			};
		return {
			label: t.statusLong,
			color: "bg-accent-rose text-white",
			progressColor: "bg-accent-rose",
		};
	};

	const getDescStatus = () => {
		const len = desc.length;
		if (len < 110)
			return {
				label: t.statusShort,
				color: "bg-accent-amber text-ink",
				progressColor: "bg-accent-amber",
			};
		if (len <= 160)
			return {
				label: t.statusIdeal,
				color: "bg-accent-emerald text-white",
				progressColor: "bg-accent-emerald",
			};
		return {
			label: t.statusLong,
			color: "bg-accent-rose text-white",
			progressColor: "bg-accent-rose",
		};
	};

	const titleStat = getTitleStatus();
	const descStat = getDescStatus();

	// Calculate truncated values for visual snippet mockup
	const truncatedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
	const truncatedDesc = desc.length > 160 ? `${desc.substring(0, 157)}...` : desc;

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Writing inputs panel */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
					<div class="space-y-1">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.title}
						</h3>
						<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
					</div>

					{/* Title checker */}
					<div class="space-y-2">
						<div class="flex justify-between items-center text-body-xs">
							<span class="text-ink font-bold">{t.lblTitle}</span>
							<span class="font-mono text-muted">{title.length} chars</span>
						</div>
						<div class="flex gap-2">
							<input
								type="text"
								class="input w-full font-sans"
								value={title}
								onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
							/>
							<button class="btn-secondary text-xs px-3" onClick={() => handleCopy(title, "title")}>
								{copiedField === "title" ? t.copied : t.copy}
							</button>
						</div>
						{/* Progress bar */}
						<div class="space-y-1">
							<div class="w-full bg-surface-soft h-2 rounded-full overflow-hidden border border-hairline">
								<div
									class={`h-full transition-all duration-300 ${titleStat.progressColor}`}
									style={{ width: `${Math.min(100, (title.length / 60) * 100)}%` }}
								/>
							</div>
							<span class={`text-[9px] font-bold px-1.5 py-0.5 rounded ${titleStat.color}`}>
								{titleStat.label}
							</span>
						</div>
					</div>

					{/* Description checker */}
					<div class="space-y-2 pt-2 border-t border-hairline">
						<div class="flex justify-between items-center text-body-xs">
							<span class="text-ink font-bold">{t.lblDesc}</span>
							<span class="font-mono text-muted">{desc.length} chars</span>
						</div>
						<div class="flex gap-2">
							<textarea
								class="input w-full h-24 text-body-sm font-sans"
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
						{/* Progress bar */}
						<div class="space-y-1">
							<div class="w-full bg-surface-soft h-2 rounded-full overflow-hidden border border-hairline">
								<div
									class={`h-full transition-all duration-300 ${descStat.progressColor}`}
									style={{ width: `${Math.min(100, (desc.length / 160) * 100)}%` }}
								/>
							</div>
							<span class={`text-[9px] font-bold px-1.5 py-0.5 rounded ${descStat.color}`}>
								{descStat.label}
							</span>
						</div>
					</div>
				</div>

				{/* Google Snippet Preview Mockup */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblPreview}
					</h3>

					<div class="bg-surface border border-hairline rounded-lg p-6 font-sans text-left space-y-1.5 shadow-xs">
						<div class="text-[14px] text-[#202124] leading-normal font-sans">
							example.com › blog
						</div>
						<div class="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight font-medium font-sans">
							{truncatedTitle}
						</div>
						<div class="text-[14px] text-[#4d5156] leading-relaxed font-sans">{truncatedDesc}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
