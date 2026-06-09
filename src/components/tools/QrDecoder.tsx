import { useCallback, useEffect, useState } from "preact/hooks";

interface WiFiConfig {
	ssid: string;
	pass: string;
	type: string;
}

export default function QrDecoder() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");
	const [payload, setPayload] = useState("");
	const [copied, setCopied] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	// Decoded metadata parsed helpers
	const [isUrl, setIsUrl] = useState(false);
	const [isJson, setIsJson] = useState(false);
	const [jsonFormatted, setJsonFormatted] = useState("");
	const [wifiInfo, setWifiInfo] = useState<WiFiConfig | null>(null);

	const t = {
		en: {
			title: "QR Payload Decoder",
			lblDrop: "Drop your QR code image here",
			lblOr: "or click to upload",
			lblFormat: "Supports PNG, JPG, WebP, SVG",
			lblResult: "Decoded QR Payload",
			btnCopy: "Copy Payload",
			copied: "Copied!",
			clearBtn: "Choose Another Image",
			errNoQr:
				"No QR Code found in this image. Try an image with higher contrast or clear borders.",
			errLib: "Failed to load decoding engine from CDN. Please check your internet connection.",
			lblType: "Detected Format",
			typeUrl: "URL Link",
			typeJson: "Structured JSON",
			typeWifi: "Wi-Fi Network Credentials",
			typeText: "Plain Text",
			btnGo: "Go to Link",
		},
		vi: {
			title: "Trình giải mã QR Payload",
			lblDrop: "Kéo thả ảnh mã QR của bạn vào đây",
			lblOr: "hoặc click để tải lên",
			lblFormat: "Hỗ trợ định dạng PNG, JPG, WebP, SVG",
			lblResult: "Nội dung giải mã QR (Payload)",
			btnCopy: "Sao chép nội dung",
			copied: "Đã copy!",
			clearBtn: "Chọn ảnh khác",
			errNoQr: "Không tìm thấy mã QR nào trong hình ảnh này. Hãy thử ảnh có độ tương phản tốt hơn.",
			errLib: "Không thể tải bộ xử lý giải mã từ CDN. Vui lòng kiểm tra kết nối mạng.",
			lblType: "Định dạng nhận diện",
			typeUrl: "Đường dẫn URL",
			typeJson: "Mã JSON có cấu trúc",
			typeWifi: "Thông tin mạng Wi-Fi",
			typeText: "Văn bản thường (Plain Text)",
			btnGo: "Mở đường dẫn",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Dynamic script loader for jsQR library
	const loadJsQR = (): Promise<any> => {
		return new Promise((resolve, reject) => {
			if ((window as any).jsQR) {
				resolve((window as any).jsQR);
				return;
			}
			const script = document.createElement("script");
			script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
			script.onload = () => resolve((window as any).jsQR);
			script.onerror = () => reject(new Error("Failed to load jsQR library from CDN"));
			document.head.appendChild(script);
		});
	};

	const decodeQrImage = useCallback(
		async (imgUrl: string) => {
			setStatus("loading");
			setErrorMsg("");
			setPayload("");
			setIsUrl(false);
			setIsJson(false);
			setWifiInfo(null);

			let jsQR: any;
			try {
				jsQR = await loadJsQR();
			} catch {
				setStatus("failed");
				setErrorMsg(t.errLib);
				return;
			}

			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					setStatus("failed");
					setErrorMsg("Could not create canvas context.");
					return;
				}

				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				ctx.drawImage(img, 0, 0);

				const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR(imgData.data, imgData.width, imgData.height, {
					inversionAttempts: "dontInvert",
				});

				if (code?.data) {
					const data = code.data;
					setPayload(data);
					setStatus("success");

					// Detect URL
					if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(data)) {
						setIsUrl(true);
					}

					// Detect JSON
					try {
						const parsed = JSON.parse(data);
						setIsJson(true);
						setJsonFormatted(JSON.stringify(parsed, null, 2));
					} catch {
						setIsJson(false);
					}

					// Detect WIFI format: WIFI:S:MySSID;T:WPA;P:password;;
					if (data.startsWith("WIFI:")) {
						const ssidMatch = data.match(/S:([^;]+)/);
						const passMatch = data.match(/P:([^;]+)/);
						const typeMatch = data.match(/T:([^;]+)/);
						if (ssidMatch) {
							setWifiInfo({
								ssid: ssidMatch[1],
								pass: passMatch ? passMatch[1] : "",
								type: typeMatch ? typeMatch[1] : "WPA",
							});
						}
					}
				} else {
					setStatus("failed");
					setErrorMsg(t.errNoQr);
				}
			};

			img.onerror = () => {
				setStatus("failed");
				setErrorMsg("Failed to load image source.");
			};

			img.src = imgUrl;
		},
		[t.errLib, t.errNoQr],
	);

	// Handling file upload/drops
	const handleFileChange = (e: Event) => {
		const files = (e.target as HTMLInputElement).files;
		if (files && files.length > 0) {
			const url = URL.createObjectURL(files[0]);
			setImageSrc(url);
			decodeQrImage(url);
		}
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			const url = URL.createObjectURL(files[0]);
			setImageSrc(url);
			decodeQrImage(url);
		}
	};

	// Paste clipboard event listener
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						const file = items[i].getAsFile();
						if (file) {
							const url = URL.createObjectURL(file);
							setImageSrc(url);
							decodeQrImage(url);
						}
					}
				}
			}
		};

		window.addEventListener("paste", handlePaste);
		return () => window.removeEventListener("paste", handlePaste);
	}, [decodeQrImage]);

	const handleCopy = () => {
		if (!payload) return;
		navigator.clipboard.writeText(payload).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleReset = () => {
		setImageSrc(null);
		setStatus("idle");
		setPayload("");
		setErrorMsg("");
		setIsUrl(false);
		setIsJson(false);
		setWifiInfo(null);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Drag drop / Preview panel */}
				<div class="lg:col-span-5 space-y-4">
					{!imageSrc ? (
						<div
							class="border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-10 text-center cursor-pointer bg-surface-elevated shadow-sm hover:shadow transition-all space-y-3"
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
							onClick={() => document.getElementById("qr-upload-input")?.click()}
						>
							<input
								id="qr-upload-input"
								type="file"
								accept="image/*"
								class="hidden"
								onChange={handleFileChange}
							/>
							<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
							</div>
							<div class="space-y-1">
								<p class="text-body-sm-strong text-ink">{t.lblDrop}</p>
								<p class="text-xs text-muted">{t.lblOr}</p>
							</div>
							<p class="text-[11px] text-muted">{t.lblFormat}</p>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<div class="bg-surface-soft p-3 rounded-lg flex items-center justify-center max-h-72 overflow-hidden border border-hairline">
								<img src={imageSrc} alt="QR Code Preview" class="max-h-60 object-contain rounded" />
							</div>
							<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
								{t.clearBtn}
							</button>
						</div>
					)}
				</div>

				{/* Result / Payload Information */}
				<div class="lg:col-span-7 space-y-4">
					{status === "loading" && (
						<div class="bg-surface-elevated rounded-lg p-10 border border-hairline shadow-sm text-center text-muted text-body-sm">
							Scanning image data and decoding QR payload...
						</div>
					)}

					{status === "failed" && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-5">
							<h4 class="text-body-sm-strong text-accent-rose font-bold mb-1">Failed to Decode</h4>
							<p class="text-body-sm text-muted">{errorMsg}</p>
						</div>
					)}

					{status === "success" && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
							<div class="flex justify-between items-center border-b border-hairline pb-3">
								<span class="text-body-strong text-ink">{t.lblResult}</span>
								<button
									class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
									onClick={handleCopy}
								>
									{copied ? t.copied : t.btnCopy}
								</button>
							</div>

							{/* Format classification badge */}
							<div class="space-y-1.5">
								<span class="text-xs text-muted font-bold uppercase">{t.lblType}</span>
								<div>
									<span class="badge badge-indigo">
										{isUrl ? t.typeUrl : isJson ? t.typeJson : wifiInfo ? t.typeWifi : t.typeText}
									</span>
								</div>
							</div>

							{/* Decoded content body */}
							<div class="space-y-3">
								{isUrl && (
									<div class="flex gap-2">
										<input
											type="text"
											class="input flex-1 font-mono text-body-sm font-bold bg-surface-soft"
											readOnly
											value={payload}
										/>
										<a
											href={payload}
											target="_blank"
											rel="noopener noreferrer"
											class="btn-primary py-2 px-4 text-xs font-bold flex items-center justify-center"
										>
											{t.btnGo}
										</a>
									</div>
								)}

								{isJson && (
									<textarea
										class="textarea font-mono text-body-sm w-full bg-surface-soft"
										style={{ minHeight: "180px" }}
										readOnly
										value={jsonFormatted}
									/>
								)}

								{wifiInfo && (
									<div class="bg-surface-soft p-4 rounded-lg border border-hairline space-y-2 text-xs font-mono">
										<div>
											<span class="text-muted font-bold">Network Name (SSID):</span>{" "}
											<span class="text-primary font-bold">{wifiInfo.ssid}</span>
										</div>
										<div>
											<span class="text-muted font-bold">Password:</span>{" "}
											<span class="text-ink font-bold">{wifiInfo.pass || "(No password)"}</span>
										</div>
										<div>
											<span class="text-muted font-bold">Security Type:</span>{" "}
											<span class="text-muted">{wifiInfo.type}</span>
										</div>
									</div>
								)}

								{!isUrl && !isJson && !wifiInfo && (
									<textarea
										class="textarea font-mono text-body-sm w-full bg-surface-soft"
										style={{ minHeight: "150px" }}
										readOnly
										value={payload}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
