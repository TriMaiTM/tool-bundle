import { useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type SocialType = "facebook" | "linkedin" | "discord";

export default function OgPreview() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [tab, setTab] = useState<SocialType>("facebook");

	// Input states
	const [title, setTitle] = useState("Open Graph Preview Tool - SEO Utilities");
	const [desc, setDesc] = useState(
		"Simulate and audit how your webpage looks when shared on Facebook, LinkedIn, and Discord card previews.",
	);
	const [siteName, setSiteName] = useState("ToolBundle");
	const [url, setUrl] = useState("https://toolbundle.org");
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Open Graph (OG) Previewer",
			desc: "Enter social metadata details or upload a mockup image to preview the rich media card layouts.",
			lblTitle: "OG Title",
			lblDesc: "OG Description",
			lblSite: "OG Site Name",
			lblUrl: "Page URL",
			lblImage: "Card Image",
			dropzoneLabel: "Drop image to simulate social sharing card",
			dropzoneSub: "Supports JPG, PNG up to 5MB",
			lblCode: "Generated OG Tags",
			copied: "Copied!",
			copy: "Copy Tags",
			btnResetImage: "Remove Image",
		},
		vi: {
			title: "Xem trước Open Graph (OG)",
			desc: "Nhập các thẻ siêu dữ liệu xã hội hoặc tải lên ảnh xem trước để giả lập hiển thị khi chia sẻ link.",
			lblTitle: "Tiêu đề (og:title)",
			lblDesc: "Mô tả (og:description)",
			lblSite: "Tên website (og:site_name)",
			lblUrl: "Đường dẫn URL",
			lblImage: "Ảnh xem trước",
			dropzoneLabel: "Thả hình ảnh vào đây để xem thử",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG tới 5MB",
			lblCode: "Mã thẻ OG tương ứng",
			copied: "Đã chép!",
			copy: "Sao chép mã",
			btnResetImage: "Xóa hình ảnh",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const getDomain = () => {
		try {
			let cleanUrl = url.trim();
			if (!/^https?:\/\//i.test(cleanUrl)) {
				cleanUrl = `https://${cleanUrl}`;
			}
			return new URL(cleanUrl).hostname;
		} catch (e) {
			return "domain.com";
		}
	};
	const domain = getDomain();

	const handleFiles = (files: File[]) => {
		if (files[0]) {
			const src = URL.createObjectURL(files[0]);
			setImageSrc(src);
		}
	};

	const generateOgTags = () => {
		return `<meta property="og:title" content="${title}" />\n<meta property="og:description" content="${desc}" />\n<meta property="og:site_name" content="${siteName}" />\n<meta property="og:url" content="${url}" />\n<meta property="og:type" content="website" />`;
	};

	const copyTags = () => {
		navigator.clipboard.writeText(generateOgTags());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div class="space-y-6">
			{/* Preview type selection tabs */}
			<div class="flex border-b border-hairline gap-4">
				{(["facebook", "linkedin", "discord"] as const).map((social) => (
					<button
						key={social}
						class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all capitalize ${
							tab === social
								? "border-primary text-primary"
								: "border-transparent text-muted hover:text-ink"
						}`}
						onClick={() => setTab(social)}
					>
						{social}
					</button>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Controllers Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Title */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblTitle}</label>
						<input
							type="text"
							class="input w-full"
							value={title}
							onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Description */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblDesc}</label>
						<textarea
							class="input w-full h-20 text-body-sm"
							value={desc}
							onInput={(e) => setDesc((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Site name */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblSite}</label>
						<input
							type="text"
							class="input w-full"
							value={siteName}
							onInput={(e) => setSiteName((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* URL */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblUrl}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={url}
							onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Mockup Card image */}
					<div class="space-y-2 pt-2 border-t border-hairline">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink block">{t.lblImage}</label>
							{imageSrc && (
								<button
									class="text-xs text-accent-rose font-bold"
									onClick={() => setImageSrc(null)}
								>
									{t.btnResetImage}
								</button>
							)}
						</div>

						{!imageSrc ? (
							<FileDropZone
								accept="image/*"
								onFiles={handleFiles}
								label={t.dropzoneLabel}
								sublabel={t.dropzoneSub}
							/>
						) : (
							<div class="aspect-video rounded-lg overflow-hidden border border-hairline bg-surface-soft">
								<img src={imageSrc} alt="Preview thumbnail" class="w-full h-full object-cover" />
							</div>
						)}
					</div>
				</div>

				{/* Preview Renderers and Code Output panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Interactive social cards */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							Preview Card Layout
						</h3>

						{tab === "facebook" && (
							/* Facebook Preview */
							<div class="bg-[#f0f2f5] border border-hairline rounded-lg overflow-hidden max-w-md mx-auto shadow-xs text-left">
								{/* Card Image Area */}
								<div class="aspect-video bg-stone-medium flex items-center justify-center border-b border-hairline relative">
									{imageSrc ? (
										<img src={imageSrc} alt="Shared thumbnail" class="w-full h-full object-cover" />
									) : (
										<span class="text-muted text-xs font-mono">1200 × 630 px</span>
									)}
								</div>
								{/* Meta Info bar */}
								<div class="bg-[#ffffff] p-3 space-y-1">
									<div class="text-[12px] uppercase text-[#606770] font-mono leading-none tracking-wider truncate">
										{domain}
									</div>
									<div class="text-[16px] font-bold text-[#1c1e21] leading-snug truncate">
										{title}
									</div>
									<div class="text-[14px] text-[#606770] leading-snug line-clamp-2">{desc}</div>
								</div>
							</div>
						)}

						{tab === "linkedin" && (
							/* LinkedIn Preview */
							<div class="bg-[#ffffff] border border-hairline rounded-lg overflow-hidden max-w-md mx-auto shadow-xs text-left">
								{/* Card Image Area */}
								<div class="aspect-video bg-stone-medium flex items-center justify-center border-b border-hairline">
									{imageSrc ? (
										<img src={imageSrc} alt="Shared thumbnail" class="w-full h-full object-cover" />
									) : (
										<span class="text-muted text-xs font-mono">1200 × 627 px</span>
									)}
								</div>
								{/* Metadata bar */}
								<div class="p-3 space-y-1 bg-[#f3f6f8]">
									<div class="text-[14px] font-bold text-[#000000e6] leading-snug line-clamp-1">
										{title}
									</div>
									<div class="text-[12px] text-[#00000099] leading-none truncate">{domain}</div>
								</div>
							</div>
						)}

						{tab === "discord" && (
							/* Discord Dark theme preview */
							<div class="bg-[#2f3136] rounded-lg border-l-4 border-[#00d4b2] p-4 max-w-md mx-auto text-left shadow-md space-y-2">
								<div class="text-[12px] text-[#dcddde] font-medium leading-none">{siteName}</div>
								<div class="text-[16px] font-semibold text-[#00b0f4] hover:underline cursor-pointer leading-tight">
									{title}
								</div>
								<div class="text-[14px] text-[#b9bbbe] leading-relaxed line-clamp-3">{desc}</div>
								{/* Shared Image */}
								{imageSrc && (
									<div class="rounded overflow-hidden aspect-video border border-[#202225] mt-2 max-h-48 bg-[#202225]">
										<img
											src={imageSrc}
											alt="Discord card preview"
											class="w-full h-full object-cover"
										/>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Code tags exporter */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblCode}
						</h3>

						<div class="flex gap-2">
							<textarea
								readOnly
								class="input w-full h-32 font-mono text-xs bg-surface-soft"
								value={generateOgTags()}
							/>
							<button class="btn-secondary text-xs px-3 align-top py-2" onClick={copyTags}>
								{copied ? t.copied : t.copy}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
