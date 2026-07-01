import { useEffect, useState } from "preact/hooks";

type SchemaType = "article" | "product" | "organization" | "localBusiness" | "event";

export default function SchemaGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [type, setType] = useState<SchemaType>("article");
	const [copied, setCopied] = useState(false);

	// Form field states
	const [headline, setHeadline] = useState("Example Article Headline");
	const [author, setAuthor] = useState("John Doe");
	const [publisher, setPublisher] = useState("My Publishing Inc.");
	const [datePublished, setDatePublished] = useState(new Date().toISOString().split("T")[0]);

	const [prodName, setProdName] = useState("Wireless Headset X");
	const [prodBrand, setProdBrand] = useState("SoundTech");
	const [prodPrice, setProdPrice] = useState("99.99");
	const [prodCurrency, setProdCurrency] = useState("USD");

	const [orgName, setOrgName] = useState("Global Softworks Ltd");
	const [orgUrl, setOrgUrl] = useState("https://globalsoftworks.com");
	const [orgLogo, setOrgLogo] = useState("https://globalsoftworks.com/logo.png");

	const [bizName, setBizName] = useState("Local Gourmet Bakery");
	const [bizAddress, setBizAddress] = useState("123 Main St, Springfield");
	const [bizPhone, setBizPhone] = useState("+1-555-0199");

	const [evtName, setEvtName] = useState("Developer Conference 2026");
	const [evtStart, setEvtStart] = useState("2026-10-15T09:00");
	const [evtLocation, setEvtLocation] = useState("Tech Center Arena");

	const t = {
		en: {
			title: "JSON-LD Schema Markup Generator",
			desc: "Select a schema structure type, fill in parameters, and retrieve standard Google-compatible JSON-LD structured data.",
			lblType: "Schema Structure Type",
			lblResults: "Generated JSON-LD Code",
			copied: "Copied!",
			copy: "Copy JSON-LD",
			headline: "Article Headline",
			author: "Author Name",
			publisher: "Publisher Name",
			datePub: "Date Published",
			prodName: "Product Name",
			prodBrand: "Product Brand",
			prodPrice: "Product Price",
			prodCurrency: "Price Currency",
			orgName: "Organization Name",
			orgUrl: "Website URL",
			orgLogo: "Logo Image URL",
			bizName: "Business Name",
			bizAddress: "Full Address",
			bizPhone: "Telephone",
			evtName: "Event Name",
			evtStart: "Event Start Time",
			evtLocation: "Location Name",
		},
		vi: {
			title: "Trình tạo cấu trúc Schema JSON-LD",
			desc: "Chọn cấu trúc thực thể, điền thông tin và sao chép mã cấu trúc dữ liệu JSON-LD tương thích chuẩn của Google.",
			lblType: "Loại thực thể Schema",
			lblResults: "Mã cấu trúc JSON-LD tạo được",
			copied: "Đã chép!",
			copy: "Sao chép mã",
			headline: "Tiêu đề bài viết",
			author: "Tên tác giả",
			publisher: "Tên nhà xuất bản",
			datePub: "Ngày xuất bản",
			prodName: "Tên sản phẩm",
			prodBrand: "Thương hiệu",
			prodPrice: "Giá bán sản phẩm",
			prodCurrency: "Đơn vị tiền tệ",
			orgName: "Tên tổ chức",
			orgUrl: "Đường dẫn website",
			orgLogo: "Đường dẫn ảnh Logo",
			bizName: "Tên cửa hàng",
			bizAddress: "Địa chỉ đầy đủ",
			bizPhone: "Số điện thoại",
			evtName: "Tên sự kiện",
			evtStart: "Thời gian bắt đầu sự kiện",
			evtLocation: "Tên địa điểm diễn ra",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generate JSON-LD string based on selected schema type
	const generateSchemaJson = () => {
		let schemaObject: Record<string, any> = {};

		switch (type) {
			case "article":
				schemaObject = {
					"@context": "https://schema.org",
					"@type": "NewsArticle",
					headline: headline,
					datePublished: datePublished,
					author: {
						"@type": "Person",
						name: author,
					},
					publisher: {
						"@type": "Organization",
						name: publisher,
					},
				};
				break;
			case "product":
				schemaObject = {
					"@context": "https://schema.org",
					"@type": "Product",
					name: prodName,
					brand: {
						"@type": "Brand",
						name: prodBrand,
					},
					offers: {
						"@type": "Offer",
						price: prodPrice,
						priceCurrency: prodCurrency,
						availability: "https://schema.org/InStock",
					},
				};
				break;
			case "organization":
				schemaObject = {
					"@context": "https://schema.org",
					"@type": "Organization",
					name: orgName,
					url: orgUrl,
					logo: orgLogo,
				};
				break;
			case "localBusiness":
				schemaObject = {
					"@context": "https://schema.org",
					"@type": "LocalBusiness",
					name: bizName,
					address: {
						"@type": "PostalAddress",
						streetAddress: bizAddress,
					},
					telephone: bizPhone,
				};
				break;
			case "event":
				schemaObject = {
					"@context": "https://schema.org",
					"@type": "Event",
					name: evtName,
					startDate: evtStart,
					location: {
						"@type": "Place",
						name: evtLocation,
					},
				};
				break;
		}

		return `<script type="application/ld+json">\n${JSON.stringify(schemaObject, null, 2)}\n</script>`;
	};

	const copySchema = () => {
		navigator.clipboard.writeText(generateSchemaJson());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
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

					{/* Schema selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblType}</label>
						<select
							class="input w-full"
							value={type}
							onChange={(e) => setType((e.target as HTMLSelectElement).value as SchemaType)}
						>
							<option value="article">Article</option>
							<option value="product">Product</option>
							<option value="organization">Organization</option>
							<option value="localBusiness">Local Business</option>
							<option value="event">Event</option>
						</select>
					</div>

					{/* Dynamic Inputs block based on type */}
					<div class="space-y-3 pt-2 border-t border-hairline">
						{type === "article" && (
							<>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.headline}</label>
									<input
										type="text"
										class="input w-full"
										value={headline}
										onInput={(e) => setHeadline((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.author}</label>
									<input
										type="text"
										class="input w-full"
										value={author}
										onInput={(e) => setAuthor((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.publisher}</label>
									<input
										type="text"
										class="input w-full"
										value={publisher}
										onInput={(e) => setPublisher((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.datePub}</label>
									<input
										type="date"
										class="input w-full"
										value={datePublished}
										onChange={(e) => setDatePublished((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{type === "product" && (
							<>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.prodName}</label>
									<input
										type="text"
										class="input w-full"
										value={prodName}
										onInput={(e) => setProdName((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.prodBrand}</label>
									<input
										type="text"
										class="input w-full"
										value={prodBrand}
										onInput={(e) => setProdBrand((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.prodPrice}</label>
									<input
										type="text"
										class="input w-full font-mono"
										value={prodPrice}
										onInput={(e) => setProdPrice((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.prodCurrency}</label>
									<input
										type="text"
										class="input w-full font-mono"
										value={prodCurrency}
										onInput={(e) => setProdCurrency((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{type === "organization" && (
							<>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.orgName}</label>
									<input
										type="text"
										class="input w-full"
										value={orgName}
										onInput={(e) => setOrgName((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.orgUrl}</label>
									<input
										type="text"
										class="input w-full font-mono"
										value={orgUrl}
										onInput={(e) => setOrgUrl((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.orgLogo}</label>
									<input
										type="text"
										class="input w-full font-mono"
										value={orgLogo}
										onInput={(e) => setOrgLogo((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{type === "localBusiness" && (
							<>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.bizName}</label>
									<input
										type="text"
										class="input w-full"
										value={bizName}
										onInput={(e) => setBizName((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.bizAddress}</label>
									<input
										type="text"
										class="input w-full"
										value={bizAddress}
										onInput={(e) => setBizAddress((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.bizPhone}</label>
									<input
										type="text"
										class="input w-full font-mono"
										value={bizPhone}
										onInput={(e) => setBizPhone((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{type === "event" && (
							<>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.evtName}</label>
									<input
										type="text"
										class="input w-full"
										value={evtName}
										onInput={(e) => setEvtName((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.evtStart}</label>
									<input
										type="datetime-local"
										class="input w-full font-mono"
										value={evtStart}
										onChange={(e) => setEvtStart((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-body-sm text-ink font-bold">{t.evtLocation}</label>
									<input
										type="text"
										class="input w-full"
										value={evtLocation}
										onInput={(e) => setEvtLocation((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Code Output panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					<div class="flex gap-2">
						<textarea
							readOnly
							class="input w-full h-96 font-mono text-xs bg-surface-soft"
							value={generateSchemaJson()}
						/>
						<button class="btn-secondary text-xs px-3 align-top py-2" onClick={copySchema}>
							{copied ? t.copied : t.copy}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
