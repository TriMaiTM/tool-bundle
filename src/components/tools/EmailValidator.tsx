import { useCallback, useState } from "preact/hooks";

const DISPOSABLE_DOMAINS = [
	"mailinator.com",
	"guerrillamail.com",
	"tempmail.com",
	"throwaway.email",
	"yopmail.com",
	"sharklasers.com",
	"guerrillamailblock.com",
	"grr.la",
	"dispostable.com",
	"mailnesia.com",
	"maildrop.cc",
	"trashmail.com",
	"fakeinbox.com",
	"temp-mail.org",
	"10minutemail.com",
	"getnada.com",
];

const ROLE_PREFIXES = [
	"admin",
	"info",
	"support",
	"sales",
	"help",
	"contact",
	"office",
	"hr",
	"marketing",
	"billing",
	"abuse",
	"postmaster",
	"webmaster",
	"noreply",
	"no-reply",
	"team",
	"staff",
	"dev",
	"ops",
];

interface EmailResult {
	email: string;
	isValidFormat: boolean;
	hasDomain: boolean;
	isDisposable: boolean;
	isRoleBased: boolean;
	overallValid: boolean;
}

const EMAIL_REGEX =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmail(email: string): EmailResult {
	const trimmed = email.trim().toLowerCase();
	const isValidFormat = EMAIL_REGEX.test(trimmed);

	let hasDomain = false;
	let isDisposable = false;
	let isRoleBased = false;

	if (isValidFormat) {
		const parts = trimmed.split("@");
		const domain = parts[1];
		hasDomain = domain.includes(".") && domain.split(".").pop()!.length >= 2;
		isDisposable = DISPOSABLE_DOMAINS.includes(domain);
		const localPart = parts[0];
		isRoleBased = ROLE_PREFIXES.some((prefix) => localPart === prefix);
	}

	return {
		email: trimmed,
		isValidFormat,
		hasDomain,
		isDisposable,
		isRoleBased,
		overallValid: isValidFormat && hasDomain && !isDisposable,
	};
}

export default function EmailValidator() {
	const [input, setInput] = useState("");
	const [results, setResults] = useState<EmailResult[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const validate = useCallback(() => {
		const lines = input.split("\n").filter((line) => line.trim().length > 0);
		const validated = lines.map(validateEmail);
		setResults(validated);
	}, [input]);

	const handleCopy = useCallback(async (email: string, index: number) => {
		await navigator.clipboard.writeText(email);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	}, []);

	const handleExportValid = useCallback(async () => {
		const validEmails = results.filter((r) => r.overallValid).map((r) => r.email);
		if (validEmails.length > 0) {
			await navigator.clipboard.writeText(validEmails.join("\n"));
			setCopiedIndex(-1);
			setTimeout(() => setCopiedIndex(null), 1500);
		}
	}, [results]);

	const stats = {
		total: results.length,
		valid: results.filter((r) => r.overallValid).length,
		invalid: results.filter((r) => !r.overallValid).length,
		disposable: results.filter((r) => r.isDisposable).length,
		roleBased: results.filter((r) => r.isRoleBased).length,
	};

	return (
		<div>
			<div>
				<label class="text-caption-uppercase text-muted block mb-2">
					Email Addresses (one per line)
				</label>
				<textarea
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					class="textarea w-full"
					rows={6}
					placeholder={"user@example.com\ntest@mailinator.com\nadmin@company.org"}
				/>
			</div>

			<div class="mt-4">
				<button class="btn-primary" onClick={validate}>
					Validate Emails
				</button>
			</div>

			{results.length > 0 && (
				<div class="mt-6">
					<div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-body-lg text-yellow-500">{stats.disposable}</div>
							<div class="text-caption-uppercase text-muted">Disposable</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-body-lg text-primary">{stats.roleBased}</div>
							<div class="text-caption-uppercase text-muted">Role-Based</div>
						</div>
					</div>

					<div class="flex items-center justify-between mb-3">
						<label class="text-caption-uppercase text-muted">Results</label>
						<button class="btn-secondary text-body-sm" onClick={handleExportValid}>
							{copiedIndex === -1 ? "Copied!" : "Export Valid Emails"}
						</button>
					</div>

					<div class="space-y-2">
						{results.map((result, index) => (
							<div class="bg-surface-elevated rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
										{result.email}
									</code>
									<button
										class="text-body-sm text-primary hover:text-primary-active transition-colors"
										onClick={() => handleCopy(result.email, index)}
									>
										{copiedIndex === index ? "Copied!" : "Copy"}
									</button>
								</div>
								<div class="flex flex-wrap gap-2">
									<span
										class={`badge ${result.isValidFormat ? "text-accent-emerald" : "text-accent-rose"}`}
									>
										{result.isValidFormat ? "Valid Format" : "Invalid Format"}
									</span>
									<span
										class={`badge ${result.hasDomain ? "text-accent-emerald" : "text-accent-rose"}`}
									>
										{result.hasDomain ? "Valid Domain" : "Invalid Domain"}
									</span>
									{result.isDisposable && <span class="badge text-yellow-500">Disposable</span>}
									{result.isRoleBased && <span class="badge text-primary">Role-Based</span>}
									<span
										class={`badge ${result.overallValid ? "text-accent-emerald" : "text-accent-rose"}`}
									>
										{result.overallValid ? "Valid" : "Invalid"}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{results.length === 0 && (
				<div class="text-center py-12 text-muted">
					Enter email addresses (one per line) and click "Validate Emails".
				</div>
			)}
		</div>
	);
}
