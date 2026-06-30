import { useEffect, useRef, useState } from "preact/hooks";

type TimerState = "work" | "shortBreak" | "longBreak";

function playAlarmSound() {
	try {
		const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch beep
		gain.gain.setValueAtTime(0.5, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start();
		osc.stop(ctx.currentTime + 0.8);
	} catch (e) {
		console.warn("Audio Context not supported or blocked by user interaction", e);
	}
}

export default function PomodoroTimer() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [currentState, setCurrentState] = useState<TimerState>("work");
	const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes standard
	const [isRunning, setIsRunning] = useState(false);
	const [completedSessions, setCompletedSessions] = useState(0);

	const timerRef = useRef<number | null>(null);

	const t = {
		en: {
			title: "Pomodoro Focus Timer",
			desc: "Boost your productivity with custom time boxing. Alternates between work focus and recovery breaks.",
			lblWork: "Work Time",
			lblShort: "Short Break",
			lblLong: "Long Break",
			btnStart: "Start Focus",
			btnPause: "Pause",
			btnReset: "Reset Timer",
			lblCompleted: "Completed Pomodoros",
			statusWork: "Focusing...",
			statusBreak: "Resting...",
		},
		vi: {
			title: "Đồng hồ Pomodoro tập trung",
			desc: "Tăng hiệu suất của bạn bằng phương pháp quản lý thời gian Pomodoro, luân phiên giữa làm việc và nghỉ ngơi.",
			lblWork: "Làm việc",
			lblShort: "Nghỉ ngắn",
			lblLong: "Nghỉ dài",
			btnStart: "Bắt đầu tập trung",
			btnPause: "Tạm dừng",
			btnReset: "Đặt lại thời gian",
			lblCompleted: "Số ca hoàn thành",
			statusWork: "Đang tập trung...",
			statusBreak: "Đang nghỉ ngơi...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	// Reset durations on mode changes
	const setMode = (mode: TimerState) => {
		setIsRunning(false);
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setCurrentState(mode);

		if (mode === "work") setTimeLeft(25 * 60);
		else if (mode === "shortBreak") setTimeLeft(5 * 60);
		else if (mode === "longBreak") setTimeLeft(15 * 60);
	};

	const toggleTimer = () => {
		if (isRunning) {
			setIsRunning(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		} else {
			setIsRunning(true);
			timerRef.current = window.setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						// Alarm sound
						playAlarmSound();
						setIsRunning(false);
						if (timerRef.current) {
							clearInterval(timerRef.current);
							timerRef.current = null;
						}

						// Move to next session type
						if (currentState === "work") {
							setCompletedSessions((c) => c + 1);
							// Automatically switch to short break
							setCurrentState("shortBreak");
							return 5 * 60;
						}
						setCurrentState("work");
						return 25 * 60;
					}
					return prev - 1;
				});
			}, 1000);
		}
	};

	const resetTimer = () => {
		setMode(currentState);
	};

	const formatMinutes = (sec: number) => {
		const m = Math.floor(sec / 60)
			.toString()
			.padStart(2, "0");
		const s = (sec % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	// Determine total baseline seconds of current mode to calculate circle ratio
	const getBaselineSeconds = () => {
		if (currentState === "work") return 25 * 60;
		if (currentState === "shortBreak") return 5 * 60;
		return 15 * 60;
	};

	const progressRatio = timeLeft / getBaselineSeconds();
	// SVG circle parameters
	const strokeDash = 2 * Math.PI * 90;

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Clock UI */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex flex-col items-center space-y-6">
					<div class="w-full text-center space-y-1">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.title}
						</h3>
						<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
					</div>

					{/* Timer Mode selector tab group */}
					<div class="flex gap-1.5 bg-surface-soft p-1 rounded-lg border border-hairline w-full">
						{[
							{ key: "work", name: t.lblWork },
							{ key: "shortBreak", name: t.lblShort },
							{ key: "longBreak", name: t.lblLong },
						].map((item) => (
							<button
								key={item.key}
								class={`flex-1 text-[11px] font-bold py-1.5 px-2 rounded-md transition-all cursor-pointer ${
									currentState === item.key
										? "bg-primary text-white shadow-sm"
										: "text-muted hover:text-ink"
								}`}
								onClick={() => setMode(item.key as TimerState)}
							>
								{item.name}
							</button>
						))}
					</div>

					{/* Circular visual countdown timer */}
					<div class="relative w-48 h-48 flex items-center justify-center">
						<svg class="w-full h-full transform -rotate-90">
							{/* Background track circle */}
							<circle
								cx="96"
								cy="96"
								r="84"
								stroke="var(--stroke-hairline)"
								stroke-width="8"
								fill="transparent"
								class="stroke-hairline"
							/>
							{/* Active progress indicator circle */}
							<circle
								cx="96"
								cy="96"
								r="84"
								stroke="var(--color-primary)"
								stroke-width="8"
								fill="transparent"
								stroke-dasharray={strokeDash}
								stroke-dashoffset={strokeDash * (1 - progressRatio)}
								stroke-linecap="round"
								class="stroke-primary transition-all duration-300"
							/>
						</svg>
						<div class="absolute flex flex-col items-center">
							<span class="text-3xl font-mono font-bold text-ink tracking-widest">
								{formatMinutes(timeLeft)}
							</span>
							<span class="text-[9px] text-primary uppercase font-bold tracking-wider mt-1">
								{currentState === "work" ? t.statusWork : t.statusBreak}
							</span>
						</div>
					</div>

					{/* Control Buttons */}
					<div class="w-full grid grid-cols-2 gap-3">
						<button
							class={`btn-primary py-2.5 font-bold ${
								isRunning
									? "bg-accent-rose hover:bg-accent-rose/90 border-accent-rose text-white"
									: ""
							}`}
							onClick={toggleTimer}
						>
							{isRunning ? t.btnPause : t.btnStart}
						</button>
						<button class="btn-secondary py-2.5 font-bold" onClick={resetTimer}>
							{t.btnReset}
						</button>
					</div>
				</div>

				{/* Statistic Statistics Card */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblCompleted}
					</h3>

					<div class="flex items-center gap-6 bg-surface-soft p-5 rounded-lg border border-hairline">
						<div class="text-5xl font-mono font-bold text-primary">{completedSessions}</div>
						<div class="text-body-xs text-muted leading-relaxed">
							{lang === "en"
								? "Keep focusing! Completed sessions represent 25 minutes of deep focus followed by healthy breaks."
								: "Tiếp tục cố gắng! Mỗi chu kỳ hoàn thành tương ứng với 25 phút làm việc chuyên sâu và một khoảng nghỉ phục hồi."}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
