import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { downloadBlob, formatFileSize } from "../../utils/download";
import { PDFDocument, degrees } from "pdf-lib";

type RotationAngle = 90 | 180 | 270;

export default function PdfRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);
  const [selectMode, setSelectMode] = useState<"all" | "custom">("all");

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];

    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setFile(f);
      setFileName(f.name);
      setTotalPages(pdfDoc.getPageCount());
      setPageSize(formatFileSize(f.size));
      setSelectedPages(new Set());
      setSelectMode("all");
    } catch (e) {
      alert(`Failed to load PDF: ${(e as Error).message}`);
    }
  }, []);

  const handleTogglePage = useCallback((page: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }, []);

  const handleRotate = useCallback(async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      const pagesToRotate = selectMode === "all"
        ? pages.map((_, i) => i + 1)
        : Array.from(selectedPages);

      for (const pageNum of pagesToRotate) {
        const page = pages[pageNum - 1];
        if (page) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + rotationAngle) % 360));
        }
      }

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes], { type: "application/pdf" });

      const baseName = fileName.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}-rotated-${rotationAngle}deg.pdf`);
    } catch (e) {
      alert("Rotation failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, fileName, selectedPages, rotationAngle, selectMode]);

  const handleReset = useCallback(() => {
    setFile(null);
    setFileName("");
    setTotalPages(0);
    setPageSize("");
    setSelectedPages(new Set());
    setRotationAngle(90);
    setSelectMode("all");
  }, []);

  const pagesToRotateCount = selectMode === "all" ? totalPages : selectedPages.size;

  return (
    <div>
      {!file ? (
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFiles}
          label="Drop a PDF file here to rotate"
          sublabel="Rotate all or specific pages in your PDF"
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

          {/* Rotation Angle */}
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-2">
              Rotation Angle
            </label>
            <div class="flex gap-3">
              {([90, 180, 270] as RotationAngle[]).map((angle) => (
                <button
                  key={angle}
                  class={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    rotationAngle === angle
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-elevated text-body border-hairline hover:border-primary"
                  }`}
                  onClick={() => setRotationAngle(angle)}
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                  </svg>
                  {angle}°
                </button>
              ))}
            </div>
          </div>

          {/* Page Selection */}
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-2">
              Pages to Rotate
            </label>
            <div class="flex gap-3 mb-4">
              <button
                class={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
                  selectMode === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-elevated text-body hover:text-on-dark"
                }`}
                onClick={() => { setSelectedPages(new Set()); setSelectMode("all"); }}
              >
                All Pages
              </button>
              <button
                class={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
                  selectMode === "custom"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-elevated text-body hover:text-on-dark"
                }`}
                onClick={() => setSelectMode("custom")}
              >
                Select Pages
              </button>
            </div>

            {selectMode === "custom" && (
              <div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    class={`py-2 rounded-md text-body-sm font-medium transition-colors ${
                      selectedPages.has(page)
                        ? "bg-primary text-on-primary"
                        : "bg-surface-elevated text-body hover:text-on-dark"
                    }`}
                    onClick={() => handleTogglePage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 mb-6">
            <div class="text-body-sm text-body">
              Will rotate <strong>{pagesToRotateCount} page{pagesToRotateCount !== 1 ? "s" : ""}</strong> by{" "}
              <strong>{rotationAngle}°</strong> clockwise
            </div>
          </div>

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button
              class="btn-primary"
              onClick={handleRotate}
              disabled={processing || (selectMode === "custom" && selectedPages.size === 0)}
            >
              {processing ? "Rotating..." : "Rotate & Download"}
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
