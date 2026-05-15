import { useCallback, useMemo, useState } from "preact/hooks";

interface MimeEntry {
	mime: string;
	extensions: string[];
	category: string;
	description: string;
}

const MIME_DATABASE: MimeEntry[] = [
	// Text
	{
		mime: "text/html",
		extensions: ["html", "htm"],
		category: "text",
		description: "HTML document",
	},
	{ mime: "text/css", extensions: ["css"], category: "text", description: "Cascading Style Sheet" },
	{
		mime: "text/plain",
		extensions: ["txt", "text"],
		category: "text",
		description: "Plain text document",
	},
	{
		mime: "text/javascript",
		extensions: ["js", "mjs"],
		category: "text",
		description: "JavaScript module",
	},
	{ mime: "text/xml", extensions: ["xml"], category: "text", description: "XML document" },
	{
		mime: "text/csv",
		extensions: ["csv"],
		category: "text",
		description: "Comma-separated values",
	},
	{
		mime: "text/markdown",
		extensions: ["md", "markdown"],
		category: "text",
		description: "Markdown document",
	},
	{
		mime: "text/tab-separated-values",
		extensions: ["tsv"],
		category: "text",
		description: "Tab-separated values",
	},
	{ mime: "text/calendar", extensions: ["ics"], category: "text", description: "iCalendar format" },
	{ mime: "text/vcard", extensions: ["vcf"], category: "text", description: "vCard contact info" },
	{ mime: "text/x-python", extensions: ["py"], category: "text", description: "Python script" },
	{ mime: "text/x-ruby", extensions: ["rb"], category: "text", description: "Ruby script" },
	{ mime: "text/x-c", extensions: ["c", "h"], category: "text", description: "C source code" },
	{ mime: "text/x-java", extensions: ["java"], category: "text", description: "Java source code" },
	{ mime: "text/x-shellscript", extensions: ["sh"], category: "text", description: "Shell script" },

	// Image
	{
		mime: "image/png",
		extensions: ["png"],
		category: "image",
		description: "Portable Network Graphics",
	},
	{ mime: "image/jpeg", extensions: ["jpg", "jpeg"], category: "image", description: "JPEG image" },
	{
		mime: "image/gif",
		extensions: ["gif"],
		category: "image",
		description: "Graphics Interchange Format",
	},
	{ mime: "image/webp", extensions: ["webp"], category: "image", description: "WebP image" },
	{
		mime: "image/svg+xml",
		extensions: ["svg"],
		category: "image",
		description: "Scalable Vector Graphics",
	},
	{ mime: "image/bmp", extensions: ["bmp"], category: "image", description: "Bitmap image" },
	{
		mime: "image/tiff",
		extensions: ["tiff", "tif"],
		category: "image",
		description: "Tagged Image File Format",
	},
	{ mime: "image/x-icon", extensions: ["ico"], category: "image", description: "Icon image" },
	{ mime: "image/avif", extensions: ["avif"], category: "image", description: "AV1 Image Format" },
	{
		mime: "image/heic",
		extensions: ["heic"],
		category: "image",
		description: "High Efficiency Image",
	},
	{
		mime: "image/heif",
		extensions: ["heif"],
		category: "image",
		description: "High Efficiency Image Format",
	},

	// Audio
	{ mime: "audio/mpeg", extensions: ["mp3"], category: "audio", description: "MP3 audio" },
	{ mime: "audio/wav", extensions: ["wav"], category: "audio", description: "WAV audio" },
	{ mime: "audio/ogg", extensions: ["ogg"], category: "audio", description: "OGG audio" },
	{ mime: "audio/flac", extensions: ["flac"], category: "audio", description: "FLAC audio" },
	{ mime: "audio/aac", extensions: ["aac"], category: "audio", description: "AAC audio" },
	{ mime: "audio/webm", extensions: ["weba"], category: "audio", description: "WebM audio" },
	{ mime: "audio/midi", extensions: ["midi", "mid"], category: "audio", description: "MIDI audio" },
	{ mime: "audio/x-m4a", extensions: ["m4a"], category: "audio", description: "M4A audio" },

	// Video
	{ mime: "video/mp4", extensions: ["mp4"], category: "video", description: "MP4 video" },
	{ mime: "video/webm", extensions: ["webm"], category: "video", description: "WebM video" },
	{ mime: "video/ogg", extensions: ["ogv"], category: "video", description: "OGG video" },
	{
		mime: "video/quicktime",
		extensions: ["mov"],
		category: "video",
		description: "QuickTime video",
	},
	{ mime: "video/x-msvideo", extensions: ["avi"], category: "video", description: "AVI video" },
	{
		mime: "video/x-ms-wmv",
		extensions: ["wmv"],
		category: "video",
		description: "Windows Media Video",
	},
	{ mime: "video/x-flv", extensions: ["flv"], category: "video", description: "Flash Video" },
	{ mime: "video/mpeg", extensions: ["mpeg"], category: "video", description: "MPEG video" },
	{ mime: "video/3gpp", extensions: ["3gp"], category: "video", description: "3GPP video" },

	// Application
	{
		mime: "application/json",
		extensions: ["json"],
		category: "application",
		description: "JSON data",
	},
	{
		mime: "application/xml",
		extensions: ["xml"],
		category: "application",
		description: "XML data",
	},
	{
		mime: "application/pdf",
		extensions: ["pdf"],
		category: "application",
		description: "PDF document",
	},
	{
		mime: "application/zip",
		extensions: ["zip"],
		category: "application",
		description: "ZIP archive",
	},
	{
		mime: "application/gzip",
		extensions: ["gz"],
		category: "application",
		description: "Gzip archive",
	},
	{
		mime: "application/x-tar",
		extensions: ["tar"],
		category: "application",
		description: "TAR archive",
	},
	{
		mime: "application/x-7z-compressed",
		extensions: ["7z"],
		category: "application",
		description: "7-Zip archive",
	},
	{
		mime: "application/x-rar-compressed",
		extensions: ["rar"],
		category: "application",
		description: "RAR archive",
	},
	{
		mime: "application/javascript",
		extensions: ["js"],
		category: "application",
		description: "JavaScript",
	},
	{
		mime: "application/typescript",
		extensions: ["ts"],
		category: "application",
		description: "TypeScript",
	},
	{
		mime: "application/wasm",
		extensions: ["wasm"],
		category: "application",
		description: "WebAssembly",
	},
	{
		mime: "application/sql",
		extensions: ["sql"],
		category: "application",
		description: "SQL database",
	},
	{
		mime: "application/graphql",
		extensions: ["graphql", "gql"],
		category: "application",
		description: "GraphQL query",
	},
	{
		mime: "application/x-yaml",
		extensions: ["yaml", "yml"],
		category: "application",
		description: "YAML data",
	},
	{
		mime: "application/x-shockwave-flash",
		extensions: ["swf"],
		category: "application",
		description: "Flash animation",
	},
	{
		mime: "application/octet-stream",
		extensions: ["bin", "exe", "dll"],
		category: "application",
		description: "Binary file",
	},
	{
		mime: "application/x-font-ttf",
		extensions: ["ttf"],
		category: "application",
		description: "TrueType font",
	},
	{
		mime: "font/woff",
		extensions: ["woff"],
		category: "application",
		description: "Web Open Font Format",
	},
	{
		mime: "font/woff2",
		extensions: ["woff2"],
		category: "application",
		description: "Web Open Font Format 2",
	},

	// Font
	{ mime: "font/ttf", extensions: ["ttf"], category: "font", description: "TrueType font" },
	{ mime: "font/otf", extensions: ["otf"], category: "font", description: "OpenType font" },

	// Multipart
	{
		mime: "multipart/form-data",
		extensions: [],
		category: "multipart",
		description: "HTML form data",
	},
	{
		mime: "multipart/byteranges",
		extensions: [],
		category: "multipart",
		description: "Byte range multipart",
	},

	// Message
	{
		mime: "message/rfc822",
		extensions: ["eml"],
		category: "message",
		description: "Email message",
	},
];

const CATEGORIES = [...new Set(MIME_DATABASE.map((e) => e.category))].sort();

export default function MimeTypeLookup() {
	const [query, setQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [copiedMime, setCopiedMime] = useState<string | null>(null);

	const results = useMemo(() => {
		const q = query.toLowerCase().trim();
		let entries = MIME_DATABASE;

		if (categoryFilter !== "all") {
			entries = entries.filter((e) => e.category === categoryFilter);
		}

		if (!q) return entries;

		return entries.filter((e) => {
			if (e.mime.toLowerCase().includes(q)) return true;
			if (e.extensions.some((ext) => ext.toLowerCase().includes(q))) return true;
			if (e.description.toLowerCase().includes(q)) return true;
			// Also match if user types "jpg" or ".jpg"
			const cleanQuery = q.replace(/^\./, "");
			if (e.extensions.some((ext) => ext === cleanQuery)) return true;
			return false;
		});
	}, [query, categoryFilter]);

	const handleCopyMime = useCallback(async (mime: string) => {
		try {
			await navigator.clipboard.writeText(mime);
		} catch {
			/* ignore */
		}
		setCopiedMime(mime);
		setTimeout(() => setCopiedMime(null), 2000);
	}, []);

	return (
		<div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div class="md:col-span-2">
					<label class="text-caption-uppercase text-muted block mb-1">
						Search by extension or MIME type
					</label>
					<input
						type="text"
						class="input w-full"
						placeholder="e.g. pdf, image/png, .mp4..."
						value={query}
						onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Category</label>
					<select
						class="input w-full"
						value={categoryFilter}
						onChange={(e) => setCategoryFilter((e.target as HTMLSelectElement).value)}
					>
						<option value="all">All Categories</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>
			</div>

			<div class="text-body-sm text-muted mb-3">
				{results.length} result{results.length !== 1 ? "s" : ""} found
			</div>

			<div class="space-y-2">
				{results.map((entry) => (
					<div key={entry.mime} class="card p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-mono text-body font-medium">{entry.mime}</span>
									<span class="badge">{entry.category}</span>
								</div>
								<div class="text-body-sm text-muted mb-1">{entry.description}</div>
								{entry.extensions.length > 0 && (
									<div class="flex flex-wrap gap-1">
										{entry.extensions.map((ext) => (
											<span
												key={ext}
												class="badge"
												style="background: var(--color-surface-elevated)"
											>
												.{ext}
											</span>
										))}
									</div>
								)}
							</div>
							<button
								class="btn-secondary text-body-sm shrink-0"
								onClick={() => handleCopyMime(entry.mime)}
							>
								{copiedMime === entry.mime ? "Copied!" : "Copy"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
