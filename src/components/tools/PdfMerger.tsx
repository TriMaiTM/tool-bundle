import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { downloadBlob, formatFileSize } from "../../utils/download";
import { PDFDocument } from "pdf-lib";

interface PdfFile {
  file: File;
  name: string;
  pageCount: number;
  size: string;
}

export default function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [mergedSize, setMergedSize] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const newPdfFiles: PdfFile[] = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        newPdfFiles.push({
          file,
          name: file.name,
          pageCount: pdfDoc.getPageCount(),
          size: formatFileSize(file.size),
        });
      } catch (e) {
        alert(`Failed to load "${file.name}": ${(e as Error).message}`);
      }
    }

    setPdfFiles((prev) => [...prev, ...newPdfFiles]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedSize(null);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setPdfFiles((prev) => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setPdfFiles((prev) => {
      if (index === prev.length - 1) return prev;
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (pdfFiles.length < 2) {
      alert("Please add at least 2 PDF files to merge.");
      return;
    }

    setProcessing(true);
    setMergedSize(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      setMergedSize(formatFileSize(blob.size));

      downloadBlob(blob, "merged.pdf");
    } catch (e) {
      alert("Merge failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [pdfFiles]);

  const handleReset = useCallback(() => {
    setPdfFiles([]);
    setMergedSize(null);
  }, []);

  const totalPages = pdfFiles.reduce((sum, pdf) => sum + pdf.pageCount, 0);
  const totalSize = pdfFiles.reduce((sum, pdf) => sum + pdf.file.size, 0);

  return (
    <div>
      {pdfFiles.length === 0 ? (
        <FileDropZone
          accept=".pdf"
          multiple={true}
          onFiles={handleFiles}
          label="Drop PDF files here to merge"
          sublabel="Select multiple PDF files to combine into one"
        />
      ) : (
        <div>
          {/* Summary */}
          <div class="bg-surface-elevated rounded-lg p-4 mb-6">
            <div class="text-caption-uppercase text-muted mb-3">Merge Summary</div>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-display-sm text-primary">{pdfFiles.length}</div>
                <div class="text-caption text-muted">Files</div>
              </div>
              <div>
                <div class="text-display-sm text-primary">{totalPages}</div>
                <div class="text-caption text-muted">Total Pages</div>
              </div>
              <div>
                <div class="text-display-sm text-primary">{formatFileSize(totalSize)}</div>
                <div class="text-caption text-muted">Total Size</div>
              </div>
            </div>
            {mergedSize && (
              <div class="mt-4 pt-4 border-t border-hairline">
                <div class="text-caption-uppercase text-accent-emerald">Merged Result</div>
                <div class="text-display-sm text-accent-emerald mt-1">{mergedSize}</div>
              </div>
            )}
          </div>

          {/* File List */}
          <div class="space-y-3 mb-6">
            {pdfFiles.map((pdf, index) => (
              <div
                key={`${pdf.name}-${index}`}
                class="bg-surface-elevated rounded-lg p-4 flex items-center gap-4"
              >
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-body-sm">
                  {index + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-body text-primary truncate">{pdf.name}</div>
                  <div class="text-caption text-muted">
                    {pdf.pageCount} pages • {pdf.size}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="p-2 rounded-md bg-surface-elevated text-muted hover:text-on-dark transition-colors disabled:opacity-50"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    class="p-2 rounded-md bg-surface-elevated text-muted hover:text-on-dark transition-colors disabled:opacity-50"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pdfFiles.length - 1}
                    title="Move down"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button
                    class="p-2 rounded-md bg-surface-elevated text-muted hover:text-accent-rose transition-colors"
                    onClick={() => handleRemove(index)}
                    title="Remove"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add more files */}
          <div class="mb-6">
            <FileDropZone
              accept=".pdf"
              multiple={true}
              onFiles={handleFiles}
              label="Add more PDF files"
              sublabel="Drop or click to add more files to the merge list"
            />
          </div>

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button
              class="btn-primary"
              onClick={handleMerge}
              disabled={processing || pdfFiles.length < 2}
            >
              {processing ? "Merging PDFs..." : "Merge & Download"}
            </button>
            <button class="btn-secondary" onClick={handleReset}>
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
