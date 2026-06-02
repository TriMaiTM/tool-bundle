import { useCallback, useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

interface ExifData {
	make?: string;
	model?: string;
	dateTime?: string;
	exposureTime?: string;
	aperture?: string;
	iso?: number;
	focalLength?: string;
	gpsLat?: string;
	gpsLng?: string;
	width?: number;
	height?: number;
	fileSize?: number;
	mimeType?: string;
}

export default function ExifManager() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [exif, setExif] = useState<ExifData | null>(null);

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [resultUrl, setResultUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image Metadata (EXIF) Viewer & Remover",
			fileInfo: "File Information",
			fileName: "File Name",
			fileSize: "File Size",
			fileType: "File Type",
			dimensions: "Dimensions",
			exifTitle: "EXIF Metadata",
			make: "Camera Brand",
			model: "Camera Model",
			dateTime: "Date & Time",
			exposure: "Exposure Time",
			aperture: "Aperture",
			iso: "ISO Speed",
			focalLength: "Focal Length",
			gps: "GPS Coordinates",
			noExif: "No EXIF Metadata found in this image.",
			cleanBtn: "Remove All Metadata (Strip EXIF)",
			downloadCleaned: "Download Clean Image",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to view or remove EXIF metadata",
			dropzoneSub: "Supports JPG, PNG, WebP (EXIF parsing works best on JPEG)",
			cleanedSuccess: "All metadata has been successfully removed!",
			previewTitle: "Image Preview",
		},
		vi: {
			title: "Xem & Xóa dữ liệu Metadata (EXIF) ảnh",
			fileInfo: "Thông tin tập tin",
			fileName: "Tên file",
			fileSize: "Dung lượng",
			fileType: "Định dạng",
			dimensions: "Kích thước ảnh",
			exifTitle: "Dữ liệu EXIF",
			make: "Hãng máy ảnh",
			model: "Dòng máy ảnh",
			dateTime: "Ngày giờ chụp",
			exposure: "Thời gian phơi sáng",
			aperture: "Khẩu độ (Aperture)",
			iso: "Chỉ số ISO",
			focalLength: "Tiêu cự lens",
			gps: "Tọa độ GPS",
			noExif: "Không tìm thấy dữ liệu EXIF trong ảnh này.",
			cleanBtn: "Xóa sạch Metadata (EXIF)",
			downloadCleaned: "Tải ảnh sạch Metadata",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để xem hoặc xóa EXIF",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP (Đọc EXIF tốt nhất với JPEG)",
			cleanedSuccess: "Đã xóa sạch toàn bộ dữ liệu ẩn Metadata thành công!",
			previewTitle: "Hình ảnh xem trước",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Cleanup URLs
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);
		};
	}, [previewUrl, resultUrl]);

	const parseExifData = (buffer: ArrayBuffer): Partial<ExifData> | null => {
		const view = new DataView(buffer);
		if (view.byteLength < 8) return null;
		if (view.getUint16(0) !== 0xffd8) return null; // Not a JPEG

		let offset = 2;
		const length = view.byteLength;
		let app1Offset = -1;

		while (offset < length) {
			const marker = view.getUint16(offset);
			if (marker === 0xffe1) {
				app1Offset = offset;
				break;
			}
			if (marker >= 0xffd0 && marker <= 0xffd9) {
				offset += 2;
				continue;
			}
			if (offset + 4 > length) break;
			const segmentLength = view.getUint16(offset + 2);
			offset += 2 + segmentLength;
		}

		if (app1Offset === -1) return null;

		const exifHeaderOffset = app1Offset + 4;
		if (exifHeaderOffset + 6 > length) return null;

		// Check Exif header: "Exif\0\0"
		if (
			view.getUint32(exifHeaderOffset) !== 0x45786966 ||
			view.getUint16(exifHeaderOffset + 4) !== 0x0000
		) {
			return null;
		}

		const tiffHeaderOffset = exifHeaderOffset + 6;
		if (tiffHeaderOffset + 8 > length) return null;

		// Byte order
		const isLittleEndian = view.getUint16(tiffHeaderOffset) === 0x4949;

		// Magic number
		if (isLittleEndian) {
			if (view.getUint16(tiffHeaderOffset + 2, true) !== 0x002a) return null;
		} else {
			if (view.getUint16(tiffHeaderOffset + 2, false) !== 0x002a) return null;
		}

		const firstIfdOffset = view.getUint32(tiffHeaderOffset + 4, isLittleEndian);
		const ifdOffset = tiffHeaderOffset + firstIfdOffset;

		const tags: Record<number, any> = {};

		const readTagValue = (tagType: number, valOffset: number, count: number): any => {
			switch (tagType) {
				case 1: // BYTE
				case 7: {
					// UNDEFINED
					if (count === 1) return view.getUint8(valOffset);
					const bytes = [];
					for (let i = 0; i < count; i++) bytes.push(view.getUint8(valOffset + i));
					return bytes;
				}
				case 2: {
					// ASCII
					let str = "";
					for (let i = 0; i < count; i++) {
						const charCode = view.getUint8(valOffset + i);
						if (charCode === 0) break;
						str += String.fromCharCode(charCode);
					}
					return str.trim();
				}
				case 3: {
					// SHORT
					if (count === 1) return view.getUint16(valOffset, isLittleEndian);
					const shorts = [];
					for (let i = 0; i < count; i++)
						shorts.push(view.getUint16(valOffset + i * 2, isLittleEndian));
					return shorts;
				}
				case 4: {
					// LONG
					if (count === 1) return view.getUint32(valOffset, isLittleEndian);
					const longs = [];
					for (let i = 0; i < count; i++)
						longs.push(view.getUint32(valOffset + i * 4, isLittleEndian));
					return longs;
				}
				case 5: {
					// RATIONAL
					if (count === 1) {
						const num = view.getUint32(valOffset, isLittleEndian);
						const den = view.getUint32(valOffset + 4, isLittleEndian);
						return den === 0 ? 0 : num / den;
					}
					const rationals = [];
					for (let i = 0; i < count; i++) {
						const num = view.getUint32(valOffset + i * 8, isLittleEndian);
						const den = view.getUint32(valOffset + i * 8 + 4, isLittleEndian);
						rationals.push(den === 0 ? 0 : num / den);
					}
					return rationals;
				}
				case 10: // SRATIONAL
					if (count === 1) {
						const num = view.getInt32(valOffset, isLittleEndian);
						const den = view.getInt32(valOffset + 4, isLittleEndian);
						return den === 0 ? 0 : num / den;
					}
					return null;
			}
			return null;
		};

		const parseIFD = (startOffset: number) => {
			if (startOffset + 2 > length) return;
			const numEntries = view.getUint16(startOffset, isLittleEndian);
			let entryOffset = startOffset + 2;

			for (let i = 0; i < numEntries; i++) {
				if (entryOffset + 12 > length) break;
				const tagId = view.getUint16(entryOffset, isLittleEndian);
				const tagType = view.getUint16(entryOffset + 2, isLittleEndian);
				const count = view.getUint32(entryOffset + 4, isLittleEndian);

				let valOffset = entryOffset + 8;

				const typeSizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
				const size = typeSizes[tagType] * count;
				if (size > 4) {
					const ptr = view.getUint32(entryOffset + 8, isLittleEndian);
					valOffset = tiffHeaderOffset + ptr;
				}

				const val = readTagValue(tagType, valOffset, count);
				tags[tagId] = val;

				// SubIFD (Exif Offset)
				if (tagId === 0x8769 && val) {
					parseIFD(tiffHeaderOffset + val);
				}
				// GPS Info Offset
				if (tagId === 0x8825 && val) {
					parseIFD(tiffHeaderOffset + val);
				}

				entryOffset += 12;
			}
		};

		parseIFD(ifdOffset);

		const res: Partial<ExifData> = {
			make: tags[0x010f],
			model: tags[0x0110],
			dateTime: tags[0x0132] || tags[0x9003],
			iso: tags[0x8827],
		};

		if (tags[0x829a]) {
			const exp = tags[0x829a];
			if (exp < 1 && exp > 0) {
				res.exposureTime = `1/${Math.round(1 / exp)}s`;
			} else {
				res.exposureTime = `${exp}s`;
			}
		}
		if (tags[0x829d]) {
			res.aperture = `f/${tags[0x829d]}`;
		}
		if (tags[0x920a]) {
			res.focalLength = `${tags[0x920a]}mm`;
		}

		// GPS
		if (tags[2] && tags[1] && tags[2].length >= 3) {
			const ref = tags[1] as string;
			const lat = tags[2][0] + tags[2][1] / 60 + tags[2][2] / 3600;
			res.gpsLat = `${lat.toFixed(6)}° ${ref}`;
		}
		if (tags[4] && tags[3] && tags[4].length >= 3) {
			const ref = tags[3] as string;
			const lng = tags[4][0] + tags[4][1] / 60 + tags[4][2] / 3600;
			res.gpsLng = `${lng.toFixed(6)}° ${ref}`;
		}

		return res;
	};

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);

			setFile(f);
			setResultUrl(null);
			setStatus("idle");

			const url = URL.createObjectURL(f);
			setPreviewUrl(url);

			const tempImg = new Image();
			tempImg.onload = () => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const buffer = e.target?.result as ArrayBuffer;
					let parsedExif: ExifData = {
						width: tempImg.naturalWidth,
						height: tempImg.naturalHeight,
						fileSize: f.size,
						mimeType: f.type,
					};

					try {
						const exifData = parseExifData(buffer);
						if (exifData) {
							parsedExif = { ...parsedExif, ...exifData };
						}
					} catch (err) {
						console.error("Exif parsing error:", err);
					}

					setExif(parsedExif);
				};
				reader.readAsArrayBuffer(f);
			};
			tempImg.src = url;
		},
		[previewUrl, resultUrl],
	);

	const removeMetadata = () => {
		if (!previewUrl || !file) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						setStatus("error");
						return;
					}

					// Draw to raw canvas removes metadata
					ctx.drawImage(img, 0, 0);

					canvas.toBlob((blob) => {
						if (blob) {
							if (resultUrl) URL.revokeObjectURL(resultUrl);
							setResultUrl(URL.createObjectURL(blob));
							setStatus("done");
						} else {
							setStatus("error");
						}
					}, file.type || "image/png");
				};
				img.onerror = () => setStatus("error");
				img.src = previewUrl;
			} catch (e) {
				console.error(e);
				setStatus("error");
			}
		}, 100);
	};

	const handleDownload = () => {
		if (!resultUrl) return;
		const a = document.createElement("a");
		a.href = resultUrl;
		a.download = `cleaned-${file?.name || "image.png"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		setFile(null);
		setPreviewUrl(null);
		setResultUrl(null);
		setExif(null);
		setStatus("idle");
	};

	const hasExifTags = exif && (exif.make || exif.model || exif.dateTime || exif.iso || exif.gpsLat);

	return (
		<div class="space-y-6">
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label={t.dropzoneLabel}
					sublabel={t.dropzoneSub}
				/>
			)}

			{file && (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Panel: EXIF Data details */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
						<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="16" x2="12" y2="12" />
								<line x1="12" y1="8" x2="12.01" y2="8" />
							</svg>
							{t.fileInfo}
						</h3>

						<div class="space-y-2 text-body-sm">
							<div class="flex justify-between border-b border-hairline/50 pb-1.5">
								<span class="text-muted">{t.fileName}:</span>
								<span class="text-ink font-bold max-w-[200px] truncate">{file.name}</span>
							</div>
							<div class="flex justify-between border-b border-hairline/50 pb-1.5">
								<span class="text-muted">{t.fileSize}:</span>
								<span class="text-ink font-mono">{formatFileSize(file.size)}</span>
							</div>
							<div class="flex justify-between border-b border-hairline/50 pb-1.5">
								<span class="text-muted">{t.fileType}:</span>
								<span class="text-ink font-mono">{file.type}</span>
							</div>
							{exif?.width && (
								<div class="flex justify-between border-b border-hairline/50 pb-1.5">
									<span class="text-muted">{t.dimensions}:</span>
									<span class="text-ink font-mono">
										{exif.width} x {exif.height} px
									</span>
								</div>
							)}
						</div>

						<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mt-4 mb-2 flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
								<circle cx="12" cy="13" r="4" />
							</svg>
							{t.exifTitle}
						</h3>

						{hasExifTags ? (
							<div class="space-y-2 text-body-sm">
								{exif.make && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.make}:</span>
										<span class="text-ink font-bold">{exif.make}</span>
									</div>
								)}
								{exif.model && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.model}:</span>
										<span class="text-ink font-bold">{exif.model}</span>
									</div>
								)}
								{exif.dateTime && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.dateTime}:</span>
										<span class="text-ink font-mono">{exif.dateTime}</span>
									</div>
								)}
								{exif.exposureTime && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.exposure}:</span>
										<span class="text-ink font-mono">{exif.exposureTime}</span>
									</div>
								)}
								{exif.aperture && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.aperture}:</span>
										<span class="text-ink font-mono">{exif.aperture}</span>
									</div>
								)}
								{exif.iso && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.iso}:</span>
										<span class="text-ink font-mono">{exif.iso}</span>
									</div>
								)}
								{exif.focalLength && (
									<div class="flex justify-between border-b border-hairline/50 pb-1.5">
										<span class="text-muted">{t.focalLength}:</span>
										<span class="text-ink">{exif.focalLength}</span>
									</div>
								)}
								{exif.gpsLat && (
									<div class="flex flex-col border-b border-hairline/50 pb-1.5">
										<span class="text-muted mb-0.5">{t.gps}:</span>
										<span class="text-ink font-mono text-xs">
											{exif.gpsLat}, {exif.gpsLng}
										</span>
									</div>
								)}
							</div>
						) : (
							<p class="text-caption italic text-muted py-2">{t.noExif}</p>
						)}

						{/* Actions */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								{status !== "done" && (
									<button class="btn-primary w-full py-2.5" onClick={removeMetadata}>
										{t.cleanBtn}
									</button>
								)}
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						)}

						{status === "processing" && (
							<div class="text-center py-4 space-y-2">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Preview & Confirmation */}
					<div class="lg:col-span-7 space-y-6">
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.previewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline overflow-hidden max-h-[450px]">
								{previewUrl && (
									<img
										src={previewUrl}
										alt="Preview"
										class="max-w-full max-h-[400px] object-contain rounded bg-surface-soft"
									/>
								)}
							</div>

							{status === "done" && resultUrl && (
								<div class="mt-4 space-y-3">
									<div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-3 text-body-sm text-ink-soft">
										{t.cleanedSuccess}
									</div>
									<button
										class="btn-primary w-full py-3 flex items-center justify-center gap-2"
										onClick={handleDownload}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
											<polyline points="7 10 12 15 17 10" />
											<line x1="12" y1="15" x2="12" y2="3" />
										</svg>
										{t.downloadCleaned}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
