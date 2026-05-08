/**
 * Security utility functions
 * Extracted from tool components for testability
 */

const CHAR_SETS = {
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	numbers: "0123456789",
	symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const SIMILAR_CHARS = "0Ol1I";
const AMBIGUOUS_CHARS = "{}[]()/\\\"'`~,;:.<>";

export interface PasswordOptions {
	length: number;
	uppercase?: boolean;
	lowercase?: boolean;
	numbers?: boolean;
	symbols?: boolean;
	excludeSimilar?: boolean;
	excludeAmbiguous?: boolean;
}

export function generatePassword(options: PasswordOptions): string {
	let chars = "";
	if (options.uppercase) chars += CHAR_SETS.uppercase;
	if (options.lowercase) chars += CHAR_SETS.lowercase;
	if (options.numbers) chars += CHAR_SETS.numbers;
	if (options.symbols) chars += CHAR_SETS.symbols;

	if (options.excludeSimilar) {
		chars = chars
			.split("")
			.filter((c) => !SIMILAR_CHARS.includes(c))
			.join("");
	}
	if (options.excludeAmbiguous) {
		chars = chars
			.split("")
			.filter((c) => !AMBIGUOUS_CHARS.includes(c))
			.join("");
	}

	if (chars.length === 0) return "";

	const array = new Uint32Array(options.length);
	crypto.getRandomValues(array);
	return Array.from(array, (v) => chars[v % chars.length]).join("");
}

const COMMON_PASSWORDS = [
	"password",
	"123456",
	"12345678",
	"qwerty",
	"abc123",
	"monkey",
	"1234567",
	"letmein",
	"trustno1",
	"dragon",
	"baseball",
	"iloveyou",
	"master",
	"sunshine",
	"ashley",
	"bailey",
	"shadow",
	"123123",
	"654321",
	"superman",
];

export interface PasswordStrength {
	score: number;
	level: "Weak" | "Fair" | "Strong" | "Very Strong";
	entropy: number;
	crackTime: string;
	suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
	if (!password) {
		return {
			score: 0,
			level: "Weak",
			entropy: 0,
			crackTime: "instant",
			suggestions: [],
		};
	}

	const suggestions: string[] = [];
	let score = 0;

	// Length scoring
	if (password.length >= 8) score += 10;
	if (password.length >= 12) score += 10;
	if (password.length >= 16) score += 10;
	if (password.length >= 20) score += 10;
	if (password.length < 8) suggestions.push("Use at least 8 characters");

	// Character variety
	const hasLower = /[a-z]/.test(password);
	const hasUpper = /[A-Z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSymbol = /[^a-zA-Z0-9]/.test(password);

	if (hasLower) score += 10;
	if (hasUpper) score += 10;
	if (hasNumber) score += 10;
	if (hasSymbol) score += 10;

	if (!hasLower) suggestions.push("Add lowercase letters");
	if (!hasUpper) suggestions.push("Add uppercase letters");
	if (!hasNumber) suggestions.push("Add numbers");
	if (!hasSymbol) suggestions.push("Add special characters");

	// Pattern penalties
	if (/^[a-zA-Z]+$/.test(password)) score -= 10;
	if (/^[0-9]+$/.test(password)) score -= 10;
	if (/(.)\1{2,}/.test(password)) score -= 10;
	if (/^(123|abc|qwerty)/i.test(password)) score -= 10;

	// Common password check
	if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
		score = Math.min(score, 5);
		suggestions.push("Avoid common passwords");
	}

	// Entropy calculation
	let charsetSize = 0;
	if (hasLower) charsetSize += 26;
	if (hasUpper) charsetSize += 26;
	if (hasNumber) charsetSize += 10;
	if (hasSymbol) charsetSize += 32;
	const entropy = charsetSize > 0 ? Math.round(password.length * Math.log2(charsetSize)) : 0;

	// Crack time (assuming 10 billion guesses/sec)
	const guessesPerSecond = 10_000_000_000;
	const totalCombinations = (charsetSize || 1) ** password.length;
	const seconds = totalCombinations / guessesPerSecond / 2;
	let crackTime: string;
	if (seconds < 1) crackTime = "instant";
	else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
	else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
	else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
	else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`;
	else if (seconds < 31536000 * 1000) crackTime = `${Math.round(seconds / 31536000)} years`;
	else crackTime = "centuries+";

	score = Math.max(0, Math.min(100, score));

	let level: PasswordStrength["level"];
	if (score < 30) level = "Weak";
	else if (score < 50) level = "Fair";
	else if (score < 75) level = "Strong";
	else level = "Very Strong";

	return { score, level, entropy, crackTime, suggestions };
}

/**
 * Base32 decode for OTP secret keys
 */
export function base32Decode(input: string): Uint8Array {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	const cleaned = input.replace(/[\s=]+/g, "").toUpperCase();
	let bits = "";
	for (const char of cleaned) {
		const val = alphabet.indexOf(char);
		if (val === -1) continue;
		bits += val.toString(2).padStart(5, "0");
	}
	// Calculate expected byte length based on Base32 encoding rules
	// Each 8 Base32 chars = 5 bytes, padding chars indicate remainder
	const _paddingChars = (input.match(/=/g) || []).length;
	const totalBits = cleaned.length * 5;
	const totalBytes = Math.floor(totalBits / 8);
	const bytes: number[] = [];
	for (let i = 0; i + 8 <= bits.length && bytes.length < totalBytes; i += 8) {
		bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
	}
	return new Uint8Array(bytes);
}

/**
 * Generate TOTP code (RFC 6238)
 */
export async function generateTOTP(
	secret: string,
	timeStep = 30,
	digits = 6,
	now = Date.now(),
): Promise<{ code: string; remaining: number }> {
	const key = base32Decode(secret);
	const epoch = Math.floor(now / 1000);
	const counter = Math.floor(epoch / timeStep);
	const remaining = timeStep - (epoch % timeStep);

	// Convert counter to 8-byte big-endian
	const counterBytes = new Uint8Array(8);
	const view = new DataView(counterBytes.buffer);
	view.setUint32(4, counter, false);

	// HMAC-SHA1
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		key,
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
	const hash = new Uint8Array(signature);

	// Dynamic truncation
	const offset = hash[hash.length - 1] & 0x0f;
	const binary =
		((hash[offset] & 0x7f) << 24) |
		((hash[offset + 1] & 0xff) << 16) |
		((hash[offset + 2] & 0xff) << 8) |
		(hash[offset + 3] & 0xff);

	const otp = binary % 10 ** digits;
	return { code: otp.toString().padStart(digits, "0"), remaining };
}
