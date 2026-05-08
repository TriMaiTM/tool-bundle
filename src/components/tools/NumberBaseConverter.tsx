import { useState, useMemo } from "preact/hooks";

const BASES = [
	{ value: 2, label: "Binary (2)" },
	{ value: 8, label: "Octal (8)" },
	{ value: 10, label: "Decimal (10)" },
	{ value: 16, label: "Hex (16)" },
	{ value: 32, label: "Base32" },
	{ value: 36, label: "Base36" },
];

export default function NumberBaseConverter() {
	const [input, setInput] = useState("");
	const [fromBase, setFromBase] = useState(10);
	const [toBase, setToBase] = useState(16);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const decimal = Number.parseInt(input.trim(), fromBase);
			if (isNaN(decimal)) return "Invalid input";
			return decimal.toString(toBase).toUpperCase();
		} catch {
			return "Invalid input";
		}
	}, [input, fromBase, toBase]);

	const handleSwap = () => {
		setFromBase(toBase);
		setToBase(fromBase);
		if (result && result !== "Invalid input") {
			setInput(result.toLowerCase());
		}
	};

	const handleCopy = async () => {
		if (result && result !== "Invalid input") {
			await navigator.clipboard.writeText(result);
		}
	};

	return (
		<div>
			<div class="flex flex-wrap items-end gap-3 mb-6">
				<div class="flex-1 min-w-[120px]">
					<label class="text-caption-uppercase text-muted block mb-1">From Base</label>
					<select
						class="input"
						value={fromBase}
						onChange={(e) => setFromBase(Number((e.target as HTMLSelectElement).value))}
					>
						{BASES.map((b) => (
							<option value={b.value}>{b.label}</option>
						))}
						{Array.from({ length: 25 }, (_, i) => i + 2)
							.filter((n) => !BASES.some((b) => b.value === n))
							.map((n) => (
								<option value={n}>Base {n}</option>
							))}
					</select>
				</div>
				<button class="btn-secondary" onClick={handleSwap} title="Swap bases">
					⇄
				</button>
				<div class="flex-1 min-w-[120px]">
					<label class="text-caption-uppercase text-muted block mb-1">To Base</label>
					<select
						class="input"
						value={toBase}
						onChange={(e) => setToBase(Number((e.target as HTMLSelectElement).value))}
					>
						{BASES.map((b) => (
							<option value={b.value}>{b.label}</option>
						))}
						{Array.from({ length: 25 }, (_, i) => i + 2)
							.filter((n) => !BASES.some((b) => b.value === n))
							.map((n) => (
								<option value={n}>Base {n}</option>
							))}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 120px"
						placeholder={`Enter a base-${fromBase} number...`}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
						{result && result !== "Invalid input" && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 120px"
						value={result}
						readOnly
						placeholder="Result will appear here..."
					/>
				</div>
			</div>

			<div class="flex gap-3">
				<button class="btn-secondary" onClick={() => setInput("")}>
					Clear
				</button>
			</div>
		</div>
	);
}
