import { useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type TwitterCardType = "summary" | "summary_large_image";

export default function TwitterCardPreview() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [cardType, setCardType] = useState<TwitterCardType>("summary_large_image");

	// Input states
	const [title, setTitle] = useState("Twitter Card Previewer - Interactive SEO Auditor");
	const [desc, setDesc] = useState(
		"Make your tweets stand out! Audit title layouts, description clampings, and image alignments for social feeds.",
	);
	const [siteHandle, setSiteHandle] = useState("@toolbundle");
	const [url, setUrl] = useState("https://toolbundle.org");
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Twitter Card Previewer",
			desc: "Test Twitter/X meta tags. Optimize the appearance of shared links with responsive layout viewports.",
			lblCardType: "Card Layout Type",
			lblTitle: "Twitter Card Title",
			lblDesc: "Twitter Card Description",
			lblSite: "Twitter Site Handle",
			lblUrl: "Page URL",
			lblImage: "Mockup Card Image",
			dropzoneLabel: "Drop image to simulate Twitter Card",
			dropzoneSub: "Supports JPG, PNG up to 5MB",
			lblCode: "Generated Twitter Meta Tags",
			copied: "Copied!",
			copy: "Copy Tags",
			btnResetImage: "Remove Image",
			summaryText: "Summary Card (Square Left Thumbnail)",
			largeText: "Summary with Large Image (Full width)",
		},
		vi: {
			title: "Xem trước Twitter Card",
			desc: "Kiểm tra các thẻ metadata Twitter/X. Tối ưu hóa giao diện của các liên kết được chia sẻ trên dòng thời gian feed.",
			lblCardType: "Loại giao diện thẻ",
			lblTitle: "Tiêu đề (twitter:title)",
			lblDesc: "Mô tả (twitter:description)",
			lblSite: "Tài khoản Twitter sở hữu (twitter:site)",
			lblUrl: "Đường dẫn URL",
			lblImage: "Ảnh xem trước",
			dropzoneLabel: "Thả hình ảnh vào đây để xem thử",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG tới 5MB",
			lblCode: "Mã thẻ Twitter tương ứng",
			copied: "Đã chép!",
			copy: "Sao chép mã",
			btnResetImage: "Xóa hình ảnh",
			summaryText: "Thẻ tóm tắt (Hình ảnh thu nhỏ bên trái)",
			largeText: "Thẻ hình ảnh lớn (Hình ảnh chiếm trọn chiều rộng)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleFiles = (files: File[]) => {
		if (files[0]) {
			const src = URL.createObjectURL(files[0]);
			setImageSrc(src);
		}
	};

	const generateTwitterTags = () => {
		return `<meta name="twitter:card" content="${cardType}" />\n<meta name="twitter:title" content="${title}" />\n<meta name="twitter:description" content="${desc}" />\n<meta name="twitter:site" content="${siteHandle}" />\n<meta name="twitter:url" content="${url}" />`;
	};

	const copyTags = () => {
		navigator.clipboard.writeText(generateTwitterTags());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const getDomain = () => {
		try {
			return new URL(url).hostname;
		} catch (e) {
			return "domain.com";
		}
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

					{/* Card Type */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblCardType}</label>
						<select
							class="input w-full"
							value={cardType}
							onChange={(e) =>
								setCardType((e.target as HTMLSelectElement).value as TwitterCardType)
							}
						>
							<option value="summary_large_image">{t.largeText}</option>
							<option value="summary">{t.summaryText}</option>
						</select>
					</div>

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

					{/* Site Handle */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblSite}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={siteHandle}
							onInput={(e) => setSiteHandle((e.target as HTMLInputElement).value)}
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

					{/* Drag & Drop image */}
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

				{/* Preview Renderer panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Twitter feed mockup card */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							Twitter/X Feed Preview
						</h3>

						<div class="w-full flex justify-center">
							{cardType === "summary_large_image" ? (
								/* Large Image Card */
								<div class="w-full bg-surface border border-[#cfd9de] rounded-2xl overflow-hidden max-w-md shadow-xs font-sans">
									{/* Image */}
									<div class="aspect-video bg-stone flex items-center justify-center border-b border-[#cfd9de]">
										{imageSrc ? (
											<img
												src={imageSrc}
												alt="Twitter card preview"
												class="w-full h-full object-cover"
											/>
										) : (
											<span class="text-muted text-xs font-mono">1200 × 628 px</span>
										)}
									</div>
									{/* Card Metadata */}
									<div class="p-3 space-y-1 bg-[#ffffff]">
										<div class="text-[12px] text-[#536471] leading-none truncate font-mono">
											{getDomain()}
										</div>
										<div class="text-[14px] font-bold text-[#0f1419] leading-snug truncate">
											{title}
										</div>
										<div class="text-[14px] text-[#536471] leading-snug line-clamp-2">{desc}</div>
									</div>
								</div>
							) : (
								/* Summary Small Left Thumbnail Card */
								<div class="w-full bg-surface border border-[#cfd9de] rounded-2xl overflow-hidden max-w-md shadow-xs font-sans flex h-28">
									{/* Card Metadata on Left */}
									<div class="p-3 flex-1 flex flex-col justify-center min-w-0 bg-[#ffffff] border-r border-[#cfd9de]">
										<div class="text-[11px] text-[#536471] leading-none truncate font-mono mb-1">
											{getDomain()}
										</div>
										<div class="text-[13px] font-bold text-[#0f1419] leading-snug truncate">
											{title}
										</div>
										<div class="text-[13px] text-[#536471] leading-snug line-clamp-2">{desc}</div>
									</div>
									{/* Left square Image */}
									<div class="w-28 h-full bg-stone flex items-center justify-center shrink-0">
										{imageSrc ? (
											<img
												src={imageSrc}
												alt="Twitter summary card preview"
												class="w-full h-full object-cover"
											/>
										) : (
											<span class="text-muted text-[10px] font-mono">150 × 150 px</span>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Meta tags exporter */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblCode}
						</h3>

						<div class="flex gap-2">
							<textarea
								readOnly
								class="input w-full h-32 font-mono text-xs bg-surface-soft"
								value={generateTwitterTags()}
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
