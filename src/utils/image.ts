/**
 * Shared image processing utilities using Canvas API
 * All processing happens 100% client-side
 */

export type ImageFormat = "image/png" | "image/jpeg" | "image/webp";

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

/**
 * Load an image file into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Load an image from a data URL or object URL
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Draw an image to canvas and return the canvas
 */
export function imageToCanvas(
  img: HTMLImageElement,
  width?: number,
  height?: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width ?? img.naturalWidth;
  canvas.height = height ?? img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Convert canvas to blob with specified format and quality
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      format,
      quality
    );
  });
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number = 0.92
): string {
  return canvas.toDataURL(format, quality);
}

/**
 * Get file extension from MIME type
 */
export function getExtension(format: ImageFormat): string {
  const map: Record<ImageFormat, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return map[format];
}

/**
 * Get MIME type from extension
 */
export function getMimeType(ext: string): ImageFormat {
  const map: Record<string, ImageFormat> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return map[ext.toLowerCase()] ?? "image/png";
}

/**
 * Get image info from a File
 */
export async function getImageInfo(file: File): Promise<ImageInfo> {
  const img = await loadImage(file);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: file.size,
    type: file.type,
    name: file.name,
  };
}

/**
 * Resize an image to specified dimensions
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format?: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = imageToCanvas(img, targetWidth, targetHeight);
  const outputFormat = format ?? (file.type as ImageFormat) ?? "image/png";
  return canvasToBlob(canvas, outputFormat, quality);
}

/**
 * Convert image format
 */
export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = imageToCanvas(img);

  // JPG doesn't support transparency, fill white background
  if (targetFormat === "image/jpeg") {
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvasToBlob(canvas, targetFormat, quality);
}

/**
 * Compress image with quality control
 */
export async function compressImage(
  file: File,
  quality: number = 0.7,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  const img = await loadImage(file);

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  if (maxHeight && height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  const canvas = imageToCanvas(img, width, height);
  const format = (file.type as ImageFormat) || "image/jpeg";
  const blob = await canvasToBlob(canvas, format, quality);

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

/**
 * Crop an image to specified region
 */
export async function cropImage(
  file: File,
  x: number,
  y: number,
  width: number,
  height: number,
  format?: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  const outputFormat = format ?? (file.type as ImageFormat) ?? "image/png";
  return canvasToBlob(canvas, outputFormat, quality);
}
