import { useCallback, useState } from "preact/hooks";

interface CardInfo {
	type: string;
	icon: string;
	patterns: RegExp[];
	lengths: number[];
}

const CARD_TYPES: CardInfo[] = [
	{ type: "Visa", icon: "💳", patterns: [/^4/], lengths: [13, 16, 19] },
	{ type: "Mastercard", icon: "💳", patterns: [/^5[1-5]/, /^2[2-7]/], lengths: [16] },
	{ type: "American Express", icon: "💳", patterns: [/^3[47]/], lengths: [15] },
	{ type: "Discover", icon: "💳", patterns: [/^6(?:011|5)/, /^64[4-9]/], lengths: [16, 19] },
	{ type: "JCB", icon: "💳", patterns: [/^35(?:2[89]|[3-8])/], lengths: [15, 16] },
	{ type: "Diners Club", icon: "💳", patterns: [/^3(?:0[0-5]|[68])/], lengths: [14] },
	{ type: "UnionPay", icon: "💳", patterns: [/^62/], lengths: [16, 17, 18, 19] },
];

const TEST_CARDS = [
	{ number: "4111111111111111", type: "Visa", desc: "Visa Test Card" },
	{ number: "5500000000000004", type: "Mastercard", desc: "Mastercard Test Card" },
	{ number: "378282246310005", type: "Amex", desc: "Amex Test Card" },
	{ number: "6011111111111117", type: "Discover", desc: "Discover Test Card" },
	{ number: "3530111333300000", type: "JCB", desc: "JCB Test Card" },
	{ number: "30569309025904", type: "Diners", desc: "Diners Club Test Card" },
];

function luhnCheck(number: string): boolean {
	const digits = number.replace(/\D/g, "");
	let sum = 0;
	let isSecond = false;

	for (let i = digits.length - 1; i >= 0; i--) {
		let digit = Number.parseInt(digits[i]);

		if (isSecond) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}

		sum += digit;
		isSecond = !isSecond;
	}

	return sum % 10 === 0;
}

function detectCardType(number: string): CardInfo | null {
	const clean = number.replace(/\D/g, "");
	for (const card of CARD_TYPES) {
		for (const pattern of card.patterns) {
			if (pattern.test(clean)) return card;
		}
	}
	return null;
}

function formatCardNumber(number: string): string {
	const clean = number.replace(/\D/g, "");
	const groups = clean.match(/.{1,4}/g);
	return groups ? groups.join(" ") : clean;
}

function maskCardNumber(number: string): string {
	const clean = number.replace(/\D/g, "");
	if (clean.length <= 4) return clean;
	return `${"*".repeat(clean.length - 4)}${clean.slice(-4)}`;
}

export default function CreditCardValidator() {
	const [input, setInput] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const cleanNumber = input.replace(/\D/g, "");
	const isValidLength = cleanNumber.length >= 13 && cleanNumber.length <= 19;
	const passesLuhn = luhnCheck(cleanNumber);
	const cardType = detectCardType(cleanNumber);
	const isValidLengthForType = cardType ? cardType.lengths.includes(cleanNumber.length) : false;
	const isOverallValid = isValidLength && passesLuhn && isValidLengthForType;

	const handleCopy = useCallback(async (text: string, field: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 1500);
	}, []);

	const handleTestCard = useCallback((number: string) => {
		setInput(number);
	}, []);

	return (
		<div>
			<div>
				<label class="text-caption-uppercase text-muted block mb-2">Card Number</label>
				<input
					type="text"
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					class="input w-full"
					placeholder="Enter card number..."
					style="font-family: var(--font-mono); letter-spacing: 0.1em"
					maxLength={23}
				/>
			</div>

			{cleanNumber.length > 0 && (
				<div class="mt-6">
					<div class="bg-surface-elevated rounded-lg p-4 mb-4">
						<div class="flex items-center gap-3 mb-3">
							{cardType && <span class="text-body-lg">{cardType.icon}</span>}
							<div>
								<div class="text-body-strong">{cardType ? cardType.type : "Unknown Card Type"}</div>
								<div class="text-body-sm text-muted-soft">{maskCardNumber(cleanNumber)}</div>
							</div>
							<span
								class={`badge ml-auto ${isOverallValid ? "text-accent-emerald" : "text-accent-rose"}`}
							>
								{isOverallValid ? "Valid" : "Invalid"}
							</span>
						</div>

						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div class="text-center">
								<div
									class={`text-body-sm ${passesLuhn ? "text-accent-emerald" : "text-accent-rose"}`}
								>
									{passesLuhn ? "✓ Pass" : "✗ Fail"}
								</div>
								<div class="text-caption-uppercase text-muted">Luhn</div>
							</div>
							<div class="text-center">
								<div
									class={`text-body-sm ${isValidLength ? "text-accent-emerald" : "text-accent-rose"}`}
								>
									{isValidLength ? "✓ Valid" : "✗ Invalid"}
								</div>
								<div class="text-caption-uppercase text-muted">Length</div>
							</div>
							<div class="text-center">
								<div
									class={`text-body-sm ${isValidLengthForType ? "text-accent-emerald" : "text-accent-rose"}`}
								>
									{isValidLengthForType ? "✓ Match" : "✗ Mismatch"}
								</div>
								<div class="text-caption-uppercase text-muted">Card Match</div>
							</div>
							<div class="text-center">
								<div class="text-body-sm text-body-strong">{cleanNumber.length}</div>
								<div class="text-caption-uppercase text-muted">Digits</div>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
							<div>
								<span class="text-caption-uppercase text-muted">Formatted: </span>
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{formatCardNumber(cleanNumber)}
								</code>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => handleCopy(formatCardNumber(cleanNumber), "formatted")}
							>
								{copiedField === "formatted" ? "Copied!" : "Copy"}
							</button>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
							<div>
								<span class="text-caption-uppercase text-muted">Masked: </span>
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{maskCardNumber(cleanNumber)}
								</code>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => handleCopy(maskCardNumber(cleanNumber), "masked")}
							>
								{copiedField === "masked" ? "Copied!" : "Copy"}
							</button>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
							<div>
								<span class="text-caption-uppercase text-muted">E.164: </span>
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{cleanNumber}
								</code>
							</div>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={() => handleCopy(cleanNumber, "raw")}
							>
								{copiedField === "raw" ? "Copied!" : "Copy"}
							</button>
						</div>
					</div>

					{cardType && (
						<div class="mt-4 bg-surface-elevated rounded-lg p-4">
							<div class="text-caption-uppercase text-muted mb-2">Card Type Details</div>
							<div class="grid grid-cols-2 gap-2 text-body-sm">
								<div>
									<span class="text-muted">Type: </span>
									<span class="text-body-strong">{cardType.type}</span>
								</div>
								<div>
									<span class="text-muted">Valid Lengths: </span>
									<span class="text-body-strong">{cardType.lengths.join(", ")}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			<div class="mt-6">
				<label class="text-caption-uppercase text-muted block mb-2">Luhn Algorithm</label>
				<div class="bg-surface-elevated rounded-lg p-4 text-body-sm text-muted-soft">
					<p class="mb-2">
						The Luhn algorithm is a simple checksum formula used to validate identification numbers:
					</p>
					<ol class="list-decimal list-inside space-y-1">
						<li>Starting from the rightmost digit, double every second digit.</li>
						<li>If doubling results in a value greater than 9, subtract 9.</li>
						<li>Sum all digits together.</li>
						<li>If the total modulo 10 equals 0, the number is valid.</li>
					</ol>
				</div>
			</div>

			<div class="mt-4">
				<label class="text-caption-uppercase text-muted block mb-2">Test Card Numbers</label>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
					{TEST_CARDS.map((card) => (
						<button
							class="bg-surface-elevated rounded-lg p-3 text-left hover:bg-surface-elevated/80 transition-colors"
							onClick={() => handleTestCard(card.number)}
						>
							<div class="text-body-sm text-body-strong">{card.desc}</div>
							<code class="text-caption text-muted" style="font-family: var(--font-mono)">
								{card.number}
							</code>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
