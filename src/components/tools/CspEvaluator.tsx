import { useCallback, useMemo, useState } from "preact/hooks";

interface DirectiveInfo {
	name: string;
	values: string[];
	line: number;
}

interface Issue {
	severity: "critical" | "warning" | "info";
	directive: string;
	message: string;
}

const KNOWN_DIRECTIVES = [
	"default-src",
	"script-src",
	"style-src",
	"img-src",
	"font-src",
	"connect-src",
	"media-src",
	"object-src",
	"frame-src",
	"frame-ancestors",
	"base-uri",
	"form-action",
	"worker-src",
	"manifest-src",
	"prefetch-src",
	"child-src",
	"navigate-to",
	"report-uri",
	"report-to",
	"require-sri-for",
	"require-trusted-types-for",
	"sandbox",
	"trusted-types",
	"upgrade-insecure-requests",
	"block-all-mixed-content",
	"plugin-types",
];

const SAMPLE_POLICIES: { label: string; policy: string }[] = [
	{
		label: "Strict (Recommended)",
		policy:
			"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
	},
	{
		label: "Basic",
		policy:
			"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'",
	},
	{
		label: "Insecure (Example)",
		policy:
			"default-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src * data: blob:; object-src *",
	},
];

function parseCsp(header: string): DirectiveInfo[] {
	const directives: DirectiveInfo[] = [];
	const parts = header
		.split(";")
		.map((s) => s.trim())
		.filter(Boolean);

	for (let i = 0; i < parts.length; i++) {
		const tokens = parts[i].split(/\s+/);
		if (tokens.length === 0) continue;

		const name = tokens[0].toLowerCase();
		const values = tokens.slice(1);

		directives.push({
			name,
			values,
			line: i + 1,
		});
	}

	return directives;
}

function analyzeDirectives(directives: DirectiveInfo[]): Issue[] {
	const issues: Issue[] = [];
	const directiveNames = new Set(directives.map((d) => d.name));

	// Check for unsafe values
	for (const dir of directives) {
		for (const val of dir.values) {
			if (val === "'unsafe-inline'") {
				issues.push({
					severity: dir.name === "script-src" ? "critical" : "warning",
					directive: dir.name,
					message: `'unsafe-inline' in ${dir.name} allows inline scripts/styles, which weakens XSS protection.`,
				});
			}
			if (val === "'unsafe-eval'") {
				issues.push({
					severity: "critical",
					directive: dir.name,
					message: `'unsafe-eval' in ${dir.name} allows eval() and similar, which is a major XSS risk.`,
				});
			}
			if (val === "data:") {
				issues.push({
					severity: dir.name === "script-src" ? "critical" : "warning",
					directive: dir.name,
					message: `data: URI in ${dir.name} can be used to inject content.`,
				});
			}
			if (val === "*") {
				issues.push({
					severity: "critical",
					directive: dir.name,
					message: `Wildcard (*) in ${dir.name} allows loading from any origin, effectively disabling CSP.`,
				});
			}
			if (val.includes("http:")) {
				issues.push({
					severity: "warning",
					directive: dir.name,
					message: `HTTP origin in ${dir.name} allows insecure (non-HTTPS) resources.`,
				});
			}
		}
	}

	// Check for object-src
	if (!directiveNames.has("object-src")) {
		const defaultSrc = directives.find((d) => d.name === "default-src");
		if (!defaultSrc || defaultSrc.values.includes("*")) {
			issues.push({
				severity: "warning",
				directive: "object-src",
				message:
					"Missing object-src directive. Plugins (Flash, Java) may load without restriction.",
			});
		}
	}

	// Check for base-uri
	if (!directiveNames.has("base-uri")) {
		issues.push({
			severity: "warning",
			directive: "base-uri",
			message:
				"Missing base-uri directive. Attackers can inject <base> tags to redirect relative URLs.",
		});
	}

	// Check for form-action
	if (!directiveNames.has("form-action")) {
		issues.push({
			severity: "info",
			directive: "form-action",
			message: "Missing form-action directive. Forms can submit to any URL.",
		});
	}

	// Check for frame-ancestors
	if (!directiveNames.has("frame-ancestors")) {
		issues.push({
			severity: "warning",
			directive: "frame-ancestors",
			message:
				"Missing frame-ancestors directive. The page can be embedded in iframes (clickjacking risk).",
		});
	}

	// Check for upgrade-insecure-requests
	if (
		!directiveNames.has("upgrade-insecure-requests") &&
		!directiveNames.has("block-all-mixed-content")
	) {
		issues.push({
			severity: "info",
			directive: "upgrade-insecure-requests",
			message: "Consider adding upgrade-insecure-requests to auto-upgrade HTTP to HTTPS.",
		});
	}

	// Check if script-src is missing (falls back to default-src)
	if (!directiveNames.has("script-src")) {
		issues.push({
			severity: "info",
			directive: "script-src",
			message:
				"No explicit script-src — it falls back to default-src. Consider setting script-src explicitly for stricter control.",
		});
	}

	return issues;
}

function calculateScore(directives: DirectiveInfo[], issues: Issue[]): number {
	let score = 100;

	for (const issue of issues) {
		if (issue.severity === "critical") score -= 20;
		else if (issue.severity === "warning") score -= 10;
		else score -= 3;
	}

	// Bonus for having key directives
	const directiveNames = new Set(directives.map((d) => d.name));
	if (directiveNames.has("default-src")) score += 5;
	if (directiveNames.has("script-src")) score += 5;
	if (directiveNames.has("frame-ancestors")) score += 5;
	if (directiveNames.has("base-uri")) score += 5;
	if (directiveNames.has("form-action")) score += 5;

	return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): string {
	if (score >= 80) return "var(--color-success)";
	if (score >= 50) return "var(--color-warning, #f59e0b)";
	return "var(--color-error)";
}

function getSeverityColor(severity: string): string {
	if (severity === "critical") return "var(--color-error)";
	if (severity === "warning") return "var(--color-warning, #f59e0b)";
	return "var(--color-info, #3b82f6)";
}

export default function CspEvaluator() {
	const [cspInput, setCspInput] = useState("");
	const [copiedIssues, setCopiedIssues] = useState(false);

	const directives = useMemo(() => parseCsp(cspInput), [cspInput]);
	const issues = useMemo(() => analyzeDirectives(directives), [directives]);
	const score = useMemo(() => calculateScore(directives, issues), [directives, issues]);

	const criticalCount = issues.filter((i) => i.severity === "critical").length;
	const warningCount = issues.filter((i) => i.severity === "warning").length;
	const infoCount = issues.filter((i) => i.severity === "info").length;

	const handleLoadSample = useCallback((policy: string) => {
		setCspInput(policy);
	}, []);

	const handleCopyIssues = useCallback(async () => {
		if (!issues.length) return;
		const text = issues
			.map((i) => `[${i.severity.toUpperCase()}] ${i.directive}: ${i.message}`)
			.join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopiedIssues(true);
		setTimeout(() => setCopiedIssues(false), 1500);
	}, [issues]);

	const handleCopyDirectives = useCallback(async () => {
		if (!directives.length) return;
		const json = JSON.stringify(
			directives.map((d) => ({ directive: d.name, values: d.values })),
			null,
			2,
		);
		try {
			await navigator.clipboard.writeText(json);
		} catch {
			/* ignore */
		}
	}, [directives]);

	return (
		<div>
			<div class="mb-6">
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">CSP Header</label>
					<button
						class="text-body-sm text-primary hover:text-primary-active transition-colors"
						onClick={handleCopyDirectives}
					>
						Copy Parsed
					</button>
				</div>
				<textarea
					class="textarea"
					style="min-height: 120px; font-family: var(--font-mono); font-size: 13px"
					placeholder="Paste your Content-Security-Policy header here..."
					value={cspInput}
					onInput={(e) => setCspInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Sample Policies</label>
				<div class="flex flex-wrap gap-2">
					{SAMPLE_POLICIES.map((s) => (
						<button
							key={s.label}
							class="btn-secondary text-body-sm"
							onClick={() => handleLoadSample(s.policy)}
						>
							{s.label}
						</button>
					))}
				</div>
			</div>

			{cspInput.trim() && directives.length > 0 && (
				<div class="space-y-4">
					{/* Score */}
					<div class="card p-6 text-center">
						<div
							class="text-body-strong"
							style={{
								fontSize: "2.5rem",
								color: getScoreColor(score),
							}}
						>
							{score}
						</div>
						<div class="text-caption-uppercase text-muted mt-1">Security Score</div>
						<div class="flex justify-center gap-4 mt-3">
							{criticalCount > 0 && (
								<span
									class="badge"
									style="background: var(--color-error); color: var(--color-on-error)"
								>
									{criticalCount} Critical
								</span>
							)}
							{warningCount > 0 && (
								<span class="badge" style="background: var(--color-warning, #f59e0b); color: #fff">
									{warningCount} Warning{warningCount !== 1 ? "s" : ""}
								</span>
							)}
							{infoCount > 0 && (
								<span class="badge" style="background: var(--color-info, #3b82f6); color: #fff">
									{infoCount} Info
								</span>
							)}
						</div>
					</div>

					{/* Issues */}
					{issues.length > 0 && (
						<div class="card p-6">
							<div class="flex items-center justify-between mb-4">
								<label class="text-caption-uppercase text-muted">
									Issues Found ({issues.length})
								</label>
								<button
									class="text-body-sm text-primary hover:text-primary-active transition-colors"
									onClick={handleCopyIssues}
								>
									{copiedIssues ? "Copied!" : "Copy Issues"}
								</button>
							</div>
							<div class="space-y-3">
								{issues.map((issue, i) => (
									<div
										key={`${issue.directive}-${i}`}
										class="p-3 rounded-lg"
										style={{
											borderLeft: `3px solid ${getSeverityColor(issue.severity)}`,
											background: "var(--color-surface-elevated)",
										}}
									>
										<div class="flex items-center gap-2 mb-1">
											<span
												class="badge text-body-sm"
												style={{
													background: getSeverityColor(issue.severity),
													color: "#fff",
												}}
											>
												{issue.severity.toUpperCase()}
											</span>
											<span class="text-body-sm font-mono" style="font-family: var(--font-mono)">
												{issue.directive}
											</span>
										</div>
										<p class="text-body-sm text-muted">{issue.message}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Parsed Directives */}
					<div class="card p-6">
						<label class="text-caption-uppercase text-muted block mb-4">
							Parsed Directives ({directives.length})
						</label>
						<div style="overflow-x: auto">
							<table style="width: 100%; border-collapse: collapse">
								<thead>
									<tr>
										<th
											class="text-caption-uppercase text-muted text-left"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
										>
											Directive
										</th>
										<th
											class="text-caption-uppercase text-muted text-left"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
										>
											Values
										</th>
									</tr>
								</thead>
								<tbody>
									{directives.map((dir) => {
										const isUnknown = !KNOWN_DIRECTIVES.includes(dir.name);
										return (
											<tr key={dir.name} style={isUnknown ? "opacity: 0.6" : ""}>
												<td
													class="text-body-sm font-mono"
													style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline); font-family: var(--font-mono)"
												>
													{dir.name}
													{isUnknown && (
														<span
															class="badge ml-2"
															style="background: var(--color-warning, #f59e0b); color: #fff"
														>
															Unknown
														</span>
													)}
												</td>
												<td
													class="text-body-sm"
													style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
												>
													<div class="flex flex-wrap gap-1">
														{dir.values.map((val) => {
															const isUnsafe =
																val === "'unsafe-inline'" ||
																val === "'unsafe-eval'" ||
																val === "*" ||
																val === "data:";
															return (
																<span
																	key={val}
																	class="badge text-body-sm"
																	style={
																		isUnsafe
																			? "background: var(--color-error); color: var(--color-on-error)"
																			: ""
																	}
																>
																	{val}
																</span>
															);
														})}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{/* Best Practices */}
					<div class="card p-5">
						<label class="text-caption-uppercase text-muted block mb-3">
							Best Practices Checklist
						</label>
						<ul class="space-y-2 text-body-sm" style="list-style: none; padding: 0">
							{[
								{
									check: directives.some((d) => d.name === "default-src"),
									text: "Define a default-src directive",
								},
								{
									check: directives.some((d) => d.name === "script-src"),
									text: "Set explicit script-src (don't rely on default-src)",
								},
								{
									check:
										!directives.some((d) => d.values.includes("'unsafe-inline'")) ||
										directives.some(
											(d) =>
												d.values.includes("'unsafe-inline'") &&
												d.values.some(
													(v) =>
														v.startsWith("'nonce-") ||
														v.startsWith("'sha256-") ||
														v.startsWith("'sha384-") ||
														v.startsWith("'sha512-"),
												),
										),
									text: "Avoid 'unsafe-inline' (or use nonces/hashes)",
								},
								{
									check: !directives.some((d) => d.values.includes("'unsafe-eval'")),
									text: "Avoid 'unsafe-eval'",
								},
								{
									check: !directives.some((d) => d.values.includes("*")),
									text: "Avoid wildcards (*)",
								},
								{
									check: directives.some((d) => d.name === "frame-ancestors"),
									text: "Set frame-ancestors to prevent clickjacking",
								},
								{
									check: directives.some((d) => d.name === "base-uri"),
									text: "Set base-uri to prevent base tag injection",
								},
								{
									check: directives.some((d) => d.name === "form-action"),
									text: "Set form-action to control form submissions",
								},
								{
									check: directives.some((d) => d.name === "upgrade-insecure-requests"),
									text: "Add upgrade-insecure-requests",
								},
							].map((item, i) => (
								<li key={i} class="flex items-center gap-2">
									<span
										style={{
											color: item.check ? "var(--color-success)" : "var(--color-error)",
										}}
									>
										{item.check ? "✓" : "✗"}
									</span>
									<span
										style={{
											color: item.check ? "var(--color-text)" : "var(--color-text-muted)",
										}}
									>
										{item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
