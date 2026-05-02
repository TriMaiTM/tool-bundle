import { useState, useCallback, useRef } from "preact/hooks";

interface Props {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFiles: (files: File[]) => void;
  label?: string;
  sublabel?: string;
}

export default function FileDropZone({
  accept = "image/*",
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFiles,
  label = "Drop files here or click to browse",
  sublabel,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);

      // Check file size
      const oversized = files.find((f) => f.size > maxSize);
      if (oversized) {
        setError(`File "${oversized.name}" exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        return;
      }

      // Check accept
      if (accept && accept !== "*") {
        const acceptTypes = accept.split(",").map((t) => t.trim());
        const invalid = files.find((f) => {
          return !acceptTypes.some((type) => {
            if (type.endsWith("/*")) return f.type.startsWith(type.replace("/*", "/"));
            if (type.startsWith(".")) return f.name.toLowerCase().endsWith(type);
            return f.type === type;
          });
        });
        if (invalid) {
          setError(`File "${invalid.name}" is not an accepted file type`);
          return;
        }
      }

      if (!multiple && files.length > 1) {
        onFiles([files[0]]);
      } else {
        onFiles(files);
      }
    },
    [accept, multiple, maxSize, onFiles]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files) {
        handleFiles(input.files);
      }
      input.value = ""; // Reset so same file can be selected again
    },
    [handleFiles]
  );

  return (
    <div>
      <div
        class={`drop-zone ${isDragging ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          class="hidden"
          onChange={handleInputChange}
        />

        {/* Upload icon */}
        <svg
          class="w-10 h-10 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <p class="text-body-sm text-body">{label}</p>
        {sublabel && <p class="text-caption text-muted">{sublabel}</p>}
      </div>

      {error && (
        <div class="mt-3 bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-3 text-body-sm text-accent-rose">
          {error}
        </div>
      )}
    </div>
  );
}
