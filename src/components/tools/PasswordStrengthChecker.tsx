import { useCallback, useMemo, useState } from "preact/hooks";

type StrengthResult = {
	score: number;
	label: string;
	color: string;
	entropy: number;
	crackTime: string;
	suggestions: string[];
};

const COMMON_PASSWORDS: string[] = [
	"password",
	"123456",
	"12345678",
	"qwerty",
	"abc123",
	"monkey",
	"master",
	"dragon",
	"111111",
	"baseball",
	"iloveyou",
	"trustno1",
	"sunshine",
	"princess",
	"football",
	"shadow",
	"superman",
	"michael",
	"letmein",
];

const COMMON_PATTERNS: RegExp[] = [
	/^(.)\1+$/,
	/^(012|123|234|345|456|567|678|789|890)+$/,
	/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i,
	/^(qwerty|asdfgh|zxcvbn)/i,
];

export default function PasswordStrengthChecker() {
	const [password, setPassword] = useState("");

	const calculateEntropy = useCallback((pwd: string): number => {
		if (!pwd) return 0;

		let charsetSize = 0;
		if (/[a-z]/.test(pwd)) charsetSize += 26;
		if (/[A-Z]/.test(pwd)) charsetSize += 26;
		if (/[0-9]/.test(pwd)) charsetSize += 10;
		if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 33;

		return Math.floor(pwd.length * Math.log2(charsetSize));
	}, []);

	const estimateCrackTime = useCallback((entropy: number): string => {
		const guessesPerSecond = 1e10;
		const seconds = 2 ** entropy / guessesPerSecond;

		if (seconds < 1) return "instant";
		if (seconds < 60) return `${Math.floor(seconds)} seconds`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
		if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`;
		if (seconds < 31536000 * 100) return `${Math.floor(seconds / 31536000)} years`;
		if (seconds < 31536000 * 1e6) return `${Math.floor(seconds / (31536000 * 1000))} millennia`;
		return "centuries+";
	}, []);

	const analyze = useCallback(
		(pwd: string): StrengthResult => {
			if (!pwd) {
				return {
					score: 0,
					label: "No password",
					color: "text-muted",
					entropy: 0,
					crackTime: "N/A",
					suggestions: [],
				};
			}

			const suggestions: string[] = [];
			let score = 0;

			// Length scoring
			if (pwd.length < 8) {
				suggestions.push("Use at least 8 characters");
				score += pwd.length * 2;
			} else if (pwd.length < 12) {
				score += 20;
				suggestions.push("Consider using 12+ characters for better security");
			} else if (pwd.length < 16) {
				score += 30;
			} else {
				score += 40;
			}

			// Character variety
			const hasLower = /[a-z]/.test(pwd);
			const hasUpper = /[A-Z]/.test(pwd);
			const hasDigit = /[0-9]/.test(pwd);
			const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

			const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
			score += variety * 10;

			if (!hasUpper) suggestions.push("Add uppercase letters");
			if (!hasLower) suggestions.push("Add lowercase letters");
			if (!hasDigit) suggestions.push("Add numbers");
			if (!hasSymbol) suggestions.push("Add symbols (!@#$%^&* etc.)");

			// Pattern penalties
			const isCommon = COMMON_PASSWORDS.includes(pwd.toLowerCase());
			if (isCommon) {
				score -= 40;
				suggestions.push("Avoid common passwords");
			}

			const hasPattern = COMMON_PATTERNS.some((p) => p.test(pwd));
			if (hasPattern) {
				score -= 15;
				suggestions.push("Avoid sequential or repeating patterns");
			}

			// Repeated characters
			const repeated = /(.)\1{2,}/.test(pwd);
			if (repeated) {
				score -= 10;
				suggestions.push("Avoid repeating characters");
			}

			// Entropy bonus
			const entropy = calculateEntropy(pwd);
			if (entropy > 60) score += 10;
			if (entropy > 80) score += 10;
			if (entropy > 100) score += 10;

			score = Math.max(0, Math.min(100, score));

			let label: string;
			let color: string;
			if (score < 25) {
				label = "Very Weak";
				color = "text-accent-rose";
			} else if (score < 50) {
				label = "Weak";
				color = "text-orange-500";
			} else if (score < 70) {
				label = "Fair";
				color = "text-yellow-500";
			} else if (score < 85) {
				label = "Strong";
				color = "text-accent-emerald";
			} else {
				label = "Very Strong";
				color = "text-primary";
			}

			return {
				score,
				label,
				color,
				entropy,
				crackTime: estimateCrackTime(entropy),
				suggestions,
			};
		},
		[calculateEntropy, estimateCrackTime, COMMON_PASSWORDS, COMMON_PATTERNS],
	);

	const result = useMemo(() => analyze(password), [password, analyze]);

	const scoreColor = useMemo(() => {
		if (result.score < 25) return "bg-accent-rose";
		if (result.score < 50) return "bg-orange-500";
		if (result.score < 70) return "bg-yellow-500";
		if (result.score < 85) return "bg-accent-emerald";
		return "bg-primary";
	}, [result.score]);

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Password to Check</label>
				<input
					type="text"
					class="input"
					placeholder="Enter a password to analyze..."
					value={password}
					onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
					style="font-family: var(--font-mono)"
				/>
			</div>

			{password && (
				<>
					<div class="bg-surface-elevated rounded-lg p-6 mb-6">
						<div class="flex items-center justify-between mb-4">
							<span class="text-title-lg">{result.label}</span>
							<span class={`text-title-lg ${result.color}`}>{result.score}/100</span>
						</div>
						<div class="h-3 bg-hairline rounded-full overflow-hidden mb-4">
							<div
								class={`h-full transition-all duration-300 ${scoreColor}`}
								style={{ width: `${result.score}%` }}
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<span class="text-caption-uppercase text-muted block mb-1">Entropy</span>
								<span class="text-body-strong">{result.entropy} bits</span>
							</div>
							<div>
								<span class="text-caption-uppercase text-muted block mb-1">Crack Time</span>
								<span class="text-body-strong">{result.crackTime}</span>
							</div>
						</div>
					</div>

					{result.suggestions.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-6">
							<span class="text-caption-uppercase text-muted block mb-3">Suggestions</span>
							<ul class="space-y-2">
								{result.suggestions.map((suggestion, _index) => (
									<li class="flex items-start gap-2">
										<span class="text-accent-rose mt-0.5">•</span>
										<span class="text-body-sm text-body">{suggestion}</span>
									</li>
								))}
							</ul>
						</div>
					)}

					<div class="mt-6 bg-surface-elevated rounded-lg p-6">
						<span class="text-caption-uppercase text-muted block mb-3">Character Breakdown</span>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div class="text-center">
								<span class="text-title-lg block">{password.length}</span>
								<span class="text-caption text-muted-soft">Length</span>
							</div>
							<div class="text-center">
								<span class="text-title-lg block">{(password.match(/[a-z]/g) || []).length}</span>
								<span class="text-caption text-muted-soft">Lowercase</span>
							</div>
							<div class="text-center">
								<span class="text-title-lg block">{(password.match(/[A-Z]/g) || []).length}</span>
								<span class="text-caption text-muted-soft">Uppercase</span>
							</div>
							<div class="text-center">
								<span class="text-title-lg block">
									{(password.match(/[^a-zA-Z0-9]/g) || []).length}
								</span>
								<span class="text-caption text-muted-soft">Symbols</span>
							</div>
						</div>
					</div>
				</>
			)}

			{!password && (
				<div class="bg-surface-elevated rounded-lg p-8 text-center">
					<span class="text-muted">Enter a password above to analyze its strength</span>
				</div>
			)}
		</div>
	);
}
