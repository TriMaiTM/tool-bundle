import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

export default function AudioTrimmer() {
	const [file, setFile] = useState<File | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioInfo, setAudioInfo] = useState<{
		name: string;
		size: string;
		duration: string;
	} | null>(null);
	const [totalDuration, setTotalDuration] = useState(0);
	const [startTime, setStartTime] = useState("00:00");
	const [endTime, setEndTime] = useState("00:00");
	const [currentTime, setCurrentTime] = useState(0);
	const [processing, setProcessing] = useState(false);
	const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
	const audioRef = useRef<HTMLAudioElement>(null);
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
	const playbackRef = useRef<{
		ctx: AudioContext;
		source: AudioBufferSourceNode;
	} | null>(null);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		setTrimmedBlob(null);
		setAudioBuffer(null);

		const url = URL.createObjectURL(f);
		setAudioUrl(url);

		const audio = new Audio();
		audio.preload = "metadata";
		audio.onloadedmetadata = () => {
			const dur = audio.duration;
			setTotalDuration(dur);
			const mins = Math.floor(dur / 60);
			const secs = Math.floor(dur % 60);
			setAudioInfo({
				name: f.name,
				size: formatFileSize(f.size),
				duration: `${mins}:${secs.toString().padStart(2, "0")}`,
			});
			setEndTime(formatTime(dur));
		};
		audio.src = url;

		// Decode audio data for trimming
		try {
			const arrayBuffer = await f.arrayBuffer();
			const ctx = new AudioContext();
			const decoded = await ctx.decodeAudioData(arrayBuffer);
			setAudioBuffer(decoded);
			ctx.close();
		} catch {
			// Will try again on trim
		}
	}, []);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const parseTime = (timeStr: string): number => {
		const parts = timeStr.split(":");
		if (parts.length !== 2) return 0;
		const mins = Number.parseInt(parts[0], 10) || 0;
		const secs = Number.parseInt(parts[1], 10) || 0;
		return mins * 60 + secs;
	};

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
		audio.addEventListener("timeupdate", handleTimeUpdate);
		return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
	}, [audioUrl]);

	const handlePreviewTrimmed = useCallback(() => {
		if (!audioBuffer) return;

		// Stop previous playback
		if (playbackRef.current) {
			try {
				playbackRef.current.source.stop();
			} catch {}
			try {
				playbackRef.current.ctx.close();
			} catch {}
		}

		const start = parseTime(startTime);
		const end = parseTime(endTime);
		const startSample = Math.floor(start * audioBuffer.sampleRate);
		const endSample = Math.min(Math.floor(end * audioBuffer.sampleRate), audioBuffer.length);
		const length = endSample - startSample;

		if (length <= 0) {
			alert("Invalid trim range. End time must be after start time.");
			return;
		}

		const ctx = new AudioContext();
		const trimmedBuffer = ctx.createBuffer(
			audioBuffer.numberOfChannels,
			length,
			audioBuffer.sampleRate,
		);

		for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
			const sourceData = audioBuffer.getChannelData(ch);
			const destData = trimmedBuffer.getChannelData(ch);
			for (let i = 0; i < length; i++) {
				destData[i] = sourceData[startSample + i];
			}
		}

		const source = ctx.createBufferSource();
		source.buffer = trimmedBuffer;
		source.connect(ctx.destination);
		source.start();

		playbackRef.current = { ctx, source };
		source.onended = () => {
			try {
				ctx.close();
			} catch {}
			playbackRef.current = null;
		};
	}, [audioBuffer, startTime, endTime]);

	const handleTrim = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		setTrimmedBlob(null);

		try {
			let buffer = audioBuffer;
			if (!buffer) {
				const arrayBuffer = await file.arrayBuffer();
				const ctx = new AudioContext();
				buffer = await ctx.decodeAudioData(arrayBuffer);
				setAudioBuffer(buffer);
				ctx.close();
			}

			if (!buffer) throw new Error("Failed to decode audio");

			const start = parseTime(startTime);
			const end = parseTime(endTime);
			const startSample = Math.floor(start * buffer.sampleRate);
			const endSample = Math.min(Math.floor(end * buffer.sampleRate), buffer.length);
			const length = endSample - startSample;

			if (length <= 0) {
				throw new Error("Invalid trim range. End time must be after start time.");
			}

			const _trimmedBuffer = new AudioContext().createBuffer(
				buffer.numberOfChannels,
				length,
				buffer.sampleRate,
			);
			// Use OfflineAudioContext to create properly
			const offlineCtx = new OfflineAudioContext(
				buffer.numberOfChannels,
				length,
				buffer.sampleRate,
			);
			const trimmed = offlineCtx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);

			for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
				const sourceData = buffer.getChannelData(ch);
				const destData = trimmed.getChannelData(ch);
				for (let i = 0; i < length; i++) {
					destData[i] = sourceData[startSample + i];
				}
			}

			const wavBlob = encodeAudioBufferToWav(trimmed);
			setTrimmedBlob(wavBlob);
		} catch (e) {
			alert(`Trim failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, audioBuffer, startTime, endTime]);

	const handleDownload = useCallback(() => {
		if (!trimmedBlob || !file) return;
		const baseName = file.name.replace(/\.[^.]+$/, "");
		downloadBlob(trimmedBlob, `${baseName}-trimmed.wav`);
	}, [trimmedBlob, file]);

	const handleReset = useCallback(() => {
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		if (playbackRef.current) {
			try {
				playbackRef.current.source.stop();
			} catch {}
			try {
				playbackRef.current.ctx.close();
			} catch {}
		}
		setFile(null);
		setAudioUrl(null);
		setAudioInfo(null);
		setTotalDuration(0);
		setStartTime("00:00");
		setEndTime("00:00");
		setCurrentTime(0);
		setProcessing(false);
		setTrimmedBlob(null);
		setAudioBuffer(null);
	}, [audioUrl]);

	const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept="audio/*"
					onFiles={handleFiles}
					label="Drop an audio file here to trim"
					sublabel="Supports MP3, WAV, OGG, and other audio formats"
				/>
			) : (
				<div>
					{/* Audio player */}
					{audioUrl && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<audio ref={audioRef} src={audioUrl} controls class="w-full" />
							{/* Visual progress bar */}
							<div
								class="mt-3"
								style="height: 6px; background: var(--color-surface); border-radius: 3px; overflow: hidden"
							>
								<div
									class="badge-yellow"
									style={`height: 100%; width: ${progressPercent}%; transition: width 0.1s`}
								/>
							</div>
							<div class="flex justify-between mt-1">
								<span class="text-caption text-muted">{formatTime(currentTime)}</span>
								<span class="text-caption text-muted">{formatTime(totalDuration)}</span>
							</div>
						</div>
					)}

					{/* Audio info */}
					{audioInfo && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Audio Info</div>
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
							</div>
						</div>
					)}

					{/* Trim controls */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Trim Range</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="text-body-sm text-primary mb-1 block">Start Time (MM:SS)</label>
								<input
									type="text"
									class="input"
									value={startTime}
									onInput={(e) => setStartTime((e.target as HTMLInputElement).value)}
									placeholder="00:00"
									pattern="[0-9]{2}:[0-9]{2}"
								/>
							</div>
							<div>
								<label class="text-body-sm text-primary mb-1 block">End Time (MM:SS)</label>
								<input
									type="text"
									class="input"
									value={endTime}
									onInput={(e) => setEndTime((e.target as HTMLInputElement).value)}
									placeholder="00:00"
									pattern="[0-9]{2}:[0-9]{2}"
								/>
							</div>
						</div>
						<div class="text-caption text-muted mt-2">
							Current position: {formatTime(currentTime)}
						</div>
					</div>

					{/* Result */}
					{trimmedBlob && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Trimmed Audio</div>
							<div class="text-body-sm text-primary">
								<div>
									<strong>Duration:</strong> {formatTime(parseTime(endTime) - parseTime(startTime))}
								</div>
								<div>
									<strong>Size:</strong> {formatFileSize(trimmedBlob.size)}
								</div>
							</div>
							<audio src={URL.createObjectURL(trimmedBlob)} controls class="mt-3 w-full" />
						</div>
					)}

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-secondary" onClick={handlePreviewTrimmed} disabled={!audioBuffer}>
							Preview Trimmed
						</button>
						{!trimmedBlob ? (
							<button class="btn-primary" onClick={handleTrim} disabled={processing}>
								{processing ? "Trimming..." : "Trim Audio"}
							</button>
						) : (
							<button class="btn-primary" onClick={handleDownload}>
								Download Trimmed WAV
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
