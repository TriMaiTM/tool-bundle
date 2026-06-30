import { useEffect, useState } from "preact/hooks";

interface CityClock {
	name: string;
	nameVi: string;
	timezone: string;
	id: string;
}

const DEFAULT_CITIES: CityClock[] = [
	{ id: "hanoi", name: "Hanoi", nameVi: "Hà Nội", timezone: "Asia/Ho_Chi_Minh" },
	{ id: "tokyo", name: "Tokyo", nameVi: "Tokyo", timezone: "Asia/Tokyo" },
	{ id: "london", name: "London", nameVi: "Luân Đôn", timezone: "Europe/London" },
	{ id: "paris", name: "Paris", nameVi: "Paris", timezone: "Europe/Paris" },
	{ id: "newyork", name: "New York", nameVi: "New York", timezone: "America/New_York" },
	{ id: "sydney", name: "Sydney", nameVi: "Sydney", timezone: "Australia/Sydney" },
];

export default function WorldClock() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [time, setTime] = useState(new Date());
	const [cities, setCities] = useState<CityClock[]>(DEFAULT_CITIES);
	const [searchQuery, setSearchQuery] = useState("");
	const [copiedCity, setCopiedCity] = useState<string | null>(null);

	const t = {
		en: {
			title: "World Clock Dashboard",
			desc: "Track current time across multiple global cities simultaneously with clean digital readouts and search capabilities.",
			lblSearch: "Search cities (e.g. London, New York)...",
			lblResults: "Current Times",
			lblTz: "Timezone",
			copied: "Copied!",
			copy: "Copy Time",
			dateLabel: "Date",
		},
		vi: {
			title: "Bảng giờ thế giới",
			desc: "Theo dõi thời gian hiện tại của nhiều thành phố lớn trên thế giới cùng một lúc với định dạng giờ chuẩn và tìm kiếm múi giờ.",
			lblSearch: "Tìm kiếm thành phố (ví dụ: Luân Đôn, New York)...",
			lblResults: "Thời gian hiện tại",
			lblTz: "Múi giờ",
			copied: "Đã chép!",
			copy: "Sao chép giờ",
			dateLabel: "Ngày tháng",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}

		const timer = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const getCityTime = (timezone: string) => {
		try {
			return time.toLocaleTimeString(lang === "en" ? "en-US" : "vi-VN", {
				timeZone: timezone,
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: true,
			});
		} catch (e) {
			return "--:--:--";
		}
	};

	const getCityDate = (timezone: string) => {
		try {
			return time.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
				timeZone: timezone,
				weekday: "short",
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (e) {
			return "";
		}
	};

	const handleCopy = (formattedTime: string, id: string) => {
		navigator.clipboard.writeText(formattedTime);
		setCopiedCity(id);
		setTimeout(() => setCopiedCity(null), 1500);
	};

	// Standard lists of supported global timezones for search
	const tzSuggestions: CityClock[] = [
		{ id: "la", name: "Los Angeles", nameVi: "Los Angeles", timezone: "America/Los_Angeles" },
		{ id: "singapore", name: "Singapore", nameVi: "Singapore", timezone: "Asia/Singapore" },
		{ id: "seoul", name: "Seoul", nameVi: "Seoul", timezone: "Asia/Seoul" },
		{ id: "dubai", name: "Dubai", nameVi: "Dubai", timezone: "Asia/Dubai" },
		{ id: "berlin", name: "Berlin", nameVi: "Berlin", timezone: "Europe/Berlin" },
		{ id: "moscow", name: "Moscow", nameVi: "Mát-xcơ-va", timezone: "Europe/Moscow" },
		{ id: "bangkok", name: "Bangkok", nameVi: "Băng Cốc", timezone: "Asia/Bangkok" },
		{ id: "beijing", name: "Beijing", nameVi: "Bắc Kinh", timezone: "Asia/Shanghai" },
	];

	const handleAddCity = (city: CityClock) => {
		if (!cities.some((c) => c.timezone === city.timezone)) {
			setCities((prev) => [...prev, city]);
		}
		setSearchQuery("");
	};

	const handleRemoveCity = (id: string) => {
		setCities((prev) => prev.filter((c) => c.id !== id));
	};

	const filteredSuggestions = searchQuery.trim()
		? tzSuggestions.filter(
				(c) =>
					c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					c.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
					c.timezone.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: [];

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Search Panel */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					<div class="space-y-2 relative">
						<input
							type="text"
							class="input w-full"
							placeholder={t.lblSearch}
							value={searchQuery}
							onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
						/>

						{filteredSuggestions.length > 0 && (
							<div class="absolute z-10 w-full bg-surface border border-hairline rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
								{filteredSuggestions.map((city) => (
									<button
										key={city.id}
										class="w-full text-left px-4 py-2 hover:bg-surface-soft text-body-sm text-ink cursor-pointer focus:outline-none"
										onClick={() => handleAddCity(city)}
									>
										<div class="font-bold">{lang === "en" ? city.name : city.nameVi}</div>
										<div class="text-xs text-muted font-mono">{city.timezone}</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Clocks Dashboard Grid */}
				<div class="lg:col-span-8 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{cities.map((city) => {
							const cityTime = getCityTime(city.timezone);
							const cityDate = getCityDate(city.timezone);
							return (
								<div
									key={city.id}
									class="bg-surface-soft border border-hairline rounded-lg p-4 flex flex-col justify-between hover:border-primary/30 transition-colors relative group"
								>
									<button
										class="absolute top-2 right-2 text-muted hover:text-accent-rose text-xs opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={() => handleRemoveCity(city.id)}
										title="Remove"
									>
										×
									</button>
									<div class="space-y-1">
										<span class="text-body-strong text-ink font-bold block">
											{lang === "en" ? city.name : city.nameVi}
										</span>
										<span class="text-[10px] text-muted font-mono block">
											{t.lblTz}: {city.timezone}
										</span>
										<span class="text-body-xs text-muted block">
											{t.dateLabel}: {cityDate}
										</span>
									</div>

									<div class="mt-4 space-y-2">
										<div class="text-2xl font-mono font-bold text-primary tracking-wider">
											{cityTime}
										</div>

										<button
											class="btn-secondary w-full py-1 text-[10px] uppercase font-bold"
											onClick={() => handleCopy(cityTime, city.id)}
										>
											{copiedCity === city.id ? t.copied : t.copy}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
