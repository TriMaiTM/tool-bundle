import { useCallback, useState } from "preact/hooks";

type Country = "US" | "VN" | "UK" | "JP" | "KR" | "CN" | "DE" | "FR" | "AU" | "IN";

interface CountryInfo {
	code: Country;
	name: string;
	prefix: string;
	flag: string;
	pattern: RegExp;
	nationalFormat: (num: string) => string;
}

const COUNTRIES: Record<Country, CountryInfo> = {
	US: {
		code: "US",
		name: "United States",
		prefix: "+1",
		flag: "🇺🇸",
		pattern: /^(\+1)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^1/, "");
			return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
		},
	},
	VN: {
		code: "VN",
		name: "Vietnam",
		prefix: "+84",
		flag: "🇻🇳",
		pattern: /^(\+84|0)[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^84/, "0");
			return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
		},
	},
	UK: {
		code: "UK",
		name: "United Kingdom",
		prefix: "+44",
		flag: "🇬🇧",
		pattern: /^(\+44|0)[\s-]?\d{4}[\s-]?\d{6}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^44/, "0");
			return `${d.slice(0, 5)} ${d.slice(5)}`;
		},
	},
	JP: {
		code: "JP",
		name: "Japan",
		prefix: "+81",
		flag: "🇯🇵",
		pattern: /^(\+81|0)[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^81/, "0");
			return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
		},
	},
	KR: {
		code: "KR",
		name: "South Korea",
		prefix: "+82",
		flag: "🇰🇷",
		pattern: /^(\+82|0)[\s-]?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^82/, "0");
			return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
		},
	},
	CN: {
		code: "CN",
		name: "China",
		prefix: "+86",
		flag: "🇨🇳",
		pattern: /^(\+86|0)?[\s-]?1\d{2}[\s-]?\d{4}[\s-]?\d{4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^86/, "");
			return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
		},
	},
	DE: {
		code: "DE",
		name: "Germany",
		prefix: "+49",
		flag: "🇩🇪",
		pattern: /^(\+49|0)[\s-]?\d{2,5}[\s-]?\d{3,12}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^49/, "0");
			return `${d.slice(0, 4)} ${d.slice(4)}`;
		},
	},
	FR: {
		code: "FR",
		name: "France",
		prefix: "+33",
		flag: "🇫🇷",
		pattern: /^(\+33|0)[\s-]?\d[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^33/, "0");
			return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
		},
	},
	AU: {
		code: "AU",
		name: "Australia",
		prefix: "+61",
		flag: "🇦🇺",
		pattern: /^(\+61|0)[\s-]?\d[\s-]?\d{4}[\s-]?\d{4}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^61/, "0");
			return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
		},
	},
	IN: {
		code: "IN",
		name: "India",
		prefix: "+91",
		flag: "🇮🇳",
		pattern: /^(\+91|0)?[\s-]?\d{5}[\s-]?\d{5}$/,
		nationalFormat: (num: string) => {
			const d = num.replace(/\D/g, "").replace(/^91/, "");
			return `${d.slice(0, 5)} ${d.slice(5)}`;
		},
	},
};

interface PhoneResult {
	phone: string;
	isValid: boolean;
	detectedCountry: CountryInfo | null;
	national: string;
	international: string;
	e164: string;
	type: string;
}

function detectCountry(phone: string): CountryInfo | null {
	const cleaned = phone.replace(/[\s-]/g, "");
	for (const country of Object.values(COUNTRIES)) {
		if (cleaned.startsWith(country.prefix) || cleaned.startsWith(country.prefix.replace("+", ""))) {
			return country;
		}
	}
	return null;
}

function getPhoneType(phone: string): string {
	const cleaned = phone.replace(/\D/g, "");
	if (cleaned.length >= 10) {
		const last = cleaned.slice(-10);
		if (last[0] === "9" || last[0] === "8" || last[0] === "7") return "Mobile";
		if (last[0] === "2" || last[0] === "3") return "Fixed-line";
		if (last[0] === "5") return "VoIP";
	}
	return "Unknown";
}

function validatePhone(phone: string, defaultCountry: Country): PhoneResult {
	const trimmed = phone.trim();
	const detected = detectCountry(trimmed) || COUNTRIES[defaultCountry];
	const isValid = detected ? detected.pattern.test(trimmed) : false;

	let national = trimmed;
	let international = trimmed;
	let e164 = trimmed;

	if (detected && isValid) {
		const digits = trimmed.replace(/\D/g, "").replace(/^0/, "");
		national = detected.nationalFormat(trimmed);
		international = `${detected.prefix} ${national}`;
		e164 = `${detected.prefix}${digits}`;
	}

	return {
		phone: trimmed,
		isValid,
		detectedCountry: detected,
		national,
		international,
		e164,
		type: getPhoneType(trimmed),
	};
}

export default function PhoneValidator() {
	const [input, setInput] = useState("");
	const [defaultCountry, setDefaultCountry] = useState<Country>("US");
	const [results, setResults] = useState<PhoneResult[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const validate = useCallback(() => {
		const lines = input.split("\n").filter((line) => line.trim().length > 0);
		const validated = lines.map((line) => validatePhone(line, defaultCountry));
		setResults(validated);
	}, [input, defaultCountry]);

	const handleCopy = useCallback(async (text: string, index: number) => {
		await navigator.clipboard.writeText(text);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	}, []);

	const stats = {
		total: results.length,
		valid: results.filter((r) => r.isValid).length,
		invalid: results.filter((r) => !r.isValid).length,
	};

	return (
		<div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						Phone Numbers (one per line)
					</label>
					<textarea
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
						class="textarea w-full"
						rows={5}
						placeholder={"+1 555 123 4567\n+84 912 345 678\n020 7946 0958"}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Default Country</label>
					<select
						value={defaultCountry}
						onChange={(e) => setDefaultCountry((e.target as HTMLSelectElement).value as Country)}
						class="input w-full"
					>
						{Object.values(COUNTRIES).map((c) => (
							<option value={c.code}>
								{c.flag} {c.name} ({c.prefix})
							</option>
						))}
					</select>
					<button class="btn-primary mt-4 w-full" onClick={validate}>
						Validate Numbers
					</button>
				</div>
			</div>

			{results.length > 0 && (
				<div class="mt-6">
					<div class="grid grid-cols-3 gap-3 mb-4">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-body-lg text-body-strong">{stats.total}</div>
							<div class="text-caption-uppercase text-muted">Total</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-body-lg text-accent-emerald">{stats.valid}</div>
							<div class="text-caption-uppercase text-muted">Valid</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-body-lg text-accent-rose">{stats.invalid}</div>
							<div class="text-caption-uppercase text-muted">Invalid</div>
						</div>
					</div>

					<div class="space-y-2">
						{results.map((result, index) => (
							<div class="bg-surface-elevated rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										{result.detectedCountry && (
											<span class="text-body-lg">{result.detectedCountry.flag}</span>
										)}
										<code
											class="text-body-sm text-body-strong"
											style="font-family: var(--font-mono)"
										>
											{result.phone}
										</code>
									</div>
									<button
										class="text-body-sm text-primary hover:text-primary-active transition-colors"
										onClick={() => handleCopy(result.e164, index)}
									>
										{copiedIndex === index ? "Copied!" : "Copy E.164"}
									</button>
								</div>
								<div class="flex flex-wrap gap-2 mb-2">
									<span
										class={`badge ${result.isValid ? "text-accent-emerald" : "text-accent-rose"}`}
									>
										{result.isValid ? "Valid" : "Invalid"}
									</span>
									{result.detectedCountry && (
										<span class="badge text-primary">{result.detectedCountry.name}</span>
									)}
									<span class="badge text-muted">{result.type}</span>
								</div>
								{result.isValid && (
									<div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-body-sm">
										<div>
											<span class="text-caption-uppercase text-muted">National: </span>
											<span class="text-body-strong" style="font-family: var(--font-mono)">
												{result.national}
											</span>
										</div>
										<div>
											<span class="text-caption-uppercase text-muted">International: </span>
											<span class="text-body-strong" style="font-family: var(--font-mono)">
												{result.international}
											</span>
										</div>
										<div>
											<span class="text-caption-uppercase text-muted">E.164: </span>
											<span class="text-body-strong" style="font-family: var(--font-mono)">
												{result.e164}
											</span>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{results.length === 0 && (
				<div class="text-center py-12 text-muted">
					Enter phone numbers (one per line) and click "Validate Numbers".
				</div>
			)}
		</div>
	);
}
