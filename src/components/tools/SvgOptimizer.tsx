import { useCallback, useMemo, useState } from "preact/hooks";
import { copyToClipboard, downloadText, formatFileSize, readAsText } from "../../utils/download";
import FileDropZone from "../ui/FileDropZone";

interface OptimizeOptions {
	removeComments: boolean;
	removeMetadata: boolean;
	removeEditorNamespaces: boolean;
	collapseWhitespace: boolean;
	removeEmptyAttributes: boolean;
	shortenColors: boolean;
	removeDefaultValues: boolean;
	removeHiddenElements: boolean;
}

const DEFAULT_OPTIONS: OptimizeOptions = {
	removeComments: true,
	removeMetadata: true,
	removeEditorNamespaces: true,
	collapseWhitespace: true,
	removeEmptyAttributes: true,
	shortenColors: true,
	removeDefaultValues: false,
	removeHiddenElements: false,
};

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="200" height="200" viewBox="0 0 200 200">
  <!-- This is a sample SVG for testing the optimizer -->
  <!-- It contains various elements that can be optimized -->
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>Sample Icon</dc:title>
        <dc:creator>Test</dc:creator>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6600; stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff0066; stop-opacity:1" />
    </linearGradient>
  </defs>
  <g id="background" sketch:type="MSLayerGroup">
    <rect x="0" y="0" width="200" height="200" fill="#ffffff" stroke="none" stroke-width="0" />
  </g>
  <g id="shapes" sketch:type="MSLayerGroup">
    <circle cx="100" cy="80" r="50" fill="url(#grad1)" opacity="1.0" />
    <rect x="50" y="140" width="100" height="40" rx="8" ry="8" fill="#0066ff" stroke="#000000" stroke-width="2" />
    <text x="100" y="165" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="bold" font-style="normal">Hello</text>
  </g>
  <g id="details" visibility="hidden">
    <circle cx="30" cy="30" r="5" fill="#cccccc" />
    <circle cx="170" cy="30" r="5" fill="#cccccc" />
  </g>
  <!-- End of sample SVG -->
</svg>`;

function optimizeSvg(svg: string, options: OptimizeOptions): string {
	let result = svg;

	// Remove comments
	if (options.removeComments) {
		result = result.replace(/<!--[\s\S]*?-->/g, "");
	}

	// Remove metadata block
	if (options.removeMetadata) {
		result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
	}

	// Remove editor-specific namespaces
	if (options.removeEditorNamespaces) {
		result = result.replace(
			/\s+xmlns:(?:sketch|inkscape|sodipodi|cc|dc|rdf|inkscape|bpmn|oai|serif|figma)="[^"]*"/gi,
			"",
		);
		result = result.replace(/\s+sketch:type="[^"]*"/gi, "");
		result = result.replace(/\s+inkscape:[a-z-]+="[^"]*"/gi, "");
		result = result.replace(/\s+sodipodi:[a-z-]+="[^"]*"/gi, "");
		result = result.replace(/\s+figma:[a-z-]+="[^"]*"/gi, "");
	}

	// Shorten colors (#ffffff -> #fff, #aabbcc -> #abc)
	if (options.shortenColors) {
		result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, "#$1$2$3");
		// Also handle named colors in fill/stroke attributes where hex equivalents are shorter
	}

	// Remove empty/default attributes
	if (options.removeEmptyAttributes) {
		result = result.replace(/\s+id=""/g, "");
		result = result.replace(/\s+class=""/g, "");
		result = result.replace(/\s+style=""/g, "");
		result = result.replace(/\s+transform=""/g, "");
	}

	// Remove default values
	if (options.removeDefaultValues) {
		// opacity="1" is default
		result = result.replace(/\s+opacity="1(?:\.0)?"/g, "");
		// fill-opacity="1" is default
		result = result.replace(/\s+fill-opacity="1(?:\.0)?"/g, "");
		// stroke-opacity="1" is default
		result = result.replace(/\s+stroke-opacity="1(?:\.0)?"/g, "");
		// stroke-width="1" is default
		result = result.replace(/\s+stroke-width="1"/g, "");
		// font-style="normal" is default
		result = result.replace(/\s+font-style="normal"/g, "");
		// font-weight="normal" is default
		result = result.replace(/\s+font-weight="normal"/g, "");
		// stroke="none" is default
		result = result.replace(/\s+stroke="none"/g, "");
		// fill="black" / fill="#000000" / fill="#000" are default for some elements
		// rx="0" / ry="0" are defaults
		result = result.replace(/\s+rx="0"/g, "");
		result = result.replace(/\s+ry="0"/g, "");
	}

	// Remove hidden elements (visibility="hidden", display="none")
	if (options.removeHiddenElements) {
		result = result.replace(/<[^>]*visibility="hidden"[^>]*>[\s\S]*?<\/[^>]+>/g, "");
		result = result.replace(/<[^>]*display="none"[^>]*>[\s\S]*?<\/[^>]+>/g, "");
		// Self-closing hidden elements
		result = result.replace(/<[^/>]*visibility="hidden"[^/]*\/>/g, "");
		result = result.replace(/<[^/>]*display="none"[^/]*\/>/g, "");
	}

	// Collapse whitespace
	if (options.collapseWhitespace) {
		// Remove extra whitespace between tags
		result = result.replace(/>\s+</g, "><");
		// Remove leading/trailing whitespace on lines
		result = result.replace(/^\s+|\s+$/gm, "");
		// Collapse multiple spaces into one
		result = result.replace(/ {2,}/g, " ");
		// Remove empty lines
		result = result.replace(/\n\s*\n/g, "\n");
	}

	// Clean up any leftover whitespace around the root element
	result = result.trim();

	return result;
}

export default function SvgOptimizer() {
	const [input, setInput] = useState("");
	const [options, setOptions] = useState<OptimizeOptions>({
		...DEFAULT_OPTIONS,
	});
	const [copied, setCopied] = useState(false);
	const [mode, setMode] = useState<"upload" | "paste">("paste");

	const optimized = useMemo(() => {
		if (!input.trim()) return "";
		return optimizeSvg(input, options);
	}, [input, options]);

	const originalSize = new Blob([input]).size;
	const optimizedSize = new Blob([optimized]).size;
	const savings = originalSize > 0 ? ((1 - optimizedSize / originalSize) * 100).toFixed(1) : "0";

	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		const text = await readAsText(f);
		setInput(text);
		setMode("paste");
	}, []);

	const toggleOption = useCallback((key: keyof OptimizeOptions) => {
		setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	const handleCopy = useCallback(async () => {
		if (!optimized) return;
		await copyToClipboard(optimized);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [optimized]);

	const handleDownload = useCallback(() => {
		if (!optimized) return;
		downloadText(optimized, "optimized.svg", "image/svg+xml");
	}, [optimized]);

	const handleLoadSample = useCallback(() => {
		setInput(SAMPLE_SVG);
		setMode("paste");
	}, []);

	const handleReset = useCallback(() => {
		setInput("");
		setCopied(false);
	}, []);

	const optionLabels: { key: keyof OptimizeOptions; label: string }[] = [
		{ key: "removeComments", label: "Remove comments" },
		{ key: "removeMetadata", label: "Remove metadata" },
		{ key: "removeEditorNamespaces", label: "Remove editor namespaces" },
		{ key: "collapseWhitespace", label: "Collapse whitespace" },
		{ key: "removeEmptyAttributes", label: "Remove empty attributes" },
		{ key: "shortenColors", label: "Shorten colors (#ffffff → #fff)" },
		{ key: "removeDefaultValues", label: "Remove default values" },
		{ key: "removeHiddenElements", label: "Remove hidden elements" },
	];

	return (
		<div>
			{/* Input Mode Toggle */}
			<div
				class="flex rounded-md overflow-hidden border border-hairline mb-4"
				style="width: fit-content"
			>
				<button
					class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "upload" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
					onClick={() => setMode("upload")}
				>
					Upload File
				</button>
				<button
					class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "paste" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
					onClick={() => setMode("paste")}
				>
					Paste Code
				</button>
			</div>

			{mode === "upload" ? (
				<div class="mb-6">
					<FileDropZone
						accept=".svg,image/svg+xml"
						onFiles={handleFiles}
						label="Drop an SVG file here or click to browse"
						sublabel="Supports .svg files up to 50MB"
					/>
					<div class="mt-3">
						<button class="btn-secondary text-body-sm" onClick={handleLoadSample}>
							Load Sample SVG
						</button>
					</div>
				</div>
			) : (
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">SVG Code</label>
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleLoadSample}
						>
							Load Sample
						</button>
					</div>
					<textarea
						class="textarea code-block"
						style="min-height: 200px; font-family: var(--font-mono); font-size: 12px"
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
						placeholder="Paste your SVG code here..."
					/>
				</div>
			)}

			{/* Optimization Options */}
			{input && (
				<>
					<div class="bg-surface-elevated rounded-lg p-3 mb-4">
						<div class="text-caption-uppercase text-muted mb-3">Optimization Options</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{optionLabels.map(({ key, label }) => (
								<label
									key={key}
									class="flex items-center gap-2 text-body-sm text-body cursor-pointer"
								>
									<input
										type="checkbox"
										checked={options[key]}
										onChange={() => toggleOption(key)}
										style="accent-color: var(--color-primary)"
									/>
									{label}
								</label>
							))}
						</div>
					</div>

					{/* Before / After Stats */}
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-caption-uppercase text-muted mb-1">Original</div>
							<div class="text-title-lg text-primary">{formatFileSize(originalSize)}</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-caption-uppercase text-muted mb-1">Optimized</div>
							<div class="text-title-lg text-primary">{formatFileSize(optimizedSize)}</div>
						</div>
						<div class="rounded-lg p-3 text-center bg-accent-emerald/10 border border-accent-emerald/30">
							<div class="text-caption-uppercase text-accent-emerald mb-1">Savings</div>
							<div class="text-title-lg text-accent-emerald">{savings}%</div>
						</div>
					</div>

					{/* Side-by-side Preview */}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
						<div class="bg-surface-elevated rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-3">Original Preview</div>
							<div
								class="rounded-md overflow-hidden bg-white"
								style="min-height: 150px; display: flex; align-items: center; justify-content: center; padding: 16px"
								dangerouslySetInnerHTML={{ __html: input }}
							/>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-3">Optimized Preview</div>
							<div
								class="rounded-md overflow-hidden bg-white"
								style="min-height: 150px; display: flex; align-items: center; justify-content: center; padding: 16px"
								dangerouslySetInnerHTML={{ __html: optimized }}
							/>
						</div>
					</div>

					{/* Output */}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<label class="text-caption-uppercase text-muted">Optimized SVG</label>
							{optimized && (
								<button
									class="text-body-sm text-primary hover:text-primary-active transition-colors"
									onClick={handleCopy}
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							)}
						</div>
						<textarea
							class="textarea code-block"
							style="min-height: 180px; font-family: var(--font-mono); font-size: 12px"
							value={optimized}
							readOnly
							placeholder="Optimized SVG will appear here..."
						/>
					</div>

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy} disabled={!optimized}>
							{copied ? "Copied!" : "Copy SVG"}
						</button>
						<button class="btn-secondary" onClick={handleDownload} disabled={!optimized}>
							Download .svg
						</button>
						<button class="btn-secondary" onClick={handleReset}>
							Clear
						</button>
					</div>
				</>
			)}
		</div>
	);
}
