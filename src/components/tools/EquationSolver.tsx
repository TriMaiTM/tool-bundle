import { useEffect, useState } from "preact/hooks";

type EqType = "linear" | "quadratic" | "cubic" | "system2" | "system3";

export default function EquationSolver() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [type, setType] = useState<EqType>("quadratic");

	// Coefficient Inputs
	const [coeffA, setCoeffA] = useState("1");
	const [coeffB, setCoeffB] = useState("-5");
	const [coeffC, setCoeffC] = useState("6");
	const [coeffD, setCoeffD] = useState("0");

	// System of 2 Equations: a1*x + b1*y = c1; a2*x + b2*y = c2
	const [sys2, setSys2] = useState({
		a1: "2",
		b1: "3",
		c1: "8",
		a2: "1",
		b2: "-1",
		c2: "1",
	});

	// System of 3 Equations inputs
	const [sys3, setSys3] = useState({
		a1: "1",
		b1: "1",
		c1: "1",
		d1: "6",
		a2: "0",
		b2: "2",
		c2: "5",
		d2: "-4",
		a3: "2",
		b3: "5",
		c3: "-1",
		d3: "27",
	});

	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<string[] | null>(null);
	const [steps, setSteps] = useState<string[]>([]);

	const t = {
		en: {
			title: "Equation Solver",
			lblType: "Equation Type",
			btnSolve: "Solve",
			lblResult: "Roots / Solutions",
			lblSteps: "Step-by-Step Solver Log",
			errInvalid: "Please enter valid numeric coefficients.",
			errNoSolution: "Equation has no solution or infinite solutions.",
			errAzero: "Coefficient 'a' cannot be zero.",
			optLinear: "Linear Equation (ax + b = 0)",
			optQuadratic: "Quadratic Equation (ax² + bx + c = 0)",
			optCubic: "Cubic Equation (ax³ + bx² + cx + d = 0)",
			optSystem2: "2x2 Linear System",
			optSystem3: "3x3 Linear System",
		},
		vi: {
			title: "Trình giải phương trình & Hệ phương trình",
			lblType: "Loại phương trình",
			btnSolve: "Giải phương trình",
			lblResult: "Nghiệm / Hệ nghiệm",
			lblSteps: "Các bước giải chi tiết",
			errInvalid: "Vui lòng nhập các hệ số hợp lệ.",
			errNoSolution: "Phương trình vô nghiệm hoặc vô số nghiệm.",
			errAzero: "Hệ số 'a' phải khác 0.",
			optLinear: "Phương trình bậc nhất (ax + b = 0)",
			optQuadratic: "Phương trình bậc hai (ax² + bx + c = 0)",
			optCubic: "Phương trình bậc ba (ax³ + bx² + cx + d = 0)",
			optSystem2: "Hệ phương trình bậc nhất 2 ẩn",
			optSystem3: "Hệ phương trình bậc nhất 3 ẩn",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const solveEquation = () => {
		setError(null);
		setResult(null);
		setSteps([]);

		const a = Number.parseFloat(coeffA);
		const b = Number.parseFloat(coeffB);
		const c = Number.parseFloat(coeffC);
		const d = Number.parseFloat(coeffD);

		if (type === "linear") {
			if (Number.isNaN(a) || Number.isNaN(b)) {
				setError(t.errInvalid);
				return;
			}
			if (a === 0) {
				setError(t.errAzero);
				return;
			}
			const x = -b / a;
			setResult([`x = ${Math.round(x * 100000) / 100000}`]);
			setSteps([
				`Equation: ${a}x + ${b} = 0`,
				`Isolate x: ${a}x = ${-b}`,
				`Solve: x = ${-b} / ${a} = ${x}`,
			]);
		} else if (type === "quadratic") {
			if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
				setError(t.errInvalid);
				return;
			}
			if (a === 0) {
				setError(t.errAzero);
				return;
			}

			const delta = b * b - 4 * a * c;
			const quadraticSteps = [
				`Equation: ${a}x² + (${b})x + (${c}) = 0`,
				`Calculate discriminant (Δ): b² - 4ac = (${b})² - 4(${a})(${c}) = ${delta}`,
			];

			if (delta > 0) {
				const x1 = (-b + Math.sqrt(delta)) / (2 * a);
				const x2 = (-b - Math.sqrt(delta)) / (2 * a);
				setResult([
					`x1 = ${Math.round(x1 * 100000) / 100000}`,
					`x2 = ${Math.round(x2 * 100000) / 100000}`,
				]);
				quadraticSteps.push(
					"Δ > 0: Real and distinct roots",
					`x1 = (-b + √Δ)/(2a) = (-(${b}) + √${delta}) / (2×${a}) = ${x1}`,
					`x2 = (-b - √Δ)/(2a) = (-(${b}) - √${delta}) / (2×${a}) = ${x2}`,
				);
			} else if (delta === 0) {
				const x = -b / (2 * a);
				setResult([`x = ${Math.round(x * 100000) / 100000} (Double Root)`]);
				quadraticSteps.push("Δ = 0: Double root", `x = -b / 2a = -(${b}) / (2×${a}) = ${x}`);
			} else {
				const real = -b / (2 * a);
				const imag = Math.sqrt(-delta) / (2 * a);
				setResult([
					`x1 = ${real.toFixed(4)} + ${imag.toFixed(4)}i`,
					`x2 = ${real.toFixed(4)} - ${imag.toFixed(4)}i`,
				]);
				quadraticSteps.push(
					"Δ < 0: Complex conjugate roots",
					`x = -b/2a ± i√(-Δ)/2a = ${real.toFixed(4)} ± ${imag.toFixed(4)}i`,
				);
			}
			setSteps(quadraticSteps);
		} else if (type === "cubic") {
			if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(d)) {
				setError(t.errInvalid);
				return;
			}
			if (a === 0) {
				setError(t.errAzero);
				return;
			}

			// Cardano's Formula helper for standard Cubic solver
			// Convert to depressed cubic: t^3 + pt + q = 0
			const p = (3 * a * c - b * b) / (3 * a * a);
			const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);

			const disc = (q * q) / 4 + (p * p * p) / 27;
			const cubicSteps = [
				`Depressed cubic parameters: p = ${p.toFixed(4)}, q = ${q.toFixed(4)}`,
				`Discriminant (D): (q/2)² + (p/3)³ = ${disc.toFixed(4)}`,
			];

			if (disc > 0) {
				const u = Math.cbrt(-q / 2 + Math.sqrt(disc));
				const v = Math.cbrt(-q / 2 - Math.sqrt(disc));
				const x1 = u + v - b / (3 * a);
				setResult([`x1 = ${x1.toFixed(5)} (Real)`]);
				cubicSteps.push("D > 0: One real root, two complex roots.");
			} else if (disc === 0) {
				if (p === 0) {
					const x = -b / (3 * a);
					setResult([`x = ${x.toFixed(5)} (Triple root)`]);
				} else {
					const x1 = (3 * q) / p - b / (3 * a);
					const x2 = (-1.5 * q) / p - b / (3 * a);
					setResult([`x1 = ${x1.toFixed(5)}`, `x2 = ${x2.toFixed(5)} (Double Root)`]);
				}
				cubicSteps.push("D = 0: Real roots, at least a double root.");
			} else {
				// D < 0: 3 distinct real roots (Trigonometric solution)
				const r = Math.sqrt((-p * p * p) / 27);
				const phi = Math.acos(-q / (2 * r));
				const m = 2 * Math.sqrt(-p / 3);
				const x1 = m * Math.cos(phi / 3) - b / (3 * a);
				const x2 = m * Math.cos((phi + 2 * Math.PI) / 3) - b / (3 * a);
				const x3 = m * Math.cos((phi + 4 * Math.PI) / 3) - b / (3 * a);
				setResult([`x1 = ${x1.toFixed(5)}`, `x2 = ${x2.toFixed(5)}`, `x3 = ${x3.toFixed(5)}`]);
				cubicSteps.push("D < 0: Three distinct real roots.");
			}
			setSteps(cubicSteps);
		} else if (type === "system2") {
			const a1 = Number.parseFloat(sys2.a1);
			const b1 = Number.parseFloat(sys2.b1);
			const c1 = Number.parseFloat(sys2.c1);
			const a2 = Number.parseFloat(sys2.a2);
			const b2 = Number.parseFloat(sys2.b2);
			const c2 = Number.parseFloat(sys2.c2);

			if ([a1, b1, c1, a2, b2, c2].some((x) => Number.isNaN(x))) {
				setError(t.errInvalid);
				return;
			}

			// Determinants (Cramer's Rule)
			const D = a1 * b2 - b1 * a2;
			const Dx = c1 * b2 - b1 * c2;
			const Dy = a1 * c2 - c1 * a2;

			if (D === 0) {
				setError(t.errNoSolution);
				return;
			}

			const x = Dx / D;
			const y = Dy / D;

			setResult([
				`x = ${Math.round(x * 100000) / 100000}`,
				`y = ${Math.round(y * 100000) / 100000}`,
			]);
			setSteps([
				`System:\n1) ${a1}x + ${b1}y = ${c1}\n2) ${a2}x + ${b2}y = ${c2}`,
				`Determinant (D): a1*b2 - b1*a2 = ${D}`,
				`Dx: c1*b2 - b1*c2 = ${Dx}`,
				`Dy: a1*c2 - c1*a2 = ${Dy}`,
				`Solution: x = Dx / D = ${x}, y = Dy / D = ${y}`,
			]);
		} else if (type === "system3") {
			const { a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3 } = sys3;
			const vals = [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3].map(Number.parseFloat);

			if (vals.some(Number.isNaN)) {
				setError(t.errInvalid);
				return;
			}

			const [A1, B1, C1, D1, A2, B2, C2, D2, A3, B3, C3, D3] = vals;

			// Determinant functions
			const det3 = (
				m11: number,
				m12: number,
				m13: number,
				m21: number,
				m22: number,
				m23: number,
				m31: number,
				m32: number,
				m33: number,
			) => {
				return (
					m11 * (m22 * m33 - m23 * m32) -
					m12 * (m21 * m33 - m23 * m31) +
					m13 * (m21 * m32 - m22 * m31)
				);
			};

			const D = det3(A1, B1, C1, A2, B2, C2, A3, B3, C3);
			const Dx = det3(D1, B1, C1, D2, B2, C2, D3, B3, C3);
			const Dy = det3(A1, D1, C1, A2, D2, C2, A3, D3, C3);
			const Dz = det3(A1, B1, D1, A2, B2, D2, A3, B3, D3);

			if (D === 0) {
				setError(t.errNoSolution);
				return;
			}

			const x = Dx / D;
			const y = Dy / D;
			const z = Dz / D;

			setResult([`x = ${x.toFixed(5)}`, `y = ${y.toFixed(5)}`, `z = ${z.toFixed(5)}`]);
			setSteps([
				`System:\n1) ${A1}x + ${B1}y + ${C1}z = ${D1}\n2) ${A2}x + ${B2}y + ${C2}z = ${D2}\n3) ${A3}x + ${B3}y + ${C3}z = ${D3}`,
				`Main Det (D) = ${D}`,
				`Dx = ${Dx}, Dy = ${Dy}, Dz = ${Dz}`,
				"x = Dx/D, y = Dy/D, z = Dz/D",
			]);
		}
	};

	return (
		<div class="space-y-6">
			{/* Mode navigation tabs */}
			<div class="flex border-b border-hairline gap-4">
				{["linear", "quadratic", "cubic", "system2", "system3"].map((m) => (
					<button
						key={m}
						class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
							type === m
								? "border-primary text-primary"
								: "border-transparent text-muted hover:text-ink"
						}`}
						onClick={() => {
							setType(m as any);
							setError(null);
							setResult(null);
							setSteps([]);
						}}
					>
						{m === "linear" && t.optLinear.split(" (")[0]}
						{m === "quadratic" && t.optQuadratic.split(" (")[0]}
						{m === "cubic" && t.optCubic.split(" (")[0]}
						{m === "system2" && t.optSystem2}
						{m === "system3" && t.optSystem3}
					</button>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Coefficient inputs */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{type === "linear" && (
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="text-xs text-muted block mb-1">a</label>
								<input
									type="number"
									class="input w-full"
									value={coeffA}
									onInput={(e) => setCoeffA((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">b</label>
								<input
									type="number"
									class="input w-full"
									value={coeffB}
									onInput={(e) => setCoeffB((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{type === "quadratic" && (
						<div class="grid grid-cols-3 gap-3">
							<div>
								<label class="text-xs text-muted block mb-1">a</label>
								<input
									type="number"
									class="input w-full"
									value={coeffA}
									onInput={(e) => setCoeffA((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">b</label>
								<input
									type="number"
									class="input w-full"
									value={coeffB}
									onInput={(e) => setCoeffB((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">c</label>
								<input
									type="number"
									class="input w-full"
									value={coeffC}
									onInput={(e) => setCoeffC((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{type === "cubic" && (
						<div class="grid grid-cols-4 gap-2">
							<div>
								<label class="text-xs text-muted block mb-1">a</label>
								<input
									type="number"
									class="input w-full"
									value={coeffA}
									onInput={(e) => setCoeffA((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">b</label>
								<input
									type="number"
									class="input w-full"
									value={coeffB}
									onInput={(e) => setCoeffB((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">c</label>
								<input
									type="number"
									class="input w-full"
									value={coeffC}
									onInput={(e) => setCoeffC((e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-xs text-muted block mb-1">d</label>
								<input
									type="number"
									class="input w-full"
									value={coeffD}
									onInput={(e) => setCoeffD((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}

					{type === "system2" && (
						<div class="space-y-4">
							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class="text-xs text-muted block mb-1">a1</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.a1}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, a1: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">b1</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.b1}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, b1: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">c1</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.c1}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, c1: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
							</div>
							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class="text-xs text-muted block mb-1">a2</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.a2}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, a2: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">b2</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.b2}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, b2: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">c2</label>
									<input
										type="number"
										class="input w-full"
										value={sys2.c2}
										onInput={(e) =>
											setSys2((prev) => ({ ...prev, c2: (e.target as HTMLInputElement).value }))
										}
									/>
								</div>
							</div>
						</div>
					)}

					{type === "system3" && (
						<div class="space-y-3">
							<div class="grid grid-cols-4 gap-2">
								<input
									type="number"
									class="input w-full"
									value={sys3.a1}
									placeholder="a1"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, a1: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.b1}
									placeholder="b1"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, b1: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.c1}
									placeholder="c1"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, c1: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.d1}
									placeholder="d1"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, d1: (e.target as HTMLInputElement).value }))
									}
								/>
							</div>
							<div class="grid grid-cols-4 gap-2">
								<input
									type="number"
									class="input w-full"
									value={sys3.a2}
									placeholder="a2"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, a2: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.b2}
									placeholder="b2"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, b2: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.c2}
									placeholder="c2"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, c2: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.d2}
									placeholder="d2"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, d2: (e.target as HTMLInputElement).value }))
									}
								/>
							</div>
							<div class="grid grid-cols-4 gap-2">
								<input
									type="number"
									class="input w-full"
									value={sys3.a3}
									placeholder="a3"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, a3: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.b3}
									placeholder="b3"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, b3: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.c3}
									placeholder="c3"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, c3: (e.target as HTMLInputElement).value }))
									}
								/>
								<input
									type="number"
									class="input w-full"
									value={sys3.d3}
									placeholder="d3"
									onInput={(e) =>
										setSys3((prev) => ({ ...prev, d3: (e.target as HTMLInputElement).value }))
									}
								/>
							</div>
						</div>
					)}

					<button class="btn-primary w-full py-2.5 mt-2" onClick={solveEquation}>
						{t.btnSolve}
					</button>
				</div>

				{/* Root solver results and steps tape */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{result && (
						<div class="space-y-4">
							{/* Solution display */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
								<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
								<div class="space-y-2 text-xl font-bold text-primary font-mono">
									{result.map((root, idx) => (
										<div key={idx}>{root}</div>
									))}
								</div>
							</div>

							{/* Step-by-Step details */}
							{steps.length > 0 && (
								<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
									<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
									<ul class="space-y-2 text-xs text-muted">
										{steps.map((step, idx) => (
											<li key={idx} class="flex gap-2 items-start">
												<span class="badge badge-yellow shrink-0">{idx + 1}</span>
												<span class="font-mono">{step}</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
