import { useEffect, useState } from "preact/hooks";

export default function ProportionCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"check" | "solve">("check");

	// Check Mode inputs
	const [checkA, setCheckA] = useState("4");
	const [checkB, setCheckB] = useState("6");
	const [checkC, setCheckC] = useState("8");
	const [checkD, setCheckD] = useState("12");

	// Solve Mode inputs
	const [propType, setPropType] = useState<"direct" | "inverse">("direct");
	const [x1, setX1] = useState("10");
	const [y1, setY1] = useState("15");
	const [x2, setX2] = useState("20");

	const t = {
		en: {
			title: "Proportion Calculator",
			tabCheck: "Proportion Checker (A:B = C:D)",
			tabSolve: "Proportion Solver (Direct/Inverse)",
			lblA: "Ratio 1 Term A",
			lblB: "Ratio 1 Term B",
			lblC: "Ratio 2 Term C",
			lblD: "Ratio 2 Term D",
			lblDirect: "Direct Proportion",
			lblInverse: "Inverse Proportion",
			lblX1: "Value X1",
			lblY1: "Value Y1",
			lblX2: "Value X2",
			lblY2: "Result Y2",
			btnCalculate: "Check / Solve",
			lblResult: "Result",
			lblSteps: "Step-by-Step Solver",
			errFormat: "Please enter valid numbers.",
			errZero: "Division by zero or invalid inputs.",
			yesProp: "The ratios are proportional!",
			noProp: "The ratios are NOT proportional.",
		},
		vi: {
			title: "Máy tính tỷ lệ thức",
			tabCheck: "Kiểm tra tỷ lệ thức (A:B = C:D)",
			tabSolve: "Giải tỷ lệ thức (Thuận/Nghịch)",
			lblA: "Tỷ số 1 - Số A",
			lblB: "Tỷ số 1 - Số B",
			lblC: "Tỷ số 2 - Số C",
			lblD: "Tỷ số 2 - Số D",
			lblDirect: "Tỷ lệ thuận",
			lblInverse: "Tỷ lệ nghịch",
			lblX1: "Giá trị X1",
			lblY1: "Giá trị Y1",
			lblX2: "Giá trị X2",
			lblY2: "Kết quả Y2",
			btnCalculate: "Kiểm tra / Giải",
			lblResult: "Kết quả",
			lblSteps: "Các bước giải chi tiết",
			errFormat: "Vui lòng nhập các số hợp lệ.",
			errZero: "Lỗi chia cho không hoặc dữ liệu không hợp lệ.",
			yesProp: "Hai tỷ số lập thành một tỷ lệ thức!",
			noProp: "Hai tỷ số KHÔNG lập thành tỷ lệ thức.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run proportion checker
	const checkProportion = () => {
		const a = Number.parseFloat(checkA);
		const b = Number.parseFloat(checkB);
		const c = Number.parseFloat(checkC);
		const d = Number.parseFloat(checkD);

		if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(d)) {
			return { error: t.errFormat };
		}

		const cross1 = a * d;
		const cross2 = b * c;
		const isProp = Math.abs(cross1 - cross2) < 1e-9;

		const steps = [
			`${lang === "en" ? "Cross-multiplication test" : "Phép nhân chéo"}: A × D vs B × C`,
			`${a} × ${d} = ${cross1}`,
			`${b} × ${c} = ${cross2}`,
			isProp
				? `${cross1} = ${cross2} (${lang === "en" ? "Equal" : "Bằng nhau"})`
				: `${cross1} ≠ ${cross2} (${lang === "en" ? "Not equal" : "Khác nhau"})`,
		];

		return {
			isProportional: isProp,
			steps,
		};
	};

	// Solve direct/inverse proportion
	const solveProportion = () => {
		const vX1 = Number.parseFloat(x1);
		const vY1 = Number.parseFloat(y1);
		const vX2 = Number.parseFloat(x2);

		if (Number.isNaN(vX1) || Number.isNaN(vY1) || Number.isNaN(vX2)) {
			return { error: t.errFormat };
		}
		if (vX1 === 0 || (propType === "inverse" && vX2 === 0)) {
			return { error: t.errZero };
		}

		let solvedVal = 0;
		let steps: string[] = [];

		if (propType === "direct") {
			// Y2 = Y1 * (X2 / X1)
			solvedVal = vY1 * (vX2 / vX1);
			steps = [
				`${lang === "en" ? "Direct Proportion relation" : "Quan hệ tỷ lệ thuận"}: Y2 / X2 = Y1 / X1`,
				"Y2 = Y1 × (X2 / X1)",
				`Y2 = ${vY1} × (${vX2} / ${vX1})`,
				`Y2 = ${vY1} × ${vX2 / vX1} = ${solvedVal}`,
			];
		} else {
			// Y2 = Y1 * (X1 / X2)
			solvedVal = vY1 * (vX1 / vX2);
			steps = [
				`${lang === "en" ? "Inverse Proportion relation" : "Quan hệ tỷ lệ nghịch"}: Y2 × X2 = Y1 × X1`,
				"Y2 = Y1 × (X1 / X2)",
				`Y2 = ${vY1} × (${vX1} / ${vX2})`,
				`Y2 = ${vY1} × ${vX1 / vX2} = ${solvedVal}`,
			];
		}

		const rounded = Math.round(solvedVal * 100000) / 100000;
		return {
			val: rounded,
			steps,
		};
	};

	const cRes = mode === "check" ? checkProportion() : null;
	const sRes = mode === "solve" ? solveProportion() : null;

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "check"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("check")}
				>
					{t.tabCheck}
				</button>
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
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Inputs panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{mode === "check" ? (
						<div class="space-y-3">
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="text-xs text-muted block mb-1">A</label>
									<input
										type="number"
										class="input w-full"
										value={checkA}
										onInput={(e) => setCheckA((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">B</label>
									<input
										type="number"
										class="input w-full"
										value={checkB}
										onInput={(e) => setCheckB((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">C</label>
									<input
										type="number"
										class="input w-full"
										value={checkC}
										onInput={(e) => setCheckC((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">D</label>
									<input
										type="number"
										class="input w-full"
										value={checkD}
										onInput={(e) => setCheckD((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						</div>
					) : (
						<div class="space-y-4">
							{/* Prop type toggle */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">Proportion Type</label>
								<select
									class="input w-full"
									value={propType}
									onChange={(e) => setPropType((e.target as HTMLSelectElement).value as any)}
								>
									<option value="direct">{t.lblDirect}</option>
									<option value="inverse">{t.lblInverse}</option>
								</select>
							</div>

							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class="text-[10px] text-muted block mb-1">X1</label>
									<input
										type="number"
										class="input w-full"
										value={x1}
										onInput={(e) => setX1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-[10px] text-muted block mb-1">Y1</label>
									<input
										type="number"
										class="input w-full"
										value={y1}
										onInput={(e) => setY1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div>
									<label class="text-[10px] text-muted block mb-1">X2</label>
									<input
										type="number"
										class="input w-full"
										value={x2}
										onInput={(e) => setX2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 space-y-4">
					{/* Error display */}
					{((mode === "check" && cRes?.error) || (mode === "solve" && sRes?.error)) && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{mode === "check" ? cRes?.error : sRes?.error}
						</div>
					)}

					{/* Proportion Checker output */}
					{mode === "check" && !cRes?.error && cRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
								<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
								<div
									class={`text-xl font-bold mt-2 ${
										cRes.isProportional ? "text-accent-emerald" : "text-accent-rose"
									}`}
								>
									{cRes.isProportional ? t.yesProp : t.noProp}
								</div>
							</div>

							{/* Step tape */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
								<ul class="space-y-2 text-xs text-muted">
									{cRes.steps?.map((step, idx) => (
										<li key={idx} class="flex gap-2 items-start">
											<span class="badge badge-yellow shrink-0">{idx + 1}</span>
											<span class="font-mono">{step}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					{/* Proportion Solver output */}
					{mode === "solve" && !sRes?.error && sRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
								<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
								<div class="text-2xl font-bold text-primary mt-1">Y2 = {sRes.val}</div>
							</div>

							{/* Step solver */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
								<ul class="space-y-2 text-xs text-muted">
									{sRes.steps?.map((step, idx) => (
										<li key={idx} class="flex gap-2 items-start">
											<span class="badge badge-yellow shrink-0">{idx + 1}</span>
											<span class="font-mono">{step}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
