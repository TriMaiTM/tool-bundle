import { marked } from "marked";
import { useCallback, useMemo, useState } from "preact/hooks";

export default function MarkdownToHtml() {
	const [input, setInput] = useState("");

	const html = useMemo(() => {
		if (!input.trim()) return "";
		try {
			return marked.parse(input) as string;
		} catch {
			return "";
		}
	}, [input]);

	const handleCopy = useCallback(async () => {
		if (html) await navigator.clipboard.writeText(html);
	}, [html]);

	const handleSample = useCallback(() => {
		setInput(`# Hello World

This is a **bold** and *italic* text example.

## Features

- Item one
- Item two
- Item three

### Code Block

\`\`\`js
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> This is a blockquote.

[Visit GitHub](https://github.com)

---

That's all folks!`);
	}, []);

	return (
		<div>
			<div class="flex items-center gap-3 mb-6">
				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Load Sample
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Markdown Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						placeholder="# Enter Markdown here..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">HTML Output</label>
						{html && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								Copy HTML
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						value={html}
						readOnly
						placeholder="HTML output will appear here..."
					/>
				</div>
			</div>

			{html && (
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Live Preview</label>
					<div
						class="bg-surface-elevated rounded-lg p-4 prose-invert"
						style="min-height: 100px"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			)}
		</div>
	);
}
