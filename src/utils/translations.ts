export const translations = {
	en: {
		// Header & Navigation
		"nav.home": "Home",
		"nav.blog": "Blog",
		"nav.workflow": "Workflow",
		"nav.categories": "Categories",
		"nav.search_placeholder": "Search tools...",
		"nav.changelog": "Changelog",
		"nav.settings": "Settings",

		// Footer
		"footer.desc": "Offline-first web utilities. No uploads. No accounts. Instant results.",
		"footer.tools": "Tools",
		"footer.system": "System",
		"footer.privacy": "Privacy Policy",
		"footer.terms": "Terms of Service",

		// Settings
		"settings.title": "Settings",
		"settings.desc":
			"Customize your ToolBundle experience. All preferences are saved locally in your browser.",
		"settings.appearance": "Appearance",
		"settings.light": "Light",
		"settings.dark": "Dark",
		"settings.system": "System",
		"settings.accent": "Primary Accent Color",
		"settings.lang": "Language",
		"settings.workflows": "Workflows",
		"settings.autorun": "Auto-run scripts",
		"settings.autorun_desc":
			"Execute pipeline workflow steps automatically when block inputs change.",
		"settings.cache": "Browser cache used:",
		"settings.reset": "Clear Data & Reset App",
		"settings.reset_confirm":
			"Are you sure you want to clear all browser data and reset the settings? This will delete your workflow canvas blocks and personal preferences.",

		// Changelog
		"changelog.title": "Changelog",
		"changelog.desc":
			"Keep track of the latest updates, features, and improvements added to ToolBundle.",
		"changelog.latest": "Latest Release",
		"changelog.past": "Past Releases",

		// Homepage Hero
		"home.tools_live": "{count} tools live • 100% client-side",
		"home.headline": "Power Locally.",
		"home.headline_red": "Process Instantly.",
		"home.subheading":
			"Over {count} browser-based tools for PDF, images, text, and code. Process everything locally with zero server uploads.",
		"home.btn_browse": "Browse All Tools",
		"home.btn_popular": "Popular Tools",

		// Homepage Browser Engine Widget
		"home.widget_title": "Browser Engine Architecture",
		"home.widget_webassembly_title": "WebAssembly & ONNX Runtime",
		"home.widget_webassembly_desc":
			"Runs machine learning models locally inside your browser cache.",
		"home.widget_canvas_title": "Local Canvas & Cryptography",
		"home.widget_canvas_desc":
			"Manipulates files and encodes keys directly on your device's CPU/GPU.",
		"home.widget_private_title": "Mathematically Private",
		"home.widget_private_desc": "Your files never leave your device. 0KB sent to external servers.",

		// Homepage Featured & Visual Pipelines
		"home.popular_title": "Most Popular",
		"home.popular_subtitle": "The tools people use most frequently",
		"home.popular_all": "All tools →",
		"home.spotlight": "Spotlight",
		"home.launch_tool": "Launch Tool",

		"home.pipeline_flagship": "Flagship Feature",
		"home.pipeline_title": "Visual Tool Pipelines",
		"home.pipeline_desc":
			"Stop running formatting and conversion tools one by one. Drag, drop, and connect tools on an interactive visual canvas to build custom local workflows that execute instantly on your device.",
		"home.pipeline_canvas_title": "Interactive Flow Canvas",
		"home.pipeline_canvas_desc":
			"Connect encoders, string formatters, and hashing algorithms visually.",
		"home.pipeline_inspector_title": "Dynamic Parameters Inspector",
		"home.pipeline_inspector_desc":
			"Configure custom parameters (e.g., indent width, search terms) on each node.",
		"home.pipeline_private_title": "100% Client-Side Privacy",
		"home.pipeline_private_desc":
			"Everything runs in your browser's local sandbox memory. Zero data uploaded.",
		"home.pipeline_btn": "Build Custom Pipeline",

		// Simulation Widget
		"home.simulation_title": "Data Migration Pipeline",
		"home.simulation_ready": "Ready",
		"home.simulation_csv_desc": "Parse input CSV table",
		"home.simulation_find_replace": "Find & Replace",
		"home.simulation_replace_desc": "Replace empty with null",
		"home.simulation_hash_desc": "Generate raw SHA hex",
		"home.simulation_exec_time": "Execution Time: ",
		"home.simulation_secure": "100% Secure & Sandboxed",

		// Categories & All tools
		"home.categories_title": "Browse by Category",
		"home.categories_subtitle": "Find the right tool for the job",
		"home.all_tools_title": "All Tools",
		"home.all_tools_subtitle": "{count} tools sorted alphabetically",

		// Why section / Built different
		"home.built_different": "Built Different",
		"home.built_diff_privacy_title": "Mathematical Browser Privacy",
		"home.built_diff_privacy_desc":
			"Your files and keys never touch our servers. ToolBundle compiles tools into WebAssembly and processes files locally using standard browser engine APIs.",
		"home.built_diff_privacy_bullet1": "✓ No Servers",
		"home.built_diff_privacy_bullet2": "✓ Local Web Crypto",
		"home.built_diff_privacy_bullet3": "✓ Sandboxed",
		"home.built_diff_instant_title": "Instant Execution",
		"home.built_diff_instant_desc":
			"No upload waiting, no queuing. Results generate instantly because all processing utilizes your local device hardware.",
		"home.built_diff_instant_footer": "Runs at native speed",
		"home.built_diff_free_title": "Unlimited & Free",
		"home.built_diff_free_desc":
			"No subscription popups, no account creation barriers. PWA offline compatibility guarantees access anywhere.",
		"home.built_diff_free_footer": "100% Client-Side",

		// Categories
		"cat.image": "Image",
		"cat.image.title": "Image Tools",
		"cat.image.desc": "Convert, resize, compress, and edit images: 100% in your browser.",
		"cat.text": "Text",
		"cat.text.title": "Text Tools",
		"cat.text.desc": "Count words, convert cases, generate slugs, and transform text instantly.",
		"cat.developer": "Developer",
		"cat.developer.title": "Developer Tools",
		"cat.developer.desc": "Format JSON, encode Base64, test regex, and more dev utilities.",
		"cat.pdf": "PDF",
		"cat.pdf.title": "PDF Tools",
		"cat.pdf.desc": "Merge, split, compress, and edit PDF files privately in your browser.",
		"cat.math": "Math",
		"cat.math.title": "Math & Calculators",
		"cat.math.desc": "Calculators, converters, and math solvers for everyday use.",
		"cat.security": "Security",
		"cat.security.title": "Security Tools",
		"cat.security.desc": "Generate passwords, QR codes, hashes, and encrypt data securely.",
		"cat.color": "Color",
		"cat.color.title": "Color Tools",
		"cat.color.desc": "Pick, convert, generate, and test colors for design and development.",
		"cat.datetime": "Date & Time",
		"cat.datetime.title": "Date & Time Tools",
		"cat.datetime.desc": "Countdown timers, timezone converters, date calculators, and more.",
		"cat.seo": "SEO & Marketing",
		"cat.seo.title": "SEO & Marketing",
		"cat.seo.desc": "Generate meta tags, robots.txt, sitemaps, and optimize for search engines.",
		"cat.data": "Data",
		"cat.data.title": "Data & Spreadsheet",
		"cat.data.desc": "Convert between CSV, JSON, and other data formats instantly.",
		"cat.fun": "Fun",
		"cat.fun.title": "Fun & Utility",
		"cat.fun.desc": "Random generators, dice rollers, wheel spinners, and fun tools.",
		"cat.education": "Education",
		"cat.education.title": "Education & Students",
		"cat.education.desc":
			"Flashcards, quizzes, grade calculators, citation generators, and study tools.",
		"cat.finance": "Finance",
		"cat.finance.title": "Finance & Money",
		"cat.finance.desc":
			"Currency converters, loan calculators, budget trackers, and investment tools.",
		"cat.health": "Health",
		"cat.health.title": "Health & Medical",
		"cat.health.desc": "BMI, calorie, sleep cycle, body fat calculators and health tools.",
		"cat.video": "Video & Audio",
		"cat.video.title": "Video & Audio",
		"cat.video.desc": "Convert, trim, compress video and audio files in your browser.",
		"cat.ai": "AI Tools",
		"cat.ai.title": "AI Tools",
		"cat.ai.desc": "AI-powered tools running 100% in your browser: private, fast, free.",
		"cat.utility": "Utility",
		"cat.utility.title": "Utility Tools",
		"cat.utility.desc":
			"Link shortener, invoice generator, signature maker, favicon generator, notepad.",
		"cat.account": "Identity",
		"cat.account.title": "Account & Identity",
		"cat.account.desc": "Generate usernames, validate emails, phones, credit cards, and IBANs.",
		"cat.game": "Game",
		"cat.game.title": "Game Tools",
		"cat.game.desc":
			"Error code lookup, DPI calculator, sensitivity converter, crosshair generator, and more.",

		// Favorites & Collections
		"fav.your_favorites": "Your Favorites",
		"fav.recently_used": "Recently Used",
		"fav.favorites_btn": "Favorites",
		"fav.recent_btn": "Recent",
		"fav.no_favorites": "No favorites yet. Click the heart icon on any tool to save it here.",
		"fav.no_recent": "No recently visited tools yet. Start using tools to see your history.",
		"coll.your_collections": "Your Collections",
		"coll.desc": "Organize tools into custom groups for quick access",
		"coll.new_collection": "New Collection",
		"coll.create_new": "Create New Collection",
		"coll.edit": "Edit Collection",
		"coll.name_label": "Collection Name *",
		"coll.name_placeholder": "e.g., My Dev Toolkit",
		"coll.desc_label": "Description (optional)",
		"coll.desc_placeholder": "What's this collection for?",
		"coll.color_label": "Accent Color",
		"coll.cancel": "Cancel",
		"coll.save": "Save Changes",
		"coll.create": "Create Collection",
		"coll.no_collections": "No collections yet",
		"coll.no_collections_desc":
			"Create your first collection to organize your favorite tools, or start with a suggestion below.",
		"coll.create_custom": "Create Custom Collection",
		"coll.create_first": "Create Your First Collection",
		"coll.suggested": "Suggested Collections",
		"coll.add_to_my": "Add to My Collections",
		"coll.no_tools": "No tools added yet",
		"coll.tools_in_coll": "Tools in this collection",
		"coll.edit_btn": "Edit",
		"coll.delete_btn": "Delete",
		"coll.confirm_btn": "Confirm",
		"coll.no_tools_in_coll":
			"No tools in this collection yet. Use the 'Add to Collection' button on any tool page.",
	},
	vi: {
		// Header & Navigation
		"nav.home": "Trang chủ",
		"nav.blog": "Blog",
		"nav.workflow": "Quy trình",
		"nav.categories": "Danh mục",
		"nav.search_placeholder": "Tìm kiếm công cụ...",
		"nav.changelog": "Nhật ký thay đổi",
		"nav.settings": "Cài đặt",

		// Footer
		"footer.desc": "Công cụ web chạy offline. Không tải lên. Không tài khoản. Kết quả tức thì.",
		"footer.tools": "Công cụ",
		"footer.system": "Hệ thống",
		"footer.privacy": "Chính sách bảo mật",
		"footer.terms": "Điều khoản dịch vụ",

		// Settings
		"settings.title": "Cài đặt",
		"settings.desc":
			"Tùy chỉnh trải nghiệm ToolBundle của bạn. Tất cả tùy chọn được lưu cục bộ trên trình duyệt.",
		"settings.appearance": "Giao diện",
		"settings.light": "Sáng",
		"settings.dark": "Tối",
		"settings.system": "Hệ thống",
		"settings.accent": "Màu chủ đạo",
		"settings.lang": "Ngôn ngữ",
		"settings.workflows": "Quy trình",
		"settings.autorun": "Tự động chạy script",
		"settings.autorun_desc":
			"Tự động thực thi các bước trong quy trình khi dữ liệu đầu vào thay đổi.",
		"settings.cache": "Bộ nhớ cache đã dùng:",
		"settings.reset": "Xóa dữ liệu & Đặt lại ứng dụng",
		"settings.reset_confirm":
			"Bạn có chắc chắn muốn xóa toàn bộ dữ liệu trình duyệt và đặt lại cài đặt không? Thao tác này sẽ xóa các khối quy trình và tùy chọn cá nhân của bạn.",

		// Changelog
		"changelog.title": "Nhật ký thay đổi",
		"changelog.desc": "Theo dõi các cập nhật, tính năng mới và cải tiến được thêm vào ToolBundle.",
		"changelog.latest": "Bản phát hành mới nhất",
		"changelog.past": "Bản phát hành trước",

		// Homepage Hero
		"home.tools_live": "{count} công cụ hoạt động • 100% client-side",
		"home.headline": "Sức mạnh cục bộ.",
		"home.headline_red": "Xử lý tức thì.",
		"home.subheading":
			"Hơn {count} công cụ chạy trên trình duyệt cho PDF, hình ảnh, văn bản và mã nguồn. Xử lý cục bộ không tải lên máy chủ.",
		"home.btn_browse": "Duyệt tất cả công cụ",
		"home.btn_popular": "Công cụ phổ biến",

		// Homepage Browser Engine Widget
		"home.widget_title": "Kiến trúc xử lý tại trình duyệt",
		"home.widget_webassembly_title": "WebAssembly & ONNX Runtime",
		"home.widget_webassembly_desc":
			"Chạy trực tiếp các mô hình học máy trong bộ nhớ cache trình duyệt của bạn.",
		"home.widget_canvas_title": "Local Canvas & Xử lý",
		"home.widget_canvas_desc":
			"Xử lý tệp tin và mã hóa khóa trực tiếp trên CPU/GPU thiết bị của bạn.",
		"home.widget_private_title": "Bảo mật tuyệt đối",
		"home.widget_private_desc":
			"Tệp tin của bạn không bao giờ rời khỏi thiết bị. 0KB dữ liệu gửi đi.",

		// Homepage Featured & Visual Pipelines
		"home.popular_title": "Phổ biến nhất",
		"home.popular_subtitle": "Các công cụ được sử dụng thường xuyên nhất",
		"home.popular_all": "Tất cả công cụ →",
		"home.spotlight": "Nổi bật",
		"home.launch_tool": "Khởi chạy công cụ",

		"home.pipeline_flagship": "Tính năng nổi bật",
		"home.pipeline_title": "Quy trình công cụ trực quan",
		"home.pipeline_desc":
			"Không còn phải chạy từng công cụ định dạng và chuyển đổi một cách thủ công. Kéo, thả và kết nối các công cụ trên một bản vẽ trực quan để xây dựng quy trình cục bộ chạy ngay trên thiết bị.",
		"home.pipeline_canvas_title": "Bản vẽ quy trình trực quan",
		"home.pipeline_canvas_desc":
			"Kết nối trực quan các bộ mã hóa, định dạng chuỗi và băm thuật toán.",
		"home.pipeline_inspector_title": "Bảng cấu hình tham số",
		"home.pipeline_inspector_desc":
			"Cấu hình các tham số tùy chỉnh (như độ rộng thò thụt, từ tìm kiếm) trên từng khối.",
		"home.pipeline_private_title": "Bảo mật 100% tại Client",
		"home.pipeline_private_desc":
			"Mọi thứ chạy hoàn toàn trong vùng bộ nhớ hộp cát (sandbox) cục bộ. Không tải lên máy chủ.",
		"home.pipeline_btn": "Tự dựng quy trình",

		// Simulation Widget
		"home.simulation_title": "Quy trình chuyển đổi dữ liệu",
		"home.simulation_ready": "Sẵn sàng",
		"home.simulation_csv_desc": "Phân tích bảng CSV đầu vào",
		"home.simulation_find_replace": "Tìm & Thay thế",
		"home.simulation_replace_desc": "Thay thế ô trống bằng null",
		"home.simulation_hash_desc": "Tạo chuỗi mã SHA hex",
		"home.simulation_exec_time": "Thời gian chạy: ",
		"home.simulation_secure": "Bảo mật & Hộp cát 100%",

		// Categories & All tools
		"home.categories_title": "Duyệt theo Danh mục",
		"home.categories_subtitle": "Tìm kiếm công cụ phù hợp với nhu cầu",
		"home.all_tools_title": "Tất cả công cụ",
		"home.all_tools_subtitle": "{count} công cụ sắp xếp theo thứ tự bảng chữ cái",

		// Why section / Built different
		"home.built_different": "Được thiết kế khác biệt",
		"home.built_diff_privacy_title": "Bảo mật trình duyệt tuyệt đối",
		"home.built_diff_privacy_desc":
			"Tệp tin và mã khóa của bạn không bao giờ gửi tới máy chủ của chúng tôi. ToolBundle biên dịch các công cụ thành WebAssembly và xử lý tệp cục bộ bằng API trình duyệt tiêu chuẩn.",
		"home.built_diff_privacy_bullet1": "✓ Không Máy chủ",
		"home.built_diff_privacy_bullet2": "✓ Mã hóa Web Cục bộ",
		"home.built_diff_privacy_bullet3": "✓ Hộp cát an toàn",
		"home.built_diff_instant_title": "Thực thi Tức thì",
		"home.built_diff_instant_desc":
			"Không thời gian chờ tải lên, không xếp hàng. Kết quả được tạo tức thì vì mọi quy trình xử lý đều sử dụng phần cứng thiết bị cục bộ của bạn.",
		"home.built_diff_instant_footer": "Chạy với tốc độ nguyên bản",
		"home.built_diff_free_title": "Không giới hạn & Miễn phí",
		"home.built_diff_free_desc":
			"Không có thông báo đăng ký thuê bao, không rào cản tạo tài khoản. Khả năng tương thích PWA ngoại tuyến đảm bảo truy cập mọi lúc mọi nơi.",
		"home.built_diff_free_footer": "100% tại Client",

		// Categories
		"cat.image": "Hình ảnh",
		"cat.image.title": "Công cụ Hình ảnh",
		"cat.image.desc":
			"Chuyển đổi, thay đổi kích thước, nén và chỉnh sửa hình ảnh: 100% trên trình duyệt.",
		"cat.text": "Văn bản",
		"cat.text.title": "Công cụ Văn bản",
		"cat.text.desc": "Đếm từ, chuyển đổi chữ hoa/thường, tạo slug và biến đổi văn bản tức thì.",
		"cat.developer": "Lập trình",
		"cat.developer.title": "Công cụ Lập trình",
		"cat.developer.desc":
			"Định dạng JSON, mã hóa Base64, kiểm tra regex và các tiện ích lập trình khác.",
		"cat.pdf": "PDF",
		"cat.pdf.title": "Công cụ PDF",
		"cat.pdf.desc":
			"Ghép, tách, nén và chỉnh sửa tệp PDF một cách riêng tư trong trình duyệt của bạn.",
		"cat.math": "Toán học",
		"cat.math.title": "Toán học & Máy tính",
		"cat.math.desc": "Máy tính, bộ chuyển đổi và trình giải toán cho nhu cầu hàng ngày.",
		"cat.security": "Bảo mật",
		"cat.security.title": "Công cụ Bảo mật",
		"cat.security.desc": "Tạo mật khẩu, mã QR, mã băm và mã hóa dữ liệu một cách an toàn.",
		"cat.color": "Màu sắc",
		"cat.color.title": "Công cụ Màu sắc",
		"cat.color.desc": "Chọn, chuyển đổi, tạo và kiểm tra màu sắc phục vụ thiết kế và phát triển.",
		"cat.datetime": "Ngày & Giờ",
		"cat.datetime.title": "Công cụ Ngày & Giờ",
		"cat.datetime.desc":
			"Đồng hồ đếm ngược, chuyển đổi múi giờ, tính toán ngày tháng và nhiều hơn nữa.",
		"cat.seo": "SEO & Marketing",
		"cat.seo.title": "SEO & Marketing",
		"cat.seo.desc": "Tạo thẻ meta, robots.txt, sơ đồ trang web và tối ưu hóa cho công cụ tìm kiếm.",
		"cat.data": "Dữ liệu",
		"cat.data.title": "Dữ liệu & Bảng tính",
		"cat.data.desc":
			"Chuyển đổi tức thì giữa các định dạng dữ liệu CSV, JSON và các định dạng khác.",
		"cat.fun": "Giải trí",
		"cat.fun.title": "Giải trí & Tiện ích",
		"cat.fun.desc": "Trình tạo ngẫu nhiên, tung xúc xắc, vòng quay may mắn và các công cụ vui vẻ.",
		"cat.education": "Giáo dục",
		"cat.education.title": "Giáo dục & Học sinh",
		"cat.education.desc": "Thẻ ghi nhớ, câu đố, tính điểm, tạo trích dẫn và công cụ học tập.",
		"cat.finance": "Tài chính",
		"cat.finance.title": "Tài chính & Tiền tệ",
		"cat.finance.desc": "Chuyển đổi tiền tệ, tính khoản vay, theo dõi ngân sách và công cụ đầu tư.",
		"cat.health": "Sức khỏe",
		"cat.health.title": "Sức khỏe & Y tế",
		"cat.health.desc": "Máy tính BMI, calo, chu kỳ giấc ngủ, lượng mỡ cơ thể và công cụ sức khỏe.",
		"cat.video": "Video & Âm thanh",
		"cat.video.title": "Video & Âm thanh",
		"cat.video.desc": "Chuyển đổi, cắt, nén tệp video và âm thanh trong trình duyệt của bạn.",
		"cat.ai": "AI Tools",
		"cat.ai.title": "Công cụ AI",
		"cat.ai.desc":
			"Công cụ tích hợp AI chạy 100% trên trình duyệt: riêng tư, nhanh chóng, miễn phí.",
		"cat.utility": "Tiện ích",
		"cat.utility.title": "Tiện ích & Ứng dụng",
		"cat.utility.desc": "Rút ngắn liên kết, tạo hóa đơn, tạo chữ ký, tạo favicon, sổ ghi chép.",
		"cat.account": "Định danh",
		"cat.account.title": "Tài khoản & Định danh",
		"cat.account.desc": "Tạo tên người dùng, xác thực email, điện thoại, thẻ tín dụng và IBAN.",
		"cat.game": "Trò chơi",
		"cat.game.title": "Công cụ Trò chơi",
		"cat.game.desc":
			"Tra cứu mã lỗi, máy tính DPI, chuyển đổi độ nhạy, tạo tâm ngắm và nhiều hơn nữa.",

		// Favorites & Collections
		"fav.your_favorites": "Yêu thích của bạn",
		"fav.recently_used": "Sử dụng gần đây",
		"fav.favorites_btn": "Yêu thích",
		"fav.recent_btn": "Gần đây",
		"fav.no_favorites":
			"Chưa có mục yêu thích nào. Nhấp vào biểu tượng trái tim trên bất kỳ công cụ nào để lưu tại đây.",
		"fav.no_recent":
			"Chưa có công cụ nào đã xem gần đây. Hãy bắt đầu sử dụng để xem lịch sử của bạn.",
		"coll.your_collections": "Bộ sưu tập của bạn",
		"coll.desc": "Sắp xếp công cụ thành các nhóm tùy chỉnh để truy cập nhanh",
		"coll.new_collection": "Bộ sưu tập mới",
		"coll.create_new": "Tạo bộ sưu tập mới",
		"coll.edit": "Sửa bộ sưu tập",
		"coll.name_label": "Tên bộ sưu tập *",
		"coll.name_placeholder": "VD: Công cụ lập trình của tôi",
		"coll.desc_label": "Mô tả (tùy chọn)",
		"coll.desc_placeholder": "Bộ sưu tập này dùng để làm gì?",
		"coll.color_label": "Màu chủ đạo",
		"coll.cancel": "Hủy",
		"coll.save": "Lưu thay đổi",
		"coll.create": "Tạo bộ sưu tập",
		"coll.no_collections": "Chưa có bộ sưu tập nào",
		"coll.no_collections_desc":
			"Tạo bộ sưu tập đầu tiên để sắp xếp các công cụ yêu thích của bạn, hoặc bắt đầu với một gợi ý dưới đây.",
		"coll.create_custom": "Tạo bộ sưu tập tùy chỉnh",
		"coll.create_first": "Tạo bộ sưu tập đầu tiên",
		"coll.suggested": "Bộ sưu tập gợi ý",
		"coll.add_to_my": "Thêm vào bộ sưu tập của tôi",
		"coll.no_tools": "Chưa có công cụ nào được thêm",
		"coll.tools_in_coll": "Các công cụ trong bộ sưu tập này",
		"coll.edit_btn": "Sửa",
		"coll.delete_btn": "Xóa",
		"coll.confirm_btn": "Xác nhận",
		"coll.no_tools_in_coll":
			"Chưa có công cụ nào trong bộ sưu tập này. Sử dụng nút 'Thêm vào bộ sưu tập' trên bất kỳ trang công cụ nào.",
	},
};
