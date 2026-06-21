import { useEffect, useState } from "preact/hooks";

export default function ScientificCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [display, setDisplay] = useState("");
	const [result, setResult] = useState("");
	const [isDegree, setIsDegree] = useState(true);
	const [history, setHistory] = useState<string[]>([]);
	const [lastAnswer, setLastAnswer] = useState("0");

	const t = {
		en: {
			title: "Scientific Calculator",
			historyTitle: "History",
			noHistory: "No calculations yet",
			deg: "DEG",
			rad: "RAD",
			error: "Error",
		},
		vi: {
			title: "Máy tính khoa học",
			historyTitle: "Lịch sử phép tính",
			noHistory: "Chưa có phép tính nào",
			deg: "Độ (DEG)",
			rad: "Radian (RAD)",
			error: "Lỗi",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleBtnPress = (val: string) => {
		setDisplay((prev) => prev + val);
	};

	const handleClear = () => {
		setDisplay("");
		setResult("");
	};

	const handleBackspace = () => {
		setDisplay((prev) => prev.slice(0, -1));
	};

	const evaluateExpression = () => {
		if (!display) return;
		try {
			// Replace mathematical constants and symbols for eval
			let expr = display
				.replace(/×/g, "*")
				.replace(/÷/g, "/")
				.replace(/π/g, "Math.PI")
				.replace(/e/g, "Math.E")
				.replace(/Ans/g, lastAnswer);

			// Handle custom trig and log wrappers for deg/rad
			expr = expr.replace(/(sin|cos|tan)\(([^)]+)\)/g, (match, func, arg) => {
				let numericVal = Number(arg);
				if (Number.isNaN(numericVal)) {
					// Fallback to evaluating inside the trig function if it contains an expression
					try {
						// biome-ignore lint/security/noGlobalEval: safe evaluation of trig arguments
						numericVal = eval(arg);
					} catch {
						return "NaN";
					}
				}
				if (isDegree) {
					numericVal = (numericVal * Math.PI) / 180;
				}
				return `Math.${func}(${numericVal})`;
			});

			expr = expr.replace(/log\(([^)]+)\)/g, "Math.log10($1)");
			expr = expr.replace(/ln\(([^)]+)\)/g, "Math.log($1)");
			expr = expr.replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)");
			expr = expr.replace(/\^/g, "**");

			// Basic safety check: allow only mathematical characters
			if (
				/[^0-9+\-*/().\sMathPIE*]/.test(
					expr.replace(/Math\.(PI|E|sin|cos|tan|log10|log|sqrt)/g, ""),
				)
			) {
				throw new Error("Invalid characters");
			}

			// biome-ignore lint/security/noGlobalEval: safe evaluation of calculator expression
			const evaluated = eval(expr);
			if (Number.isNaN(evaluated) || !Number.isFinite(evaluated)) {
				setResult(t.error);
				return;
			}

			const formattedResult = String(Math.round(evaluated * 1e10) / 1e10);
			setResult(formattedResult);
			setLastAnswer(formattedResult);
			setHistory((prev) => [`${display} = ${formattedResult}`, ...prev.slice(0, 9)]);
		} catch (err) {
			setResult(t.error);
		}
	};

	const appendFunction = (func: string) => {
		setDisplay((prev) => `${prev}${func}(`);
	};

	const applyFactorial = () => {
		// Calculate factorial of current display if it evaluates to a non-negative integer
		try {
			const val = Number(display);
			if (Number.isInteger(val) && val >= 0 && val <= 170) {
				let res = 1;
				for (let i = 2; i <= val; i++) res *= i;
				setDisplay(String(res));
				setResult(String(res));
			} else {
				setResult(t.error);
			}
		} catch {
			setResult(t.error);
		}
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Calculator GUI */}
				<div class="lg:col-span-8 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center justify-between border-b border-hairline pb-2 mb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.title}</h3>
						<button
							class="btn-secondary py-1 px-3 text-[10px]"
							onClick={() => setIsDegree(!isDegree)}
						>
							{isDegree ? t.deg : t.rad}
						</button>
					</div>

					{/* Display Screens */}
					<div class="bg-surface-soft p-4 rounded-lg text-right font-mono border border-hairline relative h-28 flex flex-col justify-between">
						<div class="text-muted text-sm truncate select-all">{display || "0"}</div>
						<div class="text-2xl font-bold text-ink truncate select-all">{result || "0"}</div>
					</div>

					{/* Keyboard Layout */}
					<div class="grid grid-cols-5 gap-2">
						{/* Trigonometry & Math Functions */}
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("sin")}
						>
							sin
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("cos")}
						>
							cos
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("tan")}
						>
							tan
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("log")}
						>
							log
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("ln")}
						>
							ln
						</button>

						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress("π")}
						>
							π
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress("e")}
						>
							e
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => appendFunction("sqrt")}
						>
							√
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress("^")}
						>
							x^y
						</button>
						<button class="btn-secondary py-2 text-xs font-mono" onClick={applyFactorial}>
							x!
						</button>

						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress("(")}
						>
							(
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress(")")}
						>
							)
						</button>
						<button
							class="btn-secondary py-2 text-xs font-mono"
							onClick={() => handleBtnPress("Ans")}
						>
							Ans
						</button>
						<button
							class="bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose font-bold py-2 rounded text-xs transition"
							onClick={handleBackspace}
						>
							DEL
						</button>
						<button
							class="bg-accent-rose/20 hover:bg-accent-rose/30 text-accent-rose font-bold py-2 rounded text-xs transition"
							onClick={handleClear}
						>
							AC
						</button>

						{/* Standard numbers & basic operations */}
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("7")}
						>
							7
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("8")}
						>
							8
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("9")}
						>
							9
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("÷")}
						>
							÷
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("(")}
						>
							(
						</button>

						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("4")}
						>
							4
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("5")}
						>
							5
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("6")}
						>
							6
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("×")}
						>
							×
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress(")")}
						>
							)
						</button>

						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("1")}
						>
							1
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("2")}
						>
							2
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("3")}
						>
							3
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("-")}
						>
							-
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("^")}
						>
							^
						</button>

						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress("0")}
						>
							0
						</button>
						<button
							class="bg-surface-soft hover:bg-surface-hover text-ink py-3 rounded text-sm font-bold"
							onClick={() => handleBtnPress(".")}
						>
							.
						</button>
						<button
							class="btn-primary col-span-2 py-3 rounded text-sm font-bold"
							onClick={evaluateExpression}
						>
							=
						</button>
						<button
							class="btn-secondary py-3 text-sm font-bold"
							onClick={() => handleBtnPress("+")}
						>
							+
						</button>
					</div>
				</div>

				{/* History tape panel */}
				<div class="lg:col-span-4 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.historyTitle}
					</h4>
					{history.length === 0 ? (
						<p class="text-xs text-muted italic">{t.noHistory}</p>
					) : (
						<div class="space-y-2 max-h-64 overflow-y-auto font-mono text-xs text-ink divide-y divide-hairline">
							{history.map((item, index) => (
								<div
									key={index}
									class="pt-2 pb-1 text-right cursor-pointer hover:bg-surface-soft rounded px-2"
									onClick={() => setDisplay(item.split(" = ")[0])}
								>
									{item}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
