import { useEffect, useState } from "preact/hooks";

type Shape = "rectangle" | "circle" | "triangle" | "trapezoid" | "ellipse" | "sector" | "polygon";

export default function AreaCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [shape, setShape] = useState<Shape>("rectangle");

	// Inputs
	const [val1, setVal1] = useState("5"); // width / radius / side
	const [val2, setVal2] = useState("10"); // height / base / angle / sides count
	const [val3, setVal3] = useState(""); // base 2 (trapezoid)

	const t = {
		en: {
			title: "Area & Perimeter Calculator",
			lblShape: "Choose Geometric Shape",
			btnCalculate: "Calculate",
			lblArea: "Area (A)",
			lblPerimeter: "Perimeter (P)",
			lblResult: "Result",
			lblSteps: "Formula Used",
			errInvalid: "Please enter positive values.",
			optRectangle: "Rectangle",
			optCircle: "Circle",
			optTriangle: "Triangle (Base & Height)",
			optTrapezoid: "Trapezoid",
			optEllipse: "Ellipse",
			optSector: "Circle Sector",
			optPolygon: "Regular Polygon",
		},
		vi: {
			title: "Tính diện tích và chu vi hình phẳng",
			lblShape: "Chọn hình học",
			btnCalculate: "Tính toán",
			lblArea: "Diện tích (A)",
			lblPerimeter: "Chu vi (P)",
			lblResult: "Kết quả",
			lblSteps: "Công thức sử dụng",
			errInvalid: "Vui lòng nhập các kích thước dương hợp lệ.",
			optRectangle: "Hình chữ nhật",
			optCircle: "Hình tròn",
			optTriangle: "Hình tam giác (Cạnh đáy & Chiều cao)",
			optTrapezoid: "Hình thang",
			optEllipse: "Hình elip",
			optSector: "Hình quạt tròn",
			optPolygon: "Đa giác đều",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const calculateAreaPerimeter = () => {
		const v1 = Number.parseFloat(val1);
		const v2 = Number.parseFloat(val2);
		const v3 = Number.parseFloat(val3);

		if (Number.isNaN(v1) || v1 <= 0) return { error: t.errInvalid };

		let area = 0;
		let perimeter = 0;
		let formulaStr = "";

		switch (shape) {
			case "rectangle": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				area = v1 * v2;
				perimeter = 2 * (v1 + v2);
				formulaStr = `Area = w × h = ${v1} × ${v2} = ${area}\nPerimeter = 2(w + h) = 2(${v1} + ${v2}) = ${perimeter}`;
				break;
			}
			case "circle": {
				area = Math.PI * v1 * v1;
				perimeter = 2 * Math.PI * v1;
				formulaStr = `Area = π × r² = π × ${v1}² = ${area.toFixed(4)}\nCircumference = 2 × π × r = 2 × π × ${v1} = ${perimeter.toFixed(4)}`;
				break;
			}
			case "triangle": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				area = 0.5 * v1 * v2;
				// Hypotenuse helper for simple visual right-angled estimation
				const hyp = Math.sqrt(v1 * v1 + v2 * v2);
				perimeter = v1 + v2 + hyp;
				formulaStr = `Area = 0.5 × base × height = 0.5 × ${v1} × ${v2} = ${area}\nPerimeter (Right-angled approx) = base + height + hyp = ${v1} + ${v2} + ${hyp.toFixed(2)} = ${perimeter.toFixed(2)}`;
				break;
			}
			case "trapezoid": {
				if (Number.isNaN(v2) || v2 <= 0 || Number.isNaN(v3) || v3 <= 0)
					return { error: t.errInvalid };
				area = 0.5 * (v1 + v3) * v2; // (base1 + base2) * height / 2
				// Perimeter approximation using symmetric isosceles trapezoid side
				const leg = Math.sqrt(v2 * v2 + (Math.abs(v1 - v3) / 2) ** 2);
				perimeter = v1 + v3 + 2 * leg;
				formulaStr = `Area = 0.5 × (a + b) × h = 0.5 × (${v1} + ${v3}) × ${v2} = ${area}\nPerimeter (Isosceles approx) = a + b + 2 × leg = ${v1} + ${v3} + 2 × ${leg.toFixed(2)} = ${perimeter.toFixed(2)}`;
				break;
			}
			case "ellipse": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				area = Math.PI * v1 * v2; // pi * a * b
				// Ramanujan approximation for ellipse perimeter
				const h = (v1 - v2) ** 2 / (v1 + v2) ** 2;
				perimeter = Math.PI * (v1 + v2) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
				formulaStr = `Area = π × a × b = π × ${v1} × ${v2} = ${area.toFixed(4)}\nPerimeter (Ramanujan approx) = ${perimeter.toFixed(4)}`;
				break;
			}
			case "sector": {
				if (Number.isNaN(v2) || v2 <= 0 || v2 > 360) return { error: t.errInvalid };
				area = (v2 / 360) * Math.PI * v1 * v1;
				const arcLength = (v2 / 360) * 2 * Math.PI * v1;
				perimeter = arcLength + 2 * v1;
				formulaStr = `Area = (θ/360) × π × r² = (${v2}/360) × π × ${v1}² = ${area.toFixed(4)}\nPerimeter = Arc + 2r = ${arcLength.toFixed(4)} + 2(${v1}) = ${perimeter.toFixed(4)}`;
				break;
			}
			case "polygon": {
				if (Number.isNaN(v2) || v2 < 3 || !Number.isInteger(v2)) return { error: t.errInvalid };
				// Area = n * s^2 / (4 * tan(pi / n))
				area = (v2 * v1 * v1) / (4 * Math.tan(Math.PI / v2));
				perimeter = v2 * v1;
				formulaStr = `Area = (n × s²) / (4 × tan(π/n)) = (${v2} × ${v1}²) / (4 × tan(π/${v2})) = ${area.toFixed(4)}\nPerimeter = n × s = ${v2} × ${v1} = ${perimeter}`;
				break;
			}
		}

		return {
			area: Math.round(area * 10000) / 10000,
			perimeter: Math.round(perimeter * 10000) / 10000,
			formula: formulaStr,
		};
	};

	const res = calculateAreaPerimeter();

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Shape choosing and input */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Shape select */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblShape}</label>
						<select
							class="input w-full"
							value={shape}
							onChange={(e) => {
								setShape((e.target as HTMLSelectElement).value as Shape);
								setVal1("5");
								setVal2("10");
								setVal3("12");
							}}
						>
							<option value="rectangle">{t.optRectangle}</option>
							<option value="circle">{t.optCircle}</option>
							<option value="triangle">{t.optTriangle}</option>
							<option value="trapezoid">{t.optTrapezoid}</option>
							<option value="ellipse">{t.optEllipse}</option>
							<option value="sector">{t.optSector}</option>
							<option value="polygon">{t.optPolygon}</option>
						</select>
					</div>

					{/* Parameters inputs depending on the shape */}
					<div class="space-y-3 pt-2">
						{shape === "rectangle" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Width (Chiều rộng)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Height (Chiều cao)</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "circle" && (
							<div class="space-y-1.5">
								<label class="text-xs text-ink font-bold block">Radius (Bán kính r)</label>
								<input
									type="number"
									class="input w-full"
									value={val1}
									onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
								/>
							</div>
						)}

						{shape === "triangle" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Base (Cạnh đáy)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Height (Chiều cao h)</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "trapezoid" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Base A (Đáy bé)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Base B (Đáy lớn)</label>
									<input
										type="number"
										class="input w-full"
										value={val3}
										onInput={(e) => setVal3((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Height (Chiều cao h)</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "ellipse" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">
										Semi-major axis (Bán trục lớn a)
									</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">
										Semi-minor axis (Bán trục nhỏ b)
									</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "sector" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Radius (Bán kính r)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Angle θ (Góc ở tâm, độ)</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 90"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "polygon" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">
										Side length (Chiều dài cạnh s)
									</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">
										Number of sides (Số cạnh n)
									</label>
									<input
										type="number"
										class="input w-full"
										placeholder="e.g. 5"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Visual and results preview */}
				<div class="lg:col-span-7 space-y-4">
					{res.error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{res.error}
						</div>
					)}

					{!res.error && (
						<div class="space-y-4">
							{/* Inline SVG preview of shape */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex justify-center">
								<svg
									width="180"
									height="150"
									viewBox="0 0 100 100"
									class="text-primary"
									stroke="currentColor"
									stroke-width="2.5"
									fill="rgba(230, 0, 35, 0.05)"
								>
									{shape === "rectangle" && <rect x="15" y="25" width="70" height="50" rx="3" />}
									{shape === "circle" && <circle cx="50" cy="50" r="35" />}
									{shape === "triangle" && <polygon points="50,15 15,85 85,85" />}
									{shape === "trapezoid" && <polygon points="30,25 70,25 85,75 15,75" />}
									{shape === "ellipse" && <ellipse cx="50" cy="50" rx="40" ry="25" />}
									{shape === "sector" && <path d="M50,50 L85,50 A35,35 0 0,0 50,15 Z" />}
									{shape === "polygon" && <polygon points="50,15 83,39 70,78 30,78 17,39" />}
								</svg>
							</div>

							{/* Calculation results */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblArea}</div>
										<div class="text-2xl font-bold text-primary">{res.area}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblPerimeter}</div>
										<div class="text-2xl font-bold text-ink">{res.perimeter}</div>
									</div>
								</div>

								{/* Steps / formulas */}
								<div class="pt-3 border-t border-hairline">
									<div class="text-[10px] text-muted font-bold uppercase mb-2">{t.lblSteps}</div>
									<pre class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
										{res.formula}
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
