import { useCallback, useEffect, useRef, useState } from "preact/hooks";

type TimerMode = "pomodoro" | "custom" | "stopwatch" | "session";
type TimerState = "idle" | "running" | "paused";

interface SessionEntry {
	id: number;
	mode: TimerMode;
	duration: number; // seconds
	timestamp: number;
}

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;
const POMODORO_LONG_BREAK = 15 * 60;
const POMODORO_CYCLES = 4;

const STORAGE_KEY = "game-timer-sessions";

function loadSessions(): SessionEntry[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveSessions(sessions: SessionEntry[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
	} catch {
		/* ignore */
	}
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

function formatTime(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	if (h > 0) {
		return `${pad(h)}:${pad(m)}:${pad(s)}`;
	}
	return `${pad(m)}:${pad(s)}`;
}

function playBeep() {
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = 800;
		osc.type = "sine";
		gain.gain.setValueAtTime(0.3, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.5);
	} catch {
		/* ignore */
	}
}

export default function GameTimer() {
	const [mode, setMode] = useState<TimerMode>("pomodoro");
	const [state, setState] = useState<TimerState>("idle");
	const [seconds, setSeconds] = useState(POMODORO_WORK);
	const [initialSeconds, setInitialSeconds] = useState(POMODORO_WORK);
	const [pomodoroPhase, setPomodoroPhase] = useState<"work" | "break" | "long-break">("work");
	const [pomodoroCycle, setPomodoroCycle] = useState(0);
	const [alarmEnabled, setAlarmEnabled] = useState(true);

	// Custom timer inputs
	const [customHours, setCustomHours] = useState(0);
	const [customMinutes, setCustomMinutes] = useState(25);
	const [customSeconds, setCustomSeconds] = useState(0);

	const [sessions, setSessions] = useState<SessionEntry[]>(loadSessions);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef(0);

	// Today's total play time
	const todayTotal = sessions
		.filter((s) => {
			const d = new Date(s.timestamp);
			const now = new Date();
			return d.toDateString() === now.toDateString();
		})
		.reduce((sum, s) => sum + s.duration, 0);

	// Timer tick
	useEffect(() => {
		if (state === "running") {
			intervalRef.current = setInterval(() => {
				setSeconds((prev) => {
					if (mode === "stopwatch" || mode === "session") {
						return prev + 1;
					}
					if (prev <= 1) {
						// Timer complete
						if (alarmEnabled) playBeep();
						if (Notification.permission === "granted") {
							new Notification("Timer Complete!", {
								body:
									mode === "pomodoro"
										? pomodoroPhase === "work"
											? "Time for a break!"
											: "Break over, back to work!"
										: "Your timer has finished!",
							});
						}
						handleTimerComplete();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [state, mode, pomodoroPhase, alarmEnabled]);

	const handleTimerComplete = useCallback(() => {
		setState("idle");
		if (mode === "pomodoro") {
			if (pomodoroPhase === "work") {
				const nextCycle = pomodoroCycle + 1;
				if (nextCycle >= POMODORO_CYCLES) {
					setPomodoroPhase("long-break");
					setSeconds(POMODORO_LONG_BREAK);
					setInitialSeconds(POMODORO_LONG_BREAK);
					setPomodoroCycle(0);
				} else {
					setPomodoroPhase("break");
					setSeconds(POMODORO_BREAK);
					setInitialSeconds(POMODORO_BREAK);
					setPomodoroCycle(nextCycle);
				}
			} else {
				setPomodoroPhase("work");
				setSeconds(POMODORO_WORK);
				setInitialSeconds(POMODORO_WORK);
			}
		}
		if (mode === "session" && startTimeRef.current > 0) {
			const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
			if (duration > 0) {
				const newSessions: SessionEntry[] = [
					{
						id: Date.now(),
						mode: "session" as TimerMode,
						duration,
						timestamp: Date.now(),
					},
					...sessions,
				].slice(0, 50);
				setSessions(newSessions);
				saveSessions(newSessions);
			}
		}
	}, [mode, pomodoroPhase, pomodoroCycle, sessions]);

	const start = useCallback(() => {
		if (mode === "session" && state === "idle") {
			startTimeRef.current = Date.now();
		}
		if (mode === "custom" && state === "idle" && seconds === 0) {
			const total = customHours * 3600 + customMinutes * 60 + customSeconds;
			if (total <= 0) return;
			setSeconds(total);
			setInitialSeconds(total);
		}
		setState("running");

		// Request notification permission
		if (Notification.permission === "default") {
			Notification.requestPermission();
		}
	}, [mode, state, seconds, customHours, customMinutes, customSeconds]);

	const pause = useCallback(() => {
		setState("paused");
	}, []);

	const reset = useCallback(() => {
		setState("idle");
		if (mode === "session" && startTimeRef.current > 0) {
			const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
			if (duration > 0) {
				const newSessions: SessionEntry[] = [
					{
						id: Date.now(),
						mode: "session" as TimerMode,
						duration,
						timestamp: Date.now(),
					},
					...sessions,
				].slice(0, 50);
				setSessions(newSessions);
				saveSessions(newSessions);
			}
			startTimeRef.current = 0;
			setSeconds(0);
		} else if (mode === "pomodoro") {
			setPomodoroPhase("work");
			setPomodoroCycle(0);
			setSeconds(POMODORO_WORK);
			setInitialSeconds(POMODORO_WORK);
		} else if (mode === "stopwatch") {
			setSeconds(0);
		} else {
			const total = customHours * 3600 + customMinutes * 60 + customSeconds;
			setSeconds(total);
			setInitialSeconds(total);
		}
	}, [mode, sessions, customHours, customMinutes, customSeconds]);

	const switchMode = useCallback(
		(newMode: TimerMode) => {
			setState("idle");
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			setMode(newMode);
			if (newMode === "pomodoro") {
				setPomodoroPhase("work");
				setPomodoroCycle(0);
				setSeconds(POMODORO_WORK);
				setInitialSeconds(POMODORO_WORK);
			} else if (newMode === "stopwatch" || newMode === "session") {
				setSeconds(0);
				setInitialSeconds(0);
				startTimeRef.current = 0;
			} else {
				const total = customHours * 3600 + customMinutes * 60 + customSeconds;
				setSeconds(total);
				setInitialSeconds(total);
			}
		},
		[customHours, customMinutes, customSeconds],
	);

	const clearHistory = useCallback(() => {
		setSessions([]);
		saveSessions([]);
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			if (e.code === "Space") {
				e.preventDefault();
				if (state === "running") pause();
				else start();
			} else if (e.key === "r" || e.key === "R") {
				reset();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [state, start, pause, reset]);

	const progress = initialSeconds > 0 ? ((initialSeconds - seconds) / initialSeconds) * 100 : 0;

	return (
		<div>
			{/* Mode Select */}
			<div class="flex flex-wrap gap-2 mb-6">
				{(["pomodoro", "custom", "stopwatch", "session"] as const).map((m) => (
					<button
						key={m}
						class={`btn-secondary text-body-sm ${mode === m ? "btn-primary" : ""}`}
						onClick={() => switchMode(m)}
					>
						{m === "pomodoro"
							? "Pomodoro"
							: m === "custom"
								? "Custom Timer"
								: m === "stopwatch"
									? "Stopwatch"
									: "Session Tracker"}
					</button>
				))}
			</div>

			{/* Custom timer inputs */}
			{mode === "custom" && state === "idle" && (
				<div class="bg-surface-elevated rounded-lg p-4 mb-6">
					<div class="text-caption-uppercase text-muted mb-3">Set Duration</div>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label class="text-caption text-muted block mb-1">Hours</label>
							<input
								type="number"
								class="input w-full"
								value={customHours}
								min={0}
								max={23}
								onInput={(e) =>
									setCustomHours(
										Math.max(0, Number.parseInt((e.target as HTMLInputElement).value) || 0),
									)
								}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Minutes</label>
							<input
								type="number"
								class="input w-full"
								value={customMinutes}
								min={0}
								max={59}
								onInput={(e) =>
									setCustomMinutes(
										Math.max(0, Number.parseInt((e.target as HTMLInputElement).value) || 0),
									)
								}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">Seconds</label>
							<input
								type="number"
								class="input w-full"
								value={customSeconds}
								min={0}
								max={59}
								onInput={(e) =>
									setCustomSeconds(
										Math.max(0, Number.parseInt((e.target as HTMLInputElement).value) || 0),
									)
								}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Pomodoro phase indicator */}
			{mode === "pomodoro" && (
				<div class="text-center mb-2">
					<span class="badge">
						{pomodoroPhase === "work" ? "Work" : pomodoroPhase === "break" ? "Break" : "Long Break"}{" "}
						(Cycle {pomodoroCycle + 1}/{POMODORO_CYCLES})
					</span>
				</div>
			)}

			{/* Timer Display */}
			<div class="bg-surface-elevated rounded-lg p-8 mb-6 text-center">
				<div
					class="text-display-lg text-primary font-mono"
					style="font-size: 4rem; letter-spacing: 0.1em;"
				>
					{formatTime(seconds)}
				</div>
			</div>

			{/* Progress bar for Pomodoro */}
			{mode === "pomodoro" && initialSeconds > 0 && (
				<div class="w-full bg-surface-soft rounded-full h-2 mb-6">
					<div
						class="h-2 rounded-full transition-all"
						style={`width: ${progress}%; background-color: var(--color-primary);`}
					/>
				</div>
			)}

			{/* Controls */}
			<div class="flex items-center justify-center gap-3 mb-6">
				{state === "running" ? (
					<button class="btn-primary" onClick={pause}>
						Pause
					</button>
				) : (
					<button class="btn-primary" onClick={start}>
						{state === "paused" ? "Resume" : "Start"}
					</button>
				)}
				<button class="btn-secondary" onClick={reset}>
					Reset
				</button>
				<label class="flex items-center gap-2 text-body-sm cursor-pointer ml-4">
					<input
						type="checkbox"
						checked={alarmEnabled}
						onChange={(e) => setAlarmEnabled((e.target as HTMLInputElement).checked)}
					/>
					Alarm
				</label>
			</div>

			{/* Today's play time */}
			{mode === "session" && (
				<div class="bg-surface-elevated rounded-lg p-4 mb-6 text-center">
					<div class="text-caption-uppercase text-muted mb-1">Today's Play Time</div>
					<div class="text-title-lg text-primary">{formatTime(todayTotal)}</div>
				</div>
			)}

			{/* Session History */}
			{sessions.length > 0 && (
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">Session History</span>
						<button class="btn-secondary text-body-sm" onClick={clearHistory}>
							Clear
						</button>
					</div>
					<div class="space-y-2 max-h-64 overflow-y-auto">
						{sessions.slice(0, 20).map((s) => (
							<div
								key={s.id}
								class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between"
							>
								<div>
									<span class="text-body-sm text-body-strong">{formatTime(s.duration)}</span>
									<span class="text-body-sm text-muted ml-2">({s.mode})</span>
								</div>
								<span class="text-body-sm text-muted">
									{new Date(s.timestamp).toLocaleString()}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Keyboard shortcuts hint */}
			<div class="text-center text-body-sm text-muted mt-4">
				Keyboard: <span class="badge">Space</span> start/pause <span class="badge">R</span> reset
			</div>
		</div>
	);
}
