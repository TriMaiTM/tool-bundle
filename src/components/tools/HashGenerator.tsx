import { useCallback, useEffect, useState } from "preact/hooks";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export default function HashGenerator() {
	const [input, setInput] = useState("");
	const [hashes, setHashes] = useState<Record<string, string>>({});
	const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

	useEffect(() => {
		if (!input) {
			setHashes({});
			return;
		}

		const encoder = new TextEncoder();
		const data = encoder.encode(input);

		Promise.all(
			ALGORITHMS.map(async (algo) => {
				const hashBuffer = await crypto.subtle.digest(algo, data);
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
				return [algo, hashHex] as const;
			}),
		).then((results) => {
			setHashes(Object.fromEntries(results));
		});
	}, [input]);

	const handleCopy = useCallback(
		async (algo: string) => {
			const hash = hashes[algo];
			if (hash) {
				await navigator.clipboard.writeText(hash);
				setCopiedAlgo(algo);
				setTimeout(() => setCopiedAlgo(null), 1500);
			}
		},
		[hashes],
	);

	return (
		<div>
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 150px"
					placeholder="Enter text to generate hashes..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div class="space-y-3">
				{ALGORITHMS.map((algo) => (
					<div class="bg-surface-elevated rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-caption-uppercase text-muted">{algo}</span>
							{hashes[algo] && (
								<button
									class="text-body-sm text-primary hover:text-primary-active transition-colors"
									onClick={() => handleCopy(algo)}
								>
									{copiedAlgo === algo ? "Copied!" : "Copy"}
								</button>
							)}
						</div>
						<code
							class="text-body-sm text-body-strong break-all"
							style="font-family: var(--font-mono)"
						>
							{hashes[algo] || (
								<span class="text-muted-soft">Enter text above to generate hash...</span>
							)}
						</code>
					</div>
				))}
			</div>
		</div>
	);
}
