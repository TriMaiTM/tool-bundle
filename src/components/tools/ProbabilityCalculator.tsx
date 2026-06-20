import { useEffect, useState } from "preact/hooks";

function factorial(num: number): number {
	if (num < 0) return 0;
	let res = 1;
	for (let i = 2; i <= num; i++) res *= i;
	return res;
}

function combinations(n: number, r: number): number {
	if (r < 0 || r > n) return 0;
	return factorial(n) / (factorial(r) * factorial(n - r));
}

function permutations(n: number, r: number): number {
	if (r < 0 || r > n) return 0;
	return factorial(n) / factorial(n - r);
}

export default function ProbabilityCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"single" | "multi" | "ncr" | "binomial">("single");

	// Single Event
	const [favOutcomes, setFavOutcomes] = useState("1");
	const [totalOutcomes, setTotalOutcomes] = useState("6");

	// Multi Events
	const [probA, setProbA] = useState("0.5");
	const [probB, setProbB] = useState("0.3");

	// nPr / nCr
	const [valN, setValN] = useState("10");
	const [valR, setValR] = useState("3");

	// Binomial
	const [trials, setTrials] = useState("5"); // n
	const [successes, setSuccesses] = useState("2"); // k
	const [successProb, setSuccessProb] = useState("0.5"); // p

	const t = {
		en: {
			title: "Probability Calculator",
			tabSingle: "Single Event",
			tabMulti: "Multiple Events",
			tabNcr: "nPr / nCr",
			tabBinomial: "Binomial Probability",
			lblFav: "Favorable Outcomes",
			lblTotal: "Total Possible Outcomes",
			lblProbA: "Probability of A (P(A))",
			lblProbB: "Probability of B (P(B))",
			lblN: "Total Items (n)",
			lblR: "Chosen Items (r)",
			lblTrials: "Number of Trials (n)",
			lblSuccesses: "Number of Successes (k)",
			lblProbOfSuccess: "Probability of Success (p)",
			btnCalculate: "Calculate",
			lblResult: "Result",
			lblFormula: "Formula & Steps",
			errInvalid: "Please enter valid parameters.",
			errRange: "Probability must be between 0 and 1.",
			errNcrRange: "Ensure n >= r >= 0 and n <= 100 for exact factorials.",
		},
		vi: {
			title: "Máy tính xác suất & Tổ hợp",
			tabSingle: "Biến cố đơn",
			tabMulti: "Nhiều biến cố",
			tabNcr: "Hoán vị / Tổ hợp",
			tabBinomial: "Xác suất Nhị thức",
			lblFav: "Số kết quả thuận lợi",
			lblTotal: "Tổng số kết quả có thể xảy ra",
			lblProbA: "Xác suất của A (P(A))",
			lblProbB: "Xác suất của B (P(B))",
			lblN: "Tổng số phần tử (n)",
			lblR: "Số phần tử được chọn (r)",
			lblTrials: "Số lần thử (n)",
			lblSuccesses: "Số lần thành công (k)",
			lblProbOfSuccess: "Xác suất thành công (p)",
			btnCalculate: "Tính toán",
			lblResult: "Kết quả",
			lblFormula: "Công thức & Các bước",
			errInvalid: "Vui lòng nhập các tham số hợp lệ.",
			errRange: "Xác suất phải nằm trong khoảng từ 0 đến 1.",
			errNcrRange: "Đảm bảo n >= r >= 0 và n <= 100 để tính chính xác giai thừa.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Calculations
	const runSingle = () => {
		const fav = Number.parseInt(favOutcomes);
		const tot = Number.parseInt(totalOutcomes);

		if (Number.isNaN(fav) || Number.isNaN(tot) || fav < 0 || tot <= 0 || fav > tot) {
			return { error: t.errInvalid };
		}

		const p = fav / tot;
		const pct = p * 100;
		return {
			val: p.toFixed(5),
			percentage: `${pct.toFixed(2)}%`,
			formula: `P(A) = Favorable / Total = ${fav} / ${tot} = ${p.toFixed(5)}`,
		};
	};

	const runMulti = () => {
		const pA = Number.parseFloat(probA);
		const pB = Number.parseFloat(probB);

		if (Number.isNaN(pA) || Number.isNaN(pB) || pA < 0 || pA > 1 || pB < 0 || pB > 1) {
			return { error: t.errRange };
		}

		const pA_and_B = pA * pB;
		const pA_or_B = pA + pB - pA_and_B;

		return {
			and: pA_and_B.toFixed(5),
			or: pA_or_B.toFixed(5),
			formula: `P(A and B) = P(A) × P(B) = ${pA} × ${pB} = ${pA_and_B.toFixed(5)}\nP(A or B) = P(A) + P(B) - P(A and B) = ${pA} + ${pB} - ${pA_and_B.toFixed(5)} = ${pA_or_B.toFixed(5)}`,
		};
	};

	const runNcr = () => {
		const n = Number.parseInt(valN);
		const r = Number.parseInt(valR);

		if (Number.isNaN(n) || Number.isNaN(r) || n < 0 || r < 0 || r > n || n > 100) {
			return { error: t.errNcrRange };
		}

		const perm = permutations(n, r);
		const comb = combinations(n, r);

		return {
			permutations: perm,
			combinations: comb,
			formula: `Permutations nPr = n! / (n-r)! = ${n}! / (${n}-${r})! = ${perm}\nCombinations nCr = n! / (r!(n-r)!) = ${n}! / (${r}! × (${n}-${r})!) = ${comb}`,
		};
	};

	const runBinomial = () => {
		const n = Number.parseInt(trials);
		const k = Number.parseInt(successes);
		const p = Number.parseFloat(successProb);

		if (
			Number.isNaN(n) ||
			Number.isNaN(k) ||
			Number.isNaN(p) ||
			n < 0 ||
			k < 0 ||
			k > n ||
			p < 0 ||
			p > 1 ||
			n > 100
		) {
			return { error: t.errInvalid };
		}

		const nCr = combinations(n, k);
		const probability = nCr * p ** k * (1 - p) ** (n - k);

		return {
			val: probability.toFixed(6),
			percentage: `${(probability * 100).toFixed(4)}%`,
			formula: `P(X = k) = nCr × p^k × (1-p)^(n-k)\nP(X = ${k}) = ${nCr} × ${p}^${k} × (1-${p})^(${n}-${k}) = ${probability.toFixed(6)}`,
		};
	};

	const singleRes = mode === "single" ? runSingle() : null;
	const multiRes = mode === "multi" ? runMulti() : null;
	const ncrRes = mode === "ncr" ? runNcr() : null;
	const bRes = mode === "binomial" ? runBinomial() : null;

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				{["single", "multi", "ncr", "binomial"].map((m) => (
					<button
						key={m}
						class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all capitalize ${
							mode === m
								? "border-primary text-primary"
								: "border-transparent text-muted hover:text-ink"
						}`}
						onClick={() => setMode(m as any)}
					>
						{m === "single" && t.tabSingle}
						{m === "multi" && t.tabMulti}
						{m === "ncr" && t.tabNcr}
						{m === "binomial" && t.tabBinomial}
					</button>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Inputs settings */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{mode === "single" && (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblFav}</label>
								<input
									type="number"
									class="input w-full"
									value={favOutcomes}
									onInput={(e) => setFavOutcomes((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblTotal}</label>
								<input
									type="number"
									class="input w-full"
									value={totalOutcomes}
									onInput={(e) => setTotalOutcomes((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{mode === "multi" && (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblProbA}</label>
								<input
									type="number"
									step="0.1"
									class="input w-full"
									value={probA}
									onInput={(e) => setProbA((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblProbB}</label>
								<input
									type="number"
									step="0.1"
									class="input w-full"
									value={probB}
									onInput={(e) => setProbB((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{mode === "ncr" && (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblN}</label>
								<input
									type="number"
									class="input w-full"
									value={valN}
									onInput={(e) => setValN((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblR}</label>
								<input
									type="number"
									class="input w-full"
									value={valR}
									onInput={(e) => setValR((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{mode === "binomial" && (
						<div class="space-y-3">
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblTrials}</label>
								<input
									type="number"
									class="input w-full"
									value={trials}
									onInput={(e) => setTrials((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblSuccesses}</label>
								<input
									type="number"
									class="input w-full"
									value={successes}
									onInput={(e) => setSuccesses((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblProbOfSuccess}</label>
								<input
									type="number"
									step="0.1"
									class="input w-full"
									value={successProb}
									onInput={(e) => setSuccessProb((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Results screen */}
				<div class="lg:col-span-7 space-y-4">
					{/* Error box */}
					{((mode === "single" && singleRes?.error) ||
						(mode === "multi" && multiRes?.error) ||
						(mode === "ncr" && ncrRes?.error) ||
						(mode === "binomial" && bRes?.error)) && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{singleRes?.error || multiRes?.error || ncrRes?.error || bRes?.error}
						</div>
					)}

					{/* Single Event Result */}
					{mode === "single" && !singleRes?.error && singleRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
										<div class="text-2xl font-bold text-primary">{singleRes.val}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">Percentage</div>
										<div class="text-2xl font-bold text-ink">{singleRes.percentage}</div>
									</div>
								</div>
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-1">{t.lblFormula}</div>
									<div class="text-xs font-mono text-ink">{singleRes.formula}</div>
								</div>
							</div>
						</div>
					)}

					{/* Multi Events Result */}
					{mode === "multi" && !multiRes?.error && multiRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">P(A and B)</div>
										<div class="text-2xl font-bold text-primary">{multiRes.and}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">P(A or B)</div>
										<div class="text-2xl font-bold text-ink">{multiRes.or}</div>
									</div>
								</div>
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblFormula}</div>
									<pre class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
										{multiRes.formula}
									</pre>
								</div>
							</div>
						</div>
					)}

					{/* nPr / nCr Result */}
					{mode === "ncr" && !ncrRes?.error && ncrRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">Permutations (nPr)</div>
										<div class="text-2xl font-bold text-primary">{ncrRes.permutations}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">Combinations (nCr)</div>
										<div class="text-2xl font-bold text-ink">{ncrRes.combinations}</div>
									</div>
								</div>
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblFormula}</div>
									<pre class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
										{ncrRes.formula}
									</pre>
								</div>
							</div>
						</div>
					)}

					{/* Binomial Result */}
					{mode === "binomial" && !bRes?.error && bRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
										<div class="text-2xl font-bold text-primary">{bRes.val}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">Percentage</div>
										<div class="text-2xl font-bold text-ink">{bRes.percentage}</div>
									</div>
								</div>
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblFormula}</div>
									<pre class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
										{bRes.formula}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
