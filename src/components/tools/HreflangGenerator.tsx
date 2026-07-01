import { useEffect, useState } from "preact/hooks";

interface HreflangRow {
	langCode: string;
	countryCode: string;
	url: string;
}

export default function HreflangGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [baseUrl, setBaseUrl] = useState("https://mysite.com");
	const [xDefaultUrl, setXDefaultUrl] = useState("https://mysite.com/en");
	const [includeXDefault, setIncludeXDefault] = useState(true);

	// Alternate translations list
	const [rows, setRows] = useState<HreflangRow[]>([
		{ langCode: "en", countryCode: "us", url: "https://mysite.com/en" },
		{ langCode: "vi", countryCode: "vn", url: "https://mysite.com/vi" },
		{ langCode: "fr", countryCode: "fr", url: "https://mysite.com/fr" },
	]);

	const [newLang, setNewLang] = useState("es");
	const [newCountry, setNewCountry] = useState("");
	const [newUrl, setNewUrl] = useState("https://mysite.com/es");
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Multilingual Hreflang Tag Generator",
			desc: "Generate alternate link configurations to inform search engines of international versions of your pages.",
			lblBase: "Default Page URL",
			lblXDefault: "x-default URL (Global Fallback)",
			lblAlternate: "Add Alternate Language Version",
			lblLang: "Language Code (e.g. es, de)",
			lblCountry: "Region / Country Code (Optional - e.g. mx, de)",
			lblAlternateUrl: "Alternative URL",
			btnAdd: "Add Alternate Link",
			lblResults: "Generated Hreflang Tags",
			copied: "Copied!",
			copy: "Copy Tags Block",
			colLang: "Language-Region",
			colUrl: "Target URL",
			colAction: "Action",
		},
		vi: {
			title: "Tạo thẻ Hreflang đa ngôn ngữ",
			desc: "Tự động sinh các liên kết cấu hình ngôn ngữ thay thế để thông báo cho các công cụ tìm kiếm về phiên bản quốc gia.",
			lblBase: "Đường dẫn trang mặc định",
			lblXDefault: "Mã x-default URL (Mặc định toàn cầu)",
			lblAlternate: "Thêm ngôn ngữ thay thế",
			lblLang: "Mã ngôn ngữ (ví dụ: es, de)",
			lblCountry: "Mã quốc gia/vùng (Không bắt buộc - ví dụ: mx, de)",
			lblAlternateUrl: "Liên kết thay thế",
			btnAdd: "Thêm ngôn ngữ",
			lblResults: "Danh sách thẻ Hreflang",
			copied: "Đã chép!",
			copy: "Sao chép khối thẻ",
			colLang: "Ngôn ngữ-Vùng",
			colUrl: "URL tương ứng",
			colAction: "Hành động",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const addRow = () => {
		if (newLang.trim() && newUrl.trim()) {
			setRows((prev) => [
				...prev,
				{
					langCode: newLang.trim().toLowerCase(),
					countryCode: newCountry.trim().toLowerCase(),
					url: newUrl.trim(),
				},
			]);
			setNewLang("");
			setNewCountry("");
			setNewUrl(baseUrl);
		}
	};

	const removeRow = (idx: number) => {
		setRows((prev) => prev.filter((_, i) => i !== idx));
	};

	const generateTags = () => {
		const list: string[] = [];

		// Include x-default if checked
		if (includeXDefault && xDefaultUrl.trim()) {
			list.push(`<link rel="alternate" hreflang="x-default" href="${xDefaultUrl.trim()}" />`);
		}

		for (const r of rows) {
			const hreflang = r.countryCode ? `${r.langCode}-${r.countryCode}` : r.langCode;
			list.push(`<link rel="alternate" hreflang="${hreflang}" href="${r.url}" />`);
		}

		return list.join("\n");
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(generateTags());
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

					{/* Base default page URL */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblBase}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={baseUrl}
							onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* x-default setup */}
					<div class="space-y-2 border-t border-hairline pt-3">
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="includeX"
								checked={includeXDefault}
								onChange={(e) => setIncludeXDefault((e.target as HTMLInputElement).checked)}
								class="w-4 h-4 rounded text-primary focus:ring-primary"
							/>
							<label htmlFor="includeX" class="text-body-sm text-ink cursor-pointer select-none">
								{t.lblXDefault}
							</label>
						</div>
						{includeXDefault && (
							<input
								type="text"
								class="input w-full font-mono text-body-sm"
								value={xDefaultUrl}
								onInput={(e) => setXDefaultUrl((e.target as HTMLInputElement).value)}
							/>
						)}
					</div>

					{/* Add form */}
					<div class="border-t border-hairline pt-3 space-y-3">
						<label class="text-body-sm-strong text-ink block">{t.lblAlternate}</label>
						<div class="grid grid-cols-2 gap-2">
							<input
								type="text"
								class="input text-body-sm"
								placeholder={t.lblLang}
								value={newLang}
								onInput={(e) => setNewLang((e.target as HTMLInputElement).value)}
							/>
							<input
								type="text"
								class="input text-body-sm"
								placeholder="Country/Region Code (optional)"
								value={newCountry}
								onInput={(e) => setNewCountry((e.target as HTMLInputElement).value)}
							/>
						</div>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							placeholder="URL"
							value={newUrl}
							onInput={(e) => setNewUrl((e.target as HTMLInputElement).value)}
						/>
						<button class="btn-primary w-full py-2" onClick={addRow}>
							{t.btnAdd}
						</button>
					</div>
				</div>

				{/* Code and Rows details panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Result Alternate XML code block */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h3>

						<div class="flex gap-2">
							<textarea
								readOnly
								class="input w-full h-36 font-mono text-xs bg-surface-soft"
								value={generateTags()}
							/>
							<button class="btn-secondary text-xs px-3 align-top py-2" onClick={handleCopy}>
								{copied ? t.copied : t.copy}
							</button>
						</div>
					</div>

					{/* Manage list table */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							Alternate Language List
						</h3>

						<div class="border border-hairline rounded-lg overflow-hidden bg-surface-soft">
							<table class="w-full text-left text-body-sm border-collapse">
								<thead>
									<tr class="bg-surface-elevated text-ink font-bold border-b border-hairline">
										<th class="p-3">{t.colLang}</th>
										<th class="p-3">{t.colUrl}</th>
										<th class="p-3 text-center">{t.colAction}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-hairline">
									{rows.map((row, idx) => {
										const code = row.countryCode
											? `${row.langCode}-${row.countryCode}`
											: row.langCode;
										return (
											<tr key={idx} class="hover:bg-surface-elevated/40">
												<td class="p-3 font-mono font-bold text-primary">{code}</td>
												<td class="p-3 font-mono text-xs truncate max-w-xs">{row.url}</td>
												<td class="p-3 text-center">
													<button
														class="text-xs text-accent-rose font-bold"
														onClick={() => removeRow(idx)}
													>
														{lang === "en" ? "Remove" : "Xóa"}
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
