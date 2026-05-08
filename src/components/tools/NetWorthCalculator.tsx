import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

type AssetCategory = "Cash" | "Investments" | "Real Estate" | "Vehicles" | "Other";
type LiabilityCategory = "Mortgage" | "Student Loans" | "Credit Cards" | "Car Loan" | "Other";

interface NetWorthItem {
	id: string;
	name: string;
	value: number;
}

interface AssetItem extends NetWorthItem {
	category: AssetCategory;
}

interface LiabilityItem extends NetWorthItem {
	category: LiabilityCategory;
}

const ASSET_CATEGORIES: AssetCategory[] = [
	"Cash",
	"Investments",
	"Real Estate",
	"Vehicles",
	"Other",
];
const LIABILITY_CATEGORIES: LiabilityCategory[] = [
	"Mortgage",
	"Student Loans",
	"Credit Cards",
	"Car Loan",
	"Other",
];

const ASSET_STORAGE_KEY = "net-worth-assets";
const LIABILITY_STORAGE_KEY = "net-worth-liabilities";

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function NetWorthCalculator() {
	const [assets, setAssets] = useState<AssetItem[]>([]);
	const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);

	// Asset form
	const [assetName, setAssetName] = useState("");
	const [assetValue, setAssetValue] = useState("");
	const [assetCategory, setAssetCategory] = useState<AssetCategory>("Cash");

	// Liability form
	const [liabilityName, setLiabilityName] = useState("");
	const [liabilityValue, setLiabilityValue] = useState("");
	const [liabilityCategory, setLiabilityCategory] = useState<LiabilityCategory>("Mortgage");

	// Load from localStorage
	useEffect(() => {
		try {
			const savedAssets = localStorage.getItem(ASSET_STORAGE_KEY);
			if (savedAssets) setAssets(JSON.parse(savedAssets));
			const savedLiabilities = localStorage.getItem(LIABILITY_STORAGE_KEY);
			if (savedLiabilities) setLiabilities(JSON.parse(savedLiabilities));
		} catch {
			// Ignore
		}
	}, []);

	// Save to localStorage
	useEffect(() => {
		try {
			localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
		} catch {
			/* Ignore */
		}
	}, [assets]);

	useEffect(() => {
		try {
			localStorage.setItem(LIABILITY_STORAGE_KEY, JSON.stringify(liabilities));
		} catch {
			/* Ignore */
		}
	}, [liabilities]);

	const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
	const totalLiabilities = useMemo(
		() => liabilities.reduce((sum, l) => sum + l.value, 0),
		[liabilities],
	);
	const netWorth = totalAssets - totalLiabilities;

	const assetByCategory = useMemo(() => {
		const map = new Map<AssetCategory, number>();
		for (const cat of ASSET_CATEGORIES) map.set(cat, 0);
		for (const a of assets) map.set(a.category, (map.get(a.category) || 0) + a.value);
		return Array.from(map.entries())
			.filter(([, v]) => v > 0)
			.map(([category, value]) => ({ category, value }))
			.sort((a, b) => b.value - a.value);
	}, [assets]);

	const liabilityByCategory = useMemo(() => {
		const map = new Map<LiabilityCategory, number>();
		for (const cat of LIABILITY_CATEGORIES) map.set(cat, 0);
		for (const l of liabilities) map.set(l.category, (map.get(l.category) || 0) + l.value);
		return Array.from(map.entries())
			.filter(([, v]) => v > 0)
			.map(([category, value]) => ({ category, value }))
			.sort((a, b) => b.value - a.value);
	}, [liabilities]);

	const maxBarValue = Math.max(totalAssets, totalLiabilities, 1);

	const handleAddAsset = useCallback(() => {
		const val = Number.parseFloat(assetValue);
		if (!assetName.trim() || Number.isNaN(val) || val <= 0) return;
		setAssets((prev) => [
			...prev,
			{
				id: generateId(),
				name: assetName.trim(),
				value: val,
				category: assetCategory,
			},
		]);
		setAssetName("");
		setAssetValue("");
	}, [assetName, assetValue, assetCategory]);

	const handleAddLiability = useCallback(() => {
		const val = Number.parseFloat(liabilityValue);
		if (!liabilityName.trim() || Number.isNaN(val) || val <= 0) return;
		setLiabilities((prev) => [
			...prev,
			{
				id: generateId(),
				name: liabilityName.trim(),
				value: val,
				category: liabilityCategory,
			},
		]);
		setLiabilityName("");
		setLiabilityValue("");
	}, [liabilityName, liabilityValue, liabilityCategory]);

	const handleDeleteAsset = useCallback((id: string) => {
		setAssets((prev) => prev.filter((a) => a.id !== id));
	}, []);

	const handleDeleteLiability = useCallback((id: string) => {
		setLiabilities((prev) => prev.filter((l) => l.id !== id));
	}, []);

	const formatCurrency = (n: number): string => {
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	return (
		<div class="space-y-6">
			{/* Net Worth Display */}
			<div class="bg-surface-elevated rounded-lg p-6 text-center">
				<div class="text-caption-uppercase text-muted mb-2">Your Net Worth</div>
				<div class={`text-title-lg ${netWorth >= 0 ? "text-accent-emerald" : "text-accent-rose"}`}>
					{netWorth < 0 ? "−" : ""}${formatCurrency(Math.abs(netWorth))}
				</div>
				<div class="flex justify-center gap-8 mt-4">
					<div>
						<div class="text-caption-uppercase text-muted">Assets</div>
						<div class="text-body text-accent-emerald">${formatCurrency(totalAssets)}</div>
					</div>
					<div>
						<div class="text-caption-uppercase text-muted">Liabilities</div>
						<div class="text-body text-accent-rose">${formatCurrency(totalLiabilities)}</div>
					</div>
				</div>
			</div>

			{/* Visual Bar */}
			{(totalAssets > 0 || totalLiabilities > 0) && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<h3 class="text-title-sm text-body-strong mb-4">Assets vs Liabilities</h3>
					<div class="space-y-3">
						<div>
							<div class="flex justify-between text-body-sm mb-1">
								<span class="text-muted">Assets</span>
								<span class="text-accent-emerald">${formatCurrency(totalAssets)}</span>
							</div>
							<div class="h-6 rounded overflow-hidden bg-surface-soft">
								<div
									class="h-full bg-accent-emerald rounded"
									style={`width: ${(totalAssets / maxBarValue) * 100}%`}
								/>
							</div>
						</div>
						<div>
							<div class="flex justify-between text-body-sm mb-1">
								<span class="text-muted">Liabilities</span>
								<span class="text-accent-rose">${formatCurrency(totalLiabilities)}</span>
							</div>
							<div class="h-6 rounded overflow-hidden bg-surface-soft">
								<div
									class="h-full bg-accent-rose rounded"
									style={`width: ${(totalLiabilities / maxBarValue) * 100}%`}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add Asset Form */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Add Asset</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Name</label>
						<input
							type="text"
							class="input w-full"
							placeholder="e.g. Savings Account"
							value={assetName}
							onInput={(e) => setAssetName((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Value ($)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 25000"
							value={assetValue}
							onInput={(e) => setAssetValue((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Category</label>
						<select
							class="input w-full"
							value={assetCategory}
							onChange={(e) =>
								setAssetCategory((e.target as HTMLSelectElement).value as AssetCategory)
							}
						>
							{ASSET_CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>
					<div class="flex items-end">
						<button class="btn-primary w-full" onClick={handleAddAsset}>
							Add Asset
						</button>
					</div>
				</div>
			</div>

			{/* Add Liability Form */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Add Liability</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Name</label>
						<input
							type="text"
							class="input w-full"
							placeholder="e.g. Home Mortgage"
							value={liabilityName}
							onInput={(e) => setLiabilityName((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Value ($)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 200000"
							value={liabilityValue}
							onInput={(e) => setLiabilityValue((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Category</label>
						<select
							class="input w-full"
							value={liabilityCategory}
							onChange={(e) =>
								setLiabilityCategory((e.target as HTMLSelectElement).value as LiabilityCategory)
							}
						>
							{LIABILITY_CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>
					<div class="flex items-end">
						<button class="btn-primary w-full" onClick={handleAddLiability}>
							Add Liability
						</button>
					</div>
				</div>
			</div>

			{/* Category Summary */}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Asset Categories */}
				{assetByCategory.length > 0 && (
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Asset Breakdown</h3>
						<div class="space-y-3">
							{assetByCategory.map(({ category, value }) => {
								const pct = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
								return (
									<div key={category}>
										<div class="flex justify-between text-body-sm mb-1">
											<span class="text-muted">{category}</span>
											<span class="text-accent-emerald">
												${formatCurrency(value)} ({pct.toFixed(1)}%)
											</span>
										</div>
										<div class="h-4 rounded overflow-hidden bg-surface-soft">
											<div class="h-full bg-accent-emerald rounded" style={`width: ${pct}%`} />
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Liability Categories */}
				{liabilityByCategory.length > 0 && (
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Liability Breakdown</h3>
						<div class="space-y-3">
							{liabilityByCategory.map(({ category, value }) => {
								const pct = totalLiabilities > 0 ? (value / totalLiabilities) * 100 : 0;
								return (
									<div key={category}>
										<div class="flex justify-between text-body-sm mb-1">
											<span class="text-muted">{category}</span>
											<span class="text-accent-rose">
												${formatCurrency(value)} ({pct.toFixed(1)}%)
											</span>
										</div>
										<div class="h-4 rounded overflow-hidden bg-surface-soft">
											<div class="h-full bg-accent-rose rounded" style={`width: ${pct}%`} />
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Asset List */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Assets ({assets.length})</h3>
				{assets.length === 0 ? (
					<p class="text-muted text-body-sm text-center py-4">No assets added yet.</p>
				) : (
					<div class="overflow-x-auto">
						<table class="w-full text-body-sm">
							<thead>
								<tr class="border-b border-hairline">
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Name</th>
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Category</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Value</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Action</th>
								</tr>
							</thead>
							<tbody>
								{assets.map((a) => (
									<tr
										key={a.id}
										class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
									>
										<td class="py-2 px-3 text-body-strong">{a.name}</td>
										<td class="py-2 px-3">
											<span class="badge">{a.category}</span>
										</td>
										<td class="py-2 px-3 text-right text-accent-emerald font-medium">
											${formatCurrency(a.value)}
										</td>
										<td class="py-2 px-3 text-right">
											<button
												class="btn-secondary text-body-sm"
												onClick={() => handleDeleteAsset(a.id)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Liability List */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Liabilities ({liabilities.length})</h3>
				{liabilities.length === 0 ? (
					<p class="text-muted text-body-sm text-center py-4">No liabilities added yet.</p>
				) : (
					<div class="overflow-x-auto">
						<table class="w-full text-body-sm">
							<thead>
								<tr class="border-b border-hairline">
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Name</th>
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Category</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Value</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Action</th>
								</tr>
							</thead>
							<tbody>
								{liabilities.map((l) => (
									<tr
										key={l.id}
										class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
									>
										<td class="py-2 px-3 text-body-strong">{l.name}</td>
										<td class="py-2 px-3">
											<span class="badge">{l.category}</span>
										</td>
										<td class="py-2 px-3 text-right text-accent-rose font-medium">
											${formatCurrency(l.value)}
										</td>
										<td class="py-2 px-3 text-right">
											<button
												class="btn-secondary text-body-sm"
												onClick={() => handleDeleteLiability(l.id)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
