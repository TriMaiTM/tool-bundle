import { useCallback, useState } from "preact/hooks";

type RecordType = "A" | "AAAA" | "MX" | "NS" | "TXT" | "CNAME" | "SOA" | "CAA";

const RECORD_TYPES: RecordType[] = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "CAA"];

interface DnsAnswer {
	name: string;
	type: number;
	TTL: number;
	data: string;
}

interface DnsResponse {
	Status: number;
	TC: boolean;
	RD: boolean;
	RA: boolean;
	AD: boolean;
	CD: boolean;
	Question: { name: string; type: number }[];
	Answer?: DnsAnswer[];
	Authority?: DnsAnswer[];
	Comment?: string;
}

const RECORD_TYPE_NAMES: Record<number, string> = {
	1: "A",
	28: "AAAA",
	15: "MX",
	2: "NS",
	16: "TXT",
	5: "CNAME",
	6: "SOA",
	257: "CAA",
};

function getRecordTypeName(type: number): string {
	return RECORD_TYPE_NAMES[type] || `TYPE${type}`;
}

export default function DnsLookup() {
	const [domain, setDomain] = useState("");
	const [recordType, setRecordType] = useState<RecordType>("A");
	const [results, setResults] = useState<DnsAnswer[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);
	const [responseData, setResponseData] = useState<DnsResponse | null>(null);

	const lookup = useCallback(async () => {
		if (!domain.trim()) {
			setError("Please enter a domain name");
			return;
		}

		setLoading(true);
		setError("");
		setResults([]);
		setResponseData(null);

		try {
			const cleanDomain = domain
				.trim()
				.replace(/^https?:\/\//, "")
				.replace(/\/.*$/, "");
			const url = `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=${recordType}`;
			const res = await fetch(url);

			if (!res.ok) throw new Error(`DNS query failed (${res.status})`);
			const data: DnsResponse = await res.json();

			setResponseData(data);

			if (data.Status !== 0) {
				const statusMessages: Record<number, string> = {
					1: "Format error",
					2: "Server failure",
					3: "Non-existent domain (NXDOMAIN)",
					4: "Not implemented",
					5: "Query refused",
				};
				throw new Error(statusMessages[data.Status] || `DNS error: status ${data.Status}`);
			}

			setResults(data.Answer || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, [domain, recordType]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter") lookup();
		},
		[lookup],
	);

	const handleCopyRecord = useCallback(
		async (index: number) => {
			const record = results[index];
			if (!record) return;
			try {
				await navigator.clipboard.writeText(record.data);
			} catch {
				/* ignore */
			}
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 1500);
		},
		[results],
	);

	const handleCopyAll = useCallback(async () => {
		if (!results.length) return;
		const json = JSON.stringify(results, null, 2);
		try {
			await navigator.clipboard.writeText(json);
		} catch {
			/* ignore */
		}
		setCopiedAll(true);
		setTimeout(() => setCopiedAll(false), 1500);
	}, [results]);

	const handleCopyAllText = useCallback(async () => {
		if (!results.length) return;
		const text = results.map((r) => `${getRecordTypeName(r.type)}\t${r.TTL}\t${r.data}`).join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopiedAll(true);
		setTimeout(() => setCopiedAll(false), 1500);
	}, [results]);

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Domain Name</label>
				<div class="flex gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="example.com"
						value={domain}
						onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
						onKeyDown={handleKeyDown}
					/>
					<button class="btn-primary" onClick={lookup} disabled={loading}>
						{loading ? "Querying..." : "Lookup"}
					</button>
				</div>
			</div>

			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Record Type</label>
				<select
					class="input"
					value={recordType}
					onChange={(e) => setRecordType((e.target as HTMLSelectElement).value as RecordType)}
				>
					{RECORD_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
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
						<span class="text-caption text-muted">Querying DNS...</span>
					</div>
				</div>
			)}

			{results.length > 0 && (
				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<span class="text-caption-uppercase text-muted">
							{results.length} record{results.length !== 1 ? "s" : ""} found
						</span>
						<div class="flex gap-2">
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopyAllText}
							>
								{copiedAll ? "Copied!" : "Copy All"}
							</button>
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopyAll}
							>
								Copy as JSON
							</button>
						</div>
					</div>

					<div style="overflow-x: auto">
						<table style="width: 100%; border-collapse: collapse">
							<thead>
								<tr>
									<th
										class="text-caption-uppercase text-muted text-left"
										style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
									>
										Type
									</th>
									<th
										class="text-caption-uppercase text-muted text-left"
										style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
									>
										TTL
									</th>
									<th
										class="text-caption-uppercase text-muted text-left"
										style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
									>
										Value
									</th>
									<th
										class="text-caption-uppercase text-muted text-right"
										style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
									>
										&nbsp;
									</th>
								</tr>
							</thead>
							<tbody>
								{results.map((record, i) => (
									<tr key={`${record.data}-${i}`}>
										<td
											class="text-body-sm"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
										>
											<span class="badge">{getRecordTypeName(record.type)}</span>
										</td>
										<td
											class="text-body-sm text-muted"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
										>
											{record.TTL}s
										</td>
										<td
											class="text-body-sm font-mono break-all"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline); font-family: var(--font-mono); word-break: break-all"
										>
											{record.data}
										</td>
										<td
											class="text-right"
											style="padding: 8px 12px; border-bottom: 1px solid var(--border-hairline)"
										>
											<button
												class="text-body-sm text-primary hover:text-primary-active transition-colors"
												onClick={() => handleCopyRecord(i)}
											>
												{copiedIndex === i ? "Copied!" : "Copy"}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{!loading && responseData && results.length === 0 && !error && (
				<div class="card p-4">
					<p class="text-body-sm text-muted">
						No {recordType} records found for {domain.trim()}.
					</p>
				</div>
			)}
		</div>
	);
}
