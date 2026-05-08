import { useCallback, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

type TargetFormat = "wav" | "ogg";
type SampleRateOption = 44100 | 48000 | 22050 | 16000;

const FORMAT_LABELS: Record<TargetFormat, string> = {
	wav: "WAV (Uncompressed PCM)",
	ogg: "OGG (Opus codec)",
};

const SAMPLE_RATES: SampleRateOption[] = [44100, 48000, 22050, 16000];

export default function AudioConverter() {
	const [file, setFile] = useState<File | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioInfo, setAudioInfo] = useState<{
		name: string;
		size: string;
		duration: string;
		format: string;
	} | null>(null);
	const [targetFormat, setTargetFormat] = useState<TargetFormat>("wav");
	const [sampleRate, setSampleRate] = useState<SampleRateOption>(44100);
	const [processing, setProcessing] = useState(false);
	const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
	const [convertedSize, setConvertedSize] = useState<string | null>(null);

	const getFormatFromMime = (mime: string): string => {
		if (mime.includes("wav")) return "WAV";
		if (mime.includes("ogg")) return "OGG";
		if (mime.includes("mpeg") || mime.includes("mp3")) return "MP3";
		if (mime.includes("aac") || mime.includes("m4a")) return "AAC";
		if (mime.includes("webm")) return "WebM";
		if (mime.includes("flac")) return "FLAC";
		return mime.split("/")[1]?.toUpperCase() || "Unknown";
	};

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setConvertedBlob(null);
		setConvertedSize(null);

		const url = URL.createObjectURL(f);
		setAudioUrl(url);

		const audio = new Audio();
		audio.preload = "metadata";
		audio.onloadedmetadata = () => {
			const dur = audio.duration;
			const mins = Math.floor(dur / 60);
			const secs = Math.floor(dur % 60);
			setAudioInfo({
				name: f.name,
				size: formatFileSize(f.size),
				duration: `${mins}:${secs.toString().padStart(2, "0")}`,
				format: getFormatFromMime(f.type),
			});
		};
		audio.src = url;
	}, []);

	const handleConvert = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		setConvertedBlob(null);
		setConvertedSize(null);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const audioCtx = new AudioContext();
			const decoded = await audioCtx.decodeAudioData(arrayBuffer);
			audioCtx.close();

			if (targetFormat === "wav") {
				// Resample if needed
				let bufferToEncode = decoded;
				if (sampleRate !== decoded.sampleRate) {
					const offlineCtx = new OfflineAudioContext(
						decoded.numberOfChannels,
						Math.ceil(decoded.length * (sampleRate / decoded.sampleRate)),
						sampleRate,
					);
					const source = offlineCtx.createBufferSource();
					source.buffer = decoded;
					source.connect(offlineCtx.destination);
					source.start();
					bufferToEncode = await offlineCtx.startRendering();
				}

				const wavBlob = encodeAudioBufferToWav(bufferToEncode);
				setConvertedBlob(wavBlob);
				setConvertedSize(formatFileSize(wavBlob.size));
			} else if (targetFormat === "ogg") {
				// Use MediaRecorder for OGG
				const offlineCtx = new OfflineAudioContext(
					decoded.numberOfChannels,
					decoded.length,
					sampleRate,
				);
				const source = offlineCtx.createBufferSource();
				source.buffer = decoded;
				source.connect(offlineCtx.destination);
				source.start();
				const rendered = await offlineCtx.startRendering();

				// Use MediaStream + MediaRecorder
				const _streamDest = new AudioContext().createMediaStreamDestination();
				const recCtx = new AudioContext();
				const recSource = recCtx.createBufferSource();
				recSource.buffer = rendered;

				const recDest = recCtx.createMediaStreamDestination();
				recSource.connect(recDest);
				recSource.connect(recCtx.destination);

				const mimeType = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")
					? "audio/ogg; codecs=opus"
					: "audio/ogg";

				const recorder = new MediaRecorder(recDest.stream, { mimeType });
				const chunks: Blob[] = [];

				await new Promise<void>((resolve, reject) => {
					recorder.ondataavailable = (e) => {
						if (e.data.size > 0) chunks.push(e.data);
					};
					recorder.onstop = () => resolve();
					recorder.onerror = (e) => reject(e);

					recorder.start();
					recSource.start();

					recSource.onended = () => {
						setTimeout(() => recorder.stop(), 100);
					};
				});

				recCtx.close();

				const oggBlob = new Blob(chunks, { type: "audio/ogg" });
				setConvertedBlob(oggBlob);
				setConvertedSize(formatFileSize(oggBlob.size));
			}
		} catch (e) {
			alert(`Conversion failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, targetFormat, sampleRate]);

	const handleDownload = useCallback(() => {
		if (!convertedBlob || !file) return;
		const baseName = file.name.replace(/\.[^.]+$/, "");
		downloadBlob(convertedBlob, `${baseName}.${targetFormat}`);
	}, [convertedBlob, file, targetFormat]);

	const handleReset = useCallback(() => {
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setFile(null);
		setAudioUrl(null);
		setAudioInfo(null);
		setProcessing(false);
		setConvertedBlob(null);
		setConvertedSize(null);
	}, [audioUrl]);

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept="audio/*"
					onFiles={handleFiles}
					label="Drop an audio file here to convert"
					sublabel="Supports MP3, WAV, OGG, AAC, FLAC, and other audio formats"
				/>
			) : (
				<div>
					{/* Audio player */}
					{audioUrl && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<audio src={audioUrl} controls class="w-full" />
						</div>
					)}

					{/* Audio info */}
					{audioInfo && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Source Audio</div>
							<div class="text-body-sm text-primary">
								<div>
									<strong>Name:</strong> {audioInfo.name}
								</div>
								<div>
									<strong>Size:</strong> {audioInfo.size}
								</div>
								<div>
									<strong>Duration:</strong> {audioInfo.duration}
								</div>
								<div>
									<strong>Format:</strong> {audioInfo.format}
								</div>
							</div>
						</div>
					)}

					{/* Format selector */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Output Format</div>
						<div class="grid grid-cols-2 gap-3">
							{(Object.keys(FORMAT_LABELS) as TargetFormat[]).map((fmt) => (
								<button
									key={fmt}
									class={targetFormat === fmt ? "btn-primary" : "btn-secondary"}
									onClick={() => setTargetFormat(fmt)}
								>
									{FORMAT_LABELS[fmt]}
								</button>
							))}
						</div>

						{/* Sample rate */}
						<div class="mt-4">
							<label class="text-body-sm text-primary mb-2 block">Sample Rate</label>
							<select
								class="input w-full"
								value={sampleRate}
								onChange={(e) =>
									setSampleRate(Number((e.target as HTMLSelectElement).value) as SampleRateOption)
								}
							>
								{SAMPLE_RATES.map((sr) => (
									<option key={sr} value={sr}>
										{sr === 44100
											? "44,100 Hz (CD Quality)"
											: sr === 48000
												? "48,000 Hz (Video Standard)"
												: sr === 22050
													? "22,050 Hz (Low)"
													: "16,000 Hz (Voice)"}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Before / After comparison */}
					{convertedBlob && audioInfo && (
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
							<div class="bg-surface-elevated rounded-lg p-4">
								<div class="text-caption-uppercase text-muted mb-3">Original</div>
								<div class="text-body-sm text-primary">
									<div>
										<strong>Format:</strong> {audioInfo.format}
									</div>
									<div>
										<strong>Size:</strong> {audioInfo.size}
									</div>
									<div>
										<strong>Duration:</strong> {audioInfo.duration}
									</div>
								</div>
							</div>
							<div class="rounded-lg p-4 bg-accent-emerald/10 border border-accent-emerald/30">
								<div class="text-caption-uppercase text-accent-emerald mb-3">Converted</div>
								<div class="text-body-sm text-primary">
									<div>
										<strong>Format:</strong> {targetFormat.toUpperCase()}
									</div>
									<div>
										<strong>Size:</strong> {convertedSize}
									</div>
									<div>
										<strong>Sample Rate:</strong> {sampleRate.toLocaleString()} Hz
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Converted audio preview */}
					{convertedBlob && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Converted Audio</div>
							<audio src={URL.createObjectURL(convertedBlob)} controls class="w-full" />
						</div>
					)}

					{/* Note */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4 text-body-sm text-muted">
						<strong>Note:</strong> Browser supports WAV and OGG output. For MP3, a dedicated tool is
						needed.
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						{!convertedBlob ? (
							<button class="btn-primary" onClick={handleConvert} disabled={processing}>
								{processing ? "Converting..." : "Convert Audio"}
							</button>
						) : (
							<button class="btn-primary" onClick={handleDownload}>
								Download {targetFormat.toUpperCase()}
							</button>
						)}
						<button class="btn-secondary" onClick={handleReset}>
							Choose Another File
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
	const numChannels = buffer.numberOfChannels;
	const sampleRate = buffer.sampleRate;
	const length = buffer.length;
	const bytesPerSample = 2;
	const dataSize = length * numChannels * bytesPerSample;
	const headerSize = 44;
	const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
	const view = new DataView(arrayBuffer);

	writeString(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(view, 8, "WAVE");
	writeString(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
	view.setUint16(32, numChannels * bytesPerSample, true);
	view.setUint16(34, 16, true);
	writeString(view, 36, "data");
	view.setUint32(40, dataSize, true);

	const channels: Float32Array[] = [];
	for (let ch = 0; ch < numChannels; ch++) {
		channels.push(buffer.getChannelData(ch));
	}

	let offset = 44;
	for (let i = 0; i < length; i++) {
		for (let ch = 0; ch < numChannels; ch++) {
			const sample = Math.max(-1, Math.min(1, channels[ch][i]));
			view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
			offset += 2;
		}
	}

	return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
	for (let i = 0; i < str.length; i++) {
		view.setUint8(offset + i, str.charCodeAt(i));
	}
}
