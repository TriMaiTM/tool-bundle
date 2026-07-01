import { useEffect, useState } from "preact/hooks";

interface PresetCategory {
	name: string;
	nameVi: string;
	tags: string[];
}

const PRESET_TAGS: PresetCategory[] = [
	{
		name: "Tech & Reviews",
		nameVi: "Công nghệ & Đánh giá",
		tags: [
			"tech review",
			"unboxing",
			"gadgets",
			"smartphone test",
			"software tutorial",
			"new technology",
			"specs comparison",
			"hands on review",
			"future tech",
		],
	},
	{
		name: "Gaming & Streams",
		nameVi: "Trò chơi & Phát trực tiếp",
		tags: [
			"let's play",
			"gameplay walkthrough",
			"live stream",
			"gaming news",
			"pro tips",
			"speedrun",
			"esports",
			"funny moments",
			"console comparison",
		],
	},
	{
		name: "Cooking & Food",
		nameVi: "Nấu ăn & Ẩm thực",
		tags: [
			"easy recipe",
			"cooking tutorial",
			"food review",
			"baking guide",
			"healthy meals",
			"street food",
			"kitchen hacks",
			"dinner ideas",
			"quick breakfast",
		],
	},
	{
		name: "Finance & Investing",
		nameVi: "Tài chính & Đầu tư",
		tags: [
			"personal finance",
			"stock market",
			"passive income",
			"budgeting tips",
			"investing guide",
			"crypto news",
			"saving money",
			"financial freedom",
			"side hustle",
		],
	},
];

export default function YoutubeTags() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
	const [customTagInput, setCustomTagInput] = useState("");
	const [addedTags, setAddedTags] = useState<string[]>([
		"youtube seo",
		"video marketing",
		"content creator",
	]);
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "YouTube Tags & Keywords Generator",
			desc: "Select category presets or add custom keywords to build your comma-separated YouTube tags list. Character limit is 500.",
			lblCategory: "Niche Category Presets",
			lblCustom: "Add Custom Tag",
			lblAdded: "My Video Tags List",
			copied: "Copied!",
			copy: "Copy Tags (Comma-separated)",
			characters: "characters",
			empty: "Add tags to start compiling the video tag list.",
		},
		vi: {
			title: "Tạo thẻ từ khóa YouTube",
			desc: "Chọn các mẫu gợi ý theo chủ đề hoặc tự thêm từ khóa để lập danh sách thẻ YouTube phân tách bằng dấu phẩy. Giới hạn 500 ký tự.",
			lblCategory: "Gợi ý thẻ theo chủ đề",
			lblCustom: "Thêm từ khóa tự chọn",
			lblAdded: "Danh sách thẻ của bạn",
			copied: "Đã chép!",
			copy: "Sao chép thẻ (Dấu phẩy)",
			characters: "ký tự",
			empty: "Hãy chọn hoặc thêm từ khóa để bắt đầu lập danh sách.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const addTag = (tagStr: string) => {
		const clean = tagStr.trim().toLowerCase();
		if (clean && !addedTags.includes(clean)) {
			// Calculate if characters count remains under 500
			const nextTagsString = [...addedTags, clean].join(",");
			if (nextTagsString.length <= 500) {
				setAddedTags((prev) => [...prev, clean]);
			}
		}
	};

	const removeTag = (tagStr: string) => {
		setAddedTags((prev) => prev.filter((t) => t !== tagStr));
	};

	const handleAddCustom = () => {
		if (customTagInput.trim()) {
			addTag(customTagInput);
			setCustomTagInput("");
		}
	};

	const getTagsString = () => addedTags.join(", ");
	const currentCharactersCount = getTagsString().length;

	const handleCopy = () => {
		navigator.clipboard.writeText(getTagsString());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Preset & Input Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Category selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblCategory}</label>
						<select
							class="input w-full"
							value={selectedCategoryIdx}
							onChange={(e) =>
								setSelectedCategoryIdx(Number((e.target as HTMLSelectElement).value))
							}
						>
							{PRESET_TAGS.map((cat, idx) => (
								<option key={idx} value={idx}>
									{lang === "en" ? cat.name : cat.nameVi}
								</option>
							))}
						</select>
					</div>

					{/* Gợi ý tags deck */}
					<div class="flex flex-wrap gap-1.5 p-2.5 bg-surface-soft border border-hairline rounded-lg max-h-48 overflow-y-auto">
						{PRESET_TAGS[selectedCategoryIdx].tags.map((tag) => {
							const isAdded = addedTags.includes(tag);
							return (
								<button
									key={tag}
									class={`text-[10px] py-1 px-2 rounded-full border transition-all cursor-pointer ${
										isAdded
											? "bg-primary/5 border-primary/20 text-primary cursor-default opacity-50"
											: "bg-surface-elevated border-hairline text-ink hover:border-primary"
									}`}
									disabled={isAdded}
									onClick={() => addTag(tag)}
								>
									+ {tag}
								</button>
							);
						})}
					</div>

					{/* Custom Input */}
					<div class="space-y-1.5 pt-2 border-t border-hairline">
						<label class="text-body-sm-strong text-ink block">{t.lblCustom}</label>
						<div class="flex gap-2">
							<input
								type="text"
								class="input w-full font-mono text-body-sm"
								value={customTagInput}
								onInput={(e) => setCustomTagInput((e.target as HTMLInputElement).value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
								placeholder="e.g. gameplay"
							/>
							<button class="btn-primary py-2 px-4 shrink-0" onClick={handleAddCustom}>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Results & Added Tags List */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex justify-between items-center border-b border-hairline pb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.lblAdded}</h3>
						<span
							class={`font-mono text-xs ${currentCharactersCount > 450 ? "text-accent-rose font-bold" : "text-muted"}`}
						>
							{currentCharactersCount} / 500 {t.characters}
						</span>
					</div>

					{addedTags.length === 0 ? (
						<div class="text-center py-12 text-muted text-body-sm italic">{t.empty}</div>
					) : (
						<div class="space-y-4">
							{/* Added tags pills stack */}
							<div class="flex flex-wrap gap-2">
								{addedTags.map((tag) => (
									<div
										key={tag}
										class="flex items-center gap-1 bg-surface-soft border border-hairline rounded-full px-2.5 py-1 text-xs text-ink font-medium"
									>
										<span>{tag}</span>
										<button
											class="text-muted hover:text-accent-rose font-bold ml-1 text-sm leading-none"
											onClick={() => removeTag(tag)}
										>
											×
										</button>
									</div>
								))}
							</div>

							{/* Outputs code area */}
							<div class="space-y-1.5 pt-2 border-t border-hairline">
								<div class="flex gap-2">
									<textarea
										readOnly
										class="input w-full h-24 font-mono text-xs bg-surface-soft"
										value={getTagsString()}
									/>
									<button class="btn-secondary text-xs px-3 align-top py-2" onClick={handleCopy}>
										{copied ? t.copied : t.copy}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
