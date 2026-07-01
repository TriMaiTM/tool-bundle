import { useEffect, useState } from "preact/hooks";

interface AuditResult {
	status: "success" | "warning" | "error";
	message: string;
	messageVi: string;
}

export default function CanonicalChecker() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [htmlInput, setHtmlInput] = useState(`<!DOCTYPE html>
<html>
<head>
  <title>My Web Page</title>
  <link rel="canonical" href="http://example.com/blog-post" />
</head>
<body>
  <h1>SEO Blog Post</h1>
</body>
</html>`);

	const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);
	const [audits, setAudits] = useState<AuditResult[]>([]);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Canonical URL Checker & Auditor",
			desc: "Paste your webpage HTML source code to extract the canonical link tag and analyze technical compliance rules.",
			lblInput: "Paste HTML Source Code",
			btnCheck: "Audit Canonical Tag",
			lblResults: "Canonical Audit Report",
			lblValue: "Extracted Canonical URL",
			statusFound: "Canonical Tag Found",
			statusNotFound: "Canonical Tag NOT Found",
			copied: "Copied!",
			copy: "Copy URL",
			empty: "Please paste HTML source containing <head> details to audit.",
		},
		vi: {
			title: "Phân tích thẻ Canonical SEO",
			desc: "Dán mã nguồn HTML trang web để tự động trích xuất thẻ liên kết Canonical và kiểm tra tính tuân thủ quy chuẩn kỹ thuật.",
			lblInput: "Dán mã nguồn HTML trang web",
			btnCheck: "Phân tích thẻ Canonical",
			lblResults: "Báo cáo thẻ Canonical",
			lblValue: "Đường dẫn Canonical trích xuất được",
			statusFound: "Đã tìm thấy thẻ Canonical",
			statusNotFound: "KHÔNG tìm thấy thẻ Canonical",
			copied: "Đã chép!",
			copy: "Sao chép link",
			empty: "Hãy dán mã nguồn HTML có chứa thẻ trong phần <head> để bắt đầu.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run audit parsing logic
	const runAudit = () => {
		const results: AuditResult[] = [];
		setCanonicalUrl(null);

		// Regex to parse <link rel="canonical" ...> or rel='canonical'
		const canonicalRegex = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
		const match = htmlInput.match(canonicalRegex);

		if (!match) {
			results.push({
				status: "error",
				message:
					"No canonical link tag found in the provided HTML. Search engines may crawl duplicate URL paths.",
				messageVi:
					"Không tìm thấy thẻ liên kết canonical trong HTML. Các công cụ tìm kiếm có thể thu thập các trang trùng lặp.",
			});
			setAudits(results);
			return;
		}

		// Extract href value from the matched tag
		const hrefRegex = /href=["']([^"']*)["']/i;
		const hrefMatch = match[0].match(hrefRegex);

		if (!hrefMatch || !hrefMatch[1].trim()) {
			results.push({
				status: "error",
				message: "Canonical link tag exists but has an empty or missing href attribute.",
				messageVi: "Thẻ canonical tồn tại nhưng thuộc tính href đang bỏ trống hoặc bị thiếu.",
			});
			setAudits(results);
			return;
		}

		const urlVal = hrefMatch[1].trim();
		setCanonicalUrl(urlVal);

		results.push({
			status: "success",
			message: "Canonical link tag successfully located in HTML document head.",
			messageVi: "Đã tìm thấy thẻ canonical hợp lệ trong tiêu đề tài liệu HTML.",
		});

		// Audit 1: Check absolute URL protocol
		if (!/^https?:\/\//i.test(urlVal)) {
			results.push({
				status: "error",
				message:
					"The canonical URL is relative. Search engines require a fully qualified absolute URL (e.g. starting with https://).",
				messageVi:
					"Đường dẫn canonical đang ở dạng tương đối. Google yêu cầu đường dẫn tuyệt đối đầy đủ (bắt đầu bằng https://).",
			});
		} else {
			// Audit 2: Check SSL HTTPS security protocol
			if (/^http:\/\//i.test(urlVal)) {
				results.push({
					status: "warning",
					message: "The canonical URL uses insecure 'http' instead of secure 'https' protocol.",
					messageVi:
						"Đường dẫn canonical đang sử dụng giao thức không bảo mật 'http' thay vì 'https'.",
				});
			}

			// Audit 3: Check correct domain structure
			try {
				new URL(urlVal);
			} catch (e) {
				results.push({
					status: "error",
					message: "The canonical URL is malformed or invalid.",
					messageVi: "Đường dẫn canonical bị sai định dạng hoặc không hợp lệ.",
				});
			}
		}

		setAudits(results);
	};

	useEffect(() => {
		runAudit();
	}, [htmlInput]);

	const handleCopy = () => {
		if (canonicalUrl) {
			navigator.clipboard.writeText(canonicalUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* HTML Input Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<textarea
							class="input w-full h-80 font-mono text-xs"
							value={htmlInput}
							onInput={(e) => setHtmlInput((e.target as HTMLTextAreaElement).value)}
						/>
					</div>
				</div>

				{/* Audit Report panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{canonicalUrl ? (
						<div class="space-y-4">
							<div class="space-y-1.5">
								<span class="text-body-xs uppercase font-bold text-accent-emerald block">
									{t.statusFound}
								</span>
								<div class="flex gap-2">
									<input
										readOnly
										type="text"
										class="input w-full font-mono text-body-sm bg-surface-soft font-bold text-primary"
										value={canonicalUrl}
									/>
									<button
										class="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
										onClick={handleCopy}
									>
										{copied ? t.copied : t.copy}
									</button>
								</div>
							</div>

							{/* Audits status list */}
							<div class="space-y-2 border-t border-hairline pt-3">
								{audits.map((a, idx) => (
									<div
										key={idx}
										class={`flex items-start gap-2.5 p-3 rounded-lg border text-body-xs ${
											a.status === "success"
												? "bg-accent-emerald/5 border-accent-emerald/10 text-accent-emerald"
												: a.status === "warning"
													? "bg-accent-amber/5 border-accent-amber/10 text-accent-amber"
													: "bg-accent-rose/5 border-accent-rose/10 text-accent-rose"
										}`}
									>
										<span class="font-bold uppercase text-[9px] mt-0.5">[{a.status}]</span>
										<span>{lang === "en" ? a.message : a.messageVi}</span>
									</div>
								))}
							</div>
						</div>
					) : (
						<div class="space-y-3">
							<span class="text-body-xs uppercase font-bold text-accent-rose block">
								{t.statusNotFound}
							</span>
							{audits.map((a, idx) => (
								<div
									key={idx}
									class="p-3 bg-accent-rose/5 border border-accent-rose/10 rounded-lg text-body-xs text-accent-rose"
								>
									{lang === "en" ? a.message : a.messageVi}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
