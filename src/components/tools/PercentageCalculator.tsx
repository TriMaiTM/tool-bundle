import { useMemo, useState } from "preact/hooks";

export default function PercentageCalculator() {
	const [x1, setX1] = useState("");
	const [y1, setY1] = useState("");
	const [x2, setX2] = useState("");
	const [y2, setY2] = useState("");
	const [x3, setX3] = useState("");
	const [y3, setY3] = useState("");
	const [x4, setX4] = useState("");
	const [y4, setY4] = useState("");
	const [operation, setOperation] = useState<"add" | "subtract">("add");

	const result1 = useMemo(() => {
		const x = Number.parseFloat(x1);
		const y = Number.parseFloat(y1);
		if (Number.isNaN(x) || Number.isNaN(y)) return null;
		return (x / 100) * y;
	}, [x1, y1]);

	const result2 = useMemo(() => {
		const x = Number.parseFloat(x2);
		const y = Number.parseFloat(y2);
		if (Number.isNaN(x) || Number.isNaN(y) || y === 0) return null;
		return (x / y) * 100;
	}, [x2, y2]);

	const result3 = useMemo(() => {
		const x = Number.parseFloat(x3);
		const y = Number.parseFloat(y3);
		if (Number.isNaN(x) || Number.isNaN(y) || x === 0) return null;
		return ((y - x) / Math.abs(x)) * 100;
	}, [x3, y3]);

	const result4 = useMemo(() => {
		const x = Number.parseFloat(x4);
		const y = Number.parseFloat(y4);
		if (Number.isNaN(x) || Number.isNaN(y)) return null;
		if (operation === "add") {
			return y + (x / 100) * y;
		}
		return y - (x / 100) * y;
	}, [x4, y4, operation]);

	const formatNumber = (n: number): string => {
		if (Number.isInteger(n)) return n.toLocaleString();
		return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
	};

	return (
		<div class="space-y-8">
			{/* Section 1: What is X% of Y? */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">What is X% of Y?</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Percentage (X)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 25"
							value={x1}
							onInput={(e) => setX1((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Of Value (Y)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 200"
							value={y1}
							onInput={(e) => setY1((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
				{result1 !== null && (
					<div class="bg-surface-elevated rounded-lg p-3 text-center">
						<div class="text-title-lg text-primary">{formatNumber(result1)}</div>
						<div class="text-caption text-muted mt-1">
							{x1}% of {y1}
						</div>
					</div>
				)}
			</div>

			{/* Section 2: X is what % of Y? */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">X is what % of Y?</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Value (X)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 50"
							value={x2}
							onInput={(e) => setX2((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Of Value (Y)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 200"
							value={y2}
							onInput={(e) => setY2((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
				{result2 !== null && (
					<div class="bg-surface-elevated rounded-lg p-3 text-center">
						<div class="text-title-lg text-primary">{formatNumber(result2)}%</div>
						<div class="text-caption text-muted mt-1">
							{x2} is {formatNumber(result2)}% of {y2}
						</div>
					</div>
				)}
			</div>

			{/* Section 3: Percentage change from X to Y */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Percentage Change</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">From Value (X)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 100"
							value={x3}
							onInput={(e) => setX3((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">To Value (Y)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 150"
							value={y3}
							onInput={(e) => setY3((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
				{result3 !== null && (
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div
								class={`text-title-lg ${result3 >= 0 ? "text-accent-emerald" : "text-accent-rose"}`}
							>
								{result3 >= 0 ? "+" : ""}
								{formatNumber(result3)}%
							</div>
							<div class="text-caption text-muted mt-1">Change</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">
								{formatNumber(Number.parseFloat(y3) - Number.parseFloat(x3))}
							</div>
							<div class="text-caption text-muted mt-1">Difference</div>
						</div>
					</div>
				)}
			</div>

			{/* Section 4: Add/Subtract X% to/from Y */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Add / Subtract Percentage</h3>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Percentage (X%)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 20"
							value={x4}
							onInput={(e) => setX4((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">From Value (Y)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 500"
							value={y4}
							onInput={(e) => setY4((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Operation</label>
						<div class="flex rounded-md overflow-hidden border border-hairline">
							<button
								class={`flex-1 px-4 py-2 text-body-sm font-medium transition-colors ${operation === "add" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
								onClick={() => setOperation("add")}
							>
								Add
							</button>
							<button
								class={`flex-1 px-4 py-2 text-body-sm font-medium transition-colors ${operation === "subtract" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
								onClick={() => setOperation("subtract")}
							>
								Subtract
							</button>
						</div>
					</div>
				</div>
				{result4 !== null && (
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result4)}</div>
							<div class="text-caption text-muted mt-1">Result</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">
								{formatNumber(result4 - Number.parseFloat(y4))}
							</div>
							<div class="text-caption text-muted mt-1">
								{operation === "add" ? "Added" : "Subtracted"}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
