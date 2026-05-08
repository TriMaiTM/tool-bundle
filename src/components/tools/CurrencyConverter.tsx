import { useCallback, useMemo, useState } from "preact/hooks";

interface Currency {
	code: string;
	name: string;
	symbol: string;
	rate: number; // relative to USD
}

const CURRENCIES: Currency[] = [
	{ code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
	{ code: "EUR", name: "Euro", symbol: "€", rate: 0.92 },
	{ code: "GBP", name: "British Pound", symbol: "£", rate: 0.79 },
	{ code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 149.5 },
	{ code: "KRW", name: "South Korean Won", symbol: "₩", rate: 1330.0 },
	{ code: "VND", name: "Vietnamese Dong", symbol: "₫", rate: 24500.0 },
	{ code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 7.24 },
	{ code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.12 },
	{ code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.53 },
	{ code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 1.36 },
	{ code: "CHF", name: "Swiss Franc", symbol: "Fr", rate: 0.88 },
	{ code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 1.34 },
	{ code: "THB", name: "Thai Baht", symbol: "฿", rate: 35.5 },
	{ code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rate: 4.72 },
	{ code: "PHP", name: "Philippine Peso", symbol: "₱", rate: 56.2 },
	{ code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 15650.0 },
	{ code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 4.97 },
	{ code: "MXN", name: "Mexican Peso", symbol: "$", rate: 17.15 },
	{ code: "RUB", name: "Russian Ruble", symbol: "₽", rate: 92.5 },
	{ code: "ZAR", name: "South African Rand", symbol: "R", rate: 18.65 },
	{ code: "SEK", name: "Swedish Krona", symbol: "kr", rate: 10.42 },
	{ code: "NOK", name: "Norwegian Krone", symbol: "kr", rate: 10.55 },
	{ code: "DKK", name: "Danish Krone", symbol: "kr", rate: 6.87 },
	{ code: "PLN", name: "Polish Zloty", symbol: "zł", rate: 4.05 },
	{ code: "TRY", name: "Turkish Lira", symbol: "₺", rate: 32.0 },
];

function formatAmount(value: number, currency: Currency): string {
	// For currencies with very large values, use fewer decimals
	if (currency.rate > 100) {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		});
	}
	return value.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function getRateDisplay(from: Currency, to: Currency): string {
	const rate = to.rate / from.rate;
	if (rate >= 100) {
		return `1 ${from.code} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${to.code}`;
	}
	return `1 ${from.code} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to.code}`;
}

export default function CurrencyConverter() {
	const [amount, setAmount] = useState("1000");
	const [fromCode, setFromCode] = useState("USD");
	const [toCode, setToCode] = useState("VND");
	const [copied, setCopied] = useState(false);

	const fromCurrency = CURRENCIES.find((c) => c.code === fromCode) || CURRENCIES[0];
	const toCurrency = CURRENCIES.find((c) => c.code === toCode) || CURRENCIES[0];

	const numericAmount = Number.parseFloat(amount);
	const isValid = !Number.isNaN(numericAmount) && numericAmount > 0;

	const convertedAmount = useMemo(() => {
		if (!isValid) return null;
		// Convert: amount in "from" currency → USD → "to" currency
		const usd = numericAmount / fromCurrency.rate;
		return usd * toCurrency.rate;
	}, [numericAmount, fromCurrency, toCurrency, isValid]);

	const allConversions = useMemo(() => {
		if (!isValid) return [];
		const usd = numericAmount / fromCurrency.rate;
		return CURRENCIES.map((c) => ({
			currency: c,
			amount: usd * c.rate,
		}));
	}, [numericAmount, fromCurrency, isValid]);

	const handleSwap = useCallback(() => {
		setFromCode(toCode);
		setToCode(fromCode);
	}, [fromCode, toCode]);

	const handleCopy = useCallback(() => {
		if (convertedAmount === null) return;
		const text = `${formatAmount(convertedAmount, toCurrency)} ${toCode}`;
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [convertedAmount, toCurrency, toCode]);

	return (
		<div class="space-y-6">
			{/* Input Section */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
					{/* Amount */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Amount</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 1000"
							value={amount}
							onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* From */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">From</label>
						<select
							class="input w-full"
							value={fromCode}
							onChange={(e) => setFromCode((e.target as HTMLSelectElement).value)}
						>
							{CURRENCIES.map((c) => (
								<option key={c.code} value={c.code}>
									{c.code} — {c.name}
								</option>
							))}
						</select>
					</div>

					{/* Swap */}
					<div class="flex justify-center">
						<button class="btn-secondary px-4 py-2" onClick={handleSwap} title="Swap currencies">
							⇄ Swap
						</button>
					</div>

					{/* To */}
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">To</label>
						<select
							class="input w-full"
							value={toCode}
							onChange={(e) => setToCode((e.target as HTMLSelectElement).value)}
						>
							{CURRENCIES.map((c) => (
								<option key={c.code} value={c.code}>
									{c.code} — {c.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Result */}
			{convertedAmount !== null && (
				<div class="space-y-4">
					<div class="bg-surface-elevated rounded-lg p-6 text-center">
						<div class="text-caption-uppercase text-muted mb-2">
							{numericAmount.toLocaleString()} {fromCurrency.code} =
						</div>
						<div class="text-title-lg text-primary">
							{formatAmount(convertedAmount, toCurrency)} {toCurrency.code}
						</div>
						<div class="text-caption text-muted mt-2">
							{getRateDisplay(fromCurrency, toCurrency)}
						</div>
						<button class="btn-primary mt-4" onClick={handleCopy}>
							{copied ? "✓ Copied!" : "Copy Result"}
						</button>
					</div>

					{/* Multi-Currency Table */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">
							{numericAmount.toLocaleString()} {fromCurrency.code} in All Currencies
						</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-body-sm">
								<thead>
									<tr class="border-b border-hairline">
										<th class="text-left text-caption-uppercase text-muted py-2 px-3">Currency</th>
										<th class="text-left text-caption-uppercase text-muted py-2 px-3">Name</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">Amount</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">
											Rate (from USD)
										</th>
									</tr>
								</thead>
								<tbody>
									{allConversions.map(({ currency, amount: converted }) => (
										<tr
											key={currency.code}
											class={`border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors ${
												currency.code === toCode ? "bg-surface-soft" : ""
											}`}
										>
											<td class="py-2 px-3">
												<span class="badge">{currency.code}</span>
											</td>
											<td class="py-2 px-3 text-muted">
												{currency.symbol} {currency.name}
											</td>
											<td class="py-2 px-3 text-right text-primary font-medium">
												{formatAmount(converted, currency)}
											</td>
											<td class="py-2 px-3 text-right text-muted">
												{currency.rate.toLocaleString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Disclaimer */}
					<div class="bg-surface-elevated rounded-lg p-3 text-center">
						<span class="badge-yellow">Disclaimer</span>
						<p class="text-caption text-muted mt-2">
							Rates are approximate and for reference only. They are hardcoded static rates and may
							not reflect current market conditions.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
