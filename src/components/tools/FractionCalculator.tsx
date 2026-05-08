import { useCallback, useMemo, useState } from "preact/hooks";

type Operation = "add" | "subtract" | "multiply" | "divide";
type Mode = "calculate" | "simplify" | "toDecimal" | "toFraction" | "compare";

function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) {
		[a, b] = [b, a % b];
	}
	return a;
}

function simplifyFraction(num: number, den: number): [number, number] {
	if (den === 0) return [num, den];
	const g = gcd(num, den);
	let n = num / g;
	let d = den / g;
	if (d < 0) {
		n = -n;
		d = -d;
	}
	return [n, d];
}

function toMixedNumber(num: number, den: number): string {
	if (den === 0) return "undefined";
	const [sn, sd] = simplifyFraction(num, den);
	if (sd === 1) return String(sn);
	if (Math.abs(sn) >= sd) {
		const whole = Math.trunc(sn / sd);
		const remainder = Math.abs(sn % sd);
		return `${whole} ${remainder}/${sd}`;
	}
	return `${sn}/${sd}`;
}

function fractionToDecimal(num: number, den: number): string {
	if (den === 0) return "undefined";
	const result = num / den;
	// Try to avoid floating point issues
	const rounded = Math.round(result * 1e10) / 1e10;
	return String(rounded);
}

function decimalToFraction(decimal: string): [number, number] | null {
	const d = Number.parseFloat(decimal);
	if (Number.isNaN(d)) return null;

	// Handle simple cases
	if (Number.isInteger(d)) return [d, 1];

	// Convert using continued fraction approach
	const sign = d < 0 ? -1 : 1;
	const abs = Math.abs(d);

	let bestNum = 1;
	let bestDen = 1;
	let bestError = Math.abs(abs - 1);

	for (let den = 1; den <= 10000; den++) {
		const num = Math.round(abs * den);
		const error = Math.abs(abs - num / den);
		if (error < bestError) {
			bestError = error;
			bestNum = num;
			bestDen = den;
			if (error < 1e-10) break;
		}
	}

	return simplifyFraction(sign * bestNum, bestDen);
}

interface FractionInput {
	num: string;
	den: string;
}

export default function FractionCalculator() {
	const [mode, setMode] = useState<Mode>("calculate");
	const [f1, setF1] = useState<FractionInput>({ num: "", den: "" });
	const [f2, setF2] = useState<FractionInput>({ num: "", den: "" });
	const [operation, setOperation] = useState<Operation>("add");
	const [singleNum, setSingleNum] = useState("");
	const [singleDen, setSingleDen] = useState("");
	const [decimalInput, setDecimalInput] = useState("");
	const [copied, setCopied] = useState(false);

	const parseFraction = useCallback((f: FractionInput): [number, number] | null => {
		const num = Number.parseInt(f.num);
		const den = Number.parseInt(f.den);
		if (Number.isNaN(num) || Number.isNaN(den) || den === 0) return null;
		return [num, den];
	}, []);

	const calculation = useMemo(() => {
		const frac1 = parseFraction(f1);
		const frac2 = parseFraction(f2);
		if (!frac1 || !frac2) return null;

		const [n1, d1] = frac1;
		const [n2, d2] = frac2;
		let resultNum: number;
		let resultDen: number;
		let steps: string[] = [];

		switch (operation) {
			case "add": {
				const commonDen = (d1 * d2) / gcd(d1, d2);
				const mult1 = commonDen / d1;
				const mult2 = commonDen / d2;
				resultNum = n1 * mult1 + n2 * mult2;
				resultDen = commonDen;
				steps = [
					`Find common denominator: LCM(${d1}, ${d2}) = ${commonDen}`,
					`Convert: ${n1}/${d1} × ${mult1}/${mult1} = ${n1 * mult1}/${commonDen}`,
					`Convert: ${n2}/${d2} × ${mult2}/${mult2} = ${n2 * mult2}/${commonDen}`,
					`Add: ${n1 * mult1}/${commonDen} + ${n2 * mult2}/${commonDen} = ${resultNum}/${commonDen}`,
				];
				break;
			}
			case "subtract": {
				const commonDen = (d1 * d2) / gcd(d1, d2);
				const mult1 = commonDen / d1;
				const mult2 = commonDen / d2;
				resultNum = n1 * mult1 - n2 * mult2;
				resultDen = commonDen;
				steps = [
					`Find common denominator: LCM(${d1}, ${d2}) = ${commonDen}`,
					`Convert: ${n1}/${d1} × ${mult1}/${mult1} = ${n1 * mult1}/${commonDen}`,
					`Convert: ${n2}/${d2} × ${mult2}/${mult2} = ${n2 * mult2}/${commonDen}`,
					`Subtract: ${n1 * mult1}/${commonDen} - ${n2 * mult2}/${commonDen} = ${resultNum}/${commonDen}`,
				];
				break;
			}
			case "multiply": {
				resultNum = n1 * n2;
				resultDen = d1 * d2;
				steps = [
					`Multiply numerators: ${n1} × ${n2} = ${resultNum}`,
					`Multiply denominators: ${d1} × ${d2} = ${resultDen}`,
					`Result: ${resultNum}/${resultDen}`,
				];
				break;
			}
			case "divide": {
				if (n2 === 0) return null;
				resultNum = n1 * d2;
				resultDen = d1 * n2;
				steps = [
					`Flip the second fraction: ${n2}/${d2} → ${d2}/${n2}`,
					`Multiply: ${n1}/${d1} × ${d2}/${n2}`,
					`Numerators: ${n1} × ${d2} = ${resultNum}`,
					`Denominators: ${d1} × ${n2} = ${resultDen}`,
					`Result: ${resultNum}/${resultDen}`,
				];
				break;
			}
			default:
				return null;
		}

		const [sn, sd] = simplifyFraction(resultNum, resultDen);
		if (sn !== resultNum || sd !== resultDen) {
			steps.push(`Simplify: ${resultNum}/${resultDen} = ${sn}/${sd}`);
		}

		return {
			resultNum,
			resultDen,
			simplifiedNum: sn,
			simplifiedDen: sd,
			mixed: toMixedNumber(sn, sd),
			decimal: fractionToDecimal(sn, sd),
			steps,
		};
	}, [f1, f2, operation, parseFraction]);

	const simplifyResult = useMemo(() => {
		if (mode !== "simplify") return null;
		const frac = parseFraction({ num: singleNum, den: singleDen });
		if (!frac) return null;
		const [n, d] = frac;
		const [sn, sd] = simplifyFraction(n, d);
		return {
			original: `${n}/${d}`,
			simplified: `${sn}/${sd}`,
			mixed: toMixedNumber(sn, sd),
			decimal: fractionToDecimal(sn, sd),
		};
	}, [mode, singleNum, singleDen, parseFraction]);

	const decimalResult = useMemo(() => {
		if (mode !== "toDecimal") return null;
		const frac = parseFraction({ num: singleNum, den: singleDen });
		if (!frac) return null;
		const [n, d] = frac;
		return {
			fraction: `${n}/${d}`,
			decimal: fractionToDecimal(n, d),
			mixed: toMixedNumber(n, d),
		};
	}, [mode, singleNum, singleDen, parseFraction]);

	const fractionFromDecimal = useMemo(() => {
		if (mode !== "toFraction") return null;
		const result = decimalToFraction(decimalInput);
		if (!result) return null;
		const [n, d] = result;
		return {
			decimal: decimalInput,
			fraction: `${n}/${d}`,
			mixed: toMixedNumber(n, d),
		};
	}, [mode, decimalInput]);

	const comparisonResult = useMemo(() => {
		if (mode !== "compare") return null;
		const frac1 = parseFraction(f1);
		const frac2 = parseFraction(f2);
		if (!frac1 || !frac2) return null;
		const [n1, d1] = frac1;
		const [n2, d2] = frac2;
		const val1 = n1 / d1;
		const val2 = n2 / d2;
		let relation: string;
		if (Math.abs(val1 - val2) < 1e-10) {
			relation = "equal";
		} else if (val1 > val2) {
			relation = "greater";
		} else {
			relation = "less";
		}
		return {
			f1: `${n1}/${d1}`,
			f2: `${n2}/${d2}`,
			val1: val1.toFixed(6),
			val2: val2.toFixed(6),
			relation,
		};
	}, [mode, f1, f2, parseFraction]);

	const copyResult = useCallback(async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, []);

	const opLabels: Record<Operation, string> = {
		add: "+",
		subtract: "−",
		multiply: "×",
		divide: "÷",
	};

	return (
		<div class="space-y-6">
			{/* Mode Tabs */}
			<div class="flex flex-wrap gap-2">
				{[
					{ key: "calculate" as Mode, label: "Calculate" },
					{ key: "simplify" as Mode, label: "Simplify" },
					{ key: "toDecimal" as Mode, label: "To Decimal" },
					{ key: "toFraction" as Mode, label: "To Fraction" },
					{ key: "compare" as Mode, label: "Compare" },
				].map(({ key, label }) => (
					<button
						key={key}
						class={mode === key ? "btn-primary" : "btn-secondary"}
						onClick={() => setMode(key)}
					>
						{label}
					</button>
				))}
			</div>

			{/* Calculate Mode */}
			{mode === "calculate" && (
				<div class="space-y-6">
					<div class="bg-surface-elevated rounded-lg p-3">
						<h3 class="text-title-lg text-primary mb-4">Fraction Calculator</h3>
						<div class="flex flex-wrap items-center gap-4">
							{/* Fraction 1 */}
							<div class="flex flex-col items-center gap-1">
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Num"
									value={f1.num}
									onInput={(e) =>
										setF1((prev) => ({
											...prev,
											num: (e.target as HTMLInputElement).value,
										}))
									}
								/>
								<div class="w-20 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Den"
									value={f1.den}
									onInput={(e) =>
										setF1((prev) => ({
											...prev,
											den: (e.target as HTMLInputElement).value,
										}))
									}
								/>
							</div>

							{/* Operation */}
							<div class="flex flex-col gap-2">
								{(["add", "subtract", "multiply", "divide"] as Operation[]).map((op) => (
									<button
										key={op}
										class={`px-3 py-1 rounded text-body-sm ${
											operation === op
												? "bg-primary text-on-primary"
												: "bg-surface-elevated text-body hover:text-on-dark"
										}`}
										onClick={() => setOperation(op)}
									>
										{opLabels[op]}
									</button>
								))}
							</div>

							{/* Fraction 2 */}
							<div class="flex flex-col items-center gap-1">
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Num"
									value={f2.num}
									onInput={(e) =>
										setF2((prev) => ({
											...prev,
											num: (e.target as HTMLInputElement).value,
										}))
									}
								/>
								<div class="w-20 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Den"
									value={f2.den}
									onInput={(e) =>
										setF2((prev) => ({
											...prev,
											den: (e.target as HTMLInputElement).value,
										}))
									}
								/>
							</div>
						</div>
					</div>

					{/* Result */}
					{calculation && (
						<div class="space-y-4">
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div class="bg-surface-elevated rounded-lg p-3 text-center">
									<div class="text-title-lg text-primary">
										{calculation.simplifiedNum}/{calculation.simplifiedDen}
									</div>
									<div class="text-caption text-muted mt-1">Simplified Fraction</div>
								</div>
								<div class="bg-surface-elevated rounded-lg p-3 text-center">
									<div class="text-title-lg text-primary">{calculation.mixed}</div>
									<div class="text-caption text-muted mt-1">Mixed Number</div>
								</div>
								<div class="bg-surface-elevated rounded-lg p-3 text-center">
									<div class="text-title-lg text-primary">{calculation.decimal}</div>
									<div class="text-caption text-muted mt-1">Decimal</div>
								</div>
							</div>

							{/* Steps */}
							<div class="bg-surface-elevated rounded-lg p-3">
								<div class="flex items-center justify-between mb-3">
									<h3 class="text-title-lg text-primary">Step-by-Step Solution</h3>
									<button
										class="btn-secondary text-body-sm"
										onClick={() =>
											copyResult(`${calculation.simplifiedNum}/${calculation.simplifiedDen}`)
										}
									>
										{copied ? "Copied!" : "Copy Result"}
									</button>
								</div>
								<ol class="space-y-2 text-body-sm">
									{calculation.steps.map((step, i) => (
										<li key={i} class="flex gap-2">
											<span class="badge badge-yellow shrink-0">{i + 1}</span>
											<span>{step}</span>
										</li>
									))}
								</ol>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Simplify Mode */}
			{mode === "simplify" && (
				<div class="space-y-6">
					<div class="bg-surface-elevated rounded-lg p-3">
						<h3 class="text-title-lg text-primary mb-4">Simplify a Fraction</h3>
						<div class="flex items-center gap-4">
							<div class="flex flex-col items-center gap-1">
								<input
									type="number"
									class="input w-24 text-center"
									placeholder="Numerator"
									value={singleNum}
									onInput={(e) => setSingleNum((e.target as HTMLInputElement).value)}
								/>
								<div class="w-24 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-24 text-center"
									placeholder="Denominator"
									value={singleDen}
									onInput={(e) => setSingleDen((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					</div>
					{simplifyResult && (
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{simplifyResult.simplified}</div>
								<div class="text-caption text-muted mt-1">Simplified</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{simplifyResult.mixed}</div>
								<div class="text-caption text-muted mt-1">Mixed Number</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{simplifyResult.decimal}</div>
								<div class="text-caption text-muted mt-1">Decimal</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* To Decimal Mode */}
			{mode === "toDecimal" && (
				<div class="space-y-6">
					<div class="bg-surface-elevated rounded-lg p-3">
						<h3 class="text-title-lg text-primary mb-4">Convert Fraction to Decimal</h3>
						<div class="flex items-center gap-4">
							<div class="flex flex-col items-center gap-1">
								<input
									type="number"
									class="input w-24 text-center"
									placeholder="Numerator"
									value={singleNum}
									onInput={(e) => setSingleNum((e.target as HTMLInputElement).value)}
								/>
								<div class="w-24 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-24 text-center"
									placeholder="Denominator"
									value={singleDen}
									onInput={(e) => setSingleDen((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					</div>
					{decimalResult && (
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{decimalResult.fraction}</div>
								<div class="text-caption text-muted mt-1">Fraction</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{decimalResult.decimal}</div>
								<div class="text-caption text-muted mt-1">Decimal</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{decimalResult.mixed}</div>
								<div class="text-caption text-muted mt-1">Mixed Number</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* To Fraction Mode */}
			{mode === "toFraction" && (
				<div class="space-y-6">
					<div class="bg-surface-elevated rounded-lg p-3">
						<h3 class="text-title-lg text-primary mb-4">Convert Decimal to Fraction</h3>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">Decimal Number</label>
							<input
								type="text"
								class="input w-full max-w-xs"
								placeholder="e.g. 0.75"
								value={decimalInput}
								onInput={(e) => setDecimalInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>
					{fractionFromDecimal && (
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{fractionFromDecimal.decimal}</div>
								<div class="text-caption text-muted mt-1">Decimal</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{fractionFromDecimal.fraction}</div>
								<div class="text-caption text-muted mt-1">Fraction</div>
							</div>
							<div class="bg-surface-elevated rounded-lg p-3 text-center">
								<div class="text-title-lg text-primary">{fractionFromDecimal.mixed}</div>
								<div class="text-caption text-muted mt-1">Mixed Number</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Compare Mode */}
			{mode === "compare" && (
				<div class="space-y-6">
					<div class="bg-surface-elevated rounded-lg p-3">
						<h3 class="text-title-lg text-primary mb-4">Compare Two Fractions</h3>
						<div class="flex flex-wrap items-center gap-6">
							<div class="flex flex-col items-center gap-1">
								<label class="text-caption-uppercase text-muted mb-1">Fraction 1</label>
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Num"
									value={f1.num}
									onInput={(e) =>
										setF1((prev) => ({
											...prev,
											num: (e.target as HTMLInputElement).value,
										}))
									}
								/>
								<div class="w-20 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Den"
									value={f1.den}
									onInput={(e) =>
										setF1((prev) => ({
											...prev,
											den: (e.target as HTMLInputElement).value,
										}))
									}
								/>
							</div>
							<span class="text-title-lg text-muted">vs</span>
							<div class="flex flex-col items-center gap-1">
								<label class="text-caption-uppercase text-muted mb-1">Fraction 2</label>
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Num"
									value={f2.num}
									onInput={(e) =>
										setF2((prev) => ({
											...prev,
											num: (e.target as HTMLInputElement).value,
										}))
									}
								/>
								<div class="w-20 h-[2px] bg-primary" />
								<input
									type="number"
									class="input w-20 text-center"
									placeholder="Den"
									value={f2.den}
									onInput={(e) =>
										setF2((prev) => ({
											...prev,
											den: (e.target as HTMLInputElement).value,
										}))
									}
								/>
							</div>
						</div>
					</div>
					{comparisonResult && (
						<div class="bg-surface-elevated rounded-lg p-6 text-center">
							<div class="text-title-lg text-primary mb-2">
								{comparisonResult.f1} ({comparisonResult.val1})
							</div>
							<div class="text-title-lg text-primary mb-2">
								{comparisonResult.relation === "equal"
									? "="
									: comparisonResult.relation === "greater"
										? ">"
										: "<"}
							</div>
							<div class="text-title-lg text-primary mb-2">
								{comparisonResult.f2} ({comparisonResult.val2})
							</div>
							<div
								class={`badge ${comparisonResult.relation === "equal" ? "badge-yellow" : comparisonResult.relation === "greater" ? "bg-accent-emerald text-white" : "bg-accent-rose text-white"}`}
							>
								{comparisonResult.relation === "equal"
									? "Equal"
									: comparisonResult.relation === "greater"
										? "Greater Than"
										: "Less Than"}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
