import { useState, useMemo } from "preact/hooks";

export default function OctalConverter() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"octal-to-decimal" | "decimal-to-octal">("octal-to-decimal");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		if (mode === "octal-to-decimal") {
			const clean = input.trim().replace(/^0o/i, "").replace(/\s/g, "");
			if (!/^[0-7]+$/.test(clean)) return "Invalid octal (0-7 only)";
			return Number.parseInt(clean, 8).toString();
		}
		const num = Number.parseInt(input.trim(), 10);
		if (isNaN(num) || num < 0) return "Invalid positive integer";
		return `0o${num.toString(8)}`;
	}, [input, mode]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result && !result.startsWith("Invalid")) {
			setInput(result.replace(/^0o/, ""));
			setMode(mode === "octal-to-decimal" ? "decimal-to-octal" : "octal-to-decimal");
		}
	};

	return (
		<div>
			<div class="flex items-center gap-3 mb-4">
				<button
					class={mode === "octal-to-decimal" ? "btn-primary" : "btn-secondary"}
					onClick={() => {
						setMode("octal-to-decimal");
						setInput("");
					}}
				>
					Octal &rarr; Decimal
				</button>
				<button
					class={mode === "decimal-to-octal" ? "btn-primary" : "btn-secondary"}
					onClick={() => {
						setMode("decimal-to-octal");
						setInput("");
					}}
				>
					Decimal &rarr; Octal
				</button>
				<button class="btn-secondary" onClick={handleSwap}>
					&#8644; Swap
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "octal-to-decimal" ? "Octal Input (e.g. 755)" : "Decimal Input (e.g. 493)"}
					</label>
					<input
						class="input"
						style="font-family: var(--font-mono)"
						placeholder={mode === "octal-to-decimal" ? "755, 644, 0o777" : "493, 420, 511"}
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
			<div class="text-caption text-muted mt-3">
				Common Unix permissions: 755 (rwxr-xr-x), 644 (rw-r--r--), 777 (rwxrwxrwx)
			</div>
		</div>
	);
}
