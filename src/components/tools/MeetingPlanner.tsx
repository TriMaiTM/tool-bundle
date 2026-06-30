import { useEffect, useState } from "preact/hooks";

interface TzRow {
	name: string;
	timezone: string;
}

const DEFAULT_TZS: TzRow[] = [
	{ name: "Hanoi (ICT)", timezone: "Asia/Ho_Chi_Minh" },
	{ name: "London (GMT/BST)", timezone: "Europe/London" },
	{ name: "New York (EST/EDT)", timezone: "America/New_York" },
	{ name: "Tokyo (JST)", timezone: "Asia/Tokyo" },
];

export default function MeetingPlanner() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [selectedHour, setSelectedHour] = useState(14); // 0-23 in primary timezone
	const [primaryTz, setPrimaryTz] = useState("Asia/Ho_Chi_Minh");
	const [tzList, setTzList] = useState<TzRow[]>(DEFAULT_TZS);
	const [newTzName, setNewTzName] = useState("");
	const [newTzValue, setNewTzValue] = useState("UTC");
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Meeting Time Planner",
			desc: "Compare working hour overlaps across timezones. Green is work (8am-6pm), Yellow is waking (6am-8am, 6pm-10pm), Red is sleep (10pm-6am).",
			lblPrimary: "Primary Timezone",
			lblHourSlider: "Select Hour of Day",
			lblAddTz: "Add Custom Timezone",
			lblLabel: "Label (e.g. Sydney)",
			lblTimezoneName: "Timezone",
			btnAdd: "Add Timezone",
			lblOverviews: "Timezone Overlaps",
			lblSelectedDetail: "Meeting Time Proposal",
			copied: "Copied!",
			copy: "Copy Proposal",
		},
		vi: {
			title: "Lên lịch họp đa múi giờ",
			desc: "So sánh sự giao thoa giờ làm việc giữa các múi giờ. Màu Xanh: Giờ làm (8h-18h), Vàng: Giờ rảnh (6h-8h, 18h-22h), Đỏ: Giờ ngủ (22h-6h).",
			lblPrimary: "Múi giờ chính",
			lblHourSlider: "Chọn giờ trong ngày",
			lblAddTz: "Thêm múi giờ khác",
			lblLabel: "Nhãn (ví dụ: Sydney)",
			lblTimezoneName: "Múi giờ",
			btnAdd: "Thêm",
			lblOverviews: "Bảng giờ các múi giờ",
			lblSelectedDetail: "Đề xuất thời gian họp",
			copied: "Đã chép!",
			copy: "Sao chép đề xuất",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Get corresponding hour in a target timezone from the primary timezone hour
	const getHourInTz = (primaryHour: number, targetTz: string) => {
		const d = new Date();
		// Set to primary timezone's date at primaryHour
		// Since JS Date uses local timezone, we can format a UTC baseline
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: primaryTz,
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			hour12: false,
		});

		const parts = formatter.formatToParts(d);
		const year = Number(parts.find((p) => p.type === "year")?.value);
		const month = Number(parts.find((p) => p.type === "month")?.value);
		const day = Number(parts.find((p) => p.type === "day")?.value);

		// Construct UTC date reflecting that timezone state
		const primaryDate = new Date(Date.UTC(year, month - 1, day, primaryHour));

		// Now format this date in the target timezone
		const targetFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: targetTz,
			hour: "numeric",
			hour12: false,
		});

		return Number(targetFormatter.format(primaryDate)) % 24;
	};

	const getHourStatusColor = (hour: number) => {
		if (hour >= 8 && hour < 18) {
			return "bg-accent-emerald text-white"; // Work hours
		}
		if (hour >= 22 || hour < 6) {
			return "bg-accent-rose text-white"; // Sleep hours
		}
		return "bg-accent-amber text-ink"; // Personal hours
	};

	const formatProposal = () => {
		const list = tzList.map((tz) => {
			const hr = getHourInTz(selectedHour, tz.timezone);
			const ampm = hr >= 12 ? "PM" : "AM";
			const displayHr = hr % 12 || 12;
			return `${tz.name}: ${displayHr}:00 ${ampm}`;
		});
		return list.join(" | ");
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(formatProposal());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const handleAddTz = () => {
		if (newTzName.trim()) {
			setTzList((prev) => [...prev, { name: newTzName.trim(), timezone: newTzValue }]);
			setNewTzName("");
		}
	};

	const handleRemoveTz = (idx: number) => {
		setTzList((prev) => prev.filter((_, i) => i !== idx));
	};

	// Suggestions for addable timezones
	const suggestions = [
		{ name: "UTC (GMT)", value: "UTC" },
		{ name: "Sydney (AEST)", value: "Australia/Sydney" },
		{ name: "San Francisco (PST)", value: "America/Los_Angeles" },
		{ name: "Berlin (CET)", value: "Europe/Berlin" },
		{ name: "New Delhi (IST)", value: "Asia/Kolkata" },
	];

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configurations panel */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Primary timezone selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblPrimary}</label>
						<select
							class="input w-full"
							value={primaryTz}
							onChange={(e) => setPrimaryTz((e.target as HTMLSelectElement).value)}
						>
							{tzList.map((tz) => (
								<option key={tz.timezone} value={tz.timezone}>
									{tz.name}
								</option>
							))}
						</select>
					</div>

					{/* Primary timezone hour slider */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblHourSlider}</label>
							<span class="font-mono text-primary font-bold">{selectedHour}:00</span>
						</div>
						<input
							type="range"
							min="0"
							max="23"
							value={selectedHour}
							onInput={(e) => setSelectedHour(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Add timezone form */}
					<div class="border-t border-hairline pt-4 space-y-3">
						<label class="text-body-sm-strong text-ink block">{t.lblAddTz}</label>
						<div class="space-y-2">
							<input
								type="text"
								class="input w-full"
								placeholder={t.lblLabel}
								value={newTzName}
								onInput={(e) => setNewTzName((e.target as HTMLInputElement).value)}
							/>
							<select
								class="input w-full"
								value={newTzValue}
								onChange={(e) => setNewTzValue((e.target as HTMLSelectElement).value)}
							>
								{suggestions.map((s) => (
									<option key={s.value} value={s.value}>
										{s.name}
									</option>
								))}
							</select>
							<button class="btn-primary w-full py-2" onClick={handleAddTz}>
								{t.btnAdd}
							</button>
						</div>
					</div>
				</div>

				{/* Overlap dashboard grids */}
				<div class="lg:col-span-8 space-y-6">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblOverviews}
						</h3>

						{/* Interactive timezone horizontal blocks */}
						<div class="space-y-4">
							{tzList.map((tz, idx) => {
								const currentHr = getHourInTz(selectedHour, tz.timezone);
								return (
									<div key={tz.timezone} class="space-y-1 relative group">
										<div class="flex justify-between items-center text-body-xs font-bold text-ink">
											<span>{tz.name}</span>
											<span class="font-mono text-primary">{currentHr}:00</span>
										</div>

										{/* 24 hour indicator strip */}
										<div class="grid grid-cols-24 gap-px bg-hairline rounded overflow-hidden h-8">
											{Array.from({ length: 24 }).map((_, hIdx) => {
												// Hours relative to primary selectedHour
												const calculatedHour = getHourInTz(hIdx, tz.timezone);
												const isSelected = calculatedHour === currentHr;
												return (
													<div
														key={hIdx}
														class={`flex items-center justify-center text-[9px] font-mono transition-all ${getHourStatusColor(
															calculatedHour,
														)} ${isSelected ? "ring-2 ring-primary ring-inset font-bold scale-105 z-10" : ""}`}
														title={`${calculatedHour}:00`}
													>
														{calculatedHour}
													</div>
												);
											})}
										</div>

										<button
											class="absolute right-0 -top-1.5 text-xs text-muted hover:text-accent-rose opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => handleRemoveTz(idx)}
										>
											×
										</button>
									</div>
								);
							})}
						</div>
					</div>

					{/* Copy proposal block */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblSelectedDetail}
						</h3>
						<div class="flex gap-2">
							<input
								readOnly
								type="text"
								class="input w-full font-mono text-body-xs bg-surface-soft"
								value={formatProposal()}
							/>
							<button
								class="btn-secondary py-2 px-4 text-xs whitespace-nowrap"
								onClick={handleCopy}
							>
								{copied ? t.copied : t.copy}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
