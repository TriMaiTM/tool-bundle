import { useCallback, useMemo, useState } from "preact/hooks";

type InputMode = "manual" | "bulk";
type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
	id: string;
	url: string;
	priority: string;
	changefreq: ChangeFreq;
	lastmod: string;
}

let nextId = 1;
function newId(): string {
	return String(nextId++);
}

function createEntry(url = ""): SitemapEntry {
	return {
		id: newId(),
		url,
		priority: "0.5",
		changefreq: "monthly",
		lastmod: "",
	};
}

const PRIORITIES = ["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"];
const CHANGE_FREQS: ChangeFreq[] = [
	"always",
	"hourly",
	"daily",
	"weekly",
	"monthly",
	"yearly",
	"never",
];

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export default function SitemapGenerator() {
	const [entries, setEntries] = useState<SitemapEntry[]>([createEntry("https://example.com/")]);
	const [mode, setMode] = useState<InputMode>("manual");
	const [bulkText, setBulkText] = useState("");
	const [copied, setCopied] = useState(false);

	// Manual entry form
	const [newUrl, setNewUrl] = useState("");
	const [newPriority, setNewPriority] = useState("0.5");
	const [newChangefreq, setNewChangefreq] = useState<ChangeFreq>("monthly");
	const [newLastmod, setNewLastmod] = useState("");

	const addEntry = useCallback(() => {
		if (!newUrl.trim()) return;
		setEntries((prev) => [
			...prev,
			{
				id: newId(),
				url: newUrl.trim(),
				priority: newPriority,
				changefreq: newChangefreq,
				lastmod: newLastmod,
			},
		]);
		setNewUrl("");
		setNewLastmod("");
	}, [newUrl, newPriority, newChangefreq, newLastmod]);

	const removeEntry = useCallback((id: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== id));
	}, []);

	const _updateEntry = useCallback((id: string, field: keyof SitemapEntry, value: string) => {
		setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
	}, []);

	const parseBulk = useCallback(() => {
		const urls = bulkText
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
		setEntries((prev) => [...prev, ...urls.map((url) => createEntry(url))]);
		setBulkText("");
	}, [bulkText]);

	const xml = useMemo(() => {
		if (entries.length === 0) return "";
		const lines: string[] = [
			`<?xml version="1.0" encoding="UTF-8"?>`,
			`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		];
		for (const entry of entries) {
			if (!entry.url) continue;
			lines.push("  <url>");
			lines.push(`    <loc>${escapeXml(entry.url)}</loc>`);
			if (entry.lastmod) lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
			lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
			lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
			lines.push("  </url>");
		}
		lines.push("</urlset>");
		return lines.join("\n");
	}, [entries]);

	const stats = useMemo(() => {
		const size = new Blob([xml]).size;
		return { count: entries.length, size };
	}, [xml, entries.length]);

	const handleCopy = useCallback(async () => {
		if (!xml) return;
		await navigator.clipboard.writeText(xml);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [xml]);

	const handleDownload = useCallback(() => {
		if (!xml) return;
		const blob = new Blob([xml], { type: "application/xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sitemap.xml";
		a.click();
		URL.revokeObjectURL(url);
	}, [xml]);

	return (
		<div>
			{/* Mode Tabs */}
			<div class="flex flex-wrap items-center gap-3 mb-6">
				<div class="flex rounded-md overflow-hidden border border-hairline">
					<button
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "manual" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("manual")}
					>
						Manual Entry
					</button>
					<button
						class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "bulk" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
						onClick={() => setMode("bulk")}
					>
						Bulk Entry
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: Input */}
				<div>
					{mode === "manual" ? (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<label class="text-caption-uppercase text-muted block mb-3">Add URL</label>
							<div class="space-y-3 mb-3">
								<div>
									<label class="text-caption text-muted block mb-1">URL</label>
									<input
										class="input"
										type="text"
										placeholder="https://example.com/page"
										value={newUrl}
										onInput={(e) => setNewUrl((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="grid grid-cols-3 gap-2">
									<div>
										<label class="text-caption text-muted block mb-1">Priority</label>
										<select
											class="input"
											value={newPriority}
											onChange={(e) => setNewPriority((e.target as HTMLSelectElement).value)}
										>
											{PRIORITIES.map((p) => (
												<option key={p} value={p}>
													{p}
												</option>
											))}
										</select>
									</div>
									<div>
										<label class="text-caption text-muted block mb-1">Change Freq</label>
										<select
											class="input"
											value={newChangefreq}
											onChange={(e) =>
												setNewChangefreq((e.target as HTMLSelectElement).value as ChangeFreq)
											}
										>
											{CHANGE_FREQS.map((f) => (
												<option key={f} value={f}>
													{f}
												</option>
											))}
										</select>
									</div>
									<div>
										<label class="text-caption text-muted block mb-1">Last Modified</label>
										<input
											class="input"
											type="date"
											value={newLastmod}
											onInput={(e) => setNewLastmod((e.target as HTMLInputElement).value)}
										/>
									</div>
								</div>
							</div>
							<button
								class="btn-primary text-body-sm"
								style="height: 36px; padding: 0 16px"
								onClick={addEntry}
							>
								Add URL
							</button>
						</div>
					) : (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-2">
								Paste URLs (one per line)
							</label>
							<textarea
								class="textarea"
								style="min-height: 160px; font-family: var(--font-mono); font-size: 13px"
								placeholder={
									"https://example.com/\nhttps://example.com/about\nhttps://example.com/contact"
								}
								value={bulkText}
								onInput={(e) => setBulkText((e.target as HTMLTextAreaElement).value)}
							/>
							<button
								class="btn-primary text-body-sm mt-3"
								style="height: 36px; padding: 0 16px"
								onClick={parseBulk}
							>
								Parse URLs
							</button>
						</div>
					)}

					{/* URL List */}
					{entries.length > 0 && (
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								URLs ({entries.length})
							</label>
							<div class="space-y-2" style="max-height: 320px; overflow-y: auto">
								{entries.map((entry) => (
									<div
										key={entry.id}
										class="flex items-center gap-2 bg-surface-elevated rounded-lg p-3"
									>
										<div class="flex-1 min-w-0">
											<div
												class="text-body-sm truncate"
												style="font-family: var(--font-mono); font-size: 12px"
											>
												{entry.url}
											</div>
											<div class="flex items-center gap-3 mt-1">
												<span class="text-caption text-muted">P: {entry.priority}</span>
												<span class="text-caption text-muted">Freq: {entry.changefreq}</span>
												{entry.lastmod && (
													<span class="text-caption text-muted">Mod: {entry.lastmod}</span>
												)}
											</div>
										</div>
										<button
											class="text-body-sm text-accent-rose"
											style="padding: 4px 8px"
											onClick={() => removeEntry(entry.id)}
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right: Output */}
				<div>
					{/* Stats */}
					<div class="flex gap-3 mb-4">
						<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
							<div class="text-title-lg text-primary">{stats.count}</div>
							<div class="text-caption-uppercase text-muted">URLs</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
							<div class="text-title-lg text-primary">
								{stats.size < 1024 ? `${stats.size} B` : `${(stats.size / 1024).toFixed(1)} KB`}
							</div>
							<div class="text-caption-uppercase text-muted">File Size</div>
						</div>
					</div>

					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Generated XML</label>
						<div class="flex items-center gap-3">
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
					<pre class="code-block" style="min-height: 400px; white-space: pre-wrap; font-size: 12px">
						{xml || "<!-- Add URLs to generate sitemap -->"}
					</pre>
				</div>
			</div>
		</div>
	);
}
