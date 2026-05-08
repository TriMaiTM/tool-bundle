import { useCallback, useRef, useState } from "preact/hooks";
import { downloadBlob, formatFileSize } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

const PRESETS = [50, 100, 150, 200, 300];

export default function VolumeBooster() {
	const [file, setFile] = useState<File | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioInfo, setAudioInfo] = useState<{
		name: string;
		size: string;
		duration: string;
	} | null>(null);
	const [volume, setVolume] = useState(100);
	const [processing, setProcessing] = useState(false);
	const [boostedBlob, setBoostedBlob] = useState<Blob | null>(null);
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
	const previewRef = useRef<{
		ctx: AudioContext;
		source: AudioBufferSourceNode;
		gain: GainNode;
	} | null>(null);
	const audioRef = useRef<HTMLAudioElement>(null);

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		setFile(f);
		setBoostedBlob(null);
		setAudioBuffer(null);

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
			});
		};
		audio.src = url;

		// Decode audio for processing
		try {
			const arrayBuffer = await f.arrayBuffer();
			const ctx = new AudioContext();
			const decoded = await ctx.decodeAudioData(arrayBuffer);
			setAudioBuffer(decoded);
			ctx.close();
		} catch {
			// Will retry on process
		}
	}, []);

	const handlePreview = useCallback(() => {
		if (!audioBuffer) return;

		// Stop previous preview
		if (previewRef.current) {
			try {
				previewRef.current.source.stop();
			} catch {}
			try {
				previewRef.current.ctx.close();
			} catch {}
		}

		const ctx = new AudioContext();
		const source = ctx.createBufferSource();
		source.buffer = audioBuffer;

		const gainNode = ctx.createGain();
		gainNode.gain.value = volume / 100;

		source.connect(gainNode);
		gainNode.connect(ctx.destination);
		source.start();

		previewRef.current = { ctx, source, gain: gainNode };

		source.onended = () => {
			try {
				ctx.close();
			} catch {}
			previewRef.current = null;
		};
	}, [audioBuffer, volume]);

	const handleProcess = useCallback(async () => {
		if (!file) return;
		setProcessing(true);
		setBoostedBlob(null);

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

			const gainValue = volume / 100;
			const offlineCtx = new OfflineAudioContext(
				buffer.numberOfChannels,
				buffer.length,
				buffer.sampleRate,
			);

			const source = offlineCtx.createBufferSource();
			source.buffer = buffer;

			const gainNode = offlineCtx.createGain();
			gainNode.gain.value = gainValue;

			source.connect(gainNode);
			gainNode.connect(offlineCtx.destination);
			source.start();

			const rendered = await offlineCtx.startRendering();
			const wavBlob = encodeAudioBufferToWav(rendered);
			setBoostedBlob(wavBlob);
		} catch (e) {
			alert(`Processing failed: ${(e as Error).message}`);
		} finally {
			setProcessing(false);
		}
	}, [file, audioBuffer, volume]);

	const handleDownload = useCallback(() => {
		if (!boostedBlob || !file) return;
		const baseName = file.name.replace(/\.[^.]+$/, "");
		downloadBlob(boostedBlob, `${baseName}-boosted-${volume}pct.wav`);
	}, [boostedBlob, file, volume]);

	const handleReset = useCallback(() => {
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		if (previewRef.current) {
			try {
				previewRef.current.source.stop();
			} catch {}
			try {
				previewRef.current.ctx.close();
			} catch {}
		}
		setFile(null);
		setAudioUrl(null);
		setAudioInfo(null);
		setVolume(100);
		setProcessing(false);
		setBoostedBlob(null);
		setAudioBuffer(null);
	}, [audioUrl]);

	const gainX = (volume / 100).toFixed(1);

	return (
		<div>
			{!file ? (
				<FileDropZone
					accept="audio/*"
					onFiles={handleFiles}
					label="Drop an audio file here to adjust volume"
					sublabel="Supports MP3, WAV, OGG, and other audio formats"
				/>
			) : (
				<div>
					{/* Audio player */}
					{audioUrl && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<audio ref={audioRef} src={audioUrl} controls class="w-full" />
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

					{/* Volume control */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="flex items-center justify-between mb-3">
							<span class="text-caption-uppercase text-muted">Volume</span>
							<div class="flex items-center gap-2">
								<span class="text-title-lg text-primary">{volume}%</span>
								<span class="badge badge-yellow">{gainX}x</span>
							</div>
						</div>
						<input
							type="range"
							min="0"
							max="500"
							step="5"
							value={volume}
							onInput={(e) => setVolume(Number((e.target as HTMLInputElement).value))}
							class="w-full"
							style="accent-color: var(--color-primary)"
						/>
						<div class="flex justify-between text-caption text-muted mt-1">
							<span>0%</span>
							<span>100%</span>
							<span>500%</span>
						</div>

						{/* Presets */}
						<div class="flex flex-wrap gap-2 mt-4">
							{PRESETS.map((preset) => (
								<button
									key={preset}
									class={volume === preset ? "btn-primary" : "btn-secondary"}
									onClick={() => setVolume(preset)}
									style="padding: 0.25rem 0.75rem; font-size: 0.875rem"
								>
									{preset}%
								</button>
							))}
						</div>
					</div>

					{/* Volume visualization */}
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Level Indicator</div>
						<div class="flex gap-2 items-end" style="height: 40px">
							{/* Original level bar */}
							<div class="flex-1 flex flex-col items-center gap-1">
								<div
									style={`width: 100%; height: ${Math.min(100, 40)}px; background: var(--color-primary); opacity: 0.3; border-radius: 4px`}
								/>
								<span class="text-caption text-muted">Original</span>
							</div>
							{/* Boosted level bar */}
							<div class="flex-1 flex flex-col items-center gap-1">
								<div
									style={`width: 100%; height: ${Math.min(100, 40 * (volume / 100))}px; background: var(--color-primary); border-radius: 4px`}
								/>
								<span class="text-caption text-muted">Boosted</span>
							</div>
						</div>
					</div>

					{/* Result */}
					{boostedBlob && (
						<div class="bg-surface-elevated rounded-lg p-3 mb-4">
							<div class="text-caption-uppercase text-muted mb-2">Boosted Audio</div>
							<div class="text-body-sm text-primary">
								<div>
									<strong>Volume:</strong> {volume}% ({gainX}x)
								</div>
								<div>
									<strong>Size:</strong> {formatFileSize(boostedBlob.size)}
								</div>
							</div>
							<audio src={URL.createObjectURL(boostedBlob)} controls class="mt-3 w-full" />
						</div>
					)}

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-secondary" onClick={handlePreview} disabled={!audioBuffer}>
							Preview with Gain
						</button>
						{!boostedBlob ? (
							<button class="btn-primary" onClick={handleProcess} disabled={processing}>
								{processing ? "Processing..." : "Process & Export"}
							</button>
						) : (
							<button class="btn-primary" onClick={handleDownload}>
								Download Boosted WAV
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
