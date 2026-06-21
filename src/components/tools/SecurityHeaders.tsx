import { useEffect, useState } from "preact/hooks";

interface HeaderAudit {
	name: string;
	status: "good" | "missing" | "warning";
	value?: string;
	descEn: string;
	descVi: string;
	adviceEn: string;
	adviceVi: string;
}

export default function SecurityHeaders() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [rawHeaders, setRawHeaders] = useState("");
	const [audits, setAudits] = useState<HeaderAudit[]>([]);
	const [infoLeaks, setInfoLeaks] = useState<
		{ name: string; value: string; adviceEn: string; adviceVi: string }[]
	>([]);
	const [grade, setGrade] = useState<"A+" | "A" | "B" | "C" | "D" | "F" | null>(null);
	const [hasAnalyzed, setHasAnalyzed] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Security Headers Evaluator",
			desc: "Analyze and audit raw HTTP response headers to identify missing security policies (CSP, HSTS, Clickjacking protections, etc.) and calculate a security grade.",
			lblHeaders: "Raw HTTP Response Headers",
			btnEvaluate: "Evaluate Headers",
			btnSampleSecure: "Load Secure Example (Grade A)",
			btnSampleInsecure: "Load Insecure Example (Grade F)",
			lblResult: "Header Audit Report",
			lblScore: "Security Grade",
			lblPresent: "Configured Protections",
			lblMissing: "Missing / Misconfigured Headers",
			lblInfoLeak: "Server Version & Platform Leakage",
			errInput: "Please paste some HTTP headers to analyze.",
			placeholder:
				"HTTP/2 200 OK\ncontent-type: text/html; charset=UTF-8\nserver: nginx\nx-powered-by: PHP/8.1\n...",
			adviceSecure:
				"Excellent! Your server utilizes key security headers protecting users against XSS, clickjacking, and session hijacking.",
			adviceInsecure:
				"Warning! The server configuration misses critical security headers. Users are exposed to common web vulnerabilities.",
		},
		vi: {
			title: "Đánh giá HTTP Security Headers",
			desc: "Phân tích và kiểm tra các tiêu đề phản hồi HTTP thô để xác định các chính sách bảo mật bị thiếu (CSP, HSTS, bảo vệ chống Clickjacking, v.v.) và tính điểm.",
			lblHeaders: "Tiêu đề HTTP Response thô",
			btnEvaluate: "Đánh giá bảo mật",
			btnSampleSecure: "Tải mẫu bảo mật (Điểm A)",
			btnSampleInsecure: "Tải mẫu rủi ro (Điểm F)",
			lblResult: "Báo cáo kiểm định Headers",
			lblScore: "Điểm bảo mật",
			lblPresent: "Các tiêu đề bảo mật hiện có",
			lblMissing: "Các tiêu đề bị thiếu hoặc yếu",
			lblInfoLeak: "Rò rỉ thông tin nền tảng & Phiên bản Server",
			errInput: "Vui lòng dán dữ liệu HTTP response headers để phân tích.",
			placeholder:
				"HTTP/2 200 OK\ncontent-type: text/html; charset=UTF-8\nserver: nginx\nx-powered-by: PHP/8.1\n...",
			adviceSecure:
				"Tuyệt vời! Máy chủ của bạn áp dụng đầy đủ các tiêu đề bảo mật chính bảo vệ người dùng chống lại XSS, clickjacking và đánh cắp phiên.",
			adviceInsecure:
				"Cảnh báo! Cấu hình máy chủ thiếu các tiêu đề bảo mật quan trọng. Người dùng có nguy cơ bị tấn công bởi các lỗ hổng web phổ biến.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const sampleSecure = `HTTP/2 200 OK
content-type: text/html; charset=UTF-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=()`;

	const sampleInsecure = `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Server: Apache/2.4.41 (Ubuntu)
X-Powered-By: PHP/7.4.3
X-AspNet-Version: 4.0.30319`;

	const loadSample = (type: "secure" | "insecure") => {
		setRawHeaders(type === "secure" ? sampleSecure : sampleInsecure);
		setHasAnalyzed(false);
		setAudits([]);
		setInfoLeaks([]);
		setGrade(null);
		setError(null);
	};

	const evaluateHeaders = () => {
		if (!rawHeaders.trim()) {
			setError(t.errInput);
			setHasAnalyzed(false);
			return;
		}

		setError(null);
		const lines = rawHeaders.split("\n");
		const headerMap: Record<string, string> = {};

		for (const line of lines) {
			const index = line.indexOf(":");
			if (index > 0) {
				const key = line.substring(0, index).trim().toLowerCase();
				const val = line.substring(index + 1).trim();
				headerMap[key] = val;
			}
		}

		// Security Audit Rules
		const securityRules = [
			{
				name: "Strict-Transport-Security",
				descEn: "Enforces secure HTTPS connections.",
				descVi: "Bắt buộc kết nối HTTPS an toàn.",
				adviceEn:
					"HSTS header is present. Ensure it has max-age set to at least 1 year (31536000 seconds).",
				adviceVi: "HSTS đã tồn tại. Đảm bảo cấu hình max-age tối thiểu 1 năm (31536000 giây).",
				missingEn:
					"Missing HSTS. Exposed to SSL/TLS stripping attacks. Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
				missingVi:
					"Thiếu HSTS. Dễ bị tấn công hạ cấp SSL/TLS stripping. Khuyến nghị thêm: Strict-Transport-Security: max-age=31536000; includeSubDomains",
			},
			{
				name: "Content-Security-Policy",
				descEn: "Prevents Cross-Site Scripting (XSS) and code injection.",
				descVi: "Ngăn chặn tấn công chèn mã Cross-Site Scripting (XSS).",
				adviceEn: "CSP is present, helping prevent arbitrary script injections.",
				adviceVi: "CSP đã được thiết lập, giúp lọc và chặn các mã nguồn độc hại tải từ bên ngoài.",
				missingEn:
					"Missing CSP. Vulnerable to script injection. Add a robust Content-Security-Policy header.",
				missingVi:
					"Thiếu CSP. Dễ bị khai thác chèn tập lệnh độc hại. Hãy thiết lập tiêu đề Content-Security-Policy.",
			},
			{
				name: "X-Frame-Options",
				descEn: "Protects against Clickjacking attacks.",
				descVi: "Chống lại các cuộc tấn công lừa nhấp chuột Clickjacking.",
				adviceEn: "Configured correctly to prevent frame embedding (DENY or SAMEORIGIN).",
				adviceVi:
					"Đã thiết lập đúng để ngăn nhúng trang vào frame của website khác (DENY hoặc SAMEORIGIN).",
				missingEn:
					"Missing X-Frame-Options. Vulnerable to Clickjacking. Add: X-Frame-Options: DENY or SAMEORIGIN",
				missingVi:
					"Thiếu X-Frame-Options. Dễ bị tấn công lừa nhấp chuột. Khuyến nghị thêm: X-Frame-Options: SAMEORIGIN",
			},
			{
				name: "X-Content-Type-Options",
				descEn: "Disables MIME-type sniffing.",
				descVi: "Ngăn chặn trình duyệt tự phán đoán định dạng file (MIME-type sniffing).",
				adviceEn: "Configured correctly with 'nosniff'.",
				adviceVi: "Đã thiết lập đúng giá trị 'nosniff'.",
				missingEn:
					"Missing X-Content-Type-Options. Browser might execute CSS/images as HTML. Add: X-Content-Type-Options: nosniff",
				missingVi:
					"Thiếu X-Content-Type-Options. Trình duyệt có thể tự ý thực thi mã. Khuyến nghị thêm: X-Content-Type-Options: nosniff",
			},
			{
				name: "Referrer-Policy",
				descEn: "Controls referrer information leaked in requests.",
				descVi: "Kiểm soát thông tin referrer rò rỉ khi người dùng chuyển trang.",
				adviceEn: "Referrer policy is defined.",
				adviceVi: "Chính sách Referrer đã được xác định.",
				missingEn:
					"Missing Referrer-Policy. Sensitive URLs might leak to third-party referrers. Add: Referrer-Policy: strict-origin-when-cross-origin",
				missingVi:
					"Thiếu Referrer-Policy. Có thể rò rỉ địa chỉ trang web nội bộ ra ngoài. Khuyến nghị thêm: Referrer-Policy: strict-origin-when-cross-origin",
			},
			{
				name: "Permissions-Policy",
				descEn: "Controls access to browser APIs (camera, geolocation, etc.).",
				descVi: "Kiểm soát quyền truy cập API của trình duyệt (camera, vị trí, v.v.).",
				adviceEn: "Permissions Policy is configured.",
				adviceVi: "Chính sách quyền Permissions-Policy đã được thiết lập.",
				missingEn: "Missing Permissions-Policy. Browser hardware features are not restricted.",
				missingVi:
					"Thiếu Permissions-Policy. Chưa giới hạn các quyền phần cứng thiết bị của trình duyệt.",
			},
		];

		const activeAudits: HeaderAudit[] = [];
		let goodCount = 0;

		for (const rule of securityRules) {
			const lowerName = rule.name.toLowerCase();
			if (headerMap[lowerName]) {
				goodCount++;
				activeAudits.push({
					name: rule.name,
					status: "good",
					value: headerMap[lowerName],
					descEn: rule.descEn,
					descVi: rule.descVi,
					adviceEn: rule.adviceEn,
					adviceVi: rule.adviceVi,
				});
			} else {
				activeAudits.push({
					name: rule.name,
					status: "missing",
					descEn: rule.descEn,
					descVi: rule.descVi,
					adviceEn: rule.missingEn,
					adviceVi: rule.missingVi,
				});
			}
		}

		// Information Leakage Audit
		const activeLeaks: { name: string; value: string; adviceEn: string; adviceVi: string }[] = [];
		const leakCheckList = [
			{
				key: "server",
				name: "Server Signature",
				advEn:
					"Exposes server software info. Configure web server (nginx/apache) to hide version token.",
				advVi:
					"Lộ thông tin phần mềm server. Hãy cấu hình ẩn phiên bản trong nginx.conf hoặc apache.conf.",
			},
			{
				key: "x-powered-by",
				name: "X-Powered-By Signature",
				advEn: "Exposes backend runtime. Remove header or disable powered-by setting in backend.",
				advVi: "Lộ thông tin ngôn ngữ backend. Hãy tắt hoặc xóa cấu hình X-Powered-By.",
			},
			{
				key: "x-aspnet-version",
				name: "X-AspNet-Version Signature",
				advEn: "Exposes ASP.NET version details. Disable output in web.config.",
				advVi: "Lộ phiên bản framework ASP.NET. Hãy tắt cấu hình trong web.config.",
			},
		];

		for (const item of leakCheckList) {
			if (headerMap[item.key]) {
				activeLeaks.push({
					name: item.name,
					value: headerMap[item.key],
					adviceEn: item.advEn,
					adviceVi: item.advVi,
				});
			}
		}

		// Grade assessment
		let gradeRes: "A+" | "A" | "B" | "C" | "D" | "F" = "F";
		if (goodCount === 6 && activeLeaks.length === 0) gradeRes = "A+";
		else if (goodCount >= 5) gradeRes = "A";
		else if (goodCount >= 4) gradeRes = "B";
		else if (goodCount >= 3) gradeRes = "C";
		else if (goodCount >= 1) gradeRes = "D";
		else gradeRes = "F";

		setAudits(activeAudits);
		setInfoLeaks(activeLeaks);
		setGrade(gradeRes);
		setHasAnalyzed(true);
	};

	const getGradeColor = (g: "A+" | "A" | "B" | "C" | "D" | "F") => {
		if (g.startsWith("A")) return "text-accent-emerald border-accent-emerald bg-accent-emerald/10";
		if (g === "B") return "text-accent-emerald border-accent-emerald/80 bg-accent-emerald/5";
		if (g === "C") return "text-accent-orange border-accent-orange bg-accent-orange/10";
		if (g === "D") return "text-accent-orange border-accent-orange/80 bg-accent-orange/5";
		return "text-accent-rose border-accent-rose bg-accent-rose/10";
	};

	return (
		<div class="space-y-6">
			{/* Explanation Header */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
				<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 mb-2">
					{t.title}
				</h3>
				<p class="text-body-sm text-muted leading-relaxed">{t.desc}</p>
				<div class="flex flex-wrap gap-3 mt-3">
					<button class="btn-secondary py-1.5 px-3 text-xs" onClick={() => loadSample("secure")}>
						{t.btnSampleSecure}
					</button>
					<button class="btn-secondary py-1.5 px-3 text-xs" onClick={() => loadSample("insecure")}>
						{t.btnSampleInsecure}
					</button>
				</div>
			</div>

			{/* Main interface layout */}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Code Area Input */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblHeaders}</label>
						<textarea
							class="input w-full h-80 font-mono text-body-sm"
							placeholder={t.placeholder}
							value={rawHeaders}
							onInput={(e) => setRawHeaders((e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={evaluateHeaders}>
						{t.btnEvaluate}
					</button>
				</div>

				{/* Verification Report */}
				<div class="lg:col-span-7 space-y-5">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{hasAnalyzed && grade && (
						<div class="space-y-6">
							{/* Grade / Summary Dashboard */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex items-center gap-6">
								<div
									class={`w-20 h-20 shrink-0 rounded-full border-4 flex items-center justify-center font-bold text-3xl select-none ${getGradeColor(
										grade,
									)}`}
								>
									{grade}
								</div>
								<div>
									<h4 class="text-body-strong text-ink font-bold mb-1">{t.lblScore}</h4>
									<p class="text-body-xs text-muted leading-relaxed">
										{grade.startsWith("A") ? t.adviceSecure : t.adviceInsecure}
									</p>
								</div>
							</div>

							{/* Audit reports lists */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
									{t.lblResult}
								</h4>

								{/* Good headers list */}
								<div class="space-y-3">
									<h5 class="text-caption-uppercase text-accent-emerald font-bold">
										{t.lblPresent}
									</h5>
									{audits.filter((a) => a.status === "good").length === 0 ? (
										<p class="text-body-xs text-muted italic ml-2">None</p>
									) : (
										<div class="space-y-2">
											{audits
												.filter((a) => a.status === "good")
												.map((a, idx) => (
													<div
														key={idx}
														class="bg-accent-emerald/5 border border-accent-emerald/20 p-3 rounded-lg text-body-xs"
													>
														<div class="flex items-center justify-between mb-1">
															<span class="font-bold font-mono text-accent-emerald">{a.name}</span>
															<span class="text-[10px] text-accent-emerald font-bold">Safe</span>
														</div>
														<p class="text-muted leading-relaxed mb-2">
															{lang === "en" ? a.descEn : a.descVi}
														</p>
														<div class="bg-surface-soft p-2 rounded text-body-xs font-mono text-ink truncate select-all">
															{a.value}
														</div>
													</div>
												))}
										</div>
									)}
								</div>

								{/* Missing headers list */}
								<div class="space-y-3 border-t border-hairline pt-3">
									<h5 class="text-caption-uppercase text-accent-rose font-bold">{t.lblMissing}</h5>
									{audits.filter((a) => a.status === "missing").length === 0 ? (
										<p class="text-body-xs text-muted italic ml-2">None</p>
									) : (
										<div class="space-y-2">
											{audits
												.filter((a) => a.status === "missing")
												.map((a, idx) => (
													<div
														key={idx}
														class="bg-accent-rose/5 border border-accent-rose/25 p-3 rounded-lg text-body-xs"
													>
														<div class="flex items-center justify-between mb-1">
															<span class="font-bold font-mono text-accent-rose">{a.name}</span>
															<span class="text-[10px] text-accent-rose font-bold">Missing</span>
														</div>
														<p class="text-muted leading-relaxed mb-1">
															{lang === "en" ? a.descEn : a.descVi}
														</p>
														<p class="text-ink font-bold leading-relaxed">
															{lang === "en" ? a.adviceEn : a.adviceVi}
														</p>
													</div>
												))}
										</div>
									)}
								</div>

								{/* Info Leaks list */}
								{infoLeaks.length > 0 && (
									<div class="space-y-3 border-t border-hairline pt-3">
										<h5 class="text-caption-uppercase text-accent-orange font-bold">
											{t.lblInfoLeak}
										</h5>
										<div class="space-y-2">
											{infoLeaks.map((a, idx) => (
												<div
													key={idx}
													class="bg-accent-orange/5 border border-accent-orange/20 p-3 rounded-lg text-body-xs"
												>
													<div class="flex items-center justify-between mb-1">
														<span class="font-bold font-mono text-accent-orange">{a.name}</span>
														<span class="text-[10px] text-accent-orange font-bold">Leakage</span>
													</div>
													<div class="bg-surface-soft p-2 rounded text-body-xs font-mono text-ink truncate mb-2 select-all">
														{a.value}
													</div>
													<p class="text-ink leading-relaxed">
														{lang === "en" ? a.adviceEn : a.adviceVi}
													</p>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
