import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import QRCode from "qrcode";

interface ShortenedLink {
	id: string;
	original: string;
	shortCode: string;
	shortUrl: string;
}

function generateHashCode(url: string): string {
	let hash = 0;
	for (let i = 0; i < url.length; i++) {
		const char = url.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	const positiveHash = Math.abs(hash);
	return positiveHash.toString(36).slice(0, 7).padStart(7, "0");
}

function generateShortUrl(url: string): ShortenedLink {
	const code = generateHashCode(url);
	const domain = typeof window !== "undefined" ? window.location.origin : "https://toolbundle.dev";
	return {
		id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
		original: url,
		shortCode: code,
		shortUrl: `${domain}/s/${code}`,
	};
}

export default function LinkShortener() {
	const [inputUrl, setInputUrl] = useState("");
	const [bulkInput, setBulkInput] = useState("");
	const [mode, setMode] = useState<"single" | "bulk">("single");
	const [results, setResults] = useState<ShortenedLink[]>([]);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [qrLinkId, setQrLinkId] = useState<string | null>(null);
	const qrCanvasRef = useRef<HTMLCanvasElement>(null);

	const handleShorten = useCallback(() => {
		if (mode === "single") {
			const url = inputUrl.trim();
			if (!url) return;
			// Basic URL validation
			try {
				new URL(url.startsWith("http") ? url : `https://${url}`);
			} catch {
				return;
			}
			const fullUrl = url.startsWith("http") ? url : `https://${url}`;
			const result = generateShortUrl(fullUrl);
			setResults((prev) => [result, ...prev.filter((r) => r.original !== fullUrl)]);
			setInputUrl("");
		} else {
			const lines = bulkInput
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length === 0) return;
			const newResults: ShortenedLink[] = lines.map((line) => {
				const fullUrl = line.startsWith("http") ? line : `https://${line}`;
				return generateShortUrl(fullUrl);
			});
			setResults((prev) => [...newResults, ...prev]);
			setBulkInput("");
		}
	}, [mode, inputUrl, bulkInput]);

	const copyToClipboard = useCallback(async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			// Fallback
			const textarea = document.createElement("textarea");
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		}
	}, []);

	// Generate QR code when a link is selected for QR
	useEffect(() => {
		if (!qrLinkId || !qrCanvasRef.current) return;
		const link = results.find((r) => r.id === qrLinkId);
		if (!link) return;
		QRCode.toCanvas(qrCanvasRef.current, link.original, {
			width: 200,
			margin: 2,
			color: { dark: "#000000", light: "#ffffff" },
			errorCorrectionLevel: "M",
		}).catch(console.error);
	}, [qrLinkId, results]);

	const selectedQrLink = qrLinkId ? results.find((r) => r.id === qrLinkId) : null;

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					{/* Mode toggle */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Mode</label>
						<div class="flex gap-2">
							<button
								class={mode === "single" ? "btn-primary" : "btn-secondary"}
								onClick={() => setMode("single")}
							>
								Single URL
							</button>
							<button
								class={mode === "bulk" ? "btn-primary" : "btn-secondary"}
								onClick={() => setMode("bulk")}
							>
								Bulk URLs
							</button>
						</div>
					</div>

					{/* Single URL input */}
					{mode === "single" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">URL to Shorten</label>
							<div class="flex gap-2">
								<input
									class="input"
									type="url"
									placeholder="https://example.com/very-long-url..."
									value={inputUrl}
									onInput={(e) => setInputUrl((e.target as HTMLInputElement).value)}
									onKeyDown={(e) => e.key === "Enter" && handleShorten()}
								/>
								<button class="btn-primary" onClick={handleShorten}>
									Shorten
								</button>
							</div>
						</div>
					)}

					{/* Bulk URL input */}
					{mode === "bulk" && (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">
								URLs (one per line)
							</label>
							<textarea
								class="textarea"
								style="min-height: 120px"
								placeholder="https://example.com/url1&#10;https://example.com/url2&#10;https://example.com/url3"
								value={bulkInput}
								onInput={(e) => setBulkInput((e.target as HTMLTextAreaElement).value)}
							/>
							<button class="btn-primary mt-2" onClick={handleShorten}>
								Shorten All
							</button>
						</div>
					)}

					{/* Educational note */}
					<div class="card mt-4" style="background-color: var(--color-surface-card)">
						<p class="text-body-sm" style="color: var(--color-mute)">
							<strong>How it works:</strong> This is a client-side demo tool. It generates a short
							hash code from your URL using a hash function. Real URL shorteners (like bit.ly) use a
							server to store the mapping and redirect visitors. This demo shows the concept — the
							short URL is derived from the original using a mathematical hash.
						</p>
					</div>
				</div>

				<div>
					{/* Results */}
					{results.length > 0 && (
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								Shortened URLs ({results.length})
							</label>
							<div class="flex flex-col gap-3" style="max-height: 500px; overflow-y: auto">
								{results.map((link) => (
									<div key={link.id} class="card" style="padding: 16px">
										<div class="flex items-start justify-between gap-2 mb-2">
											<div style="min-width: 0; flex: 1">
												<p
													class="text-body-sm"
													style="color: var(--color-mute); word-break: break-all"
												>
													{link.original}
												</p>
												<p class="text-body-strong mt-1" style="word-break: break-all">
													{link.shortUrl}
												</p>
											</div>
										</div>
										<div class="flex gap-2 flex-wrap">
											<button
												class="btn-secondary"
												style="height: 32px; font-size: 12px"
												onClick={() => copyToClipboard(link.shortUrl, link.id)}
											>
												{copiedId === link.id ? "✓ Copied!" : "Copy Short URL"}
											</button>
											<button
												class="btn-secondary"
												style="height: 32px; font-size: 12px"
												onClick={() => copyToClipboard(link.original, `${link.id}-orig`)}
											>
												{copiedId === `${link.id}-orig` ? "✓ Copied!" : "Copy Original"}
											</button>
											<button
												class="btn-secondary"
												style="height: 32px; font-size: 12px"
												onClick={() => setQrLinkId(link.id === qrLinkId ? null : link.id)}
											>
												{qrLinkId === link.id ? "Hide QR" : "Show QR"}
											</button>
										</div>
										{/* Inline QR display */}
										{qrLinkId === link.id && (
											<div class="mt-3 flex flex-col items-center">
												<canvas ref={qrCanvasRef} />
												<p class="text-caption mt-1" style="color: var(--color-mute)">
													QR code for original URL
												</p>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{results.length === 0 && (
						<div
							class="flex items-center justify-center"
							style="min-height: 200px; color: var(--color-ash)"
						>
							<p class="text-body-sm">Enter a URL to generate a short link</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
