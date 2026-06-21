import { useEffect, useState } from "preact/hooks";

type Matrix = number[][];

function createEmptyMatrix(rows: number, cols: number): Matrix {
	return Array(rows)
		.fill(0)
		.map(() => Array(cols).fill(0));
}

// Matrix helper mathematical operations
function transposeMatrix(m: Matrix): Matrix {
	const r = m.length;
	const c = m[0].length;
	const result = createEmptyMatrix(c, r);
	for (let i = 0; i < r; i++) {
		for (let j = 0; j < c; j++) {
			result[j][i] = m[i][j];
		}
	}
	return result;
}

function determinantMatrix(m: Matrix): number {
	const n = m.length;
	if (n === 1) return m[0][0];
	if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];

	let det = 0;
	for (let j = 0; j < n; j++) {
		const sub = m.slice(1).map((row) => row.filter((_, colIdx) => colIdx !== j));
		det += (-1) ** j * m[0][j] * determinantMatrix(sub);
	}
	return det;
}

function invertMatrix(m: Matrix): Matrix | null {
	const det = determinantMatrix(m);
	if (Math.abs(det) < 1e-9) return null;

	const n = m.length;
	if (n === 1) return [[1 / m[0][0]]];

	const adj = createEmptyMatrix(n, n);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			const sub = m
				.filter((_, rIdx) => rIdx !== i)
				.map((row) => row.filter((_, cIdx) => cIdx !== j));
			adj[j][i] = (-1) ** (i + j) * determinantMatrix(sub);
		}
	}

	const result = createEmptyMatrix(n, n);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			result[i][j] = Math.round((adj[i][j] / det) * 10000) / 10000;
		}
	}
	return result;
}

export default function MatrixCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [dim, setDim] = useState<2 | 3 | 4>(2);
	const [matrixA, setMatrixA] = useState<Matrix>(createEmptyMatrix(2, 2));
	const [matrixB, setMatrixB] = useState<Matrix>(createEmptyMatrix(2, 2));

	const [operation, setOperation] = useState<
		"add" | "sub" | "mul" | "det" | "transpose" | "inverse"
	>("add");
	const [result, setResult] = useState<Matrix | number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Matrix Calculator",
			lblDimension: "Matrix Dimensions",
			lblMatrixA: "Matrix A",
			lblMatrixB: "Matrix B",
			lblOperation: "Choose Operation",
			btnCalculate: "Calculate Matrix",
			lblResult: "Result Matrix",
			errDeterminantZero: "Matrix is singular (determinant is 0). It has no inverse.",
			errInvalid: "Please fill all fields with valid numbers.",
		},
		vi: {
			title: "Máy tính ma trận",
			lblDimension: "Kích thước ma trận",
			lblMatrixA: "Ma trận A",
			lblMatrixB: "Ma trận B",
			lblOperation: "Chọn phép toán",
			btnCalculate: "Tính toán",
			lblResult: "Ma trận kết quả",
			errDeterminantZero: "Định thức bằng 0. Không tồn tại ma trận nghịch đảo.",
			errInvalid: "Vui lòng nhập đầy đủ các số hợp lệ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Handle dim changes
	useEffect(() => {
		setMatrixA(createEmptyMatrix(dim, dim));
		setMatrixB(createEmptyMatrix(dim, dim));
		setResult(null);
		setError(null);
	}, [dim]);

	const updateCell = (target: "A" | "B", r: number, c: number, valStr: string) => {
		const val = Number.parseFloat(valStr) || 0;
		if (target === "A") {
			setMatrixA((prev) => {
				const copy = prev.map((row) => [...row]);
				copy[r][c] = val;
				return copy;
			});
		} else {
			setMatrixB((prev) => {
				const copy = prev.map((row) => [...row]);
				copy[r][c] = val;
				return copy;
			});
		}
	};

	const performCalculation = () => {
		setError(null);
		setResult(null);

		try {
			if (operation === "add") {
				const res = createEmptyMatrix(dim, dim);
				for (let i = 0; i < dim; i++) {
					for (let j = 0; j < dim; j++) {
						res[i][j] = matrixA[i][j] + matrixB[i][j];
					}
				}
				setResult(res);
			} else if (operation === "sub") {
				const res = createEmptyMatrix(dim, dim);
				for (let i = 0; i < dim; i++) {
					for (let j = 0; j < dim; j++) {
						res[i][j] = matrixA[i][j] - matrixB[i][j];
					}
				}
				setResult(res);
			} else if (operation === "mul") {
				const res = createEmptyMatrix(dim, dim);
				for (let i = 0; i < dim; i++) {
					for (let j = 0; j < dim; j++) {
						let sum = 0;
						for (let k = 0; k < dim; k++) {
							sum += matrixA[i][k] * matrixB[k][j];
						}
						res[i][j] = Math.round(sum * 10000) / 10000;
					}
				}
				setResult(res);
			} else if (operation === "det") {
				const detVal = determinantMatrix(matrixA);
				setResult(Math.round(detVal * 10000) / 10000);
			} else if (operation === "transpose") {
				setResult(transposeMatrix(matrixA));
			} else if (operation === "inverse") {
				const inv = invertMatrix(matrixA);
				if (!inv) {
					setError(t.errDeterminantZero);
					return;
				}
				setResult(inv);
			}
		} catch {
			setError(t.errInvalid);
		}
	};

	const isUnaryOp = ["det", "transpose", "inverse"].includes(operation);

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings and Matrix Input Area */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center justify-between border-b border-hairline pb-2 mb-2">
						<h3 class="text-body-strong text-ink font-bold">{t.title}</h3>
						{/* Dimension chooser */}
						<div class="flex items-center gap-1.5">
							<span class="text-xs text-muted">{t.lblDimension}:</span>
							<select
								class="input py-1 text-xs"
								value={dim}
								onChange={(e) => setDim(Number((e.target as HTMLSelectElement).value) as any)}
							>
								<option value="2">2x2</option>
								<option value="3">3x3</option>
								<option value="4">4x4</option>
							</select>
						</div>
					</div>

					{/* Choose operation */}
					<div class="space-y-1.5">
						<label class="text-xs text-ink font-bold block">{t.lblOperation}</label>
						<div class="flex flex-wrap gap-2">
							{[
								{ key: "add", label: "A + B" },
								{ key: "sub", label: "A - B" },
								{ key: "mul", label: "A × B" },
								{ key: "det", label: "Det(A)" },
								{ key: "transpose", label: "Aᵀ (Transpose)" },
								{ key: "inverse", label: "A⁻¹ (Inverse)" },
							].map((op) => (
								<button
									key={op.key}
									class={`py-1.5 px-3 rounded text-xs font-bold transition ${
										operation === op.key
											? "bg-primary text-white"
											: "bg-surface-soft hover:bg-surface-hover text-ink"
									}`}
									onClick={() => {
										setOperation(op.key as any);
										setResult(null);
										setError(null);
									}}
								>
									{op.label}
								</button>
							))}
						</div>
					</div>

					{/* Matrix Inputs */}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
						{/* Matrix A */}
						<div class="space-y-2">
							<h4 class="text-xs text-ink font-bold">{t.lblMatrixA}</h4>
							<div
								class="grid gap-2 p-3 bg-surface-soft rounded-lg border border-hairline"
								style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
							>
								{matrixA.map((row, rIdx) =>
									row.map((val, cIdx) => (
										<input
											key={`${rIdx}-${cIdx}`}
											type="number"
											class="input w-full text-center font-mono text-xs py-1"
											value={val || ""}
											placeholder="0"
											onInput={(e) =>
												updateCell("A", rIdx, cIdx, (e.target as HTMLInputElement).value)
											}
										/>
									)),
								)}
							</div>
						</div>

						{/* Matrix B (only if binary operation) */}
						{!isUnaryOp && (
							<div class="space-y-2">
								<h4 class="text-xs text-ink font-bold">{t.lblMatrixB}</h4>
								<div
									class="grid gap-2 p-3 bg-surface-soft rounded-lg border border-hairline"
									style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
								>
									{matrixB.map((row, rIdx) =>
										row.map((val, cIdx) => (
											<input
												key={`${rIdx}-${cIdx}`}
												type="number"
												class="input w-full text-center font-mono text-xs py-1"
												value={val || ""}
												placeholder="0"
												onInput={(e) =>
													updateCell("B", rIdx, cIdx, (e.target as HTMLInputElement).value)
												}
											/>
										)),
									)}
								</div>
							</div>
						)}
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={performCalculation}>
						{t.btnCalculate}
					</button>
				</div>

				{/* Results screen */}
				<div class="lg:col-span-5 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{result !== null && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblResult}
							</h4>

							{Array.isArray(result) ? (
								<div
									class="grid gap-2 p-3 bg-surface-soft rounded-lg border border-hairline max-w-[280px] mx-auto"
									style={{ gridTemplateColumns: `repeat(${result[0].length}, minmax(0, 1fr))` }}
								>
									{(result as Matrix).map((row, r) =>
										row.map((val, c) => (
											<div
												key={`${r}-${c}`}
												class="bg-surface-elevated border border-hairline font-mono text-xs rounded py-2 text-center text-ink font-bold"
											>
												{val}
											</div>
										)),
									)}
								</div>
							) : (
								<div class="text-center py-6">
									<span class="text-[10px] text-muted block font-bold uppercase mb-1">
										Scalar Value
									</span>
									<span class="text-4xl font-bold text-primary">{result}</span>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
