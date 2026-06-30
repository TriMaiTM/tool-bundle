import { useEffect, useState } from "preact/hooks";

export default function CalendarGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [year, setYear] = useState(new Date().getFullYear());
	const [month, setMonth] = useState(new Date().getMonth()); // 0-11
	const [startOnMonday, setStartOnMonday] = useState(true);
	const [events, setEvents] = useState<Record<string, string>>({});
	const [selectedDayForEvent, setSelectedDayForEvent] = useState<number | null>(null);
	const [eventTextInput, setEventTextInput] = useState("");
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "Printable Calendar Generator",
			desc: "Create clean calendar layouts for any year and month. Double click on days to add local event markers.",
			lblYear: "Select Year",
			lblMonth: "Select Month",
			lblStart: "Start Week On",
			mon: "Monday",
			sun: "Sunday",
			lblPreview: "Calendar Preview",
			btnPrint: "Print Calendar Layout",
			btnMarkdown: "Copy Markdown Table",
			copied: "Copied!",
			copy: "Copy",
			lblAddEvent: "Add Event to Day",
			btnSaveEvent: "Save Event",
			btnDeleteEvent: "Delete",
		},
		vi: {
			title: "Tạo và in lịch biểu",
			desc: "Tạo lịch biểu hàng tháng cho bất kỳ năm nào. Bấm vào ô ngày để thêm sự kiện hoặc ghi chú cục bộ.",
			lblYear: "Chọn năm",
			lblMonth: "Chọn tháng",
			lblStart: "Tuần bắt đầu vào",
			mon: "Thứ Hai",
			sun: "Chủ Nhật",
			lblPreview: "Xem trước lịch biểu",
			btnPrint: "In lịch biểu",
			btnMarkdown: "Sao chép Markdown Table",
			copied: "Đã chép!",
			copy: "Sao chép",
			lblAddEvent: "Thêm sự kiện vào ngày",
			btnSaveEvent: "Lưu sự kiện",
			btnDeleteEvent: "Xóa bỏ",
		},
	}[lang];

	const monthsEng = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const monthsVi = [
		"Tháng 1",
		"Tháng 2",
		"Tháng 3",
		"Tháng 4",
		"Tháng 5",
		"Tháng 6",
		"Tháng 7",
		"Tháng 8",
		"Tháng 9",
		"Tháng 10",
		"Tháng 11",
		"Tháng 12",
	];
	const monthLabel = lang === "en" ? monthsEng[month] : monthsVi[month];

	const weekDaysEng = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const weekDaysVi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
	const weekDaysHeaders = startOnMonday
		? lang === "en"
			? weekDaysEng
			: weekDaysVi
		: [
				...(lang === "en" ? ["Sun"] : ["CN"]),
				...(lang === "en" ? weekDaysEng.slice(0, 6) : weekDaysVi.slice(0, 6)),
			];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Get total days in month
	const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

	const totalDays = getDaysInMonth(year, month);
	// Day index of the 1st of month: 0 = Sun, 1 = Mon ...
	const firstDayIndex = new Date(year, month, 1).getDay();

	// Calculate empty cells at start
	const startingOffset = startOnMonday
		? firstDayIndex === 0
			? 6
			: firstDayIndex - 1
		: firstDayIndex;

	const calendarCells: (number | null)[] = [];
	for (let i = 0; i < startingOffset; i++) {
		calendarCells.push(null);
	}
	for (let day = 1; day <= totalDays; day++) {
		calendarCells.push(day);
	}

	const handleOpenEventModal = (day: number) => {
		setSelectedDayForEvent(day);
		const key = `${year}-${month}-${day}`;
		setEventTextInput(events[key] || "");
	};

	const saveEvent = () => {
		if (selectedDayForEvent !== null) {
			const key = `${year}-${month}-${selectedDayForEvent}`;
			if (eventTextInput.trim()) {
				setEvents((prev) => ({ ...prev, [key]: eventTextInput.trim() }));
			} else {
				const copy = { ...events };
				delete copy[key];
				setEvents(copy);
			}
			setSelectedDayForEvent(null);
		}
	};

	const deleteEvent = () => {
		if (selectedDayForEvent !== null) {
			const key = `${year}-${month}-${selectedDayForEvent}`;
			const copy = { ...events };
			delete copy[key];
			setEvents(copy);
			setSelectedDayForEvent(null);
		}
	};

	// Generate Markdown formatted calendar
	const generateMarkdown = () => {
		const headers = `| ${weekDaysHeaders.join(" | ")} |`;
		const divider = `| ${weekDaysHeaders.map(() => "---").join(" | ")} |`;

		const rows: string[] = [];
		let currentRow: string[] = [];

		for (let i = 0; i < calendarCells.length; i++) {
			const val = calendarCells[i];
			const key = val ? `${year}-${month}-${val}` : "";
			const eventText = events[key] ? ` (${events[key]})` : "";
			currentRow.push(val ? `${val}${eventText}` : "");

			if (currentRow.length === 7 || i === calendarCells.length - 1) {
				while (currentRow.length < 7) {
					currentRow.push("");
				}
				rows.push(`| ${currentRow.join(" | ")} |`);
				currentRow = [];
			}
		}

		return `### Calendar for ${monthLabel} ${year}\n\n${headers}\n${divider}\n${rows.join("\n")}`;
	};

	const copyMarkdown = () => {
		navigator.clipboard.writeText(generateMarkdown());
		setCopiedFormat("markdown");
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	const printCalendar = () => {
		window.print();
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
				{/* Settings panel */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Year */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblYear}</label>
						<input
							type="number"
							class="input w-full"
							value={year}
							onChange={(e) => setYear(Number((e.target as HTMLInputElement).value))}
						/>
					</div>

					{/* Month */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblMonth}</label>
						<select
							class="input w-full"
							value={month}
							onChange={(e) => setMonth(Number((e.target as HTMLSelectElement).value))}
						>
							{Array.from({ length: 12 }).map((_, idx) => (
								<option key={idx} value={idx}>
									{lang === "en" ? monthsEng[idx] : monthsVi[idx]}
								</option>
							))}
						</select>
					</div>

					{/* Start Weekday Option */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblStart}</label>
						<div class="flex gap-2">
							<button
								class={`btn-secondary w-full py-1.5 text-xs ${
									startOnMonday ? "bg-primary/10 border-primary text-primary" : ""
								}`}
								onClick={() => setStartOnMonday(true)}
							>
								{t.mon}
							</button>
							<button
								class={`btn-secondary w-full py-1.5 text-xs ${
									!startOnMonday ? "bg-primary/10 border-primary text-primary" : ""
								}`}
								onClick={() => setStartOnMonday(false)}
							>
								{t.sun}
							</button>
						</div>
					</div>

					{/* Action Buttons */}
					<div class="pt-2 space-y-2 border-t border-hairline">
						<button class="btn-primary w-full py-2" onClick={printCalendar}>
							{t.btnPrint}
						</button>
						<button class="btn-secondary w-full py-2" onClick={copyMarkdown}>
							{copiedFormat === "markdown" ? t.copied : t.btnMarkdown}
						</button>
					</div>
				</div>

				{/* Preview Panel */}
				<div class="lg:col-span-8 space-y-6">
					<div class="bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-4 print:p-0 print:border-none print:shadow-none">
						{/* Print Title */}
						<div class="text-center pb-2 border-b border-hairline">
							<h2 class="text-xl font-bold text-ink uppercase tracking-wide">
								{monthLabel} {year}
							</h2>
						</div>

						{/* Grid */}
						<div class="grid grid-cols-7 gap-1 border-t border-l border-hairline bg-hairline">
							{/* Weekday headers */}
							{weekDaysHeaders.map((day) => (
								<div
									key={day}
									class="bg-surface-elevated text-center font-bold text-ink py-2 text-xs border-r border-b border-hairline"
								>
									{day}
								</div>
							))}

							{/* Day Cells */}
							{calendarCells.map((day, idx) => {
								const key = day ? `${year}-${month}-${day}` : "";
								const eventText = day ? events[key] : null;
								const isToday =
									day === new Date().getDate() &&
									month === new Date().getMonth() &&
									year === new Date().getFullYear();

								return (
									<div
										key={idx}
										onClick={() => day && handleOpenEventModal(day)}
										class={`bg-surface-elevated min-h-16 p-1.5 border-r border-b border-hairline flex flex-col justify-between cursor-pointer transition-colors hover:bg-surface-soft ${
											isToday ? "bg-primary/5 ring-1 ring-primary/40" : ""
										} ${!day ? "bg-surface-soft/40 cursor-default" : ""}`}
									>
										{day ? (
											<>
												<div class="flex justify-between items-center">
													<span
														class={`font-mono text-body-sm font-bold ${isToday ? "text-primary" : "text-ink"}`}
													>
														{day}
													</span>
												</div>
												{eventText && (
													<div class="text-[9px] bg-primary/10 text-primary border border-primary/20 rounded p-1 truncate leading-tight mt-1 max-w-full">
														{eventText}
													</div>
												)}
											</>
										) : null}
									</div>
								);
							})}
						</div>
					</div>

					{/* Event modal configuration */}
					{selectedDayForEvent !== null && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblAddEvent} ({selectedDayForEvent} {monthLabel} {year})
							</h4>

							<input
								type="text"
								class="input w-full"
								value={eventTextInput}
								onInput={(e) => setEventTextInput((e.target as HTMLInputElement).value)}
								placeholder="e.g. Doctor appointment, meeting..."
							/>

							<div class="flex gap-2 justify-end">
								<button
									class="btn-secondary py-1.5 px-3 text-xs bg-accent-rose/10 border-accent-rose text-accent-rose"
									onClick={deleteEvent}
								>
									{t.btnDeleteEvent}
								</button>
								<button class="btn-primary py-1.5 px-4 text-xs" onClick={saveEvent}>
									{t.btnSaveEvent}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
