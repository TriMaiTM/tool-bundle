import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

const LANGUAGES = [
	{ code: "eng", name: "English" },
	{ code: "vie", name: "Vietnamese" },
	{ code: "jpn", name: "Japanese" },
	{ code: "kor", name: "Korean" },
	{ code: "chi_sim", name: "Chinese (Simplified)" },
	{ code: "chi_tra", name: "Chinese (Traditional)" },
	{ code: "fra", name: "French" },
	{ code: "deu", name: "German" },
	{ code: "spa", name: "Spanish" },
	{ code: "ita", name: "Italian" },
	{ code: "por", name: "Portuguese" },
	{ code: "rus", name: "Russian" },
	{ code: "ara", name: "Arabic" },
	{ code: "tha", name: "Thai" },
	{ code: "hin", name: "Hindi" },
];

export default function PdfOcr() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [ocrLang, setOcrLang] = useState("eng");
	const [status, setStatus] = useState<"idle" | "loading-engine" | "scanning" | "done" | "error">(
		"idle",
	);
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("");

	const [result, setResult] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const abortRef = useRef(false);

	const t = {
		en: {
			title: "PDF Document OCR Scanner",
			lblSettings: "Scan Configuration",
			lblLang: "Recognition Language",
			btnProcess: "Scan & Extract Text",
			clearBtn: "Choose Another File",
			statusEngine: "Initializing OCR Engine...",
			statusScanning: "Scanning Page ",
			successText: "Text extracted successfully!",
			btnCopy: "Copy Text",
			btnDownload: "Download .txt",
			copied: "Copied!",
			tipsTitle: "OCR Optimization Tips",
		},
		vi: {
			title: "Nhận diện chữ PDF (PDF OCR)",
			lblSettings: "Cấu hình nhận diện",
			lblLang: "Ngôn ngữ nhận diện",
			btnProcess: "Bắt đầu nhận diện",
			clearBtn: "Chọn tệp khác",
			statusEngine: "Đang khởi tạo công cụ nhận diện...",
			statusScanning: "Đang quét Trang ",
			successText: "Trích xuất văn bản thành công!",
			btnCopy: "Sao chép văn bản",
			btnDownload: "Tải về tệp .txt",
			copied: "Đã copy!",
			tipsTitle: "Lưu ý tối ưu OCR",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Dynamic script loader for pdf.js
	const loadPdfJS = (): Promise<any> => {
		return new Promise((resolve, reject) => {
			if ((window as any).pdfjsLib) {
				resolve((window as any).pdfjsLib);
				return;
			}
			const script = document.createElement("script");
			script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
			script.onload = () => {
				const pdfjs = (window as any).pdfjsLib;
				pdfjs.GlobalWorkerOptions.workerSrc =
					"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
				resolve(pdfjs);
			};
			script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
			document.head.appendChild(script);
		});
	};

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setFileName(f.name);
		setPageSize(formatFileSize(f.size));
		setResult("");
		setError(null);
		setStatus("idle");
		setProgress(0);
		setCopied(false);
	}, []);

	const handleOcrProcess = async () => {
		if (!file) return;
		abortRef.current = false;
		setStatus("loading-engine");
		setProgress(0);
		setError(null);
		setResult("");
		setCopied(false);

		let pdfjs: any;
		try {
			pdfjs = await loadPdfJS();
		} catch {
			setStatus("error");
			setError("Failed to load PDF preview engine from CDN.");
			return;
		}

		try {
			// Dynamic import of OCR utils
			const { performOCR } = await import("../../utils/ai");

			const arrayBuffer = await file.arrayBuffer();
			const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
			const pdf = await loadingTask.promise;
			const pagesCount = pdf.numPages;

			setStatus("scanning");
			let combinedText = "";

			for (let pageNum = 1; pageNum <= pagesCount; pageNum++) {
				if (abortRef.current) return;
				setStatusText(`${t.statusScanning} ${pageNum} / ${pagesCount}`);

				const page = await pdf.getPage(pageNum);
				const viewport = page.getViewport({ scale: 1.5 }); // Balanced scale for speed and quality

				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				if (!context) continue;

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				await page.render({
					canvasContext: context,
					viewport: viewport,
				}).promise;

				// Convert to Blob to pass to OCR
				const blob = await new Promise<Blob | null>((resolve) =>
					canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
				);
				if (!blob) continue;

				const { text } = await performOCR(blob, ocrLang, (p) => {
					// Local page progress mapping into total progress
					const localProgress = Math.round(
						((pageNum - 1) / pagesCount) * 100 + (p * 100) / pagesCount,
					);
					setProgress(localProgress);
				});

				combinedText += `--- PAGE ${pageNum} ---\n${text}\n\n`;
			}

			setResult(combinedText.trim());
			setStatus("done");
		} catch (err) {
			console.error(err);
			if (!abortRef.current) {
				setError(
					"OCR scan failed. Make sure the PDF document has valid images and is not encrypted.",
				);
				setStatus("error");
			}
		}
	};

	const handleCopy = useCallback(async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* fallback */
		}
	}, [result]);

	const handleDownload = () => {
		if (!result) return;
		const blob = new Blob([result], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${fileName.replace(/\.pdf$/i, "")}-ocr.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleReset = () => {
		abortRef.current = true;
		setFile(null);
		setFileName("");
		setPageSize("");
		setResult("");
		setError(null);
		setStatus("idle");
		setProgress(0);
		setCopied(false);
	};

	const isProcessing = status === "loading-engine" || status === "scanning";

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Settings Controls */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblSettings}
					</h3>

					{!file ? (
						<FileDropZone
							accept=".pdf"
							multiple={false}
							onFiles={handleFiles}
							label="Drop scanned PDF here to perform OCR"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
							</div>

							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblLang}</label>
								<select
									class="input w-full"
									value={ocrLang}
									onChange={(e) => setOcrLang((e.target as HTMLSelectElement).value)}
									disabled={isProcessing}
								>
									{LANGUAGES.map((l) => (
										<option key={l.code} value={l.code}>
											{l.name}
										</option>
									))}
								</select>
							</div>

							{!isProcessing && status !== "done" && (
								<button class="btn-primary w-full py-2.5 font-bold" onClick={handleOcrProcess}>
									{t.btnProcess}
								</button>
							)}

							{file && !isProcessing && (
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.clearBtn}
								</button>
							)}
						</div>
					)}
				</div>

				{/* Output Panel / Progress */}
				<div class="lg:col-span-7 space-y-4">
					{/* Processing Progress Bar */}
					{isProcessing && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
							<div class="flex justify-between items-center text-body-sm">
								<span class="text-ink font-bold">
									{status === "loading-engine" ? t.statusEngine : statusText}
								</span>
								<span class="text-primary font-mono font-bold">{progress}%</span>
							</div>
							<div class="w-full bg-surface-soft rounded-full h-2 overflow-hidden">
								<div
									class="bg-primary h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<span class="text-[10px] text-muted block leading-normal">
								First time scanning page requires downloading standard language models (~4MB).
								Processing runs entirely local.
							</span>
						</div>
					)}

					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					{status === "done" && result && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<div class="flex justify-between items-center border-b border-hairline pb-3">
								<span class="text-body-strong text-accent-emerald font-bold">{t.successText}</span>
								<div class="flex gap-2">
									<button class="btn-secondary py-1 px-3 text-xs font-bold" onClick={handleCopy}>
										{copied ? t.copied : t.btnCopy}
									</button>
									<button
										class="btn-secondary py-1 px-3 text-xs font-bold"
										onClick={handleDownload}
									>
										{t.btnDownload}
									</button>
								</div>
							</div>
							<textarea
								class="textarea font-mono text-body-sm w-full bg-surface-soft"
								style={{ minHeight: "260px" }}
								readOnly
								value={result}
							/>
						</div>
					)}

					{/* OCR optimization tips block */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<h4 class="text-body-strong text-ink font-bold">{t.tipsTitle}</h4>
						<ul class="list-disc pl-5 text-xs text-muted space-y-1.5">
							<li>Scanning is 100% private. Files never leave your local browser thread.</li>
							<li>
								For document scans, select the language matching the primary text for highest
								accuracy.
							</li>
							<li>
								Large PDF scans may take several seconds per page due to client-side CPU processing
								limits.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
