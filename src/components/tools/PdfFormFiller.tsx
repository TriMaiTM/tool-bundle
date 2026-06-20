import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface FormFieldItem {
	name: string;
	type: "text" | "checkbox" | "dropdown" | "unknown";
	value: string | boolean;
	options?: string[]; // for dropdowns
}

export default function PdfFormFiller() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [fields, setFields] = useState<FormFieldItem[]>([]);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const t = {
		en: {
			title: "PDF Form Filler",
			lblSettings: "Interactive Fields Form",
			btnSave: "Fill Form & Download",
			clearBtn: "Choose Another File",
			processingText: "Generating filled PDF...",
			successText: "Form filled and PDF downloaded successfully!",
			errorText: "Failed to read form fields or save document.",
			noFields: "No interactive form fields found in this PDF document.",
		},
		vi: {
			title: "Điền biểu mẫu PDF (Form Filler)",
			lblSettings: "Nhập thông tin biểu mẫu",
			btnSave: "Điền & Tải về tệp PDF",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang tạo tệp PDF mới...",
			successText: "Điền thông tin và tải tệp PDF thành công!",
			errorText: "Gặp lỗi khi điền hoặc lưu tệp tin.",
			noFields: "Không tìm thấy các trường thông tin tương tác nào trong tệp PDF này.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setFileName(f.name);
		setPageSize(formatFileSize(f.size));
		setError(null);
		setSuccess(false);
		loadFormFields(f);
	}, []);

	const loadFormFields = async (f: File) => {
		try {
			const arrayBuffer = await f.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const form = pdfDoc.getForm();
			const allFields = form.getFields();

			const list: FormFieldItem[] = [];
			for (const field of allFields) {
				const name = field.getName();

				if (field instanceof PDFTextField) {
					list.push({
						name,
						type: "text",
						value: field.getText() || "",
					});
				} else if (field instanceof PDFCheckBox) {
					list.push({
						name,
						type: "checkbox",
						value: field.isChecked(),
					});
				} else if (field instanceof PDFDropdown) {
					list.push({
						name,
						type: "dropdown",
						value: field.getSelected()[0] || "",
						options: field.getOptions(),
					});
				} else {
					list.push({
						name,
						type: "unknown",
						value: "",
					});
				}
			}

			setFields(list);
		} catch (err) {
			console.error(err);
			setError("Failed to parse PDF form. The document may be password-protected.");
		}
	};

	const handleValueChange = (name: string, value: string | boolean) => {
		setFields((prev) =>
			prev.map((f) => {
				if (f.name === name) {
					return { ...f, value };
				}
				return f;
			}),
		);
		setSuccess(false);
	};

	const handleFillAndDownload = async () => {
		if (!file) return;
		setProcessing(true);
		setError(null);
		setSuccess(false);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			const form = pdfDoc.getForm();

			for (const field of fields) {
				if (field.type === "text") {
					const f = form.getTextField(field.name);
					f.setText(field.value as string);
				} else if (field.type === "checkbox") {
					const f = form.getCheckBox(field.name);
					if (field.value) {
						f.check();
					} else {
						f.uncheck();
					}
				} else if (field.type === "dropdown") {
					const f = form.getDropdown(field.name);
					f.select(field.value as string);
				}
			}

			const pdfBytes = await pdfDoc.save();
			const blob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-filled.pdf`);
			setSuccess(true);
		} catch (err) {
			console.error(err);
			setError(t.errorText);
		} finally {
			setProcessing(false);
		}
	};

	const handleReset = () => {
		setFile(null);
		setFileName("");
		setPageSize("");
		setFields([]);
		setError(null);
		setSuccess(false);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* File upload/Input panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						Document Source
					</h3>

					{!file ? (
						<FileDropZone
							accept=".pdf"
							multiple={false}
							onFiles={handleFiles}
							label="Drop a PDF form here to fill it out"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
							</div>

							{fields.length > 0 && (
								<button
									class="btn-primary w-full py-2.5 font-bold"
									onClick={handleFillAndDownload}
									disabled={processing}
								>
									{processing ? t.processingText : t.btnSave}
								</button>
							)}

							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Fields Editor list panel */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					{success && (
						<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 text-body-sm text-accent-emerald font-bold">
							{t.successText}
						</div>
					)}

					{file && fields.length === 0 && !error && (
						<div class="bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm text-center text-muted text-body-sm">
							{t.noFields}
						</div>
					)}

					{fields.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4 max-h-[550px] overflow-y-auto pr-2">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblSettings}
							</h3>

							<div class="space-y-4">
								{fields.map((field) => (
									<div key={field.name} class="space-y-1">
										<label class="text-body-sm-strong text-ink block font-bold truncate">
											{field.name}
										</label>

										{field.type === "text" && (
											<input
												type="text"
												class="input w-full"
												value={field.value as string}
												onInput={(e) =>
													handleValueChange(field.name, (e.target as HTMLInputElement).value)
												}
											/>
										)}

										{field.type === "checkbox" && (
											<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer pt-1">
												<input
													type="checkbox"
													class="accent-primary"
													checked={field.value as boolean}
													onChange={(e) =>
														handleValueChange(field.name, (e.target as HTMLInputElement).checked)
													}
												/>
												Toggle Checkbox
											</label>
										)}

										{field.type === "dropdown" && (
											<select
												class="input w-full"
												value={field.value as string}
												onChange={(e) =>
													handleValueChange(field.name, (e.target as HTMLSelectElement).value)
												}
											>
												{field.options?.map((opt) => (
													<option key={opt} value={opt}>
														{opt}
													</option>
												))}
											</select>
										)}

										{field.type === "unknown" && (
											<span class="text-xs text-muted block italic">Unsupported Field Type</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
