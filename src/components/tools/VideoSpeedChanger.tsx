import { useState, useCallback, useRef } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { downloadBlob, formatFileSize } from "../../utils/download";

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export default function VideoSpeedChanger() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ name: string; size: string; duration: string } | null>(null);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setProcessedBlob(null);
    setProgress(0);

    const url = URL.createObjectURL(f);
    setVideoUrl(url);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dur = video.duration;
      setOriginalDuration(dur);
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const newDuration = originalDuration > 0 ? originalDuration / speed : 0;

  // Apply speed to preview video element
  const applySpeedToVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !file) return;
    setProcessing(true);
    setProgress(0);
    setProcessedBlob(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      video.playbackRate = speed;
      video.currentTime = 0;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture canvas stream for video
      const canvasStream = canvas.captureStream(30);

      // Capture audio via AudioContext
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const audioDest = audioCtx.createMediaStreamDestination();
      source.connect(audioDest);
      source.connect(audioCtx.destination);

      // Combine video + audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = (e) => reject(e);

        recorder.start();

        const duration = video.duration;
        let animId: number;

        const drawFrame = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (!video.paused && !video.ended) {
            animId = requestAnimationFrame(drawFrame);
          }
        };

        video.ontimeupdate = () => {
          if (duration > 0) {
            setProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)));
          }
        };

        video.onended = () => {
          cancelAnimationFrame(animId);
          setTimeout(() => {
            recorder.stop();
            source.disconnect();
            audioCtx.close();
          }, 200);
        };

        video.play().then(() => {
          drawFrame();
        }).catch(reject);
      });

      const blob = new Blob(chunks, { type: mimeType });
      setProcessedBlob(blob);
      setProgress(100);
    } catch (e) {
      alert("Processing failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, speed]);

  const handleDownload = useCallback(() => {
    if (!processedBlob || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(processedBlob, `${baseName}-${speed}x.webm`);
  }, [processedBlob, file, speed]);

  const handleReset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl(null);
    setVideoInfo(null);
    setOriginalDuration(0);
    setSpeed(1);
    setProcessing(false);
    setProgress(0);
    setProcessedBlob(null);
  }, [videoUrl]);

  return (
    <div>
      {!file ? (
        <FileDropZone
          accept="video/*"
          onFiles={handleFiles}
          label="Drop a video file here to change speed"
          sublabel="Supports MP4, WebM, MOV, and other video formats"
        />
      ) : (
        <div>
          {/* Large file warning */}
          {file && file.size > 100 * 1024 * 1024 && (
            <div class="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-3 mb-4 text-body-sm">
              <strong class="text-accent-amber">Warning:</strong>{" "}
              <span class="text-muted">
                This file is {formatFileSize(file.size)}. Video processing is heavy and may take a while.
                Consider using a smaller file for faster results.
              </span>
            </div>
          )}

          {/* Video preview */}
          <div class="bg-surface-elevated rounded-lg p-3 mb-4">
            {videoUrl && (
              <div>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  style="max-height: 300px; width: 100%; border-radius: 0.5rem"
                  onLoadedMetadata={applySpeedToVideo}
                />
                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} style="display: none" />
              </div>
            )}
          </div>

          {/* Video info */}
          {videoInfo && (
            <div class="bg-surface-elevated rounded-lg p-3 mb-4">
              <div class="text-caption-uppercase text-muted mb-2">Video Info</div>
              <div class="text-body-sm text-primary">
                <div><strong>Name:</strong> {videoInfo.name}</div>
                <div><strong>Size:</strong> {videoInfo.size}</div>
                <div><strong>Duration:</strong> {videoInfo.duration}</div>
              </div>
            </div>
          )}

          {/* Speed control */}
          <div class="bg-surface-elevated rounded-lg p-3 mb-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-caption-uppercase text-muted">Playback Speed</span>
              <span class="text-title-lg text-primary">{speed}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.05"
              value={speed}
              onInput={(e) => {
                const val = Number((e.target as HTMLInputElement).value);
                setSpeed(val);
                if (videoRef.current) {
                  videoRef.current.playbackRate = val;
                }
              }}
              class="w-full"
              style="accent-color: var(--color-primary)"
            />
            <div class="flex justify-between text-caption text-muted mt-1">
              <span>0.25x (Slow)</span>
              <span>1x (Normal)</span>
              <span>4x (Fast)</span>
            </div>

            {/* Preset buttons */}
            <div class="flex flex-wrap gap-2 mt-4">
              {SPEED_PRESETS.map((preset) => (
                <button
                  key={preset}
                  class={speed === preset ? "btn-primary" : "btn-secondary"}
                  onClick={() => {
                    setSpeed(preset);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = preset;
                    }
                  }}
                  style="padding: 0.25rem 0.75rem; font-size: 0.875rem"
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Duration comparison */}
          {originalDuration > 0 && (
            <div class="bg-surface-elevated rounded-lg p-3 mb-4">
              <div class="text-caption-uppercase text-muted mb-3">Duration</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-caption text-muted">Original</div>
                  <div class="text-title-lg text-primary">{formatDuration(originalDuration)}</div>
                </div>
                <div>
                  <div class="text-caption text-muted">At {speed}x</div>
                  <div class="text-title-lg text-primary">{formatDuration(newDuration)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {(processing || processedBlob) && (
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

          {/* Processed result */}
          {processedBlob && (
            <div class="bg-surface-elevated rounded-lg p-3 mb-4">
              <div class="text-caption-uppercase text-muted mb-2">Processed Video</div>
              <div class="text-body-sm text-primary">
                <div><strong>Speed:</strong> {speed}x</div>
                <div><strong>Duration:</strong> {formatDuration(newDuration)}</div>
                <div><strong>Size:</strong> {formatFileSize(processedBlob.size)}</div>
              </div>
              <video
                src={URL.createObjectURL(processedBlob)}
                controls
                style="max-height: 250px; width: 100%; border-radius: 0.5rem; margin-top: 0.75rem"
              />
            </div>
          )}

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            {!processedBlob && (
              <button
                class="btn-primary"
                onClick={handleProcess}
                disabled={processing}
              >
                {processing ? `Processing... ${progress}%` : "Process Video"}
              </button>
            )}
            {processedBlob && (
              <button class="btn-primary" onClick={handleDownload}>
                Download WebM
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
