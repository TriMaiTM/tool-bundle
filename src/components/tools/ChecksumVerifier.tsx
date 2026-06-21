import { useEffect, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type HashAlgorithm = "SHA-256" | "SHA-512" | "SHA-1" | "MD5";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Pure JS MD5 implementation for ArrayBuffer (since SubtleCrypto does not support MD5)
function md5(buffer: ArrayBuffer): string {
	const byteLength = buffer.byteLength;
	const wordsCount = (((byteLength + 8) >> 6) + 1) << 4;
	const words = new Uint32Array(wordsCount);
	const view = new DataView(buffer);
	for (let i = 0; i < byteLength; i++) {
		words[i >> 2] |= view.getUint8(i) << ((i % 4) * 8);
	}
	words[byteLength >> 2] |= 0x80 << ((byteLength % 4) * 8);

	const lowBits = (byteLength * 8) & 0xffffffff;
	const highBits = Math.floor((byteLength * 8) / 0x100000000);
	words[wordsCount - 2] = lowBits;
	words[wordsCount - 1] = highBits;

	let a = 1732584193;
	let b = -271733879;
	let c = -1732584194;
	let d = 271733878;

	const S = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
		14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
	];

	const T = new Uint32Array(64);
	for (let i = 0; i < 64; i++) {
		T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
	}

	for (let i = 0; i < words.length; i += 16) {
		const aa = a;
		const bb = b;
		const cc = c;
		const dd = d;

		for (let j = 0; j < 64; j++) {
			let f;
			let g;
			if (j < 16) {
				f = (b & c) | (~b & d);
				g = j;
			} else if (j < 32) {
				f = (d & b) | (~d & c);
				g = (5 * j + 1) % 16;
			} else if (j < 48) {
				f = b ^ c ^ d;
				g = (3 * j + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * j) % 16;
			}

			const temp = d;
			d = c;
			c = b;
			b = (b + RotateLeft((a + f + T[j] + words[i + g]) | 0, S[j])) | 0;
			a = temp;
		}

		a = (a + aa) | 0;
		b = (b + bb) | 0;
		c = (c + cc) | 0;
		d = (d + dd) | 0;
	}

	function RotateLeft(x: number, n: number) {
		return (x << n) | (x >>> (32 - n));
	}

	const hex = (n: number) => {
		let s = "";
		for (let i = 0; i < 4; i++) {
			s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, "0");
		}
		return s;
	};

	return hex(a) + hex(b) + hex(c) + hex(d);
}

export default function ChecksumVerifier() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [inputType, setInputType] = useState<"text" | "file">("text");
	const [text, setText] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [expectedHash, setExpectedHash] = useState("");
	const [algo, setAlgo] = useState<HashAlgorithm>("SHA-256");
	const [computedHash, setComputedHash] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);

	const t = {
		en: {
			title: "Checksum Verifier",
			desc: "Verify integrity of files and text by comparing computed hashes with expected values.",
			tabText: "Text Input",
			tabFile: "File Upload",
			lblText: "Plaintext",
			lblFile: "Select or drop a file",
			lblExpected: "Expected Checksum (Hex)",
			lblAlgo: "Hashing Algorithm",
			btnVerify: "Verify Checksum",
			lblResult: "Verification Status",
			match: "MATCH: The computed checksum matches the expected checksum.",
			mismatch: "MISMATCH: The computed checksum does NOT match the expected checksum.",
			computed: "Computed Checksum",
			errFileLimit: "File exceeds 100MB limit",
			errInput: "Please enter text or select a file, and provide the expected checksum.",
		},
		vi: {
			title: "Xác thực Checksum",
			desc: "Kiểm tra tính toàn vẹn của tệp và văn bản bằng cách so sánh mã băm đã tính với mã mong đợi.",
			tabText: "Nhập văn bản",
			tabFile: "Tải tệp lên",
			lblText: "Văn bản gốc",
			lblFile: "Chọn hoặc thả tệp tại đây",
			lblExpected: "Checksum mong đợi (Hex)",
			lblAlgo: "Thuật toán băm",
			btnVerify: "Xác thực Checksum",
			lblResult: "Trạng thái xác thực",
			match: "TRÙNG KHỚP: Checksum tính toán trùng khớp hoàn toàn với checksum mong đợi.",
			mismatch: "KHÔNG KHỚP: Checksum tính toán KHÔNG khớp với checksum mong đợi.",
			computed: "Checksum tính được",
			errFileLimit: "Tệp vượt quá giới hạn 100MB",
			errInput: "Vui lòng nhập văn bản hoặc chọn tệp, và nhập checksum mong đợi.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleVerify = async () => {
		if (inputType === "text" && !text.trim()) {
			setError(t.errInput);
			setIsValid(null);
			return;
		}
		if (inputType === "file" && !file) {
			setError(t.errInput);
			setIsValid(null);
			return;
		}
		if (!expectedHash.trim()) {
			setError(t.errInput);
			setIsValid(null);
			return;
		}

		setError(null);
		setComputedHash("");
		setIsValid(null);
		setIsProcessing(true);

		try {
			let buffer: ArrayBuffer;
			if (inputType === "text") {
				const enc = new TextEncoder();
				buffer = enc.encode(text).buffer;
			} else {
				buffer = await file!.arrayBuffer();
			}

			let hashHex = "";
			if (algo === "MD5") {
				hashHex = md5(buffer);
			} else {
				const hashBuffer = await crypto.subtle.digest(algo, buffer);
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
			}

			setComputedHash(hashHex);

			const cleanExpected = expectedHash.trim().replace(/\s+/g, "").toLowerCase();
			setIsValid(hashHex.toLowerCase() === cleanExpected);
		} catch (err) {
			console.error(err);
			setError(lang === "en" ? "Failed to calculate checksum." : "Không thể tính toán checksum.");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div class="space-y-6">
			{/* Mode navigation */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						inputType === "text"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setInputType("text");
						setFile(null);
						setComputedHash("");
						setIsValid(null);
						setError(null);
					}}
				>
					{t.tabText}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						inputType === "file"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => {
						setInputType("file");
						setText("");
						setComputedHash("");
						setIsValid(null);
						setError(null);
					}}
				>
					{t.tabFile}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input and Setup Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Algorithm selection */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblAlgo}</label>
						<select
							class="input w-full"
							value={algo}
							onChange={(e) => setAlgo((e.target as HTMLSelectElement).value as HashAlgorithm)}
						>
							<option value="SHA-256">SHA-256</option>
							<option value="SHA-512">SHA-512</option>
							<option value="SHA-1">SHA-1</option>
							<option value="MD5">MD5</option>
						</select>
					</div>

					{/* Expected checksum */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblExpected}</label>
						<input
							type="text"
							class="input w-full font-mono text-xs"
							value={expectedHash}
							onInput={(e) => setExpectedHash((e.target as HTMLInputElement).value)}
							placeholder="e.g. 5d41402abc54f5..."
						/>
					</div>

					<button
						class="btn-primary w-full py-2.5 mt-2"
						onClick={handleVerify}
						disabled={isProcessing}
					>
						{isProcessing ? "Processing..." : t.btnVerify}
					</button>
				</div>

				{/* Inputs/Results Area */}
				<div class="lg:col-span-7 space-y-4">
					{error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose font-bold">
							{error}
						</div>
					)}

					{inputType === "text" ? (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblText}</label>
							<textarea
								class="input w-full h-32 font-mono text-body-sm"
								value={text}
								onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>
					) : (
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.tabFile}</label>
							<FileDropZone
								accept="*"
								multiple={false}
								maxSize={MAX_FILE_SIZE}
								onFiles={(files) => {
									if (files[0]) {
										setFile(files[0]);
										setError(null);
									}
								}}
								label={t.lblFile}
								sublabel={`Max file size: ${formatFileSize(MAX_FILE_SIZE)}`}
							/>
							{file && (
								<div class="bg-surface-soft rounded-lg p-3 mt-2 flex items-center justify-between">
									<div class="truncate pr-4">
										<span class="text-body-sm-strong text-ink block truncate">{file.name}</span>
										<span class="text-body-xs text-muted">{formatFileSize(file.size)}</span>
									</div>
									<button class="btn-secondary text-[10px] py-1 px-2" onClick={() => setFile(null)}>
										Remove
									</button>
								</div>
							)}
						</div>
					)}

					{computedHash && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblResult}
							</h4>
							<div
								class={`p-4 rounded-lg text-body-sm font-bold border ${
									isValid
										? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald"
										: "bg-accent-rose/10 border-accent-rose/30 text-accent-rose"
								}`}
							>
								{isValid ? t.match : t.mismatch}
							</div>

							<div class="space-y-1 mt-2">
								<label class="text-body-xs text-muted block">{t.computed}</label>
								<div class="relative">
									<textarea
										readOnly
										class="input w-full h-20 font-mono text-body-sm bg-surface-soft"
										value={computedHash}
									/>
									<button
										class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
										onClick={() => navigator.clipboard.writeText(computedHash)}
									>
										Copy
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
