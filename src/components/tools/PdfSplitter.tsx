import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { downloadBlob, formatFileSize } from "../../utils/download";
import { PDFDocument } from "pdf-lib";

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState("");
  const [pageRange, setPageRange] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setError(null);
    setPageRange("");

    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setFile(f);
      setFileName(f.name);
      setTotalPages(pdfDoc.getPageCount());
      setPageSize(formatFileSize(f.size));
    } catch (e) {
      setError(`Failed to load PDF: ${(e as Error).message}`);
    }
  }, []);

  const parsePageRanges = useCallback((rangeStr: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > max) {
          throw new Error(`Invalid range: "${part}". Pages must be between 1 and ${max}.`);
        }

        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1 || page > max) {
          throw new Error(`Invalid page: "${part}". Pages must be between 1 and ${max}.`);
        }
        pages.add(page);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;
    setError(null);

    let pages: number[];
    try {
      pages = parsePageRanges(pageRange, totalPages);
    } catch (e) {
      setError((e as Error).message);
      return;
    }

    if (pages.length === 0) {
      setError("Please enter at least one page range.");
      return;
    }

    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      const copiedPages = await newDoc.copyPages(srcDoc, pages.map((p) => p - 1));
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const baseName = fileName.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}-pages-${pages.join(",")}.pdf`);
    } catch (e) {
      setError("Split failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, fileName, totalPages, pageRange, parsePageRanges]);

  const handlePresetRange = useCallback((range: string) => {
    setPageRange(range);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setFileName("");
    setTotalPages(0);
    setPageSize("");
    setPageRange("");
    setError(null);
  }, []);

  return (
    <div>
      {!file ? (
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFiles}
          label="Drop a PDF file here to split"
          sublabel="Select a PDF to extract specific pages"
        />
      ) : (
        <div>
          {/* File Info */}
          <div class="bg-surface-elevated rounded-lg p-4 mb-6">
            <div class="text-caption-uppercase text-muted mb-3">Document Info</div>
            <div class="text-body text-primary truncate mb-1">{fileName}</div>
            <div class="text-caption text-muted">
              {totalPages} pages • {pageSize}
            </div>
          </div>

          {/* Page Range Input */}
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-2">
              Page Range
            </label>
            <input
              type="text"
              class="input"
              placeholder="e.g. 1-3,5,7-9"
              value={pageRange}
              onInput={(e) => {
                setPageRange((e.target as HTMLInputElement).value);
                setError(null);
              }}
            />
            <div class="text-caption text-muted mt-2">
              Enter page numbers or ranges separated by commas. Pages: 1-{totalPages}
            </div>
          </div>

          {/* Preset Ranges */}
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-2">
              Quick Select
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                onClick={() => handlePresetRange("1")}
              >
                First page
              </button>
              <button
                class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                onClick={() => handlePresetRange(String(totalPages))}
              >
                Last page
              </button>
              <button
                class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                onClick={() => handlePresetRange(`1-${Math.ceil(totalPages / 2)}`)}
              >
                First half
              </button>
              <button
                class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                onClick={() => handlePresetRange(`${Math.ceil(totalPages / 2) + 1}-${totalPages}`)}
              >
                Second half
              </button>
              <button
                class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                onClick={() => handlePresetRange(`1-${totalPages}`)}
              >
                All pages
              </button>
            </div>
          </div>

          {/* Preview */}
          {pageRange && !error && (
            <div class="mb-6">
              {(() => {
                try {
                  const pages = parsePageRanges(pageRange, totalPages);
                  return (
                    <div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4">
                      <div class="text-caption-uppercase text-accent-emerald mb-2">Preview</div>
                      <div class="text-body-sm text-body">
                        {pages.length} page{pages.length !== 1 ? "s" : ""} selected: {pages.join(", ")}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          {/* Error */}
          {error && (
            <div class="mb-6 bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
              {error}
            </div>
          )}

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button
              class="btn-primary"
              onClick={handleSplit}
              disabled={processing || !pageRange}
            >
              {processing ? "Splitting..." : "Split & Download"}
            </button>
            <button class="btn-secondary" onClick={handleReset}>
              Choose Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
