import { describe, expect, it } from "vitest";
import {
	base32Decode,
	checkPasswordStrength,
	generatePassword,
	generateTOTP,
} from "../utils/security";

// ============================================
// generatePassword
// ============================================
describe("generatePassword", () => {
	it("generates password of specified length", () => {
		const password = generatePassword({
			length: 20,
			uppercase: true,
			lowercase: true,
			numbers: true,
			symbols: true,
		});
		expect(password).toHaveLength(20);
	});

	it("generates different passwords each time", () => {
		const p1 = generatePassword({ length: 16, lowercase: true });
		const p2 = generatePassword({ length: 16, lowercase: true });
		expect(p1).not.toBe(p2);
	});

	it("generates lowercase-only password", () => {
		const password = generatePassword({ length: 50, lowercase: true });
		expect(password).toMatch(/^[a-z]+$/);
	});

	it("generates numbers-only password", () => {
		const password = generatePassword({ length: 50, numbers: true });
		expect(password).toMatch(/^[0-9]+$/);
	});

	it("returns empty for empty charset", () => {
		const password = generatePassword({ length: 10 });
		expect(password).toBe("");
	});
});

// ============================================
// checkPasswordStrength
// ============================================
describe("checkPasswordStrength", () => {
	it("returns Weak for empty password", () => {
		const result = checkPasswordStrength("");
		expect(result.level).toBe("Weak");
		expect(result.score).toBe(0);
	});

	it("returns Weak for common password", () => {
		const result = checkPasswordStrength("password");
		expect(result.level).toBe("Weak");
	});

	it("returns higher score for strong password", () => {
		const result = checkPasswordStrength("Xk9!mP2@qR5#nL8&");
		expect(result.score).toBeGreaterThanOrEqual(50);
		expect(["Strong", "Very Strong"]).toContain(result.level);
	});

	it("calculates entropy", () => {
		const result = checkPasswordStrength("abcdefgh");
		expect(result.entropy).toBeGreaterThan(0);
	});

	it("provides suggestions for weak password", () => {
		const result = checkPasswordStrength("abc");
		expect(result.suggestions.length).toBeGreaterThan(0);
	});

	it("gives higher score for longer passwords", () => {
		const short = checkPasswordStrength("Ab1!");
		const long = checkPasswordStrength("Ab1!Ab1!Ab1!Ab1!");
		expect(long.score).toBeGreaterThanOrEqual(short.score);
	});

	it("returns crack time estimate", () => {
		const result = checkPasswordStrength("MyP@ssw0rd!");
		expect(result.crackTime).toBeTruthy();
		expect(typeof result.crackTime).toBe("string");
	});
});

// ============================================
// base32Decode
// ============================================
describe("base32Decode", () => {
	it("decodes valid Base32 string", () => {
		// "f" -> "MY======"
		const result = base32Decode("MY======");
		expect(result.length).toBe(1);
		expect(result[0]).toBe(102); // 'f'
	});

	it("decodes multi-byte Base32", () => {
		// "foo" -> "MZXW6==="
		const result = base32Decode("MZXW6===");
		expect(result.length).toBe(3);
		const text = new TextDecoder().decode(result);
		expect(text).toBe("foo");
	});

	it("handles padding", () => {
		// "foob" -> "MZXW6YQ="
		const result = base32Decode("MZXW6YQ=");
		expect(result.length).toBe(4);
		const text = new TextDecoder().decode(result);
		expect(text).toBe("foob");
	});

	it("handles lowercase input", () => {
		const result = base32Decode("mzxw6===");
		const text = new TextDecoder().decode(result);
		expect(text).toBe("foo");
	});

	it("returns empty array for empty input", () => {
		const result = base32Decode("");
		expect(result.length).toBe(0);
	});
});

// ============================================
// generateTOTP
// ============================================
describe("generateTOTP", () => {
	it("generates 6-digit code", async () => {
		const secret = "JBSWY3DPEHPK3PXP";
		const result = await generateTOTP(secret);
		expect(result.code).toMatch(/^\d{6}$/);
	});

	it("returns remaining seconds", async () => {
		const secret = "JBSWY3DPEHPK3PXP";
		const result = await generateTOTP(secret);
		expect(result.remaining).toBeGreaterThan(0);
		expect(result.remaining).toBeLessThanOrEqual(30);
	});

	it("generates same code for same time", async () => {
		const secret = "JBSWY3DPEHPK3PXP";
		const now = Date.now();
		const r1 = await generateTOTP(secret, 30, 6, now);
		const r2 = await generateTOTP(secret, 30, 6, now);
		expect(r1.code).toBe(r2.code);
	});

	it("generates different codes at different times", async () => {
		const secret = "JBSWY3DPEHPK3PXP";
		const r1 = await generateTOTP(secret, 30, 6, 1000000000000);
		const r2 = await generateTOTP(secret, 30, 6, 1000000060000);
		expect(r1.code).not.toBe(r2.code);
	});

	it("handles custom digit length", async () => {
		const secret = "JBSWY3DPEHPK3PXP";
		const result = await generateTOTP(secret, 30, 8);
		expect(result.code).toMatch(/^\d{8}$/);
	});
});
