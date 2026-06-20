import { useEffect, useState } from "preact/hooks";

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

// Custom repeating decimal finder
function findRepeatingDecimal(
	num: number,
	den: number,
): { integer: string; nonRepeating: string; repeating: string } {
	let integerPart = Math.floor(Math.abs(num) / Math.abs(den)).toString();
	if (num * den < 0) integerPart = `-${integerPart}`;

	let remainder = Math.abs(num) % Math.abs(den);
	if (remainder === 0) {
		return { integer: integerPart, nonRepeating: "", repeating: "" };
	}

	const remaindersMap = new Map<number, number>();
	let decimalStr = "";

	while (remainder !== 0 && !remaindersMap.has(remainder)) {
		remaindersMap.set(remainder, decimalStr.length);
		remainder *= 10;
		decimalStr += Math.floor(remainder / Math.abs(den)).toString();
		remainder %= Math.abs(den);
	}

	if (remainder === 0) {
		return { integer: integerPart, nonRepeating: decimalStr, repeating: "" };
	}

	const repeatStartIdx = remaindersMap.get(remainder)!;
	const nonRepeating = decimalStr.substring(0, repeatStartIdx);
	const repeating = decimalStr.substring(repeatStartIdx);

	return { integer: integerPart, nonRepeating, repeating };
}

function decimalToFraction(decimal: string): [number, number] | null {
	const d = Number.parseFloat(decimal);
	if (Number.isNaN(d)) return null;

	if (Number.isInteger(d)) return [d, 1];

	const decimalStr = d.toString();
	const dotIndex = decimalStr.indexOf(".");
	if (dotIndex === -1) return [d, 1];

	const digitsAfterDot = decimalStr.length - dotIndex - 1;
	const denominator = 10 ** digitsAfterDot;
	const numerator = Math.round(d * denominator);

	return simplifyFraction(numerator, denominator);
}

export default function FractionToDecimal() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"frac-to-dec" | "dec-to-frac">("frac-to-dec");

	// Frac to Dec inputs
	const [numInput, setNumInput] = useState("1");
	const [denInput, setDenInput] = useState("3");

	// Dec to Frac inputs
	const [decInput, setDecInput] = useState("0.75");

	const t = {
		en: {
			title: "Fraction to Decimal Converter",
			tabFracToDec: "Fraction to Decimal",
			tabDecToFrac: "Decimal to Fraction",
			numerator: "Numerator (Top)",
			denominator: "Denominator (Bottom)",
			decimalVal: "Decimal Number",
			btnConvert: "Convert",
			lblResult: "Result",
			lblSimplified: "Simplified Fraction",
			lblRepeating: "Repeating Decimal Notation",
			lblSteps: "Conversion Steps",
			errDenominator: "Denominator cannot be zero.",
			errInvalidNum: "Please enter valid numbers.",
		},
		vi: {
			title: "Chuyển đổi Phân số và Thập phân",
			tabFracToDec: "Phân số → Thập phân",
			tabDecToFrac: "Thập phân → Phân số",
			numerator: "Tử số (Trên)",
			denominator: "Mẫu số (Dưới)",
			decimalVal: "Số thập phân",
			btnConvert: "Chuyển đổi",
			lblResult: "Kết quả",
			lblSimplified: "Phân số rút gọn",
			lblRepeating: "Dạng số thập phân tuần hoàn",
			lblSteps: "Các bước thực hiện",
			errDenominator: "Mẫu số phải khác 0.",
			errInvalidNum: "Vui lòng nhập số hợp lệ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Fraction to Decimal computation
	const fracToDecResult = () => {
		const num = Number.parseInt(numInput);
		const den = Number.parseInt(denInput);

		if (Number.isNaN(num) || Number.isNaN(den)) {
			return { error: t.errInvalidNum };
		}
		if (den === 0) {
			return { error: t.errDenominator };
		}

		const [sNum, sDen] = simplifyFraction(num, den);
		const { integer, nonRepeating, repeating } = findRepeatingDecimal(num, den);

		let decimalFormatted = `${integer}`;
		if (nonRepeating || repeating) decimalFormatted += ".";
		decimalFormatted += nonRepeating;
		if (repeating) {
			decimalFormatted += `(${repeating})`;
		}

		const steps = [
			`${lang === "en" ? "Original fraction" : "Phân số gốc"}: ${num}/${den}`,
			sNum !== num || sDen !== den
				? `${lang === "en" ? "Simplify dividing by GCD" : "Rút gọn chia cho UCLN"}(${gcd(Math.abs(num), Math.abs(den))}): ${sNum}/${sDen}`
				: `${lang === "en" ? "Fraction is already simplified" : "Phân số đã ở dạng tối giản"}`,
			`${lang === "en" ? "Divide numerator by denominator" : "Thực hiện chia tử số cho mẫu số"}: ${num} ÷ ${den} = ${num / den}`,
		];

		return {
			decimal: num / den,
			formatted: decimalFormatted,
			simplified: `${sNum}/${sDen}`,
			isRepeating: repeating.length > 0,
			steps,
		};
	};

	// Decimal to Fraction computation
	const decToFracResult = () => {
		const result = decimalToFraction(decInput);
		if (!result) return { error: t.errInvalidNum };
		const [num, den] = result;

		const whole = Math.floor(Math.abs(num) / den);
		const rem = Math.abs(num) % den;
		const mixedStr = whole > 0 && rem > 0 ? `${num < 0 ? "-" : ""}${whole} ${rem}/${den}` : "";

		const steps = [
			`${lang === "en" ? "Count the number of digits after the decimal point" : "Đếm số chữ số sau dấu phẩy"}.`,
			`${lang === "en" ? "Create a fraction with denominator as a power of 10" : "Tạo phân số với mẫu số là lũy thừa của 10"}.`,
			`${lang === "en" ? "Simplify the fraction to its lowest terms" : "Rút gọn phân số về dạng tối giản"}.`,
		];

		return {
			fraction: `${num}/${den}`,
			mixed: mixedStr,
			steps,
		};
	};

	const fRes = mode === "frac-to-dec" ? fracToDecResult() : null;
	const dRes = mode === "dec-to-frac" ? decToFracResult() : null;

	return (
		<div class="space-y-6">
			{/* Sub-navigation tabs */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "frac-to-dec"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("frac-to-dec")}
				>
					{t.tabFracToDec}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "dec-to-frac"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("dec-to-frac")}
				>
					{t.tabDecToFrac}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Inputs & Settings */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					{mode === "frac-to-dec" ? (
						<div class="space-y-4">
							{/* Numerator */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.numerator}</label>
								<input
									type="number"
									class="input w-full"
									value={numInput}
									onInput={(e) => setNumInput((e.target as HTMLInputElement).value)}
								/>
							</div>

							{/* Denominator */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.denominator}</label>
								<input
									type="number"
									class="input w-full"
									value={denInput}
									onInput={(e) => setDenInput((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					) : (
						<div class="space-y-4">
							{/* Decimal Input */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.decimalVal}</label>
								<input
									type="text"
									class="input w-full font-mono"
									value={decInput}
									onInput={(e) => setDecInput((e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Results screen */}
				<div class="lg:col-span-7 space-y-4">
					{/* Error display */}
					{((mode === "frac-to-dec" && fRes?.error) || (mode === "dec-to-frac" && dRes?.error)) && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{mode === "frac-to-dec" ? fRes?.error : dRes?.error}
						</div>
					)}

					{/* Fraction to Decimal Result Panel */}
					{mode === "frac-to-dec" && !fRes?.error && fRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
										<div class="text-2xl font-bold text-ink">{fRes.decimal}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblSimplified}</div>
										<div class="text-2xl font-bold text-primary">{fRes.simplified}</div>
									</div>
								</div>

								{fRes.isRepeating && (
									<div class="pt-2 border-t border-hairline">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblRepeating}</div>
										<div class="text-lg font-mono font-bold text-accent-rose">{fRes.formatted}</div>
									</div>
								)}
							</div>

							{/* Step-by-Step explanation */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
								<ul class="space-y-2 text-xs text-muted">
									{fRes.steps?.map((step, idx) => (
										<li key={idx} class="flex gap-2 items-start">
											<span class="badge badge-yellow shrink-0">{idx + 1}</span>
											<span>{step}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					{/* Decimal to Fraction Result Panel */}
					{mode === "dec-to-frac" && !dRes?.error && dRes && (
						<div class="space-y-4">
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblResult}</div>
										<div class="text-2xl font-bold text-primary">{dRes.fraction}</div>
									</div>
									{dRes.mixed && (
										<div>
											<div class="text-[10px] text-muted font-bold uppercase">Mixed Number</div>
											<div class="text-2xl font-bold text-ink">{dRes.mixed}</div>
										</div>
									)}
								</div>
							</div>

							{/* Step-by-Step explanation */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
								<ul class="space-y-2 text-xs text-muted">
									{dRes.steps?.map((step, idx) => (
										<li key={idx} class="flex gap-2 items-start">
											<span class="badge badge-yellow shrink-0">{idx + 1}</span>
											<span>{step}</span>
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
