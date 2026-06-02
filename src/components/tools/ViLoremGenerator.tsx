import { useCallback, useEffect, useState } from "preact/hooks";

const VI_WORDS = [
	"đất nước",
	"quê hương",
	"non sông",
	"biển bạc",
	"đồng lúa",
	"tre xanh",
	"cánh cò",
	"con đò",
	"sông nước",
	"mẹ hiền",
	"hoa sen",
	"bình yên",
	"hạnh phúc",
	"yêu thương",
	"nắng ấm",
	"mưa sa",
	"gió thổi",
	"mây ngàn",
	"bình minh",
	"hoàng hôn",
	"thanh bình",
	"ấm no",
	"tươi đẹp",
	"rực rỡ",
	"bát ngát",
	"mênh mông",
	"chân trời",
	"ngày mai",
	"khát vọng",
	"niềm tin",
	"ước mơ",
	"tương lai",
	"hoài bão",
	"kiên cường",
	"dũng cảm",
	"hiền hòa",
	"mộc mạc",
	"giản dị",
	"thân thương",
	"ấm áp",
	"ngọt ngào",
	"dịu dàng",
	"bao dung",
	"chia sẻ",
	"đùm bọc",
	"thủy chung",
	"sắt son",
	"thân thiện",
	"thương mến",
	"bình dị",
	"yên vui",
	"rộn ràng",
	"tấp nập",
	"phố phường",
	"làng quê",
	"ngõ vắng",
];

const VI_SURNAMES = [
	"Nguyễn",
	"Trần",
	"Lê",
	"Phạm",
	"Hoàng",
	"Phan",
	"Vũ",
	"Võ",
	"Đặng",
	"Bùi",
	"Đỗ",
	"Hồ",
	"Ngô",
	"Dương",
	"Lý",
];
const VI_MIDNAMES_MALE = [
	"Văn",
	"Đăng",
	"Minh",
	"Hữu",
	"Đức",
	"Trọng",
	"Thế",
	"Anh",
	"Xuân",
	"Quốc",
	"Khánh",
	"Ngọc",
	"Gia",
	"Duy",
];
const VI_MIDNAMES_FEMALE = [
	"Thị",
	"Hồng",
	"Thu",
	"Minh",
	"Ngọc",
	"Thanh",
	"Như",
	"Kim",
	"Quỳnh",
	"Khánh",
	"Bảo",
	"Diệu",
	"Phương",
	"Trúc",
];
const VI_NAMES_MALE = [
	"Hùng",
	"Cường",
	"Tuấn",
	"Nam",
	"Hải",
	"Sơn",
	"Long",
	"Đức",
	"Tân",
	"Phong",
	"Khang",
	"Phúc",
	"Kính",
	"Lâm",
	"Huy",
	"Hoàng",
	"Bình",
	"Tùng",
	"Khoa",
];
const VI_NAMES_FEMALE = [
	"Hoa",
	"Lan",
	"Mai",
	"Cúc",
	"Trúc",
	"Vy",
	"Linh",
	"Thảo",
	"Hà",
	"Trang",
	"Anh",
	"Phương",
	"Huyền",
	"Yến",
	"Oanh",
	"Nhi",
	"Nhung",
	"Châu",
	"Hương",
];

const VI_STREETS = [
	"Lê Lợi",
	"Nguyễn Huệ",
	"Trần Hưng Đạo",
	"Hai Bà Trưng",
	"Lê Duẩn",
	"Nguyễn Trãi",
	"Phan Chu Trinh",
	"Lý Thường Kiệt",
	"Cách Mạng Tháng Tám",
	"Hoàng Hoa Thám",
	"Điện Biên Phủ",
	"Nguyễn Thị Minh Khai",
	"Bùi Viện",
	"Đồng Khởi",
	"Tràng Tiền",
	"Phan Đình Phùng",
	"Chùa Bộc",
	"Cầu Giấy",
	"Kim Mã",
];
const VI_WARDS = [
	"Phường 1",
	"Phường 5",
	"Phường Bến Nghé",
	"Phường Hàng Đào",
	"Phường Láng Hạ",
	"Phường Thảo Điền",
	"Phường Dịch Vọng",
	"Phường An Khánh",
];
const VI_DISTRICTS = [
	"Quận 1",
	"Quận 3",
	"Quận Bình Thạnh",
	"Quận Cầu Giấy",
	"Quận Hoàn Kiếm",
	"Quận Đống Đa",
	"Thành phố Thủ Đức",
	"Quận Hải Châu",
	"Quận Ninh Kiều",
];
const VI_PROVINCES = [
	"TP. Hồ Chí Minh",
	"Hà Nội",
	"Đà Nẵng",
	"Hải Phòng",
	"Cần Thơ",
	"Bình Dương",
	"Đồng Nai",
	"Lâm Đồng",
	"Khánh Hòa",
	"Quảng Ninh",
	"Thừa Thiên Huế",
];

const VI_COMPANIES = [
	"Vingroup",
	"Viettel",
	"FPT",
	"Vinamilk",
	"Vietcombank",
	"Masan",
	"Thế Giới Di Động",
	"Hòa Phát",
	"Petrolimex",
	"Vietnam Airlines",
];
const VI_COMPANY_SUFFIXES = ["Tập đoàn", "Công ty Cổ phần", "Công ty TNHH", "Tổng Công ty"];

const VI_BANKS = [
	"Vietcombank",
	"Techcombank",
	"BIDV",
	"Agribank",
	"MB Bank",
	"ACB",
	"VPBank",
	"Sacombank",
	"TPBank",
];
const VI_JOBS = [
	"Lập trình viên",
	"Designer",
	"Tester",
	"Quản lý dự án (PM)",
	"Kế toán viên",
	"Nhân viên Marketing",
	"Giám đốc kinh doanh",
	"Nhân viên nhân sự",
	"Giáo viên",
	"Bác sĩ",
];

export default function ViLoremGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [activeTab, setActiveTab] = useState<"lorem" | "fake">("lorem");

	// Lorem States
	const [loremMode, setLoremMode] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
	const [loremCount, setLoremCount] = useState<number>(3);
	const [loremResult, setLoremResult] = useState<string>("");

	// Fake Data States
	const [fakeCount, setFakeCount] = useState<number>(5);
	const [fakeFormat, setFakeFormat] = useState<"json" | "csv" | "text">("json");
	const [fakeResult, setFakeResult] = useState<string>("");

	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Vietnamese Lorem Ipsum & Fake Data Generator",
			tabLorem: "Vietnamese Lorem Ipsum",
			tabFake: "Fake Vietnamese Data",
			typeLabel: "Generate Type",
			countLabel: "Amount",
			formatLabel: "Output Format",
			generateBtn: "Generate Content",
			copyBtn: "Copy to Clipboard",
			copied: "Copied!",
			paragraphs: "Paragraphs",
			sentences: "Sentences",
			words: "Words",
			placeholderLorem: "Click 'Generate' to create Vietnamese placeholder text...",
			placeholderFake: "Click 'Generate' to create fake Vietnamese identities...",
		},
		vi: {
			title: "Lorem Ipsum tiếng Việt & Tạo dữ liệu giả lập",
			tabLorem: "Lorem Ipsum Tiếng Việt",
			tabFake: "Dữ liệu Giả lập Việt Nam",
			typeLabel: "Chế độ tạo",
			countLabel: "Số lượng",
			formatLabel: "Định dạng xuất",
			generateBtn: "Tạo nội dung",
			copyBtn: "Sao chép vào bộ nhớ tạm",
			copied: "Đã copy!",
			paragraphs: "Đoạn văn",
			sentences: "Câu",
			words: "Từ",
			placeholderLorem: "Nhấn 'Tạo nội dung' để tạo văn bản tiếng Việt mẫu...",
			placeholderFake: "Nhấn 'Tạo nội dung' để tạo danh sách thông tin giả lập...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generator Helpers
	const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
	const randRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

	const generateViWords = (count: number): string => {
		const result: string[] = [];
		for (let i = 0; i < count; i++) {
			result.push(rand(VI_WORDS));
		}
		return result.join(" ");
	};

	const generateViSentence = (): string => {
		const wordCount = randRange(6, 14);
		const words = generateViWords(wordCount);
		return `${words.charAt(0).toUpperCase() + words.slice(1)}.`;
	};

	const generateViParagraph = (): string => {
		const sentenceCount = randRange(3, 6);
		return Array.from({ length: sentenceCount }, () => generateViSentence()).join(" ");
	};

	const removeVietnameseTones = (str: string): string => {
		let result = str.toLowerCase();
		result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
		result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
		result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
		result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
		result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
		result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
		result = result.replace(/đ/g, "d");
		return result;
	};

	const generateFakeIdentity = () => {
		const isMale = Math.random() > 0.5;
		const surname = rand(VI_SURNAMES);
		const midname = isMale ? rand(VI_MIDNAMES_MALE) : rand(VI_MIDNAMES_FEMALE);
		const givenname = isMale ? rand(VI_NAMES_MALE) : rand(VI_NAMES_FEMALE);
		const fullname = `${surname} ${midname} ${givenname}`;

		// Email
		const cleanName = removeVietnameseTones(`${givenname}.${surname}`).replace(/\s/g, "");
		const email = `${cleanName}${randRange(10, 99)}@example.com`;

		// Phone
		const phonePrefixes = [
			"090",
			"091",
			"098",
			"032",
			"033",
			"070",
			"077",
			"083",
			"084",
			"086",
			"097",
		];
		const phone = rand(phonePrefixes) + Array.from({ length: 7 }, () => randRange(0, 9)).join("");

		// Address
		const address = `Số ${randRange(1, 450)} Đường ${rand(VI_STREETS)}, ${rand(VI_WARDS)}, ${rand(VI_DISTRICTS)}, ${rand(VI_PROVINCES)}`;

		// CCCD
		const cccdPrefixes = ["001", "002", "048", "079", "080", "092"];
		const cccd =
			rand(cccdPrefixes) +
			randRange(1, 3).toString() +
			randRange(70, 99).toString() +
			Array.from({ length: 6 }, () => randRange(0, 9)).join("");

		// Bank
		const bank = rand(VI_BANKS);
		const bankAccount = Array.from({ length: randRange(10, 14) }, () => randRange(0, 9)).join("");

		// Dob
		const dob = `${randRange(1, 28).toString().padStart(2, "0")}/${randRange(1, 12).toString().padStart(2, "0")}/${randRange(1975, 2004)}`;

		// Company
		const company = `${rand(VI_COMPANY_SUFFIXES)} ${rand(VI_COMPANIES)}`;
		const job = rand(VI_JOBS);

		return {
			fullname,
			email,
			phone,
			address,
			cccd,
			dob,
			bank,
			bankAccount,
			company,
			job,
		};
	};

	const handleGenerateLorem = () => {
		let text = "";
		if (loremMode === "paragraphs") {
			text = Array.from({ length: loremCount }, () => generateViParagraph()).join("\n\n");
		} else if (loremMode === "sentences") {
			text = Array.from({ length: loremCount }, () => generateViSentence()).join(" ");
		} else {
			text = generateViWords(loremCount);
		}
		setLoremResult(text);
	};

	const handleGenerateFake = () => {
		const list = Array.from({ length: fakeCount }, () => generateFakeIdentity());

		let text = "";
		if (fakeFormat === "json") {
			text = JSON.stringify(list, null, 2);
		} else if (fakeFormat === "csv") {
			const headers =
				"Họ và tên,Email,Số điện thoại,Địa chỉ,CCCD,Ngày sinh,Ngân hàng,Số tài khoản,Công ty,Nghề nghiệp";
			const rows = list.map(
				(item) =>
					`"${item.fullname}","${item.email}","${item.phone}","${item.address}","${item.cccd}","${item.dob}","${item.bank}","${item.bankAccount}","${item.company}","${item.job}"`,
			);
			text = [headers, ...rows].join("\n");
		} else {
			text = list
				.map(
					(item, idx) =>
						`Hồ sơ #${idx + 1}
- Họ và tên: ${item.fullname}
- Ngày sinh: ${item.dob}
- Số điện thoại: ${item.phone}
- Email: ${item.email}
- Địa chỉ: ${item.address}
- CCCD/CMND: ${item.cccd}
- Tài khoản: ${item.bankAccount} (${item.bank})
- Công ty: ${item.company}
- Nghề nghiệp: ${item.job}`,
				)
				.join("\n\n");
		}
		setFakeResult(text);
	};

	const handleCopy = () => {
		const targetText = activeTab === "lorem" ? loremResult : fakeResult;
		if (!targetText) return;
		navigator.clipboard.writeText(targetText).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div class="space-y-6">
			{/* Tab Switcher */}
			<div
				class="rounded-lg border border-hairline overflow-hidden p-1 bg-surface-soft"
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					width: "100%",
					maxWidth: "448px",
					marginLeft: "auto",
					marginRight: "auto",
				}}
			>
				<button
					class={`py-2 text-body-sm font-bold rounded-md transition-all cursor-pointer text-center ${
						activeTab === "lorem" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-ink"
					}`}
					onClick={() => {
						setActiveTab("lorem");
						setCopied(false);
					}}
				>
					{t.tabLorem}
				</button>
				<button
					class={`py-2 text-body-sm font-bold rounded-md transition-all cursor-pointer text-center ${
						activeTab === "fake" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-ink"
					}`}
					onClick={() => {
						setActiveTab("fake");
						setCopied(false);
					}}
				>
					{t.tabFake}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Left Config Panel */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2">Config</h3>

					{activeTab === "lorem" ? (
						<>
							{/* Lorem Generator Config */}
							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.typeLabel}</label>
								<div class="grid grid-cols-3 gap-1">
									{(["paragraphs", "sentences", "words"] as const).map((modeOption) => (
										<button
											key={modeOption}
											class={`py-2 px-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer text-center ${
												loremMode === modeOption
													? "bg-primary border-primary text-white"
													: "bg-surface-soft border-hairline text-ink hover:border-primary"
											}`}
											onClick={() => setLoremMode(modeOption)}
										>
											{t[modeOption]}
										</button>
									))}
								</div>
							</div>

							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.countLabel}</label>
								<input
									type="number"
									min="1"
									max="100"
									class="input"
									value={loremCount}
									onInput={(e) =>
										setLoremCount(
											Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
										)
									}
								/>
							</div>

							<button class="btn-primary w-full py-2.5" onClick={handleGenerateLorem}>
								{t.generateBtn}
							</button>
						</>
					) : (
						<>
							{/* Fake Data Generator Config */}
							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.formatLabel}</label>
								<div class="grid grid-cols-3 gap-1">
									{(["json", "csv", "text"] as const).map((formatOption) => (
										<button
											key={formatOption}
											class={`py-2 px-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer text-center uppercase ${
												fakeFormat === formatOption
													? "bg-primary border-primary text-white"
													: "bg-surface-soft border-hairline text-ink hover:border-primary"
											}`}
											onClick={() => setFakeFormat(formatOption)}
										>
											{formatOption}
										</button>
									))}
								</div>
							</div>

							<div>
								<label class="text-body-sm-strong text-ink block mb-2">{t.countLabel}</label>
								<input
									type="number"
									min="1"
									max="50"
									class="input"
									value={fakeCount}
									onInput={(e) =>
										setFakeCount(
											Math.max(
												1,
												Math.min(50, Number.parseInt((e.target as HTMLInputElement).value) || 1),
											),
										)
									}
								/>
							</div>

							<button class="btn-primary w-full py-2.5" onClick={handleGenerateFake}>
								{t.generateBtn}
							</button>
						</>
					)}
				</div>

				{/* Right Result Panel */}
				<div class="lg:col-span-8 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<div class="flex justify-between items-center border-b border-hairline pb-3">
							<h3 class="text-body-strong text-ink">Output</h3>
							{((activeTab === "lorem" && loremResult) || (activeTab === "fake" && fakeResult)) && (
								<button
									class="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
									onClick={handleCopy}
								>
									{copied ? (
										<>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="var(--color-accent-emerald)"
												stroke-width="3"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
											{t.copied}
										</>
									) : (
										<>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
												<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
											</svg>
											{t.copyBtn}
										</>
									)}
								</button>
							)}
						</div>

						<textarea
							class="textarea font-mono text-body-sm w-full"
							style={{ minHeight: "350px" }}
							readOnly
							placeholder={activeTab === "lorem" ? t.placeholderLorem : t.placeholderFake}
							value={activeTab === "lorem" ? loremResult : fakeResult}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
