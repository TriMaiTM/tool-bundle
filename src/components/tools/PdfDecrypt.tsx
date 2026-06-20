import { decryptPDF } from "@pdfsmaller/pdf-decrypt";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfDecrypt() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [password, setPassword] = useState("");
	const [showPass, setShowPass] = useState(false);

	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const t = {
		en: {
			title: "PDF Password Remover Tool (Unlock)",
			lblSettings: "Unlock Settings",
			lblPassword: "Enter Current PDF Password",
			lblShowPass: "Show Password",
			btnProcess: "Unlock & Download",
			clearBtn: "Choose Another File",
			processingText: "Decrypting PDF...",
			successText: "PDF decrypted and unlocked successfully!",
			errorText: "Failed to decrypt PDF. Verify the password is correct.",
		},
		vi: {
			title: "Mở khóa tệp PDF (Gỡ mật khẩu)",
			lblSettings: "Cấu hình giải mã",
			lblPassword: "Nhập mật khẩu PDF hiện tại",
			lblShowPass: "Hiển thị mật khẩu",
			btnProcess: "Gỡ mật khẩu & Tải về",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang mở khóa...",
			successText: "Gỡ mật khẩu bảo vệ PDF thành công!",
			errorText: "Mở khóa thất bại. Hãy kiểm tra lại mật khẩu.",
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
	}, []);

	const handleDecrypt = async () => {
		if (!file || !password.trim()) return;
		setProcessing(true);
		setError(null);
		setSuccess(false);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const uint8 = new Uint8Array(arrayBuffer);

			const decryptedBytes = await decryptPDF(uint8, password.trim());

			const blob = new Blob([decryptedBytes], { type: "application/pdf" });
			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-unlocked.pdf`);

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
		setPassword("");
		setError(null);
		setSuccess(false);
	};

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
							label="Drop a locked PDF file here to unlock"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
							</div>

							{/* Password Input */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblPassword}</label>
								<input
									type={showPass ? "text" : "password"}
									class="input w-full font-mono text-body-sm font-bold"
									value={password}
									onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
								/>
							</div>

							{/* Show password check */}
							<div>
								<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
									<input
										type="checkbox"
										class="accent-primary"
										checked={showPass}
										onChange={(e) => setShowPass((e.target as HTMLInputElement).checked)}
									/>
									{t.lblShowPass}
								</label>
							</div>

							<button
								class="btn-primary w-full py-2.5"
								onClick={handleDecrypt}
								disabled={processing || !password.trim()}
							>
								{processing ? t.processingText : t.btnProcess}
							</button>

							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Info Panel */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{success && (
						<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 text-body-sm text-accent-emerald font-bold">
							{t.successText}
						</div>
					)}

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold">Client-Side Decryption</h4>
						<p class="text-body-sm text-muted leading-relaxed">
							Removing a PDF password requires executing the standard cryptographic key derivation
							(hashing the password with document identifiers) and decrypting content streams. All
							algorithms execute directly in JavaScript/WASM inside your local browser tab.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
