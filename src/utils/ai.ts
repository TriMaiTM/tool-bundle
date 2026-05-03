/**
 * AI Utilities — Shared helpers for AI-powered tools
 * Uses Tesseract.js for OCR and @huggingface/transformers for other AI tasks
 */

// Re-export Tesseract worker creation for OCR
export async function createTesseractWorker(
  lang: string = "eng",
  onProgress?: (progress: number, status: string) => void,
) {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker(lang, 1, {
    logger: (m: { progress: number; status: string }) => {
      if (onProgress) {
        onProgress(m.progress, m.status);
      }
    },
  });
  return worker;
}

/**
 * Perform OCR on an image source (File, Blob, URL, or base64)
 */
export async function performOCR(
  imageSource: File | Blob | string,
  lang: string = "eng",
  onProgress?: (progress: number, status: string) => void,
): Promise<{ text: string; confidence: number }> {
  const worker = await createTesseractWorker(lang, onProgress);
  const {
    data: { text, confidence },
  } = await worker.recognize(imageSource);
  await worker.terminate();
  return { text, confidence };
}

/**
 * Resize an image to fit within max dimensions while maintaining aspect ratio.
 * Returns a Blob suitable for AI model input.
 */
export function resizeImageForAI(
  file: File,
  maxDim: number = 1024,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        "image/png",
        1,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert a Blob to a data URL string
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Create an object URL from a Blob and track it for cleanup
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
