import { useEffect, useState } from "preact/hooks";

function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) {
		[a, b] = [b, a % b];
	}
	return a;
}

// Find GCD of an array of numbers
function gcdMultiple(arr: number[]): number {
	if (arr.length === 0) return 1;
	return arr.reduce((acc, val) => gcd(acc, val), arr[0]);
}

export default function RatioCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"solve" | "simplify" | "scale">("solve");

	// Solve Mode inputs
	const [solveA, setSolveA] = useState("2");
	const [solveB, setSolveB] = useState("3");
	const [solveC, setSolveC] = useState("4");
	const [solveD, setSolveD] = useState("");

	// Simplify Mode inputs
	const [simplifyInput, setSimplifyInput] = useState("15, 20, 25");

	// Scale Mode inputs
	const [scaleRatio, setScaleRatio] = useState("1:2:3");
	const [scaleSum, setScaleSum] = useState("60");

	const t = {
		en: {
			title: "Ratio Calculator",
			tabSolve: "Solve Ratio (A:B = C:D)",
			tabSimplify: "Simplify Ratio",
			tabScale: "Scale Ratio by Sum",
			lblA: "A",
			lblB: "B",
			lblC: "C",
			lblD: "D",
			btnCalculate: "Calculate",
			lblResult: "Result",
			lblSteps: "Steps",
			lblScaleSum: "Target Total Sum",
			lblRatioInput: "Ratio (comma/colon separated)",
			errInvalid: "Please fill exactly 3 fields to solve.",
			errFormat: "Invalid input format.",
		},
		vi: {
			title: "Máy tính tỷ số",
			tabSolve: "Giải tỷ số (A:B = C:D)",
			tabSimplify: "Rút gọn tỷ số",
			tabScale: "Chia tỷ lệ theo tổng",
			lblA: "A",
			lblB: "B",
			lblC: "C",
			lblD: "D",
			btnCalculate: "Tính toán",
			lblResult: "Kết quả",
			lblSteps: "Các bước giải",
			lblScaleSum: "Tổng số mục tiêu",
			lblRatioInput: "Tỷ số (ngăn cách bởi dấu phẩy/hai chấm)",
			errInvalid: "Vui lòng nhập đúng 3 ô để tìm ô còn lại.",
			errFormat: "Định dạng dữ liệu không hợp lệ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Solve A:B = C:D
	const solveRatio = () => {
		const a = solveA ? Number.parseFloat(solveA) : Number.NaN;
		const b = solveB ? Number.parseFloat(solveB) : Number.NaN;
		const c = solveC ? Number.parseFloat(solveC) : Number.NaN;
		const d = solveD ? Number.parseFloat(solveD) : Number.NaN;

		const inputs = [a, b, c, d];
		const missingIndex = inputs.findIndex((x) => Number.isNaN(x));
		const emptyCount = inputs.filter((x) => Number.isNaN(x)).length;

		if (emptyCount !== 1) {
			return { error: t.errInvalid };
		}

		let solvedVal = 0;
		let stepDesc = "";

		if (missingIndex === 0) {
			// A = (B * C) / D
			solvedVal = (b * c) / d;
			stepDesc = `A = (B × C) / D = (${b} × ${c}) / ${d} = ${solvedVal}`;
		} else if (missingIndex === 1) {
			// B = (A * D) / C
			solvedVal = (a * d) / c;
			stepDesc = `B = (A × D) / C = (${a} × ${d}) / ${c} = ${solvedVal}`;
		} else if (missingIndex === 2) {
			// C = (A * D) / B
			solvedVal = (a * d) / b;
			stepDesc = `C = (A × D) / B = (${a} × ${d}) / ${b} = ${solvedVal}`;
		} else if (missingIndex === 3) {
			// D = (B * C) / A
			solvedVal = (b * c) / a;
			stepDesc = `D = (B × C) / A = (${b} × ${c}) / ${a} = ${solvedVal}`;
		}

		const rounded = Math.round(solvedVal * 100000) / 100000;
		return {
			val: rounded,
			step: stepDesc,
			missingIndex,
		};
	};

	// Simplify Ratio
	const simplifyRatio = () => {
		const vals = simplifyInput
			.replace(/:/g, ",")
			.split(",")
			.map((x) => Number.parseFloat(x.trim()))
			.filter((x) => !Number.isNaN(x) && x > 0);

		if (vals.length < 2) return { error: t.errFormat };

		// To simplify decimal ratios, convert them to integers first
		const decimals = vals.map((v) => {
			const str = v.toString();
			const dotIdx = str.indexOf(".");
			return dotIdx === -1 ? 0 : str.length - dotIdx - 1;
		});
		const maxDec = Math.max(...decimals);
		const mult = 10 ** maxDec;

		const intVals = vals.map((v) => Math.round(v * mult));
		const divisor = gcdMultiple(intVals);
		const simplified = intVals.map((v) => v / divisor);

		return {
			original: vals.join(" : "),
			simplified: simplified.join(" : "),
			step: `${lang === "en" ? "Scale to integers" : "Chuyển thành số nguyên"}: ${intVals.join(" : ")} (× ${mult})
${lang === "en" ? "Divide by GCD" : "Chia cho UCLN"}(${divisor}): ${simplified.join(" : ")}`,
		};
	};

	// Scale Ratio by total sum
	const scaleRatioBySum = () => {
		const parts = scaleRatio
			.replace(/:/g, ",")
			.split(",")
			.map((x) => Number.parseFloat(x.trim()))
			.filter((x) => !Number.isNaN(x) && x > 0);

		const target = Number.parseFloat(scaleSum);

		if (parts.length === 0 || Number.isNaN(target) || target <= 0) {
			return { error: t.errFormat };
		}

		const sumParts = parts.reduce((a, b) => a + b, 0);
		const factor = target / sumParts;
		const scaled = parts.map((p) => Math.round(p * factor * 10000) / 10000);

		return {
			original: parts.join(" : "),
			sum: sumParts,
			factor: factor.toFixed(5),
			result: scaled.join(" : "),
			parts: scaled,
		};
	};

	const sRes = mode === "solve" ? solveRatio() : null;
	const simpRes = mode === "simplify" ? simplifyRatio() : null;
	const scRes = mode === "scale" ? scaleRatioBySum() : null;

	return (
		<div class="space-y-6">
			{/* Sub tabs */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "solve"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("solve")}
				>
					{t.tabSolve}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "simplify"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("simplify")}
				>
					{t.tabSimplify}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "scale"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("scale")}
				>
					{t.tabScale}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{mode === "solve" && (
						<div class="space-y-3">
							<p class="text-xs text-muted">A : B = C : D</p>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="text-xs text-ink font-bold block mb-1">{t.lblA}</label>
									<input
										type="number"
										class="input w-full"
										value={solveA}
										onInput={(e) => setSolveA((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-ink font-bold block mb-1">{t.lblB}</label>
									<input
										type="number"
										class="input w-full"
										value={solveB}
										onInput={(e) => setSolveB((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-ink font-bold block mb-1">{t.lblC}</label>
									<input
										type="number"
										class="input w-full"
										value={solveC}
										onInput={(e) => setSolveC((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-ink font-bold block mb-1">{t.lblD}</label>
									<input
										type="number"
										class="input w-full"
										value={solveD}
										onInput={(e) => setSolveD((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						</div>
					)}

					{mode === "simplify" && (
						<div class="space-y-3">
							<label class="text-body-sm-strong text-ink block">{t.lblRatioInput}</label>
							<input
								type="text"
								class="input w-full font-mono text-sm"
								value={simplifyInput}
								onInput={(e) => setSimplifyInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}

					{mode === "scale" && (
						<div class="space-y-3">
							<label class="text-body-sm-strong text-ink block">{t.lblRatioInput}</label>
							<input
								type="text"
								class="input w-full font-mono text-sm"
								value={scaleRatio}
								onInput={(e) => setScaleRatio((e.target as HTMLInputElement).value)}
							/>

							<label class="text-body-sm-strong text-ink block">{t.lblScaleSum}</label>
							<input
								type="number"
								class="input w-full"
								value={scaleSum}
								onInput={(e) => setScaleSum((e.target as HTMLInputElement).value)}
							/>
						</div>
					)}
				</div>

				{/* Results screen */}
				<div class="lg:col-span-7 space-y-4">
					{/* Error handling */}
					{((mode === "solve" && sRes?.error) ||
						(mode === "simplify" && simpRes?.error) ||
						(mode === "scale" && scRes?.error)) && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{mode === "solve" ? sRes?.error : mode === "simplify" ? simpRes?.error : scRes?.error}
						</div>
					)}

					{/* Ratio Solver Result */}
					{mode === "solve" && !sRes?.error && sRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
								<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
								<div class="text-2xl font-bold text-primary mt-1">
									{sRes.missingIndex === 0 && `A = ${sRes.val}`}
									{sRes.missingIndex === 1 && `B = ${sRes.val}`}
									{sRes.missingIndex === 2 && `C = ${sRes.val}`}
									{sRes.missingIndex === 3 && `D = ${sRes.val}`}
								</div>
								<p class="text-xs text-muted font-mono mt-3 pt-2 border-t border-hairline">
									{sRes.step}
								</p>
							</div>
						</div>
					)}

					{/* Simplify Ratio Result */}
					{mode === "simplify" && !simpRes?.error && simpRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
								<div>
									<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
									<div class="text-2xl font-bold text-primary mt-1">{simpRes.simplified}</div>
								</div>
								<div>
									<div class="text-[10px] text-muted font-bold uppercase">{t.lblSteps}</div>
									<pre class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg mt-1.5 whitespace-pre-wrap">
										{simpRes.step}
									</pre>
								</div>
							</div>
						</div>
					)}

					{/* Scale Ratio Result */}
					{mode === "scale" && !scRes?.error && scRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
								<div>
									<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
									<div class="text-2xl font-bold text-primary mt-1">{scRes.result}</div>
								</div>
								<div class="text-xs text-muted space-y-1">
									<div>Factor: {scRes.factor}</div>
									<div>Original Sum: {scRes.sum}</div>
								</div>

								{/* Segmented Bar representation */}
								<div class="w-full h-6 rounded overflow-hidden flex mt-4 border border-hairline shadow-inner">
									{scRes.parts.map((p, idx) => {
										const pct = (p / Number(scaleSum)) * 100;
										const bgClass = [
											"bg-primary",
											"bg-accent-emerald",
											"bg-accent-rose",
											"bg-badge-yellow",
										][idx % 4];
										return (
											<div
												key={idx}
												class={`${bgClass} h-full flex items-center justify-center text-[10px] font-bold text-white`}
												style={{ width: `${pct}%` }}
											>
												{p}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
