import { useEffect, useRef, useState } from "preact/hooks";

const ENGLISH_WORDS = [
	"the",
	"be",
	"to",
	"of",
	"and",
	"a",
	"in",
	"that",
	"have",
	"i",
	"it",
	"for",
	"not",
	"on",
	"with",
	"he",
	"as",
	"you",
	"do",
	"at",
	"this",
	"but",
	"his",
	"by",
	"from",
	"they",
	"we",
	"say",
	"her",
	"she",
	"or",
	"an",
	"will",
	"my",
	"one",
	"all",
	"would",
	"there",
	"their",
	"what",
	"so",
	"up",
	"out",
	"if",
	"about",
	"who",
	"get",
	"which",
	"go",
	"me",
	"when",
	"make",
	"can",
	"like",
	"time",
	"no",
	"just",
	"him",
	"know",
	"take",
	"people",
	"into",
	"year",
	"your",
	"good",
	"some",
	"could",
	"them",
	"see",
	"other",
	"than",
	"then",
	"now",
	"look",
	"only",
	"come",
	"its",
	"over",
	"think",
	"also",
	"back",
	"after",
	"use",
	"two",
	"how",
	"our",
	"work",
	"first",
	"well",
	"way",
	"even",
	"new",
	"want",
	"because",
	"any",
	"these",
	"give",
	"day",
	"most",
	"us",
];

const VIETNAMESE_WORDS = [
	"học",
	"tập",
	"sinh",
	"viên",
	"trường",
	"lớp",
	"thầy",
	"cô",
	"bài",
	"vở",
	"người",
	"nhà",
	"nước",
	"việt",
	"nam",
	"đất",
	"nước",
	"quê",
	"hương",
	"gia",
	"đình",
	"bố",
	"mẹ",
	"anh",
	"em",
	"chị",
	"bạn",
	"bè",
	"yêu",
	"thương",
	"công",
	"việc",
	"làm",
	"nghiệp",
	"phát",
	"triển",
	"xã",
	"hội",
	"kinh",
	"tế",
	"văn",
	"hóa",
	"du",
	"lịch",
	"khám",
	"phá",
	"sáng",
	"tạo",
	"công",
	"nghệ",
	"máy",
	"tính",
	"điện",
	"thoại",
	"mạng",
	"internet",
	"dữ",
	"liệu",
	"phần",
	"mềm",
	"sách",
	"truyện",
	"báo",
	"chí",
	"tin",
	"tức",
	"thời",
	"tiết",
	"ngày",
	"đêm",
	"mưa",
	"nắng",
	"gió",
	"lạnh",
	"ấm",
	"áp",
	"mùa",
	"xuân",
	"hạ",
	"thu",
	"đông",
	"hoa",
	"quả",
	"cây",
	"lá",
	"rừng",
	"núi",
	"sông",
	"biển",
	"hồ",
	"chạy",
	"nhảy",
	"đi",
	"đứng",
	"nói",
	"cười",
	"khóc",
	"nghe",
	"nhìn",
	"thấy",
];

export default function TypingSpeedTest() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const inputRef = useRef<HTMLInputElement>(null);

	// Settings state
	const [textLang, setTextLang] = useState<"en" | "vi">("en");
	const [duration, setDuration] = useState<number>(60); // in seconds

	// Game state
	const [words, setWords] = useState<string[]>([]);
	const [currentWordIdx, setCurrentWordIdx] = useState(0);
	const [typedWord, setTypedWord] = useState("");
	const [wordStatuses, setWordStatuses] = useState<("correct" | "incorrect" | "pending")[]>([]);

	const [timeLeft, setTimeLeft] = useState(duration);
	const [isActive, setIsActive] = useState(false);
	const [isFinished, setIsFinished] = useState(false);

	// Stats
	const [correctChars, setCorrectChars] = useState(0);
	const [incorrectChars, setIncorrectChars] = useState(0);
	const [totalTypedWords, setTotalTypedWords] = useState(0);
	const [correctWordsCount, setCorrectWordsCount] = useState(0);

	// Multi-language strings
	const t = {
		en: {
			settings: "Test Settings",
			textLang: "Language",
			duration: "Time Limit",
			seconds: "seconds",
			start: "Start Test",
			restart: "Restart",
			typeHere: "Type the word here...",
			wpm: "WPM (Words Per Minute)",
			accuracy: "Accuracy",
			correctWords: "Correct Words",
			incorrectWords: "Incorrect Words",
			charsStats: "Keystrokes (Correct/Wrong)",
			results: "Your Results",
			clickToFocus: "Click to start typing!",
			secLeft: "seconds left",
			typingArea: "Typing Area",
		},
		vi: {
			settings: "Cấu hình kiểm tra",
			textLang: "Ngôn ngữ văn bản",
			duration: "Thời gian gõ",
			seconds: "giây",
			start: "Bắt đầu gõ",
			restart: "Gõ lại",
			typeHere: "Gõ từ hiển thị tại đây...",
			wpm: "Tốc độ gõ WPM",
			accuracy: "Độ chính xác",
			correctWords: "Từ gõ đúng",
			incorrectWords: "Từ gõ sai",
			charsStats: "Phím nhấn (Đúng/Sai)",
			results: "Kết quả của bạn",
			clickToFocus: "Nhấp chuột vào đây và bắt đầu gõ!",
			secLeft: "giây còn lại",
			typingArea: "Khung luyện gõ phím",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Initialize word list
	const generateWords = () => {
		const vocabulary = textLang === "en" ? ENGLISH_WORDS : VIETNAMESE_WORDS;
		const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
		// Duplicate to have enough words
		const list = [...shuffled, ...shuffled, ...shuffled].slice(0, 100);
		setWords(list);
		setCurrentWordIdx(0);
		setTypedWord("");
		setWordStatuses(new Array(list.length).fill("pending"));
		setTimeLeft(duration);
		setIsActive(false);
		setIsFinished(false);
		setCorrectChars(0);
		setIncorrectChars(0);
		setTotalTypedWords(0);
		setCorrectWordsCount(0);
	};

	useEffect(() => {
		generateWords();
	}, [textLang, duration]);

	// Countdown Timer
	useEffect(() => {
		let interval: any = null;
		if (isActive && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
		} else if (timeLeft === 0 && isActive) {
			setIsActive(false);
			setIsFinished(true);
			if (interval) clearInterval(interval);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive, timeLeft]);

	// Handle input typing
	const handleInput = (e: Event) => {
		const value = (e.target as HTMLInputElement).value;

		// Start game on first keystroke
		if (!isActive && !isFinished) {
			setIsActive(true);
		}

		// Check if Spacebar is pressed
		if (value.endsWith(" ")) {
			const cleanedVal = value.trim();
			const targetWord = words[currentWordIdx];

			// Evaluate word
			const isCorrect = cleanedVal === targetWord;
			const newStatuses = [...wordStatuses];
			newStatuses[currentWordIdx] = isCorrect ? "correct" : "incorrect";
			setWordStatuses(newStatuses);

			// Count keystrokes
			if (isCorrect) {
				setCorrectChars((prev) => prev + targetWord.length + 1); // +1 for space
				setCorrectWordsCount((prev) => prev + 1);
			} else {
				setIncorrectChars((prev) => prev + cleanedVal.length + 1);
			}

			setTotalTypedWords((prev) => prev + 1);
			setCurrentWordIdx((prev) => prev + 1);
			setTypedWord("");
		} else {
			setTypedWord(value);
		}
	};

	// Calculate Final Stats
	const wpm = Math.round(correctChars / 5 / (duration / 60));
	const totalTypedCount = correctWordsCount + wordStatuses.filter((s) => s === "incorrect").length;
	const accuracy =
		totalTypedCount > 0 ? Math.round((correctWordsCount / totalTypedCount) * 100) : 0;

	return (
		<div class="space-y-6">
			{/* Settings Panel */}
			{!isActive && !isFinished && (
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.textLang}</label>
						<select
							class="select w-full"
							value={textLang}
							onChange={(e) => setTextLang((e.target as HTMLSelectElement).value as "en" | "vi")}
						>
							<option value="en">English</option>
							<option value="vi">Tiếng Việt</option>
						</select>
					</div>
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.duration}</label>
						<select
							class="select w-full"
							value={duration}
							onChange={(e) => setDuration(Number.parseInt((e.target as HTMLSelectElement).value))}
						>
							<option value="30">30 {t.seconds}</option>
							<option value="60">60 {t.seconds}</option>
							<option value="120">120 {t.seconds}</option>
						</select>
					</div>
					<div class="flex items-end">
						<button
							class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
							onClick={() => {
								setIsActive(true);
								inputRef.current?.focus();
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polygon points="6 3 20 12 6 21 6 3" />
							</svg>
							{t.start}
						</button>
					</div>
				</div>
			)}

			{/* Main Game Interface */}
			{!isFinished && (
				<div class="bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-6">
					{/* Header with timer */}
					<div class="flex justify-between items-center border-b border-hairline pb-4">
						<h3 class="text-body-strong text-ink">{t.typingArea}</h3>
						<div class="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-mono font-bold text-lg">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
							{timeLeft} {t.secLeft}
						</div>
					</div>

					{/* Words box */}
					<div
						class="p-4 bg-surface-soft rounded-lg border border-hairline font-mono text-xl leading-relaxed select-none overflow-hidden h-[120px] relative"
						onClick={() => inputRef.current?.focus()}
					>
						<div class="flex flex-wrap gap-x-3 gap-y-2 max-h-full transition-transform duration-200">
							{words.map((word, idx) => {
								let colorClass = "text-muted opacity-50";
								if (idx === currentWordIdx) {
									colorClass =
										"bg-primary/10 text-primary px-1 rounded-sm border-b-2 border-primary font-bold";
								} else if (wordStatuses[idx] === "correct") {
									colorClass = "text-success-deep font-semibold";
								} else if (wordStatuses[idx] === "incorrect") {
									colorClass = "text-error line-through";
								}
								return <span class={colorClass}>{word}</span>;
							})}
						</div>
					</div>

					{/* Typing Input */}
					<div class="flex gap-4">
						<input
							type="text"
							ref={inputRef}
							class="input flex-1 font-mono text-lg py-3"
							placeholder={isActive ? "" : t.clickToFocus}
							value={typedWord}
							onInput={handleInput}
							disabled={isFinished}
							autoComplete="off"
							autoCapitalize="off"
						/>
						<button class="btn-secondary px-6" onClick={generateWords}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
								<path d="M16 3h5v5" />
								<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
								<path d="M8 21H3v-5" />
							</svg>
							{t.restart}
						</button>
					</div>
				</div>
			)}

			{/* Results Panel */}
			{isFinished && (
				<div class="bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-6">
					<div class="text-center border-b border-hairline pb-4">
						<h2 class="text-title-lg text-primary font-bold">{t.results}</h2>
					</div>

					{/* Grid statistic dashboard */}
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div class="bg-surface-soft p-4 rounded-lg text-center border border-hairline">
							<div class="text-caption text-muted mb-1">{t.wpm}</div>
							<div class="text-title-lg text-primary font-black" style="font-size: 36px;">
								{wpm}
							</div>
						</div>
						<div class="bg-surface-soft p-4 rounded-lg text-center border border-hairline">
							<div class="text-caption text-muted mb-1">{t.accuracy}</div>
							<div class="text-title-lg text-ink font-black" style="font-size: 36px;">
								{accuracy}%
							</div>
						</div>
						<div class="bg-surface-soft p-4 rounded-lg text-center border border-hairline">
							<div class="text-caption text-muted mb-1">{t.correctWords}</div>
							<div class="text-title-lg text-success-deep font-bold" style="font-size: 32px;">
								{correctWordsCount}
							</div>
						</div>
						<div class="bg-surface-soft p-4 rounded-lg text-center border border-hairline">
							<div class="text-caption text-muted mb-1">{t.incorrectWords}</div>
							<div class="text-title-lg text-error font-bold" style="font-size: 32px;">
								{wordStatuses.filter((s) => s === "incorrect").length}
							</div>
						</div>
					</div>

					<div class="bg-surface-soft p-4 rounded-lg border border-hairline">
						<div class="flex justify-between items-center text-body-sm">
							<span class="text-muted">{t.charsStats}</span>
							<span class="font-mono font-bold text-ink">
								<span class="text-success-deep">{correctChars}</span> /{" "}
								<span class="text-error">{incorrectChars}</span>
							</span>
						</div>
					</div>

					{/* Action buttons */}
					<button
						class="btn-primary w-full py-3 flex items-center justify-center gap-2"
						onClick={generateWords}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
							<path d="M16 3h5v5" />
							<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
							<path d="M8 21H3v-5" />
						</svg>
						{t.restart}
					</button>
				</div>
			)}
		</div>
	);
}
