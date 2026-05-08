import { useCallback, useMemo, useState } from "preact/hooks";

function htmlToMarkdown(html: string): string {
	let md = html;

	// Pre/code blocks (must come before inline code)
	md = md.replace(
		/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
		(_: string, code: string) => {
			const decoded = decodeHtml(code).replace(/\n$/, "");
			return `\n\`\`\`\n${decoded}\n\`\`\`\n`;
		},
	);

	// Headers
	md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
	md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
	md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
	md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
	md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
	md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");

	// Bold
	md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");

	// Italic
	md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");

	// Inline code (must come after pre/code blocks)
	md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

	// Links
	md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

	// Images
	md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
	md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, "![$1]($2)");
	md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

	// Horizontal rule
	md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n");

	// Blockquote
	md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_: string, content: string) => {
		const lines = content
			.trim()
			.split("\n")
			.map((l) => `> ${l.trim()}`)
			.join("\n");
		return `\n${lines}\n`;
	});

	// Unordered list
	md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_: string, content: string) => {
		const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
		return `\n${items.trim()}\n`;
	});

	// Ordered list
	let olCounter = 0;
	md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_: string, content: string) => {
		olCounter = 0;
		const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
			olCounter++;
			return `${olCounter}. $1\n`;
		});
		return `\n${items.trim()}\n`;
	});

	// Paragraphs
	md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");

	// Line breaks
	md = md.replace(/<br\s*\/?>/gi, "\n");

	// Strip remaining HTML tags
	md = md.replace(/<[^>]+>/g, "");

	// Decode HTML entities
	md = decodeHtml(md);

	// Clean up extra whitespace
	md = md.replace(/\n{3,}/g, "\n\n");
	md = md.trim();

	return md;
}

function decodeHtml(html: string): string {
	return html
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ");
}

export default function HtmlToMarkdown() {
	const [input, setInput] = useState("");

	const markdown = useMemo(() => {
		if (!input.trim()) return "";
		return htmlToMarkdown(input);
	}, [input]);

	const handleCopy = useCallback(async () => {
		if (markdown) await navigator.clipboard.writeText(markdown);
	}, [markdown]);

	const handleSample = useCallback(() => {
		setInput(`<h1>Hello World</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> text example.</p>

<h2>Features</h2>
<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

<h3>Code Block</h3>
<pre><code>const greeting = "Hello, World!";
console.log(greeting);</code></pre>

<blockquote>
  <p>This is a blockquote.</p>
</blockquote>

<p><a href="https://github.com">Visit GitHub</a></p>
<hr>
<p>That's all folks!</p>`);
	}, []);

	return (
		<div>
			<div class="flex items-center gap-3 mb-6">
				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
					Load Sample
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">HTML Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						placeholder="<h1>Enter HTML here...</h1>"
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Markdown Output</label>
						{markdown && (
							<button
								class="text-body-sm text-primary hover:text-primary-active transition-colors"
								onClick={handleCopy}
							>
								Copy Markdown
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
						value={markdown}
						readOnly
						placeholder="Markdown output will appear here..."
					/>
				</div>
			</div>
		</div>
	);
}
