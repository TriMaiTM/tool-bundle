import { useCallback, useEffect, useState } from "preact/hooks";

interface ValidationResult {
	uuid: string;
	isValid: boolean;
	version: string;
	variant: string;
}

export default function UuidValidator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [inputText, setInputText] = useState(
		"123e4567-e89b-12d3-a456-426614174000\nnot-a-uuid\nf81d4fae-7dec-11d0-a765-00a0c91e6bf6",
	);
	const [mode, setMode] = useState<"single" | "bulk">("single");
	const [singleInput, setSingleInput] = useState("123e4567-e89b-12d3-a456-426614174000");

	const [singleResult, setSingleResult] = useState<ValidationResult | null>(null);
	const [bulkResults, setBulkResults] = useState<ValidationResult[]>([]);

	const t = {
		en: {
			title: "UUID Validator & Metadata Extractor",
			tabSingle: "Single Validator",
			tabBulk: "Bulk Validator",
			lblSingleInput: "Enter UUID to validate",
			lblBulkInput: "Enter UUID list (one per line)",
			lblStatus: "Validation Status",
			lblVersion: "UUID Version",
			lblVariant: "UUID Variant",
			valid: "Valid",
			invalid: "Invalid",
			colUuid: "UUID String",
			colStatus: "Status",
			colVersion: "Version",
			colVariant: "Variant",
			clearBtn: "Clear",
			placeholderSingle: "e.g. 123e4567-e89b-12d3-a456-426614174000",
			placeholderBulk: "Paste list of UUIDs...",
		},
		vi: {
			title: "Trình xác thực & Phân tích UUID",
			tabSingle: "Xác thực đơn",
			tabBulk: "Xác thực hàng loạt",
			lblSingleInput: "Nhập mã UUID cần xác thực",
			lblBulkInput: "Nhập danh sách UUID (mỗi dòng một mã)",
			lblStatus: "Trạng thái hợp lệ",
			lblVersion: "Phiên bản (Version)",
			lblVariant: "Biến thể (Variant)",
			valid: "Hợp lệ",
			invalid: "Không hợp lệ",
			colUuid: "Chuỗi UUID",
			colStatus: "Trạng thái",
			colVersion: "Phiên bản",
			colVariant: "Biến thể",
			clearBtn: "Xóa sạch",
			placeholderSingle: "Ví dụ: 123e4567-e89b-12d3-a456-426614174000",
			placeholderBulk: "Dán danh sách các UUID cần kiểm tra...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const analyzeUuid = (uuidStr: string): ValidationResult => {
		const clean = uuidStr.trim();
		// General RFC4122 regex
		const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-([89ab])[0-9a-f]{3}-[0-9a-f]{12}$/i;
		const match = clean.match(regex);

		if (!match) {
			// Check if it's nil UUID
			if (clean === "00000000-0000-0000-0000-000000000000") {
				return {
					uuid: clean,
					isValid: true,
					version: "Nil (All zeros)",
					variant: "RFC 4122",
				};
			}
			return {
				uuid: clean,
				isValid: false,
				version: "Unknown",
				variant: "Unknown",
			};
		}

		const versionDigit = match[1];
		const variantChar = match[2].toLowerCase();

		let variantStr = "RFC 4122";
		if (["8", "9", "a", "b"].includes(variantChar)) {
			variantStr = "RFC 4122 (Variant 1)";
		}

		return {
			uuid: clean,
			isValid: true,
			version: `v${versionDigit}`,
			variant: variantStr,
		};
	};

	const handleValidate = useCallback(() => {
		if (mode === "single") {
			if (!singleInput.trim()) {
				setSingleResult(null);
				return;
			}
			setSingleResult(analyzeUuid(singleInput));
		} else {
			const lines = inputText.split("\n");
			const results: ValidationResult[] = [];
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed) {
					results.push(analyzeUuid(trimmed));
				}
			}
			setBulkResults(results);
		}
	}, [mode, singleInput, inputText]);

	useEffect(() => {
		handleValidate();
	}, [handleValidate]);

	const handleClear = () => {
		if (mode === "single") {
			setSingleInput("");
			setSingleResult(null);
		} else {
			setInputText("");
			setBulkResults([]);
		}
	};

	return (
		<div class="space-y-6">
			{/* Mode select tabs */}
			<div class="flex border-b border-hairline gap-2">
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						mode === "single"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("single")}
				>
					{t.tabSingle}
				</button>
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						mode === "bulk"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("bulk")}
				>
					{t.tabBulk}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input Panels */}
				<div class="lg:col-span-6 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-body-sm-strong text-ink">
								{mode === "single" ? t.lblSingleInput : t.lblBulkInput}
							</span>
							<button class="btn-tertiary text-xs py-1 px-3" onClick={handleClear}>
								{t.clearBtn}
							</button>
						</div>

						{mode === "single" ? (
							<input
								type="text"
								class="input w-full font-mono text-body-sm text-center"
								placeholder={t.placeholderSingle}
								value={singleInput}
								onInput={(e) => setSingleInput((e.target as HTMLInputElement).value)}
							/>
						) : (
							<textarea
								class="textarea font-mono text-body-sm w-full"
								style={{ minHeight: "280px" }}
								placeholder={t.placeholderBulk}
								value={inputText}
								onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
							/>
						)}
					</div>
				</div>

				{/* Output Panels */}
				<div class="lg:col-span-6 space-y-4">
					{mode === "single" && singleResult && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblStatus}
							</h3>

							<div class="grid grid-cols-2 gap-4">
								{/* Valid status banner */}
								<div class="col-span-2">
									{singleResult.isValid ? (
										<div class="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-lg text-sm font-bold text-center">
											{t.valid} UUID
										</div>
									) : (
										<div class="p-4 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose rounded-lg text-sm font-bold text-center">
											{t.invalid} UUID Format
										</div>
									)}
								</div>

								{singleResult.isValid && (
									<>
										{/* Version */}
										<div class="p-3 bg-surface-soft border border-hairline rounded-lg text-center">
											<div class="text-xs text-muted font-bold uppercase">{t.lblVersion}</div>
											<div class="text-title-sm font-bold text-primary mt-1">
												{singleResult.version}
											</div>
										</div>

										{/* Variant */}
										<div class="p-3 bg-surface-soft border border-hairline rounded-lg text-center">
											<div class="text-xs text-muted font-bold uppercase">{t.lblVariant}</div>
											<div class="text-body-sm-strong text-ink font-bold mt-1">
												{singleResult.variant}
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					)}

					{mode === "bulk" && bulkResults.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								Bulk Status Results
							</h3>

							<div class="overflow-x-auto border border-hairline rounded-lg max-h-[380px] overflow-y-auto">
								<table class="w-full text-left border-collapse text-xs font-mono">
									<thead>
										<tr class="bg-surface-soft border-b border-hairline text-ink font-bold sticky top-0">
											<th class="p-2.5">{t.colUuid}</th>
											<th class="p-2.5 text-center">{t.colStatus}</th>
											<th class="p-2.5 text-center">{t.colVersion}</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-hairline">
										{bulkResults.map((res, idx) => (
											<tr key={idx} class="hover:bg-surface-soft/50 text-ink">
												<td class="p-2.5 font-bold break-all">{res.uuid}</td>
												<td class="p-2.5 text-center">
													<span
														class={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
															res.isValid
																? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
																: "bg-accent-rose/10 border-accent-rose/20 text-accent-rose"
														}`}
													>
														{res.isValid ? t.valid : t.invalid}
													</span>
												</td>
												<td class="p-2.5 text-center font-bold text-primary">{res.version}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
