import { useCallback, useRef, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function VideoToAudio() {
	const [file, setFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [videoInfo, setVideoInfo] = useState<{
		name: string;
		size: string;
		duration: string;
	} | null>(null);
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setAudioBlob(null);
		setProgress(0);

		const url = URL.createObjectURL(f);
		setVideoUrl(url);

		const video = document.createElement("video");
		video.preload = "metadata";
		video.onloadedmetadata = () => {
			const dur = video.duration;
			const mins = Math.floor(dur / 60);
			const secs = Math.floor(dur % 60);
			setVideoInfo({
				name: f.name,
				size: formatFileSize(f.size),
				duration: `${mins}:${secs.toString().padStart(2, "0")}`,
			});
		};
		video.src = url;
	}, []);

	const handleExtract = useCallback(async () => {
		if (!videoUrl || !videoRef.current) return;
		setProcessing(true);
		setProgress(0);
		setAudioBlob(null);

		try {
			const video = videoRef.current;
			video.currentTime = 0;
			await new Promise<void>((resolve) => {
				video.onseeked = () => resolve();
			});

			const audioCtx = new AudioContext();
			const source = audioCtx.createMediaElementSource(video);
			const destination = audioCtx.createMediaStreamDestination();
			source.connect(destination);
			// Also connect to speakers so we can hear it (needed for playback)
			source.connect(audioCtx.destination);

			const mediaRecorder = new MediaRecorder(destination.stream, {
				mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
					? "audio/webm;codecs=opus"
					: "audio/webm",
			});
			const chunks: Blob[] = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};

			await new Promise<void>((resolve, reject) => {
				mediaRecorder.onstop = () => resolve();
				mediaRecorder.onerror = (e) => reject(e);

				mediaRecorder.start();

				const duration = video.duration;
				video.ontimeupdate = () => {
					if (duration > 0) {
						setProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)));
					}
				};

				video.onended = () => {
					mediaRecorder.stop();
					source.disconnect();
					audioCtx.close();
				};

				video.play().catch(reject);
			});

			const blob = new Blob(chunks, { type: "audio/wav" });
			// Re-encode to proper WAV via AudioContext decode + WAV encode
			const arrayBuffer = await blob.arrayBuffer();
			const decodeCtx = new AudioContext();
			const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
			const wavBlob = encodeAudioBufferToWav(audioBuffer);
			decodeCtx.close();

			setAudioBlob(wavBlob);
			setProgress(100);
		} catch (e) {
			alert(`Extraction failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [videoUrl]);

	const handleDownload = useCallback(() => {
		if (!audioBlob || !file) return;
		const baseName = file.name.replace(/\.[^.]+$/, "");
		downloadBlob(audioBlob, `${baseName}-audio.wav`);
	}, [audioBlob, file]);

	const handleReset = useCallback(() => {
		if (videoUrl) URL.revokeObjectURL(videoUrl);
		setFile(null);
		setVideoUrl(null);
		setVideoInfo(null);
		setProcessing(false);
		setProgress(0);
		setAudioBlob(null);
	}, [videoUrl]);

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept="video/*"
					onFiles={handleFiles}
					label="Drop a video file here to extract audio"
					sublabel="Supports MP4, WebM, MOV, AVI, and other video formats"
				/>
			) : (
				<div>
					{/* Video preview */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						{videoUrl && (
							<video
								ref={videoRef}
								src={videoUrl}
								controls
								style="max-height: 300px; width: 100%; border-radius: 0.5rem"
							/>
						)}
					</div>

					{/* Video info */}
					{videoInfo && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Video Info</div>
							<div class="text-body-sm text-primary">
								<div>
									<strong>Name:</strong> {videoInfo.name}
								</div>
								<div>
									<strong>Size:</strong> {videoInfo.size}
								</div>
								<div>
									<strong>Duration:</strong> {videoInfo.duration}
								</div>
							</div>
						</div>
					)}

					{/* Progress */}
					{(processing || audioBlob) && (
						<div class="mb-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-caption-uppercase text-muted">Progress</span>
								<span class="text-primary font-semibold">{progress}%</span>
							</div>
							<div style="height: 8px; background: var(--color-surface); border-radius: 4px; overflow: hidden">
								<div
									class="badge-yellow"
									style={`height: 100%; width: ${progress}%; transition: width 0.3s`}
								/>
							</div>
						</div>
					)}

					{/* Result */}
					{audioBlob && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Extracted Audio</div>
							<div class="text-body-sm text-primary">
								<div>
									<strong>Format:</strong> WAV
								</div>
								<div>
									<strong>Size:</strong> {formatFileSize(audioBlob.size)}
								</div>
							</div>
							<audio src={URL.createObjectURL(audioBlob)} controls class="mt-3 w-full" />
						</div>
					)}

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						{!audioBlob && (
							<button class="btn-primary" onClick={handleExtract} disabled={processing}>
								{processing ? `Extracting... ${progress}%` : "Extract Audio"}
							</button>
						)}
						{audioBlob && (
							<button class="btn-primary" onClick={handleDownload}>
								Download WAV
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
	const bytesPerSample = 2; // 16-bit
	const dataSize = length * numChannels * bytesPerSample;
	const headerSize = 44;
	const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
	const view = new DataView(arrayBuffer);

	// WAV header
	writeString(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(view, 8, "WAVE");
	writeString(view, 12, "fmt ");
	view.setUint32(16, 16, true); // PCM chunk size
	view.setUint16(20, 1, true); // PCM format
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
	view.setUint16(32, numChannels * bytesPerSample, true);
	view.setUint16(34, 16, true); // bits per sample
	writeString(view, 36, "data");
	view.setUint32(40, dataSize, true);

	// Interleave channels
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
