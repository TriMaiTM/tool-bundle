import { useState, useMemo } from "preact/hooks";

function htmlToText(html: string): string {
	let text = html;
	// Block elements → newlines
	text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre|section|article)>/gi, "\n");
	text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");
	// List items with bullets
	text = text.replace(/<li[^>]*>/gi, "• ");
	// Headers with newlines
	text = text.replace(/<h[1-6][^>]*>/gi, "\n");
	// Remove all remaining tags
	text = text.replace(/<[^>]+>/g, "");
	// Decode common HTML entities
	text = text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ");
	// Clean up whitespace
	text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ");
	return text.trim();
}

export default function HtmlToText() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		return htmlToText(input);
	}, [input]);

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};
	const handleClear = () => {
		setInput("");
	};

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">HTML Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						placeholder={
							"<h1>Title</h1>\n<p>Hello <strong>world</strong></p>\n<ul><li>Item 1</li><li>Item 2</li></ul>"
						}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Plain Text Output</label>
						{result && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 300px;"
						value={result}
						readOnly
						placeholder="Plain text output..."
					/>
				</div>
			</div>
			{result && (
				<div class="grid grid-cols-3 gap-3">
					<div class="bg-surface-card rounded-lg p-3 text-center">
						<div class="text-title-sm text-primary">
							{result.split(/\s+/).filter(Boolean).length}
						</div>
						<div class="text-caption text-muted">Words</div>
					</div>
					<div class="bg-surface-card rounded-lg p-3 text-center">
						<div class="text-title-sm text-primary">{result.length}</div>
						<div class="text-caption text-muted">Characters</div>
					</div>
					<div class="bg-surface-card rounded-lg p-3 text-center">
						<div class="text-title-sm text-primary">{result.split("\n").length}</div>
						<div class="text-caption text-muted">Lines</div>
					</div>
				</div>
			)}
		</div>
	);
}
