import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { useCallback, useEffect, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function PdfEncrypt() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [pageSize, setPageSize] = useState("");

	const [userPassword, setUserPassword] = useState("");
	const [ownerPassword, setOwnerPassword] = useState("");
	const [showPass, setShowPass] = useState(false);

	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const t = {
		en: {
			title: "PDF Password Protect Tool",
			lblSettings: "Encryption Settings",
			lblUserPass: "User Password (Required to Open)",
			lblOwnerPass: "Owner Password (Optional)",
			lblShowPass: "Show Passwords",
			btnProcess: "Encrypt & Download",
			clearBtn: "Choose Another File",
			processingText: "Encrypting PDF...",
			successText: "PDF encrypted and downloaded successfully!",
			errorText: "Failed to encrypt PDF. Ensure it is not already password protected.",
		},
		vi: {
			title: "Đặt mật khẩu bảo vệ PDF",
			lblSettings: "Cấu hình mật khẩu",
			lblUserPass: "Mật khẩu người dùng (Bắt buộc nhập khi mở)",
			lblOwnerPass: "Mật khẩu chủ sở hữu (Không bắt buộc)",
			lblShowPass: "Hiển thị mật khẩu",
			btnProcess: "Đặt mật khẩu & Tải về",
			clearBtn: "Chọn tệp khác",
			processingText: "Đang tiến hành mã hóa...",
			successText: "Mã hóa bảo vệ tệp PDF thành công!",
			errorText: "Không thể đặt mật khẩu cho tệp PDF. Đảm bảo tệp gốc chưa bị khóa.",
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

	const handleEncrypt = async () => {
		if (!file || !userPassword.trim()) return;
		setProcessing(true);
		setError(null);
		setSuccess(false);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const uint8 = new Uint8Array(arrayBuffer);

			const encryptedBytes = await encryptPDF(
				uint8,
				userPassword.trim(),
				ownerPassword.trim() || null,
			);

			const blob = new Blob([encryptedBytes], { type: "application/pdf" });
			const baseName = fileName.replace(/\.pdf$/i, "");
			downloadBlob(blob, `${baseName}-protected.pdf`);

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
		setUserPassword("");
		setOwnerPassword("");
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
							label="Drop a PDF file here to password protect"
							sublabel="PDF sizes up to 50MB"
						/>
					) : (
						<div class="space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg text-xs space-y-1">
								<div class="font-bold text-ink truncate">{fileName}</div>
								<div class="text-muted">Size: {pageSize}</div>
							</div>

							{/* User Password */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblUserPass}</label>
								<input
									type={showPass ? "text" : "password"}
									class="input w-full font-mono text-body-sm font-bold"
									value={userPassword}
									onInput={(e) => setUserPassword((e.target as HTMLInputElement).value)}
								/>
							</div>

							{/* Owner Password */}
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblOwnerPass}</label>
								<input
									type={showPass ? "text" : "password"}
									class="input w-full font-mono text-body-sm"
									value={ownerPassword}
									onInput={(e) => setOwnerPassword((e.target as HTMLInputElement).value)}
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
								onClick={handleEncrypt}
								disabled={processing || !userPassword.trim()}
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
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{error}
						</div>
					)}

					{success && (
						<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 text-body-sm text-accent-emerald font-bold">
							{t.successText}
						</div>
					)}

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold">Encryption Security & Privacy</h4>
						<p class="text-body-sm text-muted leading-relaxed">
							This tool uses standard PDF RC4 128-bit encryption directly inside your browser. No
							files or passwords are sent to any remote server, guaranteeing complete privacy for
							your sensitive data.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
