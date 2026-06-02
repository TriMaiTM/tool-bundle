import { useEffect, useState } from "preact/hooks";

interface CurrencyOption {
	code: string;
	symbol: string;
	format: (val: number) => string;
}

const CURRENCIES: CurrencyOption[] = [
	{
		code: "VND",
		symbol: "₫",
		format: (val) => `${Math.round(val).toLocaleString("vi-VN")} ₫`,
	},
	{
		code: "USD",
		symbol: "$",
		format: (val) => `$${val.toFixed(2)}`,
	},
	{
		code: "EUR",
		symbol: "€",
		format: (val) => `${val.toFixed(2)} €`,
	},
	{
		code: "GBP",
		symbol: "£",
		format: (val) => `£${val.toFixed(2)}`,
	},
];

export default function BillSplitter() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Input states
	const [billAmount, setBillAmount] = useState<number>(0);
	const [peopleCount, setPeopleCount] = useState<number>(2);
	const [tipPercent, setTipPercent] = useState<number>(10);
	const [customTip, setCustomTip] = useState<string>("");
	const [currency, setCurrency] = useState<string>("VND");
	const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);

	// Multi-language strings
	const t = {
		en: {
			billLabel: "Total Bill Amount",
			peopleLabel: "Number of People",
			tipLabel: "Tip Percentage",
			customTipPlaceholder: "Custom",
			currencyLabel: "Currency",
			results: "Calculation Summary",
			tipPerPerson: "Tip Per Person",
			totalPerPerson: "Total Per Person",
			totalTip: "Total Tip Amount",
			totalBill: "Total Bill (with Tip)",
			reset: "Reset Calculator",
			billPlaceholder: "Enter bill amount...",
			peopleMinWarn: "Number of people must be at least 1.",
		},
		vi: {
			billLabel: "Tổng tiền hóa đơn",
			peopleLabel: "Số người chia",
			tipLabel: "Phần trăm tiền Tip",
			customTipPlaceholder: "Tự chọn",
			currencyLabel: "Đơn vị tiền tệ",
			results: "Kết quả chi tiết",
			tipPerPerson: "Tiền Tip mỗi người",
			totalPerPerson: "Số tiền mỗi người cần trả",
			totalTip: "Tổng số tiền Tip",
			totalBill: "Tổng tiền hóa đơn (gồm Tip)",
			reset: "Nhập lại",
			billPlaceholder: "Nhập số tiền...",
			peopleMinWarn: "Số người chia hóa đơn phải lớn hơn hoặc bằng 1.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Active Currency Formatter
	const activeCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

	// Calculations
	const activeTipPercent = isCustomTipActive ? Number.parseFloat(customTip) || 0 : tipPercent;
	const totalTipAmount = billAmount * (activeTipPercent / 100);
	const grandTotal = billAmount + totalTipAmount;

	const safePeopleCount = Math.max(1, peopleCount);
	const tipPerPerson = totalTipAmount / safePeopleCount;
	const totalPerPerson = grandTotal / safePeopleCount;

	const handleReset = () => {
		setBillAmount(0);
		setPeopleCount(2);
		setTipPercent(10);
		setCustomTip("");
		setIsCustomTipActive(false);
	};

	return (
		<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
			{/* Input Panel Column */}
			<div class="md:col-span-6 bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-6">
				{/* Currency Selector */}
				<div>
					<label class="text-body-sm-strong text-ink block mb-2">{t.currencyLabel}</label>
					<select
						class="input w-full"
						value={currency}
						onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
					>
						{CURRENCIES.map((c) => (
							<option value={c.code}>
								{c.code} ({c.symbol})
							</option>
						))}
					</select>
				</div>

				{/* Bill Amount input */}
				<div>
					<label class="text-body-sm-strong text-ink block mb-2">{t.billLabel}</label>
					<div class="relative">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold font-mono">
							{activeCurrency.symbol}
						</span>
						<input
							type="number"
							min="0"
							step="any"
							class="input w-full pl-9"
							placeholder={t.billPlaceholder}
							value={billAmount || ""}
							onInput={(e) =>
								setBillAmount(
									Math.max(0, Number.parseFloat((e.target as HTMLInputElement).value) || 0),
								)
							}
						/>
					</div>
				</div>

				{/* Number of People */}
				<div>
					<label class="text-body-sm-strong text-ink block mb-2">{t.peopleLabel}</label>
					<div class="flex gap-2">
						<button
							class="btn-secondary px-4 font-bold text-lg"
							onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
							disabled={peopleCount <= 1}
						>
							-
						</button>
						<input
							type="number"
							min="1"
							class="input text-center flex-1 font-mono font-bold text-lg"
							value={peopleCount}
							onInput={(e) =>
								setPeopleCount(
									Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
								)
							}
						/>
						<button
							class="btn-secondary px-4 font-bold text-lg"
							onClick={() => setPeopleCount((p) => p + 1)}
						>
							+
						</button>
					</div>
					{peopleCount < 1 && <p class="text-caption text-error mt-1">{t.peopleMinWarn}</p>}
				</div>

				{/* Tip Percentage selector */}
				<div>
					<label class="text-body-sm-strong text-ink block mb-2">{t.tipLabel}</label>
					<div class="grid grid-cols-4 gap-2">
						{[5, 10, 15, 20].map((percent) => (
							<button
								key={percent}
								class={`py-2 px-3 rounded-full text-caption-uppercase font-bold border transition-colors ${
									!isCustomTipActive && tipPercent === percent
										? "bg-primary border-primary text-white"
										: "bg-surface-soft border-hairline text-ink hover:border-primary"
								}`}
								onClick={() => {
									setTipPercent(percent);
									setIsCustomTipActive(false);
								}}
							>
								{percent}%
							</button>
						))}
					</div>

					{/* Custom Tip */}
					<div class="mt-3 relative">
						<span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold font-mono">
							%
						</span>
						<input
							type="number"
							min="0"
							max="100"
							class={`input w-full ${isCustomTipActive ? "border-primary" : ""}`}
							placeholder={t.customTipPlaceholder}
							value={customTip}
							onInput={(e) => {
								setIsCustomTipActive(true);
								setCustomTip((e.target as HTMLInputElement).value);
							}}
							onClick={() => setIsCustomTipActive(true)}
						/>
					</div>
				</div>

				{/* Reset Button */}
				<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
					{t.reset}
				</button>
			</div>

			{/* Summary Results Column */}
			<div class="md:col-span-6 bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-6">
				<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-2 flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					{t.results}
				</h3>

				<div class="space-y-4">
					{/* Total Per Person Display Card */}
					<div class="bg-primary/5 p-5 rounded-lg border border-primary/20 text-center">
						<div class="text-caption text-primary font-bold uppercase tracking-wider mb-1">
							{t.totalPerPerson}
						</div>
						<div
							class="text-title-lg text-primary font-black"
							style="font-size: 38px; letter-spacing: -1px;"
						>
							{activeCurrency.format(totalPerPerson)}
						</div>
					</div>

					{/* Tip Per Person Display Card */}
					<div class="bg-surface-soft p-4 rounded-lg border border-hairline text-center">
						<div class="text-caption text-muted font-semibold uppercase mb-1">{t.tipPerPerson}</div>
						<div class="text-title-lg text-ink font-bold" style="font-size: 26px;">
							{activeCurrency.format(tipPerPerson)}
						</div>
					</div>

					{/* Breakdown totals */}
					<div class="space-y-2 pt-2 text-body-sm">
						<div class="flex justify-between items-center p-3 rounded bg-surface-soft/60">
							<span class="text-muted">{t.totalTip}</span>
							<span class="font-bold font-mono text-ink">
								{activeCurrency.format(totalTipAmount)}
							</span>
						</div>
						<div class="flex justify-between items-center p-3 rounded bg-surface-soft/60">
							<span class="text-muted">{t.totalBill}</span>
							<span class="font-bold font-mono text-ink">{activeCurrency.format(grandTotal)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
