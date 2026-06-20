import { useEffect, useState } from "preact/hooks";

type Shape = "sphere" | "cylinder" | "cone" | "prism" | "pyramid" | "ellipsoid";

export default function VolumeCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [shape, setShape] = useState<Shape>("sphere");

	// Inputs
	const [val1, setVal1] = useState("5"); // radius / length / semi-axis a
	const [val2, setVal2] = useState("10"); // height / width / semi-axis b
	const [val3, setVal3] = useState("12"); // depth / semi-axis c

	const t = {
		en: {
			title: "Volume & Surface Area Calculator",
			lblShape: "Choose Geometric Solid",
			btnCalculate: "Calculate",
			lblVolume: "Volume (V)",
			lblSurface: "Surface Area (A)",
			lblResult: "Result",
			lblSteps: "Formula Used",
			errInvalid: "Please enter positive values.",
			optSphere: "Sphere",
			optCylinder: "Cylinder",
			optCone: "Cone",
			optPrism: "Rectangular Prism (Box)",
			optPyramid: "Square Pyramid",
			optEllipsoid: "Ellipsoid",
		},
		vi: {
			title: "Tính thể tích và diện tích bề mặt hình khối",
			lblShape: "Chọn khối hình học",
			btnCalculate: "Tính toán",
			lblVolume: "Thể tích (V)",
			lblSurface: "Diện tích toàn phần (A)",
			lblResult: "Kết quả",
			lblSteps: "Công thức sử dụng",
			errInvalid: "Vui lòng nhập các số đo dương hợp lệ.",
			optSphere: "Hình cầu",
			optCylinder: "Hình trụ",
			optCone: "Hình nón",
			optPrism: "Hình hộp chữ nhật",
			optPyramid: "Hình chóp tứ giác đều",
			optEllipsoid: "Hình elipsoid",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const calculateVolumeSurface = () => {
		const v1 = Number.parseFloat(val1);
		const v2 = Number.parseFloat(val2);
		const v3 = Number.parseFloat(val3);

		if (Number.isNaN(v1) || v1 <= 0) return { error: t.errInvalid };

		let volume = 0;
		let surface = 0;
		let formulaStr = "";

		switch (shape) {
			case "sphere": {
				volume = (4 / 3) * Math.PI * v1 ** 3;
				surface = 4 * Math.PI * v1 * v1;
				formulaStr = `Volume = (4/3) × π × r³ = (4/3) × π × ${v1}³ = ${volume.toFixed(4)}\nSurface Area = 4 × π × r² = 4 × π × ${v1}² = ${surface.toFixed(4)}`;
				break;
			}
			case "cylinder": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				volume = Math.PI * v1 * v1 * v2;
				surface = 2 * Math.PI * v1 * (v1 + v2); // 2pi*r^2 + 2pi*r*h
				formulaStr = `Volume = π × r² × h = π × ${v1}² × ${v2} = ${volume.toFixed(4)}\nSurface Area = 2 × π × r × (r + h) = 2 × π × ${v1} × (${v1} + ${v2}) = ${surface.toFixed(4)}`;
				break;
			}
			case "cone": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				volume = (1 / 3) * Math.PI * v1 * v1 * v2;
				const slant = Math.sqrt(v1 * v1 + v2 * v2);
				surface = Math.PI * v1 * (v1 + slant); // pi*r^2 + pi*r*s
				formulaStr = `Volume = (1/3) × π × r² × h = (1/3) × π × ${v1}² × ${v2} = ${volume.toFixed(4)}\nSlant Height (s) = √(${v1}² + ${v2}²) = ${slant.toFixed(2)}\nSurface Area = π × r × (r + s) = π × ${v1} × (${v1} + ${slant.toFixed(2)}) = ${surface.toFixed(4)}`;
				break;
			}
			case "prism": {
				if (Number.isNaN(v2) || v2 <= 0 || Number.isNaN(v3) || v3 <= 0)
					return { error: t.errInvalid };
				volume = v1 * v2 * v3; // l * w * h
				surface = 2 * (v1 * v2 + v2 * v3 + v1 * v3);
				formulaStr = `Volume = l × w × h = ${v1} × ${v2} × ${v3} = ${volume}\nSurface Area = 2(lw + wh + lh) = 2(${v1}×${v2} + ${v2}×${v3} + ${v1}×${v3}) = ${surface}`;
				break;
			}
			case "pyramid": {
				if (Number.isNaN(v2) || v2 <= 0) return { error: t.errInvalid };
				volume = (1 / 3) * v1 * v1 * v2; // base_area * height / 3
				const slant = Math.sqrt((v1 / 2) ** 2 + v2 * v2);
				surface = v1 * v1 + 2 * v1 * slant; // base_area + 4 * (0.5 * base_side * slant)
				formulaStr = `Volume = (1/3) × base² × h = (1/3) × ${v1}² × ${v2} = ${volume.toFixed(4)}\nSlant height (s) = √((a/2)² + h²) = ${slant.toFixed(2)}\nSurface Area = base² + 2 × base × s = ${v1}² + 2 × ${v1} × ${slant.toFixed(2)} = ${surface.toFixed(4)}`;
				break;
			}
			case "ellipsoid": {
				if (Number.isNaN(v2) || v2 <= 0 || Number.isNaN(v3) || v3 <= 0)
					return { error: t.errInvalid };
				volume = (4 / 3) * Math.PI * v1 * v2 * v3;
				// Knud Thomsen's formula for ellipsoid surface area (p ≈ 1.6075)
				const p = 1.6075;
				const ap = v1 ** p;
				const bp = v2 ** p;
				const cp = v3 ** p;
				surface = 4 * Math.PI * ((ap * bp + bp * cp + ap * cp) / 3) ** (1 / p);
				formulaStr = `Volume = (4/3) × π × a × b × c = (4/3) × π × ${v1} × ${v2} × ${v3} = ${volume.toFixed(4)}\nSurface Area (Knud Thomsen approx) = ${surface.toFixed(4)}`;
				break;
			}
		}

		return {
			volume: Math.round(volume * 10000) / 10000,
			surface: Math.round(surface * 10000) / 10000,
			formula: formulaStr,
		};
	};

	const res = calculateVolumeSurface();

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{/* Solid select */}
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
							<option value="sphere">{t.optSphere}</option>
							<option value="cylinder">{t.optCylinder}</option>
							<option value="cone">{t.optCone}</option>
							<option value="prism">{t.optPrism}</option>
							<option value="pyramid">{t.optPyramid}</option>
							<option value="ellipsoid">{t.optEllipsoid}</option>
						</select>
					</div>

					{/* Inputs dynamic fields */}
					<div class="space-y-3 pt-2">
						{shape === "sphere" && (
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

						{shape === "cylinder" && (
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

						{shape === "cone" && (
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

						{shape === "prism" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Length (Chiều dài l)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Width (Chiều rộng w)</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Height (Chiều cao h)</label>
									<input
										type="number"
										class="input w-full"
										value={val3}
										onInput={(e) => setVal3((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}

						{shape === "pyramid" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">
										Base side length (Chiều dài cạnh đáy a)
									</label>
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

						{shape === "ellipsoid" && (
							<>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Semi-axis a (Bán trục a)</label>
									<input
										type="number"
										class="input w-full"
										value={val1}
										onInput={(e) => setVal1((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Semi-axis b (Bán trục b)</label>
									<input
										type="number"
										class="input w-full"
										value={val2}
										onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1.5">
									<label class="text-xs text-ink font-bold block">Semi-axis c (Bán trục c)</label>
									<input
										type="number"
										class="input w-full"
										value={val3}
										onInput={(e) => setVal3((e.target as HTMLInputElement).value)}
									/>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Solid previews and results */}
				<div class="lg:col-span-7 space-y-4">
					{res.error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{res.error}
						</div>
					)}

					{!res.error && (
						<div class="space-y-4">
							{/* Inline 3D mock-up SVG visualization */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex justify-center">
								<svg
									width="180"
									height="150"
									viewBox="0 0 100 100"
									class="text-primary"
									stroke="currentColor"
									stroke-width="2"
									fill="rgba(230, 0, 35, 0.05)"
								>
									{shape === "sphere" && (
										<>
											<circle cx="50" cy="50" r="35" />
											<ellipse cx="50" cy="50" rx="35" ry="12" stroke-dasharray="3,3" />
										</>
									)}
									{shape === "cylinder" && (
										<>
											<ellipse cx="50" cy="20" rx="20" ry="8" />
											<line x1="30" y1="20" x2="30" y2="80" />
											<line x1="70" y1="20" x2="70" y2="80" />
											<path d="M30,80 A20,8 0 0,0 70,80" />
											<path d="M30,80 A20,8 0 0,1 70,80" stroke-dasharray="3,3" />
										</>
									)}
									{shape === "cone" && (
										<>
											<ellipse cx="50" cy="80" rx="22" ry="8" />
											<line x1="50" y1="15" x2="28" y2="80" />
											<line x1="50" y1="15" x2="72" y2="80" />
										</>
									)}
									{shape === "prism" && (
										<>
											<rect x="20" y="35" width="45" height="35" />
											<rect x="35" y="20" width="45" height="35" stroke-dasharray="2,2" />
											<line x1="20" y1="35" x2="35" y2="20" />
											<line x1="65" y1="35" x2="80" y2="20" />
											<line x1="20" y1="70" x2="35" y2="55" stroke-dasharray="2,2" />
											<line x1="65" y1="70" x2="80" y2="55" />
										</>
									)}
									{shape === "pyramid" && (
										<>
											<polygon points="50,15 15,75 60,85" />
											<polygon points="50,15 60,85 85,75" />
											<line x1="15" y1="75" x2="85" y2="75" stroke-dasharray="3,3" />
										</>
									)}
									{shape === "ellipsoid" && (
										<>
											<ellipse cx="50" cy="50" rx="40" ry="22" />
											<ellipse cx="50" cy="50" rx="40" ry="8" stroke-dasharray="3,3" />
											<ellipse cx="50" cy="50" rx="12" ry="22" stroke-dasharray="3,3" />
										</>
									)}
								</svg>
							</div>

							{/* Numbers grid outputs */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblVolume}</div>
										<div class="text-2xl font-bold text-primary">{res.volume}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblSurface}</div>
										<div class="text-2xl font-bold text-ink">{res.surface}</div>
									</div>
								</div>

								{/* formulas */}
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
