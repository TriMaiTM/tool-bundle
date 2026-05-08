import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

type TransactionType = "income" | "expense";

interface Transaction {
	id: string;
	description: string;
	amount: number;
	type: TransactionType;
	category: string;
	date: string; // ISO date string
}

const CATEGORIES = [
	"Housing",
	"Food",
	"Transportation",
	"Entertainment",
	"Shopping",
	"Healthcare",
	"Education",
	"Utilities",
	"Insurance",
	"Savings",
	"Other",
];

const STORAGE_KEY = "budget-tracker-transactions";

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getMonthKey(dateStr: string): string {
	const d = new Date(dateStr);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
	const [year, month] = key.split("-");
	const d = new Date(Number.parseInt(year), Number.parseInt(month) - 1);
	return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function BudgetTracker() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [type, setType] = useState<TransactionType>("expense");
	const [category, setCategory] = useState("Other");
	const [selectedMonth, setSelectedMonth] = useState<string>("all");

	// Load from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				setTransactions(JSON.parse(saved));
			}
		} catch {
			// Ignore parse errors
		}
	}, []);

	// Save to localStorage
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
		} catch {
			// Ignore storage errors
		}
	}, [transactions]);

	const availableMonths = useMemo(() => {
		const months = new Set<string>();
		for (const t of transactions) {
			months.add(getMonthKey(t.date));
		}
		return Array.from(months).sort().reverse();
	}, [transactions]);

	const filteredTransactions = useMemo(() => {
		if (selectedMonth === "all") return transactions;
		return transactions.filter((t) => getMonthKey(t.date) === selectedMonth);
	}, [transactions, selectedMonth]);

	const summary = useMemo(() => {
		const income = filteredTransactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = filteredTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		return { income, expenses, balance: income - expenses };
	}, [filteredTransactions]);

	const categoryBreakdown = useMemo(() => {
		const map = new Map<string, number>();
		for (const t of filteredTransactions) {
			if (t.type === "expense") {
				map.set(t.category, (map.get(t.category) || 0) + t.amount);
			}
		}
		return Array.from(map.entries())
			.map(([cat, amount]) => ({ category: cat, amount }))
			.sort((a, b) => b.amount - a.amount);
	}, [filteredTransactions]);

	const maxCategoryAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].amount : 1;

	const handleAdd = useCallback(() => {
		const amt = Number.parseFloat(amount);
		if (!description.trim() || Number.isNaN(amt) || amt <= 0) return;

		const newTransaction: Transaction = {
			id: generateId(),
			description: description.trim(),
			amount: amt,
			type,
			category,
			date: new Date().toISOString(),
		};

		setTransactions((prev) => [newTransaction, ...prev]);
		setDescription("");
		setAmount("");
	}, [description, amount, type, category]);

	const handleDelete = useCallback((id: string) => {
		setTransactions((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleExportCsv = useCallback(() => {
		const header = "Date,Description,Type,Category,Amount\n";
		const rows = transactions
			.map((t) => {
				const date = new Date(t.date).toLocaleDateString();
				return `${date},"${t.description}",${t.type},${t.category},${t.amount.toFixed(2)}`;
			})
			.join("\n");

		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "budget-export.csv";
		a.click();
		URL.revokeObjectURL(url);
	}, [transactions]);

	const formatCurrency = (n: number): string => {
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	return (
		<div class="space-y-6">
			{/* Add Transaction */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">Add Transaction</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
					<div class="lg:col-span-2">
						<label class="text-caption-uppercase text-muted block mb-2">Description</label>
						<input
							type="text"
							class="input w-full"
							placeholder="e.g. Grocery shopping"
							value={description}
							onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Amount ($)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 50.00"
							step="0.01"
							value={amount}
							onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Type</label>
						<select
							class="input w-full"
							value={type}
							onChange={(e) => setType((e.target as HTMLSelectElement).value as TransactionType)}
						>
							<option value="expense">Expense</option>
							<option value="income">Income</option>
						</select>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Category</label>
						<select
							class="input w-full"
							value={category}
							onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
						>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>
				</div>
				<button class="btn-primary mt-4" onClick={handleAdd}>
					Add Transaction
				</button>
			</div>

			{/* Month Filter & Export */}
			<div class="bg-surface-elevated rounded-lg p-4 flex flex-wrap items-center gap-4">
				<div class="flex-1 min-w-[200px]">
					<label class="text-caption-uppercase text-muted block mb-2">View Month</label>
					<select
						class="input w-full"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth((e.target as HTMLSelectElement).value)}
					>
						<option value="all">All Time</option>
						{availableMonths.map((m) => (
							<option key={m} value={m}>
								{getMonthLabel(m)}
							</option>
						))}
					</select>
				</div>
				<button class="btn-secondary" onClick={handleExportCsv}>
					Export CSV
				</button>
			</div>

			{/* Summary */}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-accent-emerald">${formatCurrency(summary.income)}</div>
					<div class="text-caption text-muted mt-1">Total Income</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div class="text-title-lg text-accent-rose">${formatCurrency(summary.expenses)}</div>
					<div class="text-caption text-muted mt-1">Total Expenses</div>
				</div>
				<div class="bg-surface-elevated rounded-lg p-3 text-center">
					<div
						class={`text-title-lg ${summary.balance >= 0 ? "text-accent-emerald" : "text-accent-rose"}`}
					>
						${formatCurrency(summary.balance)}
					</div>
					<div class="text-caption text-muted mt-1">Balance</div>
				</div>
			</div>

			{/* Category Breakdown */}
			{categoryBreakdown.length > 0 && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<h3 class="text-title-sm text-body-strong mb-4">Expense Breakdown by Category</h3>
					<div class="space-y-3">
						{categoryBreakdown.map(({ category: cat, amount: catAmount }) => {
							const pct = summary.expenses > 0 ? (catAmount / summary.expenses) * 100 : 0;
							return (
								<div key={cat} class="flex items-center gap-3">
									<div class="w-28 text-body-sm text-muted shrink-0">{cat}</div>
									<div class="flex-1">
										<div class="h-5 rounded overflow-hidden bg-surface-soft">
											<div
												class="h-full bg-primary rounded"
												style={`width: ${(catAmount / maxCategoryAmount) * 100}%`}
											/>
										</div>
									</div>
									<div class="w-24 text-body-sm text-right text-primary shrink-0">
										${formatCurrency(catAmount)}
									</div>
									<div class="w-14 text-body-sm text-right text-muted shrink-0">
										{pct.toFixed(1)}%
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Transaction List */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-4">
					Transactions ({filteredTransactions.length})
				</h3>
				{filteredTransactions.length === 0 ? (
					<p class="text-muted text-body-sm text-center py-8">
						No transactions yet. Add one above!
					</p>
				) : (
					<div class="overflow-x-auto">
						<table class="w-full text-body-sm">
							<thead>
								<tr class="border-b border-hairline">
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Date</th>
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Description</th>
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Category</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Amount</th>
									<th class="text-right text-caption-uppercase text-muted py-2 px-3">Action</th>
								</tr>
							</thead>
							<tbody>
								{filteredTransactions.map((t) => (
									<tr
										key={t.id}
										class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
									>
										<td class="py-2 px-3 text-muted">{new Date(t.date).toLocaleDateString()}</td>
										<td class="py-2 px-3 text-body-strong">{t.description}</td>
										<td class="py-2 px-3">
											<span class="badge">{t.category}</span>
										</td>
										<td
											class={`py-2 px-3 text-right font-medium ${t.type === "income" ? "text-accent-emerald" : "text-accent-rose"}`}
										>
											{t.type === "income" ? "+" : "−"}${formatCurrency(t.amount)}
										</td>
										<td class="py-2 px-3 text-right">
											<button class="btn-secondary text-body-sm" onClick={() => handleDelete(t.id)}>
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
