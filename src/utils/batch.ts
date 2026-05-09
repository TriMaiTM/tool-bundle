/**
 * Batch Processing Utilities
 * Shared helpers for multi-file processing and bulk download
 */

import JSZip from "jszip";

export interface BatchFile {
	id: string;
	file: File;
	name: string;
	size: number;
	status: "pending" | "processing" | "done" | "error";
	progress: number;
	result?: { blob: Blob; name: string };
	error?: string;
}

export function createBatchId(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
	return filename.slice(filename.lastIndexOf("."));
}

export function getFileNameWithoutExt(filename: string): string {
	return filename.slice(0, filename.lastIndexOf("."));
}

export async function downloadAsZip(
	files: { name: string; blob: Blob }[],
	zipName: string,
): Promise<void> {
	const zip = new JSZip();
	for (const file of files) {
		zip.file(file.name, file.blob);
	}
	const content = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(content);
	const a = document.createElement("a");
	a.href = url;
	a.download = zipName;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function processBatchSequentially<T>(
	items: T[],
	processor: (item: T, index: number) => Promise<void>,
	onProgress: (index: number) => void,
): Promise<void> {
	return items.reduce(async (prev, item, index) => {
		await prev;
		await processor(item, index);
		onProgress(index);
	}, Promise.resolve());
}

export function processBatchParallel<T>(
	items: T[],
	processor: (item: T, index: number) => Promise<void>,
	concurrency = 3,
): Promise<void> {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += concurrency) {
		chunks.push(items.slice(i, i + concurrency));
	}
	return chunks.reduce(async (prev, chunk) => {
		await prev;
		await Promise.all(chunk.map((item, i) => processor(item, i)));
	}, Promise.resolve());
}
