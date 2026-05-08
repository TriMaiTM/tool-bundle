import { useCallback, useMemo, useState } from "preact/hooks";

interface Rule {
	type: "Allow" | "Disallow";
	path: string;
}

interface UserAgentBlock {
	agent: string;
	rules: Rule[];
}

interface RobotsState {
	defaultAgent: string;
	defaultRules: Rule[];
	sitemap: string;
	crawlDelay: string;
	additionalAgents: UserAgentBlock[];
}

const defaultRules: Rule[] = [
	{ type: "Allow", path: "/" },
	{ type: "Disallow", path: "/admin" },
	{ type: "Disallow", path: "/private" },
];

const initial: RobotsState = {
	defaultAgent: "*",
	defaultRules,
	sitemap: "",
	crawlDelay: "",
	additionalAgents: [],
};

const PRESETS: Record<string, () => RobotsState> = {
	"Allow All": () => ({
		defaultAgent: "*",
		defaultRules: [{ type: "Allow", path: "/" }],
		sitemap: "",
		crawlDelay: "",
		additionalAgents: [],
	}),
	"Block All": () => ({
		defaultAgent: "*",
		defaultRules: [{ type: "Disallow", path: "/" }],
		sitemap: "",
		crawlDelay: "",
		additionalAgents: [],
	}),
	WordPress: () => ({
		defaultAgent: "*",
		defaultRules: [
			{ type: "Disallow", path: "/wp-admin/" },
			{ type: "Allow", path: "/wp-admin/admin-ajax.php" },
		],
		sitemap: "https://example.com/wp-sitemap.xml",
		crawlDelay: "",
		additionalAgents: [
			{
				agent: "Googlebot",
				rules: [
					{ type: "Disallow", path: "/wp-admin/" },
					{ type: "Allow", path: "/wp-admin/admin-ajax.php" },
				],
			},
		],
	}),
	"E-commerce": () => ({
		defaultAgent: "*",
		defaultRules: [
			{ type: "Disallow", path: "/cart" },
			{ type: "Disallow", path: "/checkout" },
			{ type: "Disallow", path: "/admin" },
			{ type: "Disallow", path: "/account" },
			{ type: "Disallow", path: "/search" },
		],
		sitemap: "https://example.com/sitemap.xml",
		crawlDelay: "",
		additionalAgents: [],
	}),
};

export default function RobotsTxtGenerator() {
	const [state, setState] = useState<RobotsState>(initial);
	const [newRulePath, setNewRulePath] = useState("");
	const [newRuleType, setNewRuleType] = useState<"Allow" | "Disallow">("Allow");
	const [newAgentName, setNewAgentName] = useState("");
	const [copied, setCopied] = useState(false);

	const addRule = useCallback(() => {
		if (!newRulePath.trim()) return;
		setState((s) => ({
			...s,
			defaultRules: [...s.defaultRules, { type: newRuleType, path: newRulePath.trim() }],
		}));
		setNewRulePath("");
	}, [newRulePath, newRuleType]);

	const removeRule = useCallback((index: number) => {
		setState((s) => ({
			...s,
			defaultRules: s.defaultRules.filter((_, i) => i !== index),
		}));
	}, []);

	const addAgent = useCallback(() => {
		if (!newAgentName.trim()) return;
		setState((s) => ({
			...s,
			additionalAgents: [
				...s.additionalAgents,
				{
					agent: newAgentName.trim(),
					rules: [{ type: "Disallow" as const, path: "/private" }],
				},
			],
		}));
		setNewAgentName("");
	}, [newAgentName]);

	const removeAgent = useCallback((index: number) => {
		setState((s) => ({
			...s,
			additionalAgents: s.additionalAgents.filter((_, i) => i !== index),
		}));
	}, []);

	const addAgentRule = useCallback((agentIndex: number) => {
		setState((s) => ({
			...s,
			additionalAgents: s.additionalAgents.map((a, i) =>
				i === agentIndex
					? {
							...a,
							rules: [...a.rules, { type: "Disallow" as const, path: "/" }],
						}
					: a,
			),
		}));
	}, []);

	const removeAgentRule = useCallback((agentIndex: number, ruleIndex: number) => {
		setState((s) => ({
			...s,
			additionalAgents: s.additionalAgents.map((a, i) =>
				i === agentIndex ? { ...a, rules: a.rules.filter((_, ri) => ri !== ruleIndex) } : a,
			),
		}));
	}, []);

	const updateAgentRule = useCallback(
		(agentIndex: number, ruleIndex: number, field: "type" | "path", value: string) => {
			setState((s) => ({
				...s,
				additionalAgents: s.additionalAgents.map((a, i) =>
					i === agentIndex
						? {
								...a,
								rules: a.rules.map((r, ri) => (ri === ruleIndex ? { ...r, [field]: value } : r)),
							}
						: a,
				),
			}));
		},
		[],
	);

	const applyPreset = useCallback((name: string) => {
		const preset = PRESETS[name];
		if (preset) setState(preset());
	}, []);

	const output = useMemo(() => {
		const lines: string[] = [];

		// Default user-agent block
		lines.push(`User-agent: ${state.defaultAgent}`);
		for (const rule of state.defaultRules) {
			lines.push(`${rule.type}: ${rule.path}`);
		}
		if (state.crawlDelay) {
			lines.push(`Crawl-delay: ${state.crawlDelay}`);
		}
		lines.push("");

		// Additional user-agent blocks
		for (const agent of state.additionalAgents) {
			lines.push(`User-agent: ${agent.agent}`);
			for (const rule of agent.rules) {
				lines.push(`${rule.type}: ${rule.path}`);
			}
			lines.push("");
		}

		// Sitemap
		if (state.sitemap) {
			lines.push(`Sitemap: ${state.sitemap}`);
		}

		return lines.join("\n").trim();
	}, [state]);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(output);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [output]);

	const handleDownload = useCallback(() => {
		const blob = new Blob([output], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "robots.txt";
		a.click();
		URL.revokeObjectURL(url);
	}, [output]);

	return (
		<div>
			{/* Presets */}
			<div class="flex flex-wrap items-center gap-2 mb-6">
				<label class="text-caption-uppercase text-muted mr-2">Presets</label>
				{Object.keys(PRESETS).map((name) => (
					<button
						key={name}
						class="btn-secondary text-body-sm"
						style="height: 32px; padding: 0 12px"
						onClick={() => applyPreset(name)}
					>
						{name}
					</button>
				))}
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: Builder */}
				<div>
					{/* Default Policy */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<label class="text-caption-uppercase text-muted block mb-3">Default Policy</label>
						<div class="flex items-center gap-3 mb-3">
							<label class="text-caption text-muted">User-agent:</label>
							<input
								class="input"
								type="text"
								style="flex: 1"
								value={state.defaultAgent}
								onInput={(e) =>
									setState((s) => ({
										...s,
										defaultAgent: (e.target as HTMLInputElement).value,
									}))
								}
							/>
						</div>

						<div class="space-y-2 mb-3">
							{state.defaultRules.map((rule, i) => (
								<div key={i} class="flex items-center gap-2">
									<span
										class={rule.type === "Allow" ? "badge" : "badge-yellow"}
										style="min-width: 70px; text-align: center; cursor: default"
									>
										{rule.type}
									</span>
									<code class="text-body-sm flex-1" style="font-family: var(--font-mono)">
										{rule.path}
									</code>
									<button
										class="text-body-sm text-accent-rose hover:text-accent-rose/80 transition-colors"
										onClick={() => removeRule(i)}
										style="padding: 4px 8px"
									>
										×
									</button>
								</div>
							))}
						</div>

						<div class="flex items-center gap-2">
							<select
								class="input"
								style="width: auto; height: 36px"
								value={newRuleType}
								onChange={(e) =>
									setNewRuleType((e.target as HTMLSelectElement).value as "Allow" | "Disallow")
								}
							>
								<option value="Allow">Allow</option>
								<option value="Disallow">Disallow</option>
							</select>
							<input
								class="input"
								type="text"
								style="flex: 1"
								placeholder="/path"
								value={newRulePath}
								onInput={(e) => setNewRulePath((e.target as HTMLInputElement).value)}
								onKeyDown={(e) => e.key === "Enter" && addRule()}
							/>
							<button
								class="btn-primary text-body-sm"
								style="height: 36px; padding: 0 14px"
								onClick={addRule}
							>
								Add
							</button>
						</div>
					</div>

					{/* Sitemap & Crawl Delay */}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">Sitemap URL</label>
							<input
								class="input"
								type="text"
								placeholder="https://example.com/sitemap.xml"
								value={state.sitemap}
								onInput={(e) =>
									setState((s) => ({
										...s,
										sitemap: (e.target as HTMLInputElement).value,
									}))
								}
							/>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								Crawl Delay (seconds)
							</label>
							<input
								class="input"
								type="number"
								placeholder="Optional"
								min="0"
								value={state.crawlDelay}
								onInput={(e) =>
									setState((s) => ({
										...s,
										crawlDelay: (e.target as HTMLInputElement).value,
									}))
								}
							/>
						</div>
					</div>

					{/* Additional User Agents */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<label class="text-caption-uppercase text-muted block mb-3">
							Additional User Agents
						</label>

						{state.additionalAgents.map((agent, ai) => (
							<div
								key={ai}
								class="mb-4 pb-4"
								style={
									ai < state.additionalAgents.length - 1
										? "border-bottom: 1px solid var(--color-hairline)"
										: ""
								}
							>
								<div class="flex items-center justify-between mb-2">
									<span class="badge badge-yellow">{agent.agent}</span>
									<button
										class="text-body-sm text-accent-rose"
										onClick={() => removeAgent(ai)}
										style="padding: 4px 8px"
									>
										Remove
									</button>
								</div>
								<div class="space-y-2 mb-2 ml-2">
									{agent.rules.map((rule, ri) => (
										<div key={ri} class="flex items-center gap-2">
											<select
												class="input"
												style="width: auto; height: 32px; font-size: 13px"
												value={rule.type}
												onChange={(e) =>
													updateAgentRule(ai, ri, "type", (e.target as HTMLSelectElement).value)
												}
											>
												<option value="Allow">Allow</option>
												<option value="Disallow">Disallow</option>
											</select>
											<input
												class="input"
												type="text"
												style="flex: 1; height: 32px; font-size: 13px"
												value={rule.path}
												onInput={(e) =>
													updateAgentRule(ai, ri, "path", (e.target as HTMLInputElement).value)
												}
											/>
											<button
												class="text-body-sm text-accent-rose"
												onClick={() => removeAgentRule(ai, ri)}
												style="padding: 4px 8px"
											>
												×
											</button>
										</div>
									))}
								</div>
								<button
									class="text-body-sm text-primary"
									onClick={() => addAgentRule(ai)}
									style="padding: 4px 0"
								>
									+ Add Rule
								</button>
							</div>
						))}

						<div class="flex items-center gap-2">
							<input
								class="input"
								type="text"
								style="flex: 1"
								placeholder="e.g. Googlebot, Bingbot"
								value={newAgentName}
								onInput={(e) => setNewAgentName((e.target as HTMLInputElement).value)}
								onKeyDown={(e) => e.key === "Enter" && addAgent()}
							/>
							<button
								class="btn-primary text-body-sm"
								style="height: 36px; padding: 0 14px"
								onClick={addAgent}
							>
								Add Agent
							</button>
						</div>
					</div>
				</div>

				{/* Right: Output */}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">robots.txt</label>
						<div class="flex items-center gap-2">
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleDownload}
							>
								Download
							</button>
						</div>
					</div>
					<pre class="code-block" style="min-height: 400px; white-space: pre-wrap; font-size: 13px">
						{output}
					</pre>
				</div>
			</div>
		</div>
	);
}
