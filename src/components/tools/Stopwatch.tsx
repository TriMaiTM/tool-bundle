import { useEffect, useRef, useState } from "preact/hooks";

interface Lap {
	index: number;
	lapTime: number;
	overallTime: number;
}

export default function Stopwatch() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [isRunning, setIsRunning] = useState(false);
	const [time, setTime] = useState(0); // Elapsed time in milliseconds
	const [laps, setLaps] = useState<Lap[]>([]);
	const [copied, setCopied] = useState(false);

	const timerRef = useRef<number | null>(null);
	const startTimeRef = useRef(0);
	const accumulatedTimeRef = useRef(0);

	const t = {
		en: {
			title: "Professional Stopwatch",
			desc: "A millisecond-accurate stopwatch. Start, pause, record laps, and export your timing logs easily.",
			btnStart: "Start",
			btnPause: "Pause",
			btnResume: "Resume",
			btnReset: "Reset",
			btnLap: "Lap",
			lblLaps: "Recorded Laps",
			colLapNum: "Lap",
			colLapTime: "Lap Time",
			colOverall: "Overall Time",
			copied: "Copied Laps!",
			copyLaps: "Copy Laps List",
		},
		vi: {
			title: "Đồng hồ bấm giờ chuyên nghiệp",
			desc: "Đồng hồ đo thời gian chính xác tới mili-giây. Bắt đầu, tạm dừng, lưu vòng chạy và xuất lịch sử bấm giờ.",
			btnStart: "Bắt đầu",
			btnPause: "Tạm dừng",
			btnResume: "Tiếp tục",
			btnReset: "Đặt lại",
			btnLap: "Vòng chạy",
			lblLaps: "Lịch sử vòng chạy",
			colLapNum: "Vòng",
			colLapTime: "Thời gian vòng",
			colOverall: "Thời gian tổng",
			copied: "Đã chép lịch sử!",
			copyLaps: "Sao chép lịch sử vòng chạy",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
		return () => stopTimer();
	}, []);

	const startTimer = () => {
		if (isRunning) return;
		setIsRunning(true);
		startTimeRef.current = Date.now();
		timerRef.current = window.setInterval(() => {
			const elapsed = Date.now() - startTimeRef.current + accumulatedTimeRef.current;
			setTime(elapsed);
		}, 10);
	};

	const stopTimer = () => {
		if (!isRunning) return;
		setIsRunning(false);
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		accumulatedTimeRef.current = time;
	};

	const resetTimer = () => {
		stopTimer();
		setTime(0);
		accumulatedTimeRef.current = 0;
		setLaps([]);
	};

	const addLap = () => {
		const lapIndex = laps.length + 1;
		const lastOverall = laps.length > 0 ? laps[laps.length - 1].overallTime : 0;
		const lapTime = time - lastOverall;

		setLaps((prev) => [
			...prev,
			{
				index: lapIndex,
				lapTime,
				overallTime: time,
			},
		]);
	};

	const formatTime = (ms: number) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		const centiseconds = Math.floor((ms % 1000) / 10);

		const pad = (num: number) => num.toString().padStart(2, "0");

		return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
	};

	const handleCopyLaps = () => {
		const text = laps
			.map(
				(l) =>
					`Lap ${l.index}: Lap Time = ${formatTime(l.lapTime)} | Overall = ${formatTime(l.overallTime)}`,
			)
			.join("\n");
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Clock display and controls */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-6">
					<div class="space-y-2">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.title}
						</h3>
						<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
					</div>

					{/* Time Display */}
					<div class="text-center py-6 bg-surface-soft border border-hairline rounded-xl shadow-inner">
						<span class="text-4xl sm:text-5xl font-mono font-bold text-primary tracking-widest">
							{formatTime(time)}
						</span>
					</div>

					{/* Controls buttons */}
					<div class="grid grid-cols-3 gap-2">
						{isRunning ? (
							<button
								class="btn-secondary py-2.5 font-bold bg-accent-rose/10 border-accent-rose text-accent-rose"
								onClick={stopTimer}
							>
								{t.btnPause}
							</button>
						) : (
							<button class="btn-primary py-2.5 font-bold" onClick={startTimer}>
								{time === 0 ? t.btnStart : t.btnResume}
							</button>
						)}

						<button
							disabled={!isRunning}
							class="btn-secondary py-2.5 font-bold disabled:opacity-50"
							onClick={addLap}
						>
							{t.btnLap}
						</button>

						<button class="btn-secondary py-2.5 font-bold" onClick={resetTimer}>
							{t.btnReset}
						</button>
					</div>
				</div>

				{/* Laps List history */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex justify-between items-center border-b border-hairline pb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.lblLaps}</h3>
						{laps.length > 0 && (
							<button class="btn-secondary py-1 px-3 text-xs" onClick={handleCopyLaps}>
								{copied ? t.copied : t.copyLaps}
							</button>
						)}
					</div>

					{laps.length === 0 ? (
						<div class="text-center py-12 text-muted text-body-sm italic">
							{lang === "en" ? "No laps recorded yet." : "Chưa có lịch sử vòng chạy nào."}
						</div>
					) : (
						<div class="max-h-80 overflow-y-auto border border-hairline rounded-lg bg-surface-soft">
							<table class="w-full text-left text-body-sm font-mono border-collapse">
								<thead>
									<tr class="bg-surface-elevated text-ink font-bold border-b border-hairline">
										<th class="p-3 text-center">{t.colLapNum}</th>
										<th class="p-3">{t.colLapTime}</th>
										<th class="p-3">{t.colOverall}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-hairline">
									{laps.map((l) => (
										<tr key={l.index} class="hover:bg-surface-elevated/40">
											<td class="p-3 text-center text-muted">#{l.index}</td>
											<td class="p-3 text-primary font-bold">{formatTime(l.lapTime)}</td>
											<td class="p-3 text-ink">{formatTime(l.overallTime)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
