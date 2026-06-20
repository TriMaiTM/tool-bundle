import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfMetadata() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [subject, setSubject] = useState("");
	const [keywords, setKeywords] = useState("");
	const [creator, setCreator] = useState("");
	const [producer, setProducer] = useState("");
	const [creationDate, setCreationDate] = useState("");
	const [modDate, setModDate] = useState("");

	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const t = {
		en: {
			title: "PDF Metadata Editor",
			lblSettings: "Metadata Fields",
			lblTitle: "Document Title",
			lblAuthor: "Author",
			lblSubject: "Subject",
			lblKeywords: "Keywords (comma separated)",
			lblCreator: "Creator / Application",
			lblProducer: "Producer",
			lblCreated: "Created Date",
			lblModified: "Modified Date",
			btnSave: "Save Metadata & Download",
			clearBtn: "Choose Another File",
			processingText: "Saving Metadata...",
			successText: "Metadata saved and PDF downloaded successfully!",
			errorText: "Failed to update PDF metadata.",
		},
		vi: {
			title: "Chỉnh sửa Metadata tệp PDF",
			lblSettings: "Thông tin Metadata",
			lblTitle: "Tiêu đề tài liệu",
			lblAuthor: "Tác giả",
			lblSubject: "Chủ đề",
			lblKeywords: "Từ khóa (cách nhau bởi dấu phẩy)",
			lblCreator: "Ứng dụng tạo (Creator)",
			lblProducer: "Nhà sản xuất (Producer)",
			lblCreated: "Ngày tạo",
			lblModified: "Ngày chỉnh sửa",
			btnSave: "Lưu Metadata & Tải về",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang lưu thông tin...",
			successText: "Cập nhật Metadata tệp PDF thành công!",
			errorText: "Lưu thông tin thất bại.",
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
		loadMetadata(f);
	}, []);

	const loadMetadata = async (f: File) => {
		try {
			const arrayBuffer = await f.arrayBuffer();
			// Read without throwing on encrypted block so we can read headers if available
			const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

			setTitle(pdfDoc.getTitle() || "");
			setAuthor(pdfDoc.getAuthor() || "");
			setSubject(pdfDoc.getSubject() || "");
			setKeywords(pdfDoc.getKeywords() || "");
			setCreator(pdfDoc.getCreator() || "");
			setProducer(pdfDoc.getProducer() || "");

			const created = pdfDoc.getCreationDate();
			setCreationDate(created ? created.toLocaleString() : "");

			const modified = pdfDoc.getModificationDate();
			setModDate(modified ? modified.toLocaleString() : "");
		} catch (err) {
			console.error(err);
			setError("Failed to read PDF metadata. The file may be encrypted.");
		}
	};

	const handleSave = async () => {
		if (!file) return;
		setProcessing(true);
		setError(null);
		setSuccess(false);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);

			pdfDoc.setTitle(title.trim());
			pdfDoc.setAuthor(author.trim());
			pdfDoc.setSubject(subject.trim());
			pdfDoc.setKeywords(
				keywords
					.split(",")
					.map((k) => k.trim())
					.filter(Boolean),
			);
			pdfDoc.setCreator(creator.trim());
			pdfDoc.setProducer(producer.trim());
			pdfDoc.setModificationDate(new Date());

			const pdfBytes = await pdfDoc.save();
			const blob = new Blob([pdfBytes], { type: "application/pdf" });

			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-meta.pdf`);
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
		setTitle("");
		setAuthor("");
		setSubject("");
		setKeywords("");
		setCreator("");
		setProducer("");
		setCreationDate("");
		setModDate("");
		setError(null);
		setSuccess(false);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblSettings}
					</h3>

					{!file ? (
						<FileDropZone
							accept=".pdf"
							multiple={false}
							onFiles={handleFiles}
							label="Drop a PDF file here to view or edit metadata"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-3">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<label class="text-body-sm-strong text-ink block">{t.lblTitle}</label>
									<input
										type="text"
										class="input w-full"
										value={title}
										onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1">
									<label class="text-body-sm-strong text-ink block">{t.lblAuthor}</label>
									<input
										type="text"
										class="input w-full"
										value={author}
										onInput={(e) => setAuthor((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>

							<div class="space-y-1">
								<label class="text-body-sm-strong text-ink block">{t.lblSubject}</label>
								<input
									type="text"
									class="input w-full"
									value={subject}
									onInput={(e) => setSubject((e.target as HTMLInputElement).value)}
								/>
							</div>

							<div class="space-y-1">
								<label class="text-body-sm-strong text-ink block">{t.lblKeywords}</label>
								<input
									type="text"
									class="input w-full"
									value={keywords}
									onInput={(e) => setKeywords((e.target as HTMLInputElement).value)}
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<label class="text-body-sm-strong text-ink block">{t.lblCreator}</label>
									<input
										type="text"
										class="input w-full"
										value={creator}
										onInput={(e) => setCreator((e.target as HTMLInputElement).value)}
									/>
								</div>
								<div class="space-y-1">
									<label class="text-body-sm-strong text-ink block">{t.lblProducer}</label>
									<input
										type="text"
										class="input w-full"
										value={producer}
										onInput={(e) => setProducer((e.target as HTMLInputElement).value)}
									/>
								</div>
							</div>

							<div class="flex gap-2 pt-2">
								<button
									class="btn-primary flex-1 py-2.5"
									onClick={handleSave}
									disabled={processing}
								>
									{processing ? t.processingText : t.btnSave}
								</button>
								<button class="btn-secondary py-2.5 px-4" onClick={handleReset}>
									{t.clearBtn}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* File Info / ReadOnly metadata info */}
				<div class="lg:col-span-6 space-y-4">
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

					{file && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								Document Properties
							</h3>
							<div class="space-y-2 text-xs font-mono">
								<div class="flex justify-between py-1 border-b border-hairline/40">
									<span class="text-muted">File Name:</span>
									<span class="text-ink truncate max-w-xs">{fileName}</span>
								</div>
								<div class="flex justify-between py-1 border-b border-hairline/40">
									<span class="text-muted">File Size:</span>
									<span class="text-ink">{pageSize}</span>
								</div>
								<div class="flex justify-between py-1 border-b border-hairline/40">
									<span class="text-muted">{t.lblCreated}:</span>
									<span class="text-ink">{creationDate || "-"}</span>
								</div>
								<div class="flex justify-between py-1">
									<span class="text-muted">{t.lblModified}:</span>
									<span class="text-ink">{modDate || "-"}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
