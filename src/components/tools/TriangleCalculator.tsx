import { useEffect, useRef, useState } from "preact/hooks";

interface SolvedTriangle {
	a: number;
	b: number;
	c: number;
	alpha: number; // angle opposite to side a, in degrees
	beta: number; // angle opposite to side b, in degrees
	gamma: number; // angle opposite to side c, in degrees
	area: number;
	perimeter: number;
	typeSide: string;
	typeAngle: string;
	inradius: number;
	circumradius: number;
	heightA: number;
	heightB: number;
	heightC: number;
}

export default function TriangleCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Inputs
	const [solveMode, setSolveMode] = useState<"SSS" | "SAS" | "ASA" | "AAS">("SSS");
	const [sideA, setSideA] = useState("5");
	const [sideB, setSideB] = useState("6");
	const [sideC, setSideC] = useState("7");
	const [angleAlpha, setAngleAlpha] = useState("");
	const [angleBeta, setAngleBeta] = useState("");
	const [angleGamma, setAngleGamma] = useState("");

	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<SolvedTriangle | null>(null);

	const t = {
		en: {
			title: "Triangle Calculator",
			lblMode: "Given Values (Solve Mode)",
			lblSideA: "Side a",
			lblSideB: "Side b",
			lblSideC: "Side c",
			lblAngleAlpha: "Angle α (opposite side a, deg)",
			lblAngleBeta: "Angle β (opposite side b, deg)",
			lblAngleGamma: "Angle γ (opposite side c, deg)",
			btnSolve: "Solve Triangle",
			lblArea: "Area",
			lblPerimeter: "Perimeter",
			lblType: "Type",
			lblHeights: "Heights",
			lblInradius: "Inradius (r)",
			lblCircumradius: "Circumradius (R)",
			lblAngles: "Angles",
			errInvalid: "Please enter positive numbers.",
			errInquality:
				"Triangle inequality theorem violated: sum of two sides must be greater than the third.",
			errAngleSum: "Sum of given angles must be less than 180°.",
			errNoTriangle: "Cannot construct a valid triangle with these parameters.",
		},
		vi: {
			title: "Giải tam giác & Vẽ hình",
			lblMode: "Các dữ kiện đã biết (Chế độ giải)",
			lblSideA: "Cạnh a",
			lblSideB: "Cạnh b",
			lblSideC: "Cạnh c",
			lblAngleAlpha: "Góc α (đối diện cạnh a, độ)",
			lblAngleBeta: "Góc β (đối diện cạnh b, độ)",
			lblAngleGamma: "Góc γ (đối diện cạnh c, độ)",
			btnSolve: "Giải tam giác",
			lblArea: "Diện tích",
			lblPerimeter: "Chu vi",
			lblType: "Phân loại",
			lblHeights: "Đường cao",
			lblInradius: "Bán kính nội tiếp (r)",
			lblCircumradius: "Bán kính ngoại tiếp (R)",
			lblAngles: "Các góc",
			errInvalid: "Vui lòng nhập các số dương hợp lệ.",
			errInquality:
				"Vi phạm định lý bất đẳng thức tam giác: tổng hai cạnh phải lớn hơn cạnh còn lại.",
			errAngleSum: "Tổng các góc đã cho phải nhỏ hơn 180°.",
			errNoTriangle: "Không thể kiến tạo một tam giác từ các số đo này.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run solver and trigger canvas redrawing
	const solveTriangle = () => {
		setError(null);
		setResult(null);

		const sa = Number.parseFloat(sideA);
		const sb = Number.parseFloat(sideB);
		const sc = Number.parseFloat(sideC);
		const aA = Number.parseFloat(angleAlpha);
		const aB = Number.parseFloat(angleBeta);
		const aG = Number.parseFloat(angleGamma);

		let a = 0;
		let b = 0;
		let c = 0;
		let alpha = 0;
		let beta = 0;
		let gamma = 0;

		try {
			if (solveMode === "SSS") {
				if (
					sa <= 0 ||
					sb <= 0 ||
					sc <= 0 ||
					Number.isNaN(sa) ||
					Number.isNaN(sb) ||
					Number.isNaN(sc)
				) {
					setError(t.errInvalid);
					return;
				}
				if (sa + sb <= sc || sa + sc <= sb || sb + sc <= sa) {
					setError(t.errInquality);
					return;
				}
				a = sa;
				b = sb;
				c = sc;
				// Law of cosines: cos(A) = (b^2 + c^2 - a^2) / (2bc)
				alpha = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI);
				beta = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * (180 / Math.PI);
				gamma = 180 - alpha - beta;
			} else if (solveMode === "SAS") {
				if (
					sa <= 0 ||
					sb <= 0 ||
					aG <= 0 ||
					Number.isNaN(sa) ||
					Number.isNaN(sb) ||
					Number.isNaN(aG)
				) {
					setError(t.errInvalid);
					return;
				}
				if (aG >= 180) {
					setError(t.errAngleSum);
					return;
				}
				a = sa;
				b = sb;
				gamma = aG;
				const gammaRad = (gamma * Math.PI) / 180;
				// Law of cosines
				c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(gammaRad));
				alpha = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI);
				beta = 180 - alpha - gamma;
			} else if (solveMode === "ASA") {
				if (
					aA <= 0 ||
					aB <= 0 ||
					sc <= 0 ||
					Number.isNaN(aA) ||
					Number.isNaN(aB) ||
					Number.isNaN(sc)
				) {
					setError(t.errInvalid);
					return;
				}
				if (aA + aB >= 180) {
					setError(t.errAngleSum);
					return;
				}
				alpha = aA;
				beta = aB;
				gamma = 180 - alpha - beta;
				c = sc;

				const aRad = (alpha * Math.PI) / 180;
				const bRad = (beta * Math.PI) / 180;
				const gRad = (gamma * Math.PI) / 180;

				// Law of sines: a = c * sin(A) / sin(G)
				a = (c * Math.sin(aRad)) / Math.sin(gRad);
				b = (c * Math.sin(bRad)) / Math.sin(gRad);
			} else if (solveMode === "AAS") {
				if (
					aA <= 0 ||
					aB <= 0 ||
					sa <= 0 ||
					Number.isNaN(aA) ||
					Number.isNaN(aB) ||
					Number.isNaN(sa)
				) {
					setError(t.errInvalid);
					return;
				}
				if (aA + aB >= 180) {
					setError(t.errAngleSum);
					return;
				}
				alpha = aA;
				beta = aB;
				gamma = 180 - alpha - beta;
				a = sa;

				const aRad = (alpha * Math.PI) / 180;
				const bRad = (beta * Math.PI) / 180;
				const gRad = (gamma * Math.PI) / 180;

				// Law of sines
				b = (a * Math.sin(bRad)) / Math.sin(aRad);
				c = (a * Math.sin(gRad)) / Math.sin(aRad);
			}

			// Core calculations
			const perimeter = a + b + c;
			const s = perimeter / 2; // semiperimeter
			const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

			if (Number.isNaN(area) || area <= 0) {
				setError(t.errNoTriangle);
				return;
			}

			// Inradius & Circumradius
			const inradius = area / s;
			const circumradius = (a * b * c) / (4 * area);

			// Heights
			const heightA = (2 * area) / a;
			const heightB = (2 * area) / b;
			const heightC = (2 * area) / c;

			// Classify sides
			let typeSide = lang === "en" ? "Scalene" : "Tam giác thường";
			if (Math.abs(a - b) < 1e-5 && Math.abs(b - c) < 1e-5) {
				typeSide = lang === "en" ? "Equilateral" : "Đều";
			} else if (Math.abs(a - b) < 1e-5 || Math.abs(b - c) < 1e-5 || Math.abs(a - c) < 1e-5) {
				typeSide = lang === "en" ? "Isosceles" : "Cân";
			}

			// Classify angles
			let typeAngle = lang === "en" ? "Acute" : "Nhọn";
			const angles = [alpha, beta, gamma];
			if (angles.some((angle) => Math.abs(angle - 90) < 1e-4)) {
				typeAngle = lang === "en" ? "Right-Angled" : "Vuông";
			} else if (angles.some((angle) => angle > 90)) {
				typeAngle = lang === "en" ? "Obtuse" : "Tù";
			}

			const solved: SolvedTriangle = {
				a: Math.round(a * 10000) / 10000,
				b: Math.round(b * 10000) / 10000,
				c: Math.round(c * 10000) / 10000,
				alpha: Math.round(alpha * 100) / 100,
				beta: Math.round(beta * 100) / 100,
				gamma: Math.round(gamma * 100) / 100,
				area: Math.round(area * 10000) / 10000,
				perimeter: Math.round(perimeter * 10000) / 10000,
				typeSide,
				typeAngle,
				inradius: Math.round(inradius * 10000) / 10000,
				circumradius: Math.round(circumradius * 10000) / 10000,
				heightA: Math.round(heightA * 10000) / 10000,
				heightB: Math.round(heightB * 10000) / 10000,
				heightC: Math.round(heightC * 10000) / 10000,
			};

			setResult(solved);
			drawTriangleCanvas(a, b, c, alpha, beta, gamma);
		} catch {
			setError(t.errNoTriangle);
		}
	};

	// Draw the exact triangle shapes on Canvas
	const drawTriangleCanvas = (
		a: number,
		b: number,
		c: number,
		alpha: number,
		beta: number,
		gamma: number,
	) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear Canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Calculate coordinates of 3 vertices A, B, C
		// Place side 'c' along the horizontal axis starting from origin (left side)
		const xC1 = 0; // Vertice A
		const yC1 = 0;

		const xC2 = c; // Vertice B
		const yC2 = 0;

		// Angle alpha (opposite side a, vertex A connecting side b and c)
		// Alpha is angle at Vertex A. Beta is angle at Vertex B.
		const alphaRad = (alpha * Math.PI) / 180;
		const xC3 = b * Math.cos(alphaRad); // Vertice C
		const yC3 = b * Math.sin(alphaRad);

		// Get bounding box of coordinates to scale and fit inside canvas (e.g. padding 30px)
		const xs = [xC1, xC2, xC3];
		const ys = [yC1, yC2, yC3];

		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		const triWidth = maxX - minX;
		const triHeight = maxY - minY;

		const padding = 35;
		const scaleX = (canvas.width - padding * 2) / triWidth;
		const scaleY = (canvas.height - padding * 2) / triHeight;
		const scale = Math.min(scaleX, scaleY);

		// Center the triangle in the canvas
		const offsetX = padding + (canvas.width - padding * 2 - triWidth * scale) / 2 - minX * scale;
		const offsetY = padding + (canvas.height - padding * 2 - triHeight * scale) / 2 - minY * scale;

		// Map to screen coordinates (flip Y for standard cartesian viewport)
		const mapCoords = (x: number, y: number) => {
			return {
				x: x * scale + offsetX,
				y: canvas.height - (y * scale + offsetY),
			};
		};

		const pA = mapCoords(xC1, yC1);
		const pB = mapCoords(xC2, yC2);
		const pC = mapCoords(xC3, yC3);

		// Draw triangle path
		ctx.beginPath();
		ctx.moveTo(pA.x, pA.y);
		ctx.lineTo(pB.x, pB.y);
		ctx.lineTo(pC.x, pC.y);
		ctx.closePath();

		ctx.strokeStyle = "var(--color-primary, #e60023)";
		ctx.lineWidth = 3;
		ctx.fillStyle = "rgba(230, 0, 35, 0.05)";
		ctx.fill();
		ctx.stroke();

		// Label vertices A, B, C
		ctx.fillStyle = "var(--color-ink, #000000)";
		ctx.font = "bold 12px sans-serif";
		ctx.textAlign = "center";

		ctx.fillText("A", pA.x - 10, pA.y + 12);
		ctx.fillText("B", pB.x + 10, pB.y + 12);
		ctx.fillText("C", pC.x, pC.y - 8);

		// Label side lengths
		ctx.font = "10px monospace";
		ctx.fillStyle = "var(--color-muted, #62625b)";
		// Side a (opposite Vertex A, i.e., BC)
		ctx.fillText(String(a), (pB.x + pC.x) / 2 + 10, (pB.y + pC.y) / 2);
		// Side b (opposite Vertex B, i.e., AC)
		ctx.fillText(String(b), (pA.x + pC.x) / 2 - 10, (pA.y + pC.y) / 2);
		// Side c (opposite Vertex C, i.e., AB)
		ctx.fillText(String(c), (pA.x + pB.x) / 2, pA.y + 15);
	};

	// Redraw when result changes
	useEffect(() => {
		if (result) {
			drawTriangleCanvas(result.a, result.b, result.c, result.alpha, result.beta, result.gamma);
		}
	}, [result]);

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Solve mode select */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblMode}</label>
						<select
							class="input w-full"
							value={solveMode}
							onChange={(e) => {
								setSolveMode((e.target as HTMLSelectElement).value as any);
								setError(null);
								setResult(null);
							}}
						>
							<option value="SSS">3 Sides (SSS)</option>
							<option value="SAS">2 Sides, 1 Angle (SAS)</option>
							<option value="ASA">2 Angles, 1 Side (ASA)</option>
							<option value="AAS">2 Angles, 1 Side opposite (AAS)</option>
						</select>
					</div>

					<div class="space-y-3 pt-2">
						{/* Fields based on solve mode */}
						{solveMode === "SSS" && (
							<div class="space-y-3">
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideA}</label>
									<input
										type="number"
										class="input w-full"
										value={sideA}
										onInput={(e) => setSideA((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideB}</label>
									<input
										type="number"
										class="input w-full"
										value={sideB}
										onInput={(e) => setSideB((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideC}</label>
									<input
										type="number"
										class="input w-full"
										value={sideC}
										onInput={(e) => setSideC((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						)}

						{solveMode === "SAS" && (
							<div class="space-y-3">
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideA}</label>
									<input
										type="number"
										class="input w-full"
										value={sideA}
										onInput={(e) => setSideA((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideB}</label>
									<input
										type="number"
										class="input w-full"
										value={sideB}
										onInput={(e) => setSideB((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblAngleGamma}</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 60"
										value={angleGamma}
										onInput={(e) => setAngleGamma((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						)}

						{solveMode === "ASA" && (
							<div class="space-y-3">
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblAngleAlpha}</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 45"
										value={angleAlpha}
										onInput={(e) => setAngleAlpha((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblAngleBeta}</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 65"
										value={angleBeta}
										onInput={(e) => setAngleBeta((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideC}</label>
									<input
										type="number"
										class="input w-full"
										value={sideC}
										onInput={(e) => setSideC((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						)}

						{solveMode === "AAS" && (
							<div class="space-y-3">
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblAngleAlpha}</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 45"
										value={angleAlpha}
										onInput={(e) => setAngleAlpha((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblAngleBeta}</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 60"
										value={angleBeta}
										onInput={(e) => setAngleBeta((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">{t.lblSideA}</label>
									<input
										type="number"
										class="input w-full"
										value={sideA}
										onInput={(e) => setSideA((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>
						)}
					</div>

					<button class="btn-primary w-full py-2.5 mt-2" onClick={solveTriangle}>
						{t.btnSolve}
					</button>
				</div>

				{/* Drawing canvas & detailed results */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					{result && (
						<div class="space-y-4">
							{/* Live Triangle Canvas Drawing */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2 flex flex-col items-center">
								<canvas
									ref={canvasRef}
									width={400}
									height={280}
									class="bg-surface-soft border border-hairline rounded-lg w-full max-w-[400px]"
								/>
							</div>

							{/* Output figures */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblArea}</div>
										<div class="text-xl font-bold text-primary">{result.area}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblPerimeter}</div>
										<div class="text-xl font-bold text-ink">{result.perimeter}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblType}</div>
										<div class="text-sm font-bold text-ink">
											{result.typeSide}
											<br />
											{result.typeAngle}
										</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblInradius}</div>
										<div class="text-sm font-bold text-ink">{result.inradius}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">
											{t.lblCircumradius}
										</div>
										<div class="text-sm font-bold text-ink">{result.circumradius}</div>
									</div>
								</div>

								{/* Angles list */}
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblAngles}</div>
									<div class="grid grid-cols-3 gap-2 text-xs font-mono text-ink">
										<div>α (Alpha): {result.alpha}°</div>
										<div>β (Beta): {result.beta}°</div>
										<div>γ (Gamma): {result.gamma}°</div>
									</div>
								</div>

								{/* Heights list */}
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblHeights}</div>
									<div class="grid grid-cols-3 gap-2 text-xs font-mono text-ink">
										<div>ha: {result.heightA}</div>
										<div>hb: {result.heightB}</div>
										<div>hc: {result.heightC}</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
