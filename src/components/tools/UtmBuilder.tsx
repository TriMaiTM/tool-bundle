import { useEffect, useState } from "preact/hooks";

interface BuiltUrl {
	url: string;
	timestamp: string;
}

export default function UtmBuilder() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Input states
	const [baseUrl, setBaseUrl] = useState("https://example.com/shop");
	const [source, setSource] = useState("google");
	const [medium, setMedium] = useState("cpc");
	const [campaign, setCampaign] = useState("summer_promo");
	const [term, setTerm] = useState("");
	const [content, setContent] = useState("");

	// History
	const [history, setHistory] = useState<BuiltUrl[]>([]);
	const [copied, setCopied] = useState(false);
	const [copiedHistoryIdx, setCopiedHistoryIdx] = useState<number | null>(null);

	const t = {
		en: {
			title: "UTM Campaign URL Builder",
			desc: "Add UTM parameters to your links to track campaign performance in Google Analytics and marketing tools.",
			lblBase: "Website URL (Required)",
			lblSource: "Campaign Source (utm_source - e.g. newsletter, google)",
			lblMedium: "Campaign Medium (utm_medium - e.g. email, cpc)",
			lblCampaign: "Campaign Name (utm_campaign - e.g. promo_code)",
			lblTerm: "Campaign Term (utm_term - search keywords)",
			lblContent: "Campaign Content (utm_content - click variants)",
			lblResults: "Generated Campaign Link",
			lblHistory: "UTM History Log",
			copied: "Copied!",
			copy: "Copy Link",
			saveBtn: "Save to History",
			presetsLabel: "Popular Presets",
			googleCpc: "Google CPC",
			fbSocial: "Facebook Social",
			newsletterEmail: "Newsletter Email",
		},
		vi: {
			title: "Trình tạo mã liên kết UTM",
			desc: "Thêm các tham số UTM vào liên kết URL của bạn để theo dõi hiệu quả chiến dịch trên Google Analytics và marketing.",
			lblBase: "Đường dẫn URL trang web (Bắt buộc)",
			lblSource: "Nguồn chiến dịch (utm_source - ví dụ: newsletter, google)",
			lblMedium: "Phương thức chiến dịch (utm_medium - ví dụ: email, cpc)",
			lblCampaign: "Tên chiến dịch (utm_campaign - ví dụ: khuyen_mai)",
			lblTerm: "Từ khóa chiến dịch (utm_term - từ khóa tìm kiếm)",
			lblContent: "Nội dung chiến dịch (utm_content - vị trí quảng cáo)",
			lblResults: "Liên kết UTM tạo được",
			lblHistory: "Lịch sử tạo mã liên kết",
			copied: "Đã chép!",
			copy: "Sao chép link",
			saveBtn: "Lưu lịch sử",
			presetsLabel: "Mẫu cấu hình nhanh",
			googleCpc: "Quảng cáo Google (CPC)",
			fbSocial: "Mạng xã hội Facebook",
			newsletterEmail: "Email bản tin (Newsletter)",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Build UTM Link
	const buildUtmLink = () => {
		if (!baseUrl.trim()) return "";

		try {
			// Normalise URL to make sure it has protocol
			let cleanUrl = baseUrl.trim();
			if (!/^https?:\/\//i.test(cleanUrl)) {
				cleanUrl = `https://${cleanUrl}`;
			}

			const parsed = new URL(cleanUrl);

			if (source.trim()) parsed.searchParams.set("utm_source", source.trim());
			if (medium.trim()) parsed.searchParams.set("utm_medium", medium.trim());
			if (campaign.trim()) parsed.searchParams.set("utm_campaign", campaign.trim());
			if (term.trim()) parsed.searchParams.set("utm_term", term.trim());
			if (content.trim()) parsed.searchParams.set("utm_content", content.trim());

			return parsed.toString();
		} catch (e) {
			return "";
		}
	};

	const finalUrl = buildUtmLink();

	const handleCopy = () => {
		if (finalUrl) {
			navigator.clipboard.writeText(finalUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	const saveToHistory = () => {
		if (finalUrl && !history.some((h) => h.url === finalUrl)) {
			setHistory((prev) =>
				[
					{
						url: finalUrl,
						timestamp: new Date().toLocaleTimeString(),
					},
					...prev,
				].slice(0, 10),
			);
		}
	};

	const applyPreset = (pSource: string, pMedium: string, pCampaign: string) => {
		setSource(pSource);
		setMedium(pMedium);
		setCampaign(pCampaign);
	};

	const handleCopyHistory = (urlStr: string, idx: number) => {
		navigator.clipboard.writeText(urlStr);
		setCopiedHistoryIdx(idx);
		setTimeout(() => setCopiedHistoryIdx(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Left Form Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Presets */}
					<div class="space-y-2">
						<span class="text-body-xs font-bold text-ink block">{t.presetsLabel}</span>
						<div class="flex flex-wrap gap-2">
							<button
								class="btn-secondary py-1 px-2.5 text-[10px]"
								onClick={() => applyPreset("google", "cpc", "search_ads")}
							>
								{t.googleCpc}
							</button>
							<button
								class="btn-secondary py-1 px-2.5 text-[10px]"
								onClick={() => applyPreset("facebook", "social", "retargeting")}
							>
								{t.fbSocial}
							</button>
							<button
								class="btn-secondary py-1 px-2.5 text-[10px]"
								onClick={() => applyPreset("newsletter", "email", "weekly_updates")}
							>
								{t.newsletterEmail}
							</button>
						</div>
					</div>

					{/* Base URL */}
					<div class="space-y-1.5 pt-2 border-t border-hairline">
						<label class="text-body-sm-strong text-ink block">{t.lblBase}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={baseUrl}
							onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
							placeholder="https://mysite.com/landing"
						/>
					</div>

					{/* Source */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblSource}</label>
						<input
							type="text"
							class="input w-full text-body-sm"
							value={source}
							onInput={(e) => setSource((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Medium */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblMedium}</label>
						<input
							type="text"
							class="input w-full text-body-sm"
							value={medium}
							onInput={(e) => setMedium((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Campaign */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblCampaign}</label>
						<input
							type="text"
							class="input w-full text-body-sm"
							value={campaign}
							onInput={(e) => setCampaign((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Term */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblTerm}</label>
						<input
							type="text"
							class="input w-full text-body-sm"
							value={term}
							onInput={(e) => setTerm((e.target as HTMLInputElement).value)}
							placeholder="Optional"
						/>
					</div>

					{/* Content */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblContent}</label>
						<input
							type="text"
							class="input w-full text-body-sm"
							value={content}
							onInput={(e) => setContent((e.target as HTMLInputElement).value)}
							placeholder="Optional"
						/>
					</div>
				</div>

				{/* Right Results & History panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Result UTM Display */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h4>
						<div class="space-y-3">
							<div class="flex gap-2">
								<input
									readOnly
									type="text"
									class="input w-full font-mono text-body-xs bg-surface-soft"
									value={finalUrl}
								/>
								<button
									class="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
									onClick={handleCopy}
									disabled={!finalUrl}
								>
									{copied ? t.copied : t.copy}
								</button>
							</div>
							{finalUrl && (
								<button class="btn-primary w-full py-2" onClick={saveToHistory}>
									{t.saveBtn}
								</button>
							)}
						</div>
					</div>

					{/* History Logs */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblHistory}
						</h3>

						{history.length === 0 ? (
							<div class="text-center py-12 text-muted text-body-sm italic">
								{lang === "en"
									? "No links generated in current session."
									: "Chưa có liên kết nào được lưu."}
							</div>
						) : (
							<div class="space-y-2">
								{history.map((item, idx) => (
									<div
										key={idx}
										class="flex items-center justify-between bg-surface-soft p-2.5 rounded-lg border border-hairline hover:border-primary/30 transition-colors"
									>
										<div class="min-w-0 pr-4">
											<span class="text-body-xs text-ink font-mono block truncate">{item.url}</span>
											<span class="text-[9px] text-muted block mt-0.5">
												Saved at {item.timestamp}
											</span>
										</div>

										<button
											class="btn-secondary text-[10px] py-1.5 px-3 shrink-0"
											onClick={() => handleCopyHistory(item.url, idx)}
										>
											{copiedHistoryIdx === idx ? t.copied : t.copy}
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
