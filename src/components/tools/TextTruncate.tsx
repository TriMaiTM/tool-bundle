import { useCallback, useMemo, useState } from "preact/hooks";

type TruncatePosition = "end" | "middle" | "start";

export default function TextTruncate() {
	const [input, setInput] = useState("");
	const [maxLength, setMaxLength] = useState(100);
	const [wordBoundary, setWordBoundary] = useState(false);
	const [ellipsis, setEllipsis] = useState("...");
	const [position, setPosition] = useState<TruncatePosition>("end");

	const { truncated, wasTruncated } = useMemo(() => {
		if (!input) return { truncated: "", wasTruncated: false };
		if (input.length <= maxLength) return { truncated: input, wasTruncated: false };

		const effectiveMax = maxLength - ellipsis.length;
		if (effectiveMax <= 0) return { truncated: ellipsis.slice(0, maxLength), wasTruncated: true };

		let result: string;

		switch (position) {
			case "start": {
				const slice = input.slice(input.length - effectiveMax);
				result = wordBoundary
					? `${ellipsis}${slice.replace(/^\S+\s*/, "")}`
					: `${ellipsis}${slice}`;
				break;
			}
			case "middle": {
				const frontLen = Math.ceil(effectiveMax / 2);
				const backLen = Math.floor(effectiveMax / 2);
				const front = input.slice(0, frontLen);
				const back = input.slice(input.length - backLen);
				result = wordBoundary
					? `${front.replace(/\S+\s*$/, "")}${ellipsis}${back.replace(/^\S+\s*/, "")}`
					: `${front}${ellipsis}${back}`;
				break;
			}
			default: {
				const slice = input.slice(0, effectiveMax);
				result = wordBoundary
					? `${slice.replace(/\S+\s*$/, "")}${ellipsis}`
					: `${slice}${ellipsis}`;
				break;
			}
		}

		return { truncated: result, wasTruncated: true };
	}, [input, maxLength, wordBoundary, ellipsis, position]);

	const handleCopy = useCallback(async () => {
		if (truncated) await navigator.clipboard.writeText(truncated);
	}, [truncated]);

	return (
		<div>
			<div class="flex flex-wrap gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Max Length</label>
					<input
						type="number"
						class="input"
						style="width: 100px"
						min={1}
						value={maxLength}
						onInput={(e) =>
							setMaxLength(Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1))
						}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Ellipsis</label>
					<input
						type="text"
						class="input"
						style="width: 100px"
						value={ellipsis}
						onInput={(e) => setEllipsis((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Truncate From</label>
					<select
						class="input"
						style="width: auto; height: 36px"
						value={position}
						onChange={(e) => setPosition((e.target as HTMLSelectElement).value as TruncatePosition)}
					>
						<option value="end">End</option>
						<option value="middle">Middle</option>
						<option value="start">Start</option>
					</select>
				</div>
				<div class="flex items-end">
					<label class="flex items-center gap-2 text-body-sm cursor-pointer pb-1">
						<input
							type="checkbox"
							checked={wordBoundary}
							onChange={(e) => setWordBoundary((e.target as HTMLInputElement).checked)}
						/>
						Word boundary
					</label>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{input.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Original Length</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">{truncated.length}</div>
					<div class="text-caption-uppercase text-muted mt-1">Truncated Length</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-primary">
						{wasTruncated ? input.length - truncated.length : 0}
					</div>
					<div class="text-caption-uppercase text-muted mt-1">Chars Removed</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 250px"
						placeholder="Type or paste your text here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Truncated Output</label>
						{truncated && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 250px"
						value={truncated}
						readOnly
						placeholder="Truncated text will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
