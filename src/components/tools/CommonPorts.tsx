import { useEffect, useState } from "preact/hooks";

interface PortInfo {
	port: string;
	service: string;
	protocol: "TCP" | "UDP" | "TCP/UDP";
	category: "web_email" | "database" | "file_transfer" | "remote_access" | "infrastructure";
	risk: "Low" | "Medium" | "High";
	descEn: string;
	descVi: string;
	recommendEn: string;
	recommendVi: string;
}

const PORT_DATABASE: PortInfo[] = [
	{
		port: "20, 21",
		service: "FTP",
		protocol: "TCP",
		category: "file_transfer",
		risk: "High",
		descEn: "File Transfer Protocol. Used for transferring files between a client and a server.",
		descVi: "Giao thức truyền tệp tin. Được sử dụng để truyền tệp tin giữa máy khách và máy chủ.",
		recommendEn:
			"Insecure by default (plain-text credentials). Replace with SFTP (Port 22) or FTPS.",
		recommendVi:
			"Không an toàn mặc định (thông tin đăng nhập dạng rõ). Thay thế bằng SFTP (Cổng 22) hoặc FTPS.",
	},
	{
		port: "22",
		service: "SSH / SFTP",
		protocol: "TCP",
		category: "remote_access",
		risk: "Low",
		descEn: "Secure Shell. Used for secure command line access and file transfers (SFTP).",
		descVi: "Giao thức điều khiển từ xa an toàn. Được sử dụng để truy cập và truyền tệp bảo mật.",
		recommendEn:
			"Secure, but target for brute force. Disable password logins; use key-based auth and fail2ban.",
		recommendVi:
			"An toàn, nhưng thường bị dò mật khẩu. Tắt đăng nhập mật khẩu; dùng khóa SSH và fail2ban.",
	},
	{
		port: "23",
		service: "Telnet",
		protocol: "TCP",
		category: "remote_access",
		risk: "High",
		descEn: "Terminal Emulation. Unencrypted text communications for command line control.",
		descVi: "Giao thức dòng lệnh cũ. Giao tiếp văn bản không mã hóa để điều khiển máy chủ.",
		recommendEn: "Extremely insecure. Disable immediately and use SSH (Port 22) instead.",
		recommendVi: "Cực kỳ không an toàn. Hãy vô hiệu hóa ngay và chuyển sang SSH (Cổng 22).",
	},
	{
		port: "25",
		service: "SMTP",
		protocol: "TCP",
		category: "web_email",
		risk: "Medium",
		descEn: "Simple Mail Transfer Protocol. Used for email transmission between mail servers.",
		descVi: "Giao thức truyền tải thư tín đơn giản. Dùng để gửi nhận email giữa các máy chủ.",
		recommendEn:
			"Vulnerable to spam injection. Enforce TLS; use port 587/465 with auth for client submissions.",
		recommendVi:
			"Dễ bị lạm dụng spam. Bắt buộc mã hóa TLS; dùng cổng 587/465 có xác thực cho người dùng cuối.",
	},
	{
		port: "53",
		service: "DNS",
		protocol: "TCP/UDP",
		category: "infrastructure",
		risk: "Medium",
		descEn: "Domain Name System. Translates domain names to IP addresses.",
		descVi: "Hệ thống phân giải tên miền. Dịch tên miền thành địa chỉ IP.",
		recommendEn:
			"Target for DNS spoofing/amplification DDoS attacks. Keep server patched; restrict recursive queries.",
		recommendVi:
			"Dễ bị tấn công giả mạo hoặc DDoS khuếch đại. Cập nhật hệ thống; hạn chế truy vấn đệ quy.",
	},
	{
		port: "80",
		service: "HTTP",
		protocol: "TCP",
		category: "web_email",
		risk: "Medium",
		descEn:
			"Hypertext Transfer Protocol. Standard protocol for transferring unencrypted web pages.",
		descVi: "Giao thức truyền siêu văn bản. Giao thức tiêu chuẩn truyền tải trang web chưa mã hóa.",
		recommendEn: "Unencrypted traffic. Configure permanent redirect (301) to HTTPS (Port 443).",
		recommendVi:
			"Dữ liệu dạng văn bản rõ. Cấu hình chuyển hướng vĩnh viễn (301) sang HTTPS (Cổng 443).",
	},
	{
		port: "110",
		service: "POP3",
		protocol: "TCP",
		category: "web_email",
		risk: "Medium",
		descEn:
			"Post Office Protocol v3. Used by email clients to retrieve messages from a mail server.",
		descVi: "Giao thức lấy thư POP3. Dùng để tải email từ máy chủ về máy khách.",
		recommendEn: "Plaintext credentials. Use POP3S (Port 995) with SSL/TLS encryption instead.",
		recommendVi:
			"Thông tin đăng nhập gửi dạng văn bản rõ. Thay thế bằng POP3S (Cổng 995) dùng SSL/TLS.",
	},
	{
		port: "123",
		service: "NTP",
		protocol: "UDP",
		category: "infrastructure",
		risk: "Medium",
		descEn: "Network Time Protocol. Synchronizes system clocks across network devices.",
		descVi: "Giao thức đồng bộ thời gian mạng. Đồng bộ đồng hồ hệ thống giữa các thiết bị mạng.",
		recommendEn:
			"Often target for NTP reflection DDoS attacks. Disable monlist feature; restrict access lists.",
		recommendVi:
			"Thường bị lợi dụng để DDoS phản xạ NTP. Vô hiệu hóa tính năng monlist; giới hạn IP truy cập.",
	},
	{
		port: "143",
		service: "IMAP",
		protocol: "TCP",
		category: "web_email",
		risk: "Medium",
		descEn:
			"Internet Message Access Protocol. Allows email client tools to synchronize mail folders.",
		descVi: "Giao thức truy cập thư mục mail IMAP. Cho phép đồng bộ các thư mục thư điện tử.",
		recommendEn:
			"Unencrypted transmission. Replace with IMAPS (Port 993) for encrypted connections.",
		recommendVi: "Truyền tải không mã hóa. Thay thế bằng IMAPS (Cổng 993) để kết nối bảo mật hơn.",
	},
	{
		port: "161, 162",
		service: "SNMP",
		protocol: "TCP/UDP",
		category: "infrastructure",
		risk: "High",
		descEn:
			"Simple Network Management Protocol. Monitors and configures network hardware elements.",
		descVi: "Giao thức giám sát mạng đơn giản. Giám sát và cấu hình các thiết bị phần cứng mạng.",
		recommendEn:
			"Default community strings (e.g. 'public') leak hardware setups. Use SNMPv3 with auth & privacy.",
		recommendVi:
			"Các chuỗi cộng đồng mặc định (như 'public') dễ bị rò rỉ. Sử dụng SNMPv3 có xác thực và mã hóa.",
	},
	{
		port: "443",
		service: "HTTPS",
		protocol: "TCP",
		category: "web_email",
		risk: "Low",
		descEn: "Hypertext Transfer Protocol Secure. Web communication encrypted via TLS.",
		descVi: "Giao thức truyền siêu văn bản bảo mật. Giao tiếp web được mã hóa qua TLS.",
		recommendEn:
			"Secure. Ensure weak ciphers are disabled (e.g. SSLv3, TLS 1.0, 1.1). Implement HSTS headers.",
		recommendVi:
			"An toàn. Đảm bảo đã tắt các thuật toán cũ (như SSLv3, TLS 1.0, 1.1). Áp dụng tiêu đề HSTS.",
	},
	{
		port: "445",
		service: "SMB / Active Directory",
		protocol: "TCP",
		category: "file_transfer",
		risk: "High",
		descEn: "Server Message Block. Shared file access, printers, and system controller operations.",
		descVi:
			"Giao thức chia sẻ tài nguyên Windows SMB. Chia sẻ tệp tin, máy in và quản lý hệ thống.",
		recommendEn:
			"Vulnerable to high-impact exploits (WannaCry, EternalBlue). BLOCK port 445 at firewall WAN.",
		recommendVi:
			"Dễ bị khai thác lỗ hổng nghiêm trọng (WannaCry, EternalBlue). BẮT BUỘC chặn cổng này ở tường lửa WAN.",
	},
	{
		port: "1433",
		service: "MSSQL",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "Microsoft SQL Server Database. Storage engine and listener query entry point.",
		descVi: "Cơ sở dữ liệu Microsoft SQL Server. Cổng truy vấn chính của máy chủ SQL.",
		recommendEn:
			"Never expose to public internet. Restrict connections to specific client IP addresses or VPN.",
		recommendVi:
			"Không bao giờ mở cổng ra Internet. Giới hạn kết nối từ các IP cụ thể hoặc dùng VPN.",
	},
	{
		port: "1521",
		service: "Oracle DB",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "Oracle Database Default Listener port.",
		descVi: "Cổng lắng nghe cơ sở dữ liệu mặc định của Oracle Database.",
		recommendEn: "High-risk target. Keep firewalled; use secure transport network configurations.",
		recommendVi:
			"Mục tiêu tấn công rủi ro cao. Giữ đằng sau tường lửa; dùng cấu hình mạng mã hóa secure transport.",
	},
	{
		port: "3306",
		service: "MySQL",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "MySQL Database query port.",
		descVi: "Cổng truy vấn cơ sở dữ liệu MySQL.",
		recommendEn:
			"Do not expose publicly. Bind MySQL to local loopback (127.0.0.1) and route remote sessions via SSH tunnels.",
		recommendVi:
			"Không mở công khai. Cấu hình MySQL chạy trên 127.0.0.1 và điều khiển từ xa qua đường ống SSH.",
	},
	{
		port: "3389",
		service: "RDP",
		protocol: "TCP/UDP",
		category: "remote_access",
		risk: "High",
		descEn: "Remote Desktop Protocol. Remote control client for Windows operating systems.",
		descVi: "Giao thức điều khiển màn hình từ xa. Dịch vụ điều khiển Windows từ xa.",
		recommendEn:
			"Extremely targeted by ransomware. Place behind VPN/Gateway; enforce multi-factor authentication.",
		recommendVi:
			"Bị tấn công tống tiền rất nhiều. Đặt sau VPN/Gateway; yêu cầu xác thực đa nhân tố MFA.",
	},
	{
		port: "5432",
		service: "PostgreSQL",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "PostgreSQL Database listener port.",
		descVi: "Cổng lắng nghe cơ sở dữ liệu PostgreSQL.",
		recommendEn:
			"Restrict access lists in pg_hba.conf; require client SSL certificates for client connections.",
		recommendVi:
			"Giới hạn danh sách IP trong pg_hba.conf; bắt buộc chứng chỉ SSL cho các kết nối từ xa.",
	},
	{
		port: "6379",
		service: "Redis",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "Redis In-Memory Key-Value database query port.",
		descVi: "Cổng truy vấn bộ nhớ đệm / cơ sở dữ liệu Redis.",
		recommendEn:
			"Highly vulnerable. By default has no auth. Never expose to public interface. Enforce strong password.",
		recommendVi:
			"Rủi ro cực cao. Mặc định không mật khẩu. Không bao giờ mở ra Internet. Đặt mật khẩu cực mạnh.",
	},
	{
		port: "8080",
		service: "HTTP Alternative / Tomcat",
		protocol: "TCP",
		category: "web_email",
		risk: "Medium",
		descEn:
			"Alternative HTTP. Commonly used for local dev environments, proxies, and application dashboards.",
		descVi:
			"Cổng HTTP thay thế. Phổ biến cho môi trường lập trình local, máy chủ proxy, bảng điều khiển ứng dụng.",
		recommendEn:
			"Check application admin pages. Often lacks HTTPS configuration. Secure panels with proper auth/TLS.",
		recommendVi:
			"Kiểm tra các trang quản trị. Thường thiếu cấu hình HTTPS. Bảo mật các bảng điều khiển bằng auth/TLS.",
	},
	{
		port: "27017",
		service: "MongoDB",
		protocol: "TCP",
		category: "database",
		risk: "High",
		descEn: "MongoDB NoSQL Database portal.",
		descVi: "Cổng kết nối cơ sở dữ liệu NoSQL MongoDB.",
		recommendEn:
			"Easy ransomware target if exposed without credentials. Bind listener strictly to localhost / private VPC.",
		recommendVi:
			"Dễ bị tin tặc mã hóa tống tiền nếu thiếu mật khẩu. Ràng buộc lắng nghe ở localhost / mạng nội bộ.",
	},
];

export default function CommonPorts() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedRisk, setSelectedRisk] = useState<string>("all");

	const t = {
		en: {
			title: "Common Ports & Services Reference",
			desc: "A quick security reference guide listing standard network ports, active service protocols, vulnerability risk levels, and defensive firewall configurations.",
			searchPlaceholder: "Search by port, service name, description...",
			lblPort: "Port",
			lblService: "Service",
			lblProtocol: "Protocol",
			lblRisk: "Vulnerability Risk",
			lblRecommendation: "Security Recommendation",
			lblCategory: "Category",
			riskLow: "Low Risk",
			riskMedium: "Medium Risk",
			riskHigh: "High Risk / Critical",
			catAll: "All Categories",
			catWeb: "Web & Email",
			catDb: "Databases",
			catFile: "File Transfer",
			catRemote: "Remote Access",
			catInfra: "Infrastructure & Network",
			lblNoResults: "No port matching your query was found in the dictionary.",
			lblQuickCheck: "Quick Port Inspector",
			lblInspectorDesc: "Enter a port number to fetch security recommendations instantly.",
			btnCheck: "Check Port",
			lblSafetyAlert: "Exposure Policy",
		},
		vi: {
			title: "Cổng mạng & Dịch vụ phổ biến",
			desc: "Cẩm nang tra cứu bảo mật các cổng kết nối mạng phổ biến, mức độ rủi ro và các khuyến nghị cấu hình tường lửa an toàn.",
			searchPlaceholder: "Tìm kiếm bằng số cổng, tên dịch vụ, mô tả...",
			lblPort: "Cổng",
			lblService: "Dịch vụ",
			lblProtocol: "Giao thức",
			lblRisk: "Mức độ rủi ro",
			lblRecommendation: "Khuyến nghị bảo mật",
			lblCategory: "Phân loại",
			riskLow: "Rủi ro thấp",
			riskMedium: "Rủi ro trung bình",
			riskHigh: "Rủi ro cao / Nguy hiểm",
			catAll: "Tất cả danh mục",
			catWeb: "Web & Thư điện tử",
			catDb: "Cơ sở dữ liệu",
			catFile: "Truyền tải tệp tin",
			catRemote: "Truy cập từ xa",
			catInfra: "Hạ tầng & Thiết bị mạng",
			lblNoResults: "Không tìm thấy thông tin cổng mạng khớp với tìm kiếm.",
			lblQuickCheck: "Kiểm tra cổng nhanh",
			lblInspectorDesc: "Nhập một cổng mạng để xem khuyến nghị bảo mật tức thì.",
			btnCheck: "Tra cứu cổng",
			lblSafetyAlert: "Nguyên tắc mở cổng",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Filter database
	const filteredPorts = PORT_DATABASE.filter((item) => {
		const matchesSearch =
			item.port.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(lang === "en" ? item.descEn : item.descVi).toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCat =
			selectedCategory === "all" ||
			(selectedCategory === "web_email" && item.category === "web_email") ||
			(selectedCategory === "database" && item.category === "database") ||
			(selectedCategory === "file_transfer" && item.category === "file_transfer") ||
			(selectedCategory === "remote_access" && item.category === "remote_access") ||
			(selectedCategory === "infrastructure" && item.category === "infrastructure");

		const matchesRisk = selectedRisk === "all" || item.risk === selectedRisk;

		return matchesSearch && matchesCat && matchesRisk;
	});

	const getRiskColor = (risk: "Low" | "Medium" | "High") => {
		if (risk === "Low") return "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30";
		if (risk === "Medium") return "bg-accent-orange/10 text-accent-orange border-accent-orange/30";
		return "bg-accent-rose/10 text-accent-rose border-accent-rose/30";
	};

	return (
		<div class="space-y-6">
			{/* Top Header Card */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
				<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 mb-2">
					{t.title}
				</h3>
				<p class="text-body-sm text-muted leading-relaxed">{t.desc}</p>
			</div>

			{/* Filter Layout */}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Query Settings */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					{/* Search field */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">
							{lang === "en" ? "Search Service" : "Tìm kiếm dịch vụ"}
						</label>
						<input
							type="text"
							class="input w-full"
							placeholder={t.searchPlaceholder}
							value={searchQuery}
							onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Category Selector */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblCategory}</label>
						<select
							class="input w-full"
							value={selectedCategory}
							onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value)}
						>
							<option value="all">{t.catAll}</option>
							<option value="web_email">{t.catWeb}</option>
							<option value="database">{t.catDb}</option>
							<option value="file_transfer">{t.catFile}</option>
							<option value="remote_access">{t.catRemote}</option>
							<option value="infrastructure">{t.catInfra}</option>
						</select>
					</div>

					{/* Risk Level Selector */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblRisk}</label>
						<select
							class="input w-full"
							value={selectedRisk}
							onChange={(e) => setSelectedRisk((e.target as HTMLSelectElement).value)}
						>
							<option value="all">{lang === "en" ? "All Risks" : "Tất cả mức độ"}</option>
							<option value="Low">{t.riskLow}</option>
							<option value="Medium">{t.riskMedium}</option>
							<option value="High">{t.riskHigh}</option>
						</select>
					</div>

					{/* Exposure Policy Alert */}
					<div class="bg-accent-orange/5 border border-accent-orange/20 rounded-lg p-4 space-y-2 mt-4 text-body-xs">
						<span class="text-body-sm-strong text-accent-orange block font-bold">
							{t.lblSafetyAlert}
						</span>
						<p class="text-muted leading-relaxed">
							{lang === "en"
								? "Never expose management panels (RDP, SSH, Telnet) or databases (MySQL, Redis, MongoDB) to the public interface. Implement firewalls (iptables/UFW), secure ports with VPNs, and close unused listening ports."
								: "Không bao giờ mở công khai các cổng quản lý hệ thống (RDP, SSH, Telnet) hoặc CSDL (MySQL, Redis, MongoDB). Luôn sử dụng tường lửa, kết nối an toàn VPN và đóng các cổng không cần sử dụng."}
						</p>
					</div>
				</div>

				{/* Database listings grid */}
				<div class="lg:col-span-8 space-y-4">
					{filteredPorts.length === 0 ? (
						<div class="bg-surface-elevated rounded-lg p-8 border border-hairline text-center text-muted">
							{t.lblNoResults}
						</div>
					) : (
						<div class="space-y-4">
							{filteredPorts.map((item, index) => (
								<div
									key={index}
									class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3 hover:border-primary/40 transition-colors"
								>
									{/* Port and service details header */}
									<div class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
										<div class="flex items-center gap-3">
											<span class="text-body-strong font-mono bg-surface-soft px-3 py-1 rounded font-bold text-primary">
												Port {item.port}
											</span>
											<span class="text-body-strong font-bold text-ink">{item.service}</span>
											<span class="text-body-xs text-muted font-mono bg-surface-soft px-2 py-0.5 rounded">
												{item.protocol}
											</span>
										</div>
										<span
											class={`text-body-xs font-bold px-2.5 py-0.5 rounded-full border ${getRiskColor(
												item.risk,
											)}`}
										>
											{item.risk === "Low"
												? t.riskLow
												: item.risk === "Medium"
													? t.riskMedium
													: t.riskHigh}
										</span>
									</div>

									{/* Desc and recommendation details */}
									<div class="space-y-2 text-body-sm">
										<p class="text-body leading-relaxed">
											{lang === "en" ? item.descEn : item.descVi}
										</p>
										<div class="bg-surface-soft p-3.5 rounded-lg border-l-4 border-primary">
											<span class="text-body-xs-strong text-muted block font-bold mb-1">
												{t.lblRecommendation}
											</span>
											<p class="text-ink text-body-xs leading-relaxed">
												{lang === "en" ? item.recommendEn : item.recommendVi}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
