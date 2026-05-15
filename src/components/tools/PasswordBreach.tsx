import { useCallback, useState } from "preact/hooks";

async function sha1(message: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-1", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
		.toUpperCase();
}

export default function PasswordBreach() {
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [breachCount, setBreachCount] = useState<number | null>(null);
	const [checked, setChecked] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [hashPrefix, setHashPrefix] = useState("");
	const [hashSuffix, setHashSuffix] = useState("");

	const checkBreach = useCallback(async () => {
		if (!password) {
			setError("Please enter a password");
			return;
		}

		setLoading(true);
		setError("");
		setChecked(false);
		setBreachCount(null);

		try {
			const fullHash = await sha1(password);
			const prefix = fullHash.slice(0, 5);
			const suffix = fullHash.slice(5);

			setHashPrefix(prefix);
			setHashSuffix(suffix);

			const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
			if (!res.ok) throw new Error(`API error (${res.status})`);

			const text = await res.text();
			const lines = text.split("\n");

			let found = 0;
			for (const line of lines) {
				const [hashSuffixFromApi, countStr] = line.split(":");
				if (hashSuffixFromApi?.trim().toUpperCase() === suffix) {
					found = Number.parseInt(countStr?.trim() || "0", 10);
					break;
				}
			}

			setBreachCount(found);
			setChecked(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, [password]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter") checkBreach();
		},
		[checkBreach],
	);

	const isBreached = checked && breachCount !== null && breachCount > 0;

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Enter Password to Check</label>
				<div class="flex gap-2">
					<div class="relative flex-1">
						<input
							type={showPassword ? "text" : "password"}
							class="input"
							style="padding-right: 44px"
							placeholder="Enter a password..."
							value={password}
							onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
							onKeyDown={handleKeyDown}
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 -translate-y-1/2 text-body-sm text-muted hover:text-primary transition-colors"
							style="background: none; border: none; cursor: pointer; padding: 4px 8px"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? "Hide" : "Show"}
						</button>
					</div>
					<button class="btn-primary" onClick={checkBreach} disabled={loading}>
						{loading ? "Checking..." : "Check"}
					</button>
				</div>
				<p class="text-body-sm text-muted mt-1">
					Your password is never sent to any server. Only a partial SHA-1 hash prefix is shared
					using k-anonymity.
				</p>
			</div>

			{error && (
				<div class="card p-4 mb-4" style="border-left: 3px solid var(--color-error)">
					<p class="text-body-sm" style="color: var(--color-error)">
						{error}
					</p>
				</div>
			)}

			{loading && (
				<div class="flex items-center justify-center py-12">
					<div class="flex flex-col items-center gap-3">
						<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<span class="text-caption text-muted">Checking breach databases...</span>
					</div>
				</div>
			)}

			{checked && (
				<div class="space-y-4">
					<div
						class="card p-6"
						style={{
							borderLeft: `4px solid ${isBreached ? "var(--color-error)" : "var(--color-success)"}`,
						}}
					>
						<div class="flex items-center gap-3 mb-3">
							<span
								class="text-body-strong"
								style={{
									color: isBreached ? "var(--color-error)" : "var(--color-success)",
									fontSize: "1.25rem",
								}}
							>
								{isBreached ? "⚠ Password Breached!" : "✓ Password Not Found"}
							</span>
						</div>

						{isBreached ? (
							<div class="space-y-2">
								<p class="text-body">
									This password has been seen{" "}
									<strong style="color: var(--color-error)">{breachCount?.toLocaleString()}</strong>{" "}
									time{breachCount !== 1 ? "s" : ""} in data breaches.
								</p>
								<p class="text-body-sm text-muted">
									<strong>Recommendation:</strong> Do not use this password. It is compromised and
									easily discoverable by attackers. Choose a unique, strong password that hasn't
									appeared in any breach.
								</p>
							</div>
						) : (
							<div class="space-y-2">
								<p class="text-body">This password was not found in any known data breaches.</p>
								<p class="text-body-sm text-muted">
									<strong>Note:</strong> This doesn't guarantee the password is strong. Make sure
									it's long, unique, and uses a mix of character types.
								</p>
							</div>
						)}
					</div>

					<div class="card p-5">
						<label class="text-caption-uppercase text-muted block mb-3">Technical Details</label>
						<div class="space-y-2">
							<div class="flex items-start gap-3">
								<span class="text-caption-uppercase text-muted" style="min-width: 120px">
									SHA-1 Prefix
								</span>
								<span class="text-body-sm font-mono" style="font-family: var(--font-mono)">
									{hashPrefix}
								</span>
							</div>
							<div class="flex items-start gap-3">
								<span class="text-caption-uppercase text-muted" style="min-width: 120px">
									SHA-1 Suffix
								</span>
								<span class="text-body-sm font-mono" style="font-family: var(--font-mono)">
									{hashSuffix}
								</span>
							</div>
							<div class="flex items-start gap-3">
								<span class="text-caption-uppercase text-muted" style="min-width: 120px">
									Breach Count
								</span>
								<span class="text-body-sm font-medium">{breachCount?.toLocaleString() ?? "0"}</span>
							</div>
						</div>
					</div>

					<div class="card p-5">
						<label class="text-caption-uppercase text-muted block mb-3">
							How K-Anonymity Works
						</label>
						<div class="space-y-3 text-body-sm">
							<p>
								This tool uses the <strong>Have I Been Pwned</strong> API with k-anonymity to
								protect your password privacy:
							</p>
							<ol style="list-style: decimal; padding-left: 20px" class="space-y-1">
								<li>Your password is hashed locally using SHA-1</li>
								<li>
									Only the <strong>first 5 characters</strong> of the hash are sent to the API
								</li>
								<li>The API returns all hash suffixes that match that prefix</li>
								<li>Your browser checks if the full hash appears in the results</li>
							</ol>
							<p>
								At no point is your actual password or full hash transmitted over the network. The
								server never knows which password you checked.
							</p>
						</div>
					</div>

					<div class="card p-5">
						<label class="text-caption-uppercase text-muted block mb-3">
							Password Security Tips
						</label>
						<ul class="space-y-2 text-body-sm" style="list-style: disc; padding-left: 20px">
							<li>Use at least 12-16 characters</li>
							<li>Mix uppercase, lowercase, numbers, and symbols</li>
							<li>Never reuse passwords across different accounts</li>
							<li>Use a password manager to generate and store unique passwords</li>
							<li>Enable two-factor authentication (2FA) wherever possible</li>
							<li>Check your passwords against breach databases regularly</li>
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
