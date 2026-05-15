import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

interface LineItem {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
}

interface InvoiceData {
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
	companyName: string;
	companyAddress: string;
	companyEmail: string;
	companyPhone: string;
	clientName: string;
	clientAddress: string;
	clientEmail: string;
	items: LineItem[];
	taxRate: number;
	discountRate: number;
	currency: string;
	notes: string;
}

const STORAGE_KEY = "invoice-generator-draft";

const CURRENCIES: Record<string, { symbol: string; locale: string }> = {
	USD: { symbol: "$", locale: "en-US" },
	EUR: { symbol: "€", locale: "de-DE" },
	GBP: { symbol: "£", locale: "en-GB" },
	VND: { symbol: "₫", locale: "vi-VN" },
	JPY: { symbol: "¥", locale: "ja-JP" },
};

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateInvoiceNumber(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const rand = Math.floor(Math.random() * 9000 + 1000);
	return `INV-${year}${month}-${rand}`;
}

function formatCurrency(amount: number, currency: string): string {
	const info = CURRENCIES[currency] || CURRENCIES.USD;
	return new Intl.NumberFormat(info.locale, {
		style: "currency",
		currency,
		minimumFractionDigits: currency === "JPY" ? 0 : 2,
	}).format(amount);
}

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function defaultInvoice(): InvoiceData {
	return {
		invoiceNumber: generateInvoiceNumber(),
		invoiceDate: todayISO(),
		dueDate: "",
		companyName: "",
		companyAddress: "",
		companyEmail: "",
		companyPhone: "",
		clientName: "",
		clientAddress: "",
		clientEmail: "",
		items: [{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }],
		taxRate: 0,
		discountRate: 0,
		currency: "USD",
		notes: "",
	};
}

export default function InvoiceGenerator() {
	const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Load from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as InvoiceData;
				setInvoice((prev) => ({ ...prev, ...parsed }));
			}
		} catch {
			// ignore
		}
	}, []);

	// Auto-save to localStorage
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
		} catch {
			// ignore
		}
	}, [invoice]);

	const updateField = useCallback(
		<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
			setInvoice((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const addItem = useCallback(() => {
		setInvoice((prev) => ({
			...prev,
			items: [...prev.items, { id: generateId(), description: "", quantity: 1, unitPrice: 0 }],
		}));
	}, []);

	const removeItem = useCallback((id: string) => {
		setInvoice((prev) => ({
			...prev,
			items: prev.items.filter((item) => item.id !== id),
		}));
	}, []);

	const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
		setInvoice((prev) => ({
			...prev,
			items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
		}));
	}, []);

	// Calculations
	const subtotal = useMemo(
		() => invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
		[invoice.items],
	);

	const discountAmount = useMemo(
		() => subtotal * (invoice.discountRate / 100),
		[subtotal, invoice.discountRate],
	);

	const taxableAmount = subtotal - discountAmount;

	const taxAmount = useMemo(
		() => taxableAmount * (invoice.taxRate / 100),
		[taxableAmount, invoice.taxRate],
	);

	const total = taxableAmount + taxAmount;

	const copyToClipboard = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			const ta = document.createElement("textarea");
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		}
	}, []);

	const generateTextInvoice = useCallback((): string => {
		const lines: string[] = [];
		lines.push("========================================");
		lines.push("INVOICE");
		lines.push("========================================");
		lines.push("");
		lines.push(`Invoice #: ${invoice.invoiceNumber}`);
		lines.push(`Date: ${invoice.invoiceDate}`);
		if (invoice.dueDate) lines.push(`Due Date: ${invoice.dueDate}`);
		lines.push("");
		lines.push("--- From ---");
		if (invoice.companyName) lines.push(invoice.companyName);
		if (invoice.companyAddress) lines.push(invoice.companyAddress);
		if (invoice.companyEmail) lines.push(invoice.companyEmail);
		if (invoice.companyPhone) lines.push(invoice.companyPhone);
		lines.push("");
		lines.push("--- Bill To ---");
		if (invoice.clientName) lines.push(invoice.clientName);
		if (invoice.clientAddress) lines.push(invoice.clientAddress);
		if (invoice.clientEmail) lines.push(invoice.clientEmail);
		lines.push("");
		lines.push("--- Line Items ---");
		lines.push("Description | Qty | Unit Price | Total");
		lines.push("----------------------------------------");
		for (const item of invoice.items) {
			if (!item.description) continue;
			const lineTotal = item.quantity * item.unitPrice;
			lines.push(
				`${item.description} | ${item.quantity} | ${formatCurrency(item.unitPrice, invoice.currency)} | ${formatCurrency(lineTotal, invoice.currency)}`,
			);
		}
		lines.push("----------------------------------------");
		lines.push(`Subtotal: ${formatCurrency(subtotal, invoice.currency)}`);
		if (invoice.discountRate > 0) {
			lines.push(
				`Discount (${invoice.discountRate}%): -${formatCurrency(discountAmount, invoice.currency)}`,
			);
		}
		if (invoice.taxRate > 0) {
			lines.push(`Tax (${invoice.taxRate}%): ${formatCurrency(taxAmount, invoice.currency)}`);
		}
		lines.push(`TOTAL: ${formatCurrency(total, invoice.currency)}`);
		if (invoice.notes) {
			lines.push("");
			lines.push("--- Notes ---");
			lines.push(invoice.notes);
		}
		return lines.join("\n");
	}, [invoice, subtotal, discountAmount, taxAmount, total]);

	const handlePrint = useCallback(() => {
		window.print();
	}, []);

	const handleReset = useCallback(() => {
		setInvoice(defaultInvoice());
	}, []);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: Form */}
				<div style="max-height: 700px; overflow-y: auto; padding-right: 8px">
					{/* Company Info */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Your Company</label>
						<div class="flex flex-col gap-2">
							<input
								class="input"
								placeholder="Company name"
								value={invoice.companyName}
								onInput={(e) => updateField("companyName", (e.target as HTMLInputElement).value)}
							/>
							<input
								class="input"
								placeholder="Address"
								value={invoice.companyAddress}
								onInput={(e) => updateField("companyAddress", (e.target as HTMLInputElement).value)}
							/>
							<div class="grid grid-cols-2 gap-2">
								<input
									class="input"
									placeholder="Email"
									value={invoice.companyEmail}
									onInput={(e) => updateField("companyEmail", (e.target as HTMLInputElement).value)}
								/>
								<input
									class="input"
									placeholder="Phone"
									value={invoice.companyPhone}
									onInput={(e) => updateField("companyPhone", (e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					</div>

					{/* Client Info */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Client</label>
						<div class="flex flex-col gap-2">
							<input
								class="input"
								placeholder="Client name"
								value={invoice.clientName}
								onInput={(e) => updateField("clientName", (e.target as HTMLInputElement).value)}
							/>
							<input
								class="input"
								placeholder="Address"
								value={invoice.clientAddress}
								onInput={(e) => updateField("clientAddress", (e.target as HTMLInputElement).value)}
							/>
							<input
								class="input"
								placeholder="Email"
								value={invoice.clientEmail}
								onInput={(e) => updateField("clientEmail", (e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					{/* Invoice Details */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Invoice Details</label>
						<div class="grid grid-cols-3 gap-2">
							<div>
								<label class="text-caption text-muted block mb-1">Invoice #</label>
								<input
									class="input"
									value={invoice.invoiceNumber}
									onInput={(e) =>
										updateField("invoiceNumber", (e.target as HTMLInputElement).value)
									}
								/>
							</div>
							<div>
								<label class="text-caption text-muted block mb-1">Date</label>
								<input
									class="input"
									type="date"
									value={invoice.invoiceDate}
									onInput={(e) => updateField("invoiceDate", (e.target as HTMLInputElement).value)}
								/>
							</div>
							<div>
								<label class="text-caption text-muted block mb-1">Due Date</label>
								<input
									class="input"
									type="date"
									value={invoice.dueDate}
									onInput={(e) => updateField("dueDate", (e.target as HTMLInputElement).value)}
								/>
							</div>
						</div>
					</div>

					{/* Currency */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Currency</label>
						<select
							class="input"
							value={invoice.currency}
							onChange={(e) => updateField("currency", (e.target as HTMLSelectElement).value)}
						>
							{Object.entries(CURRENCIES).map(([code, info]) => (
								<option key={code} value={code}>
									{info.symbol} {code}
								</option>
							))}
						</select>
					</div>

					{/* Line Items */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Line Items</label>
						<div class="flex flex-col gap-2">
							{invoice.items.map((item) => (
								<div key={item.id} class="flex gap-2 items-start">
									<input
										class="input"
										style="flex: 3"
										placeholder="Description"
										value={item.description}
										onInput={(e) =>
											updateItem(item.id, "description", (e.target as HTMLInputElement).value)
										}
									/>
									<input
										class="input"
										style="flex: 1"
										type="number"
										min="0"
										placeholder="Qty"
										value={item.quantity}
										onInput={(e) =>
											updateItem(
												item.id,
												"quantity",
												Number.parseFloat((e.target as HTMLInputElement).value) || 0,
											)
										}
									/>
									<input
										class="input"
										style="flex: 1"
										type="number"
										min="0"
										step="0.01"
										placeholder="Price"
										value={item.unitPrice}
										onInput={(e) =>
											updateItem(
												item.id,
												"unitPrice",
												Number.parseFloat((e.target as HTMLInputElement).value) || 0,
											)
										}
									/>
									<button
										class="btn-secondary"
										style="height: 44px; min-width: 44px"
										onClick={() => removeItem(item.id)}
										disabled={invoice.items.length <= 1}
									>
										×
									</button>
								</div>
							))}
						</div>
						<button class="btn-secondary mt-2" onClick={addItem}>
							+ Add Line Item
						</button>
					</div>

					{/* Tax & Discount */}
					<div class="mb-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">Tax Rate (%)</label>
								<input
									class="input"
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={invoice.taxRate}
									onInput={(e) =>
										updateField(
											"taxRate",
											Number.parseFloat((e.target as HTMLInputElement).value) || 0,
										)
									}
								/>
							</div>
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">Discount (%)</label>
								<input
									class="input"
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={invoice.discountRate}
									onInput={(e) =>
										updateField(
											"discountRate",
											Number.parseFloat((e.target as HTMLInputElement).value) || 0,
										)
									}
								/>
							</div>
						</div>
					</div>

					{/* Notes */}
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Notes / Terms</label>
						<textarea
							class="textarea"
							style="min-height: 80px"
							placeholder="Payment terms, thank you note, etc."
							value={invoice.notes}
							onInput={(e) => updateField("notes", (e.target as HTMLTextAreaElement).value)}
						/>
					</div>

					{/* Actions */}
					<div class="flex gap-2 flex-wrap">
						<button class="btn-primary" onClick={handlePrint}>
							Print Invoice
						</button>
						<button
							class="btn-secondary"
							onClick={() => copyToClipboard(generateTextInvoice(), "invoice-text")}
						>
							{copiedField === "invoice-text" ? "✓ Copied!" : "Copy as Text"}
						</button>
						<button class="btn-secondary" onClick={handleReset}>
							Reset Draft
						</button>
					</div>
				</div>

				{/* Right: Preview */}
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Invoice Preview</label>
					<div
						class="card"
						style="background-color: var(--color-canvas); max-height: 700px; overflow-y: auto"
					>
						<div style="padding: 8px">
							{/* Header */}
							<div class="flex justify-between items-start mb-6">
								<div>
									<h2 class="text-heading-lg">{invoice.companyName || "Your Company"}</h2>
									{invoice.companyAddress && (
										<p class="text-body-sm" style="color: var(--color-mute)">
											{invoice.companyAddress}
										</p>
									)}
									{invoice.companyEmail && (
										<p class="text-body-sm" style="color: var(--color-mute)">
											{invoice.companyEmail}
										</p>
									)}
									{invoice.companyPhone && (
										<p class="text-body-sm" style="color: var(--color-mute)">
											{invoice.companyPhone}
										</p>
									)}
								</div>
								<div style="text-align: right">
									<h1 class="text-heading-xl" style="color: var(--color-primary)">
										INVOICE
									</h1>
									<p class="text-body-sm" style="color: var(--color-mute)">
										#{invoice.invoiceNumber}
									</p>
								</div>
							</div>

							{/* Bill To + Dates */}
							<div class="grid grid-cols-2 gap-4 mb-6">
								<div>
									<p class="text-caption-uppercase text-muted mb-1">Bill To</p>
									<p class="text-body-strong">{invoice.clientName || "Client Name"}</p>
									{invoice.clientAddress && (
										<p class="text-body-sm" style="color: var(--color-mute)">
											{invoice.clientAddress}
										</p>
									)}
									{invoice.clientEmail && (
										<p class="text-body-sm" style="color: var(--color-mute)">
											{invoice.clientEmail}
										</p>
									)}
								</div>
								<div style="text-align: right">
									<p class="text-caption-uppercase text-muted mb-1">Date</p>
									<p class="text-body-sm">{invoice.invoiceDate}</p>
									{invoice.dueDate && (
										<>
											<p class="text-caption-uppercase text-muted mb-1 mt-2">Due Date</p>
											<p class="text-body-sm">{invoice.dueDate}</p>
										</>
									)}
								</div>
							</div>

							{/* Items Table */}
							<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px">
								<thead>
									<tr style="border-bottom: 2px solid var(--color-hairline)">
										<th style="text-align: left; padding: 8px 0; font-size: 12px; font-weight: 600; color: var(--color-mute); text-transform: uppercase; letter-spacing: 1px">
											Description
										</th>
										<th style="text-align: right; padding: 8px 0; font-size: 12px; font-weight: 600; color: var(--color-mute); text-transform: uppercase; letter-spacing: 1px; width: 60px">
											Qty
										</th>
										<th style="text-align: right; padding: 8px 0; font-size: 12px; font-weight: 600; color: var(--color-mute); text-transform: uppercase; letter-spacing: 1px; width: 100px">
											Price
										</th>
										<th style="text-align: right; padding: 8px 0; font-size: 12px; font-weight: 600; color: var(--color-mute); text-transform: uppercase; letter-spacing: 1px; width: 100px">
											Total
										</th>
									</tr>
								</thead>
								<tbody>
									{invoice.items.map((item) => (
										<tr key={item.id} style="border-bottom: 1px solid var(--color-hairline-soft)">
											<td style="padding: 8px 0; font-size: 14px">{item.description || "—"}</td>
											<td style="padding: 8px 0; font-size: 14px; text-align: right">
												{item.quantity}
											</td>
											<td style="padding: 8px 0; font-size: 14px; text-align: right">
												{formatCurrency(item.unitPrice, invoice.currency)}
											</td>
											<td style="padding: 8px 0; font-size: 14px; text-align: right">
												{formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
											</td>
										</tr>
									))}
								</tbody>
							</table>

							{/* Totals */}
							<div style="max-width: 280px; margin-left: auto">
								<div class="flex justify-between mb-1">
									<span class="text-body-sm" style="color: var(--color-mute)">
										Subtotal
									</span>
									<span class="text-body-sm">{formatCurrency(subtotal, invoice.currency)}</span>
								</div>
								{invoice.discountRate > 0 && (
									<div class="flex justify-between mb-1">
										<span class="text-body-sm" style="color: var(--color-mute)">
											Discount ({invoice.discountRate}%)
										</span>
										<span class="text-body-sm" style="color: var(--color-success)">
											-{formatCurrency(discountAmount, invoice.currency)}
										</span>
									</div>
								)}
								{invoice.taxRate > 0 && (
									<div class="flex justify-between mb-1">
										<span class="text-body-sm" style="color: var(--color-mute)">
											Tax ({invoice.taxRate}%)
										</span>
										<span class="text-body-sm">{formatCurrency(taxAmount, invoice.currency)}</span>
									</div>
								)}
								<div
									class="flex justify-between mt-2 pt-2"
									style="border-top: 2px solid var(--color-hairline)"
								>
									<span class="text-body-strong">TOTAL</span>
									<span class="text-heading-md" style="color: var(--color-primary)">
										{formatCurrency(total, invoice.currency)}
									</span>
								</div>
							</div>

							{/* Notes */}
							{invoice.notes && (
								<div class="mt-6">
									<p class="text-caption-uppercase text-muted mb-1">Notes</p>
									<p class="text-body-sm" style="color: var(--color-mute); white-space: pre-wrap">
										{invoice.notes}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
