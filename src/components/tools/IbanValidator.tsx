import { useCallback, useState } from "preact/hooks";

interface CountrySpec {
	code: string;
	name: string;
	flag: string;
	ibanLength: number;
	bbanPattern: string;
	bankCodeLength: number;
	accountStart: number;
}

const COUNTRY_SPECS: Record<string, CountrySpec> = {
	DE: {
		code: "DE",
		name: "Germany",
		flag: "🇩🇪",
		ibanLength: 22,
		bbanPattern: "\\d{18}",
		bankCodeLength: 8,
		accountStart: 12,
	},
	FR: {
		code: "FR",
		name: "France",
		flag: "🇫🇷",
		ibanLength: 27,
		bbanPattern: "\\d{23}",
		bankCodeLength: 5,
		accountStart: 10,
	},
	GB: {
		code: "GB",
		name: "United Kingdom",
		flag: "🇬🇧",
		ibanLength: 22,
		bbanPattern: "[A-Z]{4}\\d{14}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	ES: {
		code: "ES",
		name: "Spain",
		flag: "🇪🇸",
		ibanLength: 24,
		bbanPattern: "\\d{20}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	IT: {
		code: "IT",
		name: "Italy",
		flag: "🇮🇹",
		ibanLength: 27,
		bbanPattern: "[A-Z]\\d{22}",
		bankCodeLength: 5,
		accountStart: 10,
	},
	NL: {
		code: "NL",
		name: "Netherlands",
		flag: "🇳🇱",
		ibanLength: 18,
		bbanPattern: "[A-Z]{4}\\d{10}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	BE: {
		code: "BE",
		name: "Belgium",
		flag: "🇧🇪",
		ibanLength: 16,
		bbanPattern: "\\d{12}",
		bankCodeLength: 3,
		accountStart: 7,
	},
	AT: {
		code: "AT",
		name: "Austria",
		flag: "🇦🇹",
		ibanLength: 20,
		bbanPattern: "\\d{16}",
		bankCodeLength: 5,
		accountStart: 9,
	},
	CH: {
		code: "CH",
		name: "Switzerland",
		flag: "🇨🇭",
		ibanLength: 21,
		bbanPattern: "\\d{17}",
		bankCodeLength: 5,
		accountStart: 9,
	},
	PT: {
		code: "PT",
		name: "Portugal",
		flag: "🇵🇹",
		ibanLength: 25,
		bbanPattern: "\\d{21}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	SE: {
		code: "SE",
		name: "Sweden",
		flag: "🇸🇪",
		ibanLength: 24,
		bbanPattern: "\\d{20}",
		bankCodeLength: 3,
		accountStart: 7,
	},
	PL: {
		code: "PL",
		name: "Poland",
		flag: "🇵🇱",
		ibanLength: 28,
		bbanPattern: "\\d{24}",
		bankCodeLength: 3,
		accountStart: 7,
	},
	DK: {
		code: "DK",
		name: "Denmark",
		flag: "🇩🇰",
		ibanLength: 18,
		bbanPattern: "\\d{14}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	NO: {
		code: "NO",
		name: "Norway",
		flag: "🇳🇴",
		ibanLength: 15,
		bbanPattern: "\\d{11}",
		bankCodeLength: 4,
		accountStart: 8,
	},
	FI: {
		code: "FI",
		name: "Finland",
		flag: "🇫🇮",
		ibanLength: 18,
		bbanPattern: "\\d{14}",
		bankCodeLength: 3,
		accountStart: 7,
	},
};

const SAMPLE_IBANS = [
	{ iban: "DE89370400440532013000", country: "Germany" },
	{ iban: "FR7630006000011234567890189", country: "France" },
	{ iban: "GB29NWBK60161331926819", country: "United Kingdom" },
	{ iban: "ES9121000418450200051332", country: "Spain" },
	{ iban: "IT60X0542811101000000123456", country: "Italy" },
	{ iban: "NL91ABNA0417164300", country: "Netherlands" },
];

function mod97(iban: string): number {
	let remainder = iban;
	while (remainder.length > 2) {
		const block = remainder.substring(0, 9);
		remainder = `${Number.parseInt(block, 10) % 97}${remainder.substring(block.length)}`;
	}
	return Number.parseInt(remainder, 10) % 97;
}

function validateIban(iban: string): {
	isValid: boolean;
	country: CountrySpec | null;
	bankCode: string;
	accountNumber: string;
	checkDigits: string;
	formatted: string;
	errors: string[];
} {
	const cleaned = iban.replace(/[\s-]/g, "").toUpperCase();
	const errors: string[] = [];

	if (cleaned.length < 4) {
		return {
			isValid: false,
			country: null,
			bankCode: "",
			accountNumber: "",
			checkDigits: "",
			formatted: cleaned,
			errors: ["IBAN too short"],
		};
	}

	const countryCode = cleaned.substring(0, 2);
	const checkDigits = cleaned.substring(2, 4);
	const bban = cleaned.substring(4);

	const country = COUNTRY_SPECS[countryCode] || null;

	if (!country) {
		errors.push(`Unknown country code: ${countryCode}`);
	}

	if (!/^\d{2}$/.test(checkDigits)) {
		errors.push("Check digits must be numeric");
	}

	if (country && cleaned.length !== country.ibanLength) {
		errors.push(
			`Expected ${country.ibanLength} characters for ${country.name}, got ${cleaned.length}`,
		);
	}

	// Validate checksum
	const rearranged = `${bban}${countryCode}00`;
	let numericStr = "";
	for (const ch of rearranged) {
		if (ch >= "0" && ch <= "9") {
			numericStr += ch;
		} else {
			numericStr += (ch.charCodeAt(0) - 55).toString();
		}
	}

	const remainder = mod97(numericStr);
	const calculatedCheck = (98 - remainder).toString().padStart(2, "0");

	if (calculatedCheck !== checkDigits) {
		errors.push(`Invalid checksum: expected ${calculatedCheck}, got ${checkDigits}`);
	}

	// Format IBAN in groups of 4
	const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;

	// Extract bank code and account number
	let bankCode = "";
	let accountNumber = "";
	if (country && !errors.some((e) => e.includes("characters"))) {
		bankCode = bban.substring(0, country.bankCodeLength);
		accountNumber = bban.substring(country.accountStart);
	}

	return {
		isValid: errors.length === 0,
		country,
		bankCode,
		accountNumber,
		checkDigits,
		formatted,
		errors,
	};
}

export default function IbanValidator() {
	const [input, setInput] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const result = input.trim().length >= 4 ? validateIban(input) : null;

	const handleCopy = useCallback(async (text: string, field: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 1500);
	}, []);

	const handleSample = useCallback((iban: string) => {
		setInput(iban);
	}, []);

	return (
		<div>
			<div>
				<label class="text-caption-uppercase text-muted block mb-2">IBAN Number</label>
				<input
					type="text"
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					class="input w-full"
					placeholder="DE89 3704 0044 0532 0130 00"
					style="font-family: var(--font-mono); letter-spacing: 0.05em"
					maxLength={34}
				/>
			</div>

			{result && (
				<div class="mt-6">
					<div class="bg-surface-elevated rounded-lg p-4 mb-4">
						<div class="flex items-center gap-3 mb-3">
							{result.country && <span class="text-body-lg">{result.country.flag}</span>}
							<div>
								<div class="text-body-strong">
									{result.country ? result.country.name : "Unknown Country"}
								</div>
								<div class="text-body-sm text-muted-soft" style="font-family: var(--font-mono)">
									{result.formatted}
								</div>
							</div>
							<span
								class={`badge ml-auto ${result.isValid ? "text-accent-emerald" : "text-accent-rose"}`}
							>
								{result.isValid ? "Valid" : "Invalid"}
							</span>
						</div>

						{result.errors.length > 0 && (
							<div class="mb-3 space-y-1">
								{result.errors.map((error) => (
									<div class="text-body-sm text-accent-rose">• {error}</div>
								))}
							</div>
						)}

						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div class="text-center">
								<div class="text-body-sm text-body-strong">{result.checkDigits || "—"}</div>
								<div class="text-caption-uppercase text-muted">Check Digits</div>
							</div>
							<div class="text-center">
								<div class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{result.bankCode || "—"}
								</div>
								<div class="text-caption-uppercase text-muted">Bank Code</div>
							</div>
							<div class="text-center">
								<div class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{result.accountNumber || "—"}
								</div>
								<div class="text-caption-uppercase text-muted">Account No.</div>
							</div>
							<div class="text-center">
								<div class="text-body-sm text-body-strong">
									{input.replace(/[\s-]/g, "").length}
								</div>
								<div class="text-caption-uppercase text-muted">Length</div>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
							<div>
								<span class="text-caption-uppercase text-muted">Formatted: </span>
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{result.formatted}
								</code>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => handleCopy(result.formatted, "formatted")}
							>
								{copiedField === "formatted" ? "Copied!" : "Copy"}
							</button>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
							<div>
								<span class="text-caption-uppercase text-muted">Compact: </span>
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{input.replace(/[\s-]/g, "").toUpperCase()}
								</code>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => handleCopy(input.replace(/[\s-]/g, "").toUpperCase(), "compact")}
							>
								{copiedField === "compact" ? "Copied!" : "Copy"}
							</button>
						</div>
					</div>
				</div>
			)}

			<div class="mt-6">
				<label class="text-caption-uppercase text-muted block mb-2">Supported Countries</label>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
					{Object.values(COUNTRY_SPECS).map((spec) => (
						<div class="bg-surface-elevated rounded-lg p-2 flex items-center gap-2 text-body-sm">
							<span>{spec.flag}</span>
							<span class="text-body">{spec.name}</span>
							<span class="text-muted-soft">({spec.ibanLength})</span>
						</div>
					))}
				</div>
			</div>

			<div class="mt-4">
				<label class="text-caption-uppercase text-muted block mb-2">Sample IBANs</label>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
					{SAMPLE_IBANS.map((sample) => (
						<button
							class="bg-surface-elevated rounded-lg p-3 text-left hover:bg-surface-elevated/80 transition-colors"
							onClick={() => handleSample(sample.iban)}
						>
							<div class="text-body-sm text-body-strong">{sample.country}</div>
							<code class="text-caption text-muted" style="font-family: var(--font-mono)">
								{sample.iban}
							</code>
						</button>
					))}
				</div>
			</div>

			{!result && input.trim().length === 0 && (
				<div class="text-center py-12 text-muted">
					Enter an IBAN number to validate, or click a sample IBAN to test.
				</div>
			)}
		</div>
	);
}
