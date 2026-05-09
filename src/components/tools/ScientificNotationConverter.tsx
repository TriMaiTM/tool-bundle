import { useState, useMemo } from "preact/hooks";

export default function ScientificNotationConverter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"to-scientific" | "from-scientific">("to-scientific");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			if (mode === "to-scientific") {
				const num = Number.parseFloat(input.trim().replace(/,/g, ""));
				if (isNaN(num)) return "Invalid number";
				return num.toExponential();
			}
			const num = Number.parseFloat(input.trim());
			if (isNaN(num)) return "Invalid scientific notation";
			return num.toLocaleString("en-US", { maximumFractionDigits: 20 });
		} catch {
			return "Invalid input";
		}
	}, [input, mode]);

	const details = useMemo(() => {
		if (!input.trim()) return null;
		try {
			const num =
				mode === "to-scientific"
					? Number.parseFloat(input.trim().replace(/,/g, ""))
					: Number.parseFloat(input.trim());
			if (isNaN(num)) return null;
			return {
				scientific: num.toExponential(),
				decimal: num.toLocaleString("en-US", { maximumFractionDigits: 20 }),
				precision: num.toPrecision(),
			};
		} catch {
			return null;
		}
	}, [input, mode]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="flex items-center gap-3 mb-4">
				<button
					class={mode === "to-scientific" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("to-scientific")}
				>
					Decimal &rarr; Scientific
				</button>
				<button
					class={mode === "from-scientific" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("from-scientific")}
				>
					Scientific &rarr; Decimal
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "to-scientific" ? "Decimal Input" : "Scientific Notation Input"}
					</label>
					<input
						class="input"
						style="font-family: var(--font-mono); font-size: 18px;"
						placeholder={mode === "to-scientific" ? "e.g. 123456.789" : "e.g. 1.23456789e+5"}
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
						{result && !result.startsWith("Invalid") && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<input
						class="input"
						style="font-family: var(--font-mono); font-size: 18px;"
						value={result}
						readOnly
						placeholder="Result..."
					/>
				</div>
			</div>
			{details && (
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="bg-surface-card rounded-lg p-4">
						<div class="text-caption-uppercase text-muted mb-1">Scientific</div>
						<code class="text-body-sm" style="font-family: var(--font-mono)">
							{details.scientific}
						</code>
					</div>
					<div class="bg-surface-card rounded-lg p-4">
						<div class="text-caption-uppercase text-muted mb-1">Decimal</div>
						<code class="text-body-sm" style="font-family: var(--font-mono)">
							{details.decimal}
						</code>
					</div>
				</div>
			)}
		</div>
	);
}
