/**
 * AI Assistant — Rule-based tool recommendation engine
 * Matches user queries to tools and generates helpful responses
 */

import { tools } from "../data/tools";
import { categories } from "../data/categories";

// ─── Knowledge Base ──────────────────────────────────────────────────────────

interface ToolKnowledge {
	keywords: string[];
	description: string;
	useCases: string[];
}

const toolKnowledge: Record<string, ToolKnowledge> = {
	"png-to-jpg": {
		keywords: ["png", "jpg", "convert", "image", "photo"],
		description: "Convert PNG images to JPG with quality control",
		useCases: ["reduce file size", "compatibility", "web upload"],
	},
	"jpg-to-png": {
		keywords: ["jpg", "png", "convert", "image", "photo"],
		description: "Convert JPG images to lossless PNG",
		useCases: ["transparency", "quality", "editing"],
	},
	"jpg-to-webp": {
		keywords: ["jpg", "webp", "convert", "image", "smaller"],
		description: "Convert JPG to WebP for smaller files",
		useCases: ["web optimization", "faster loading", "smaller size"],
	},
	"png-to-webp": {
		keywords: ["png", "webp", "convert", "image", "compress"],
		description: "Convert PNG to WebP for smaller files",
		useCases: ["web optimization", "reduce size", "modern format"],
	},
	"webp-to-png": {
		keywords: ["webp", "png", "convert", "image"],
		description: "Convert WebP to universally compatible PNG",
		useCases: ["compatibility", "editing", "sharing"],
	},
	"image-resizer": {
		keywords: ["resize", "image", "photo", "dimensions", "pixels", "smaller", "larger"],
		description: "Resize images by pixels, percentage, or presets",
		useCases: ["social media", "profile picture", "thumbnail"],
	},
	"image-compressor": {
		keywords: ["compress", "image", "photo", "size", "reduce", "optimize"],
		description: "Compress images with quality control",
		useCases: ["faster website", "email attachment", "storage"],
	},
	"image-cropper": {
		keywords: ["crop", "image", "photo", "trim", "cut"],
		description: "Crop images with aspect ratio presets",
		useCases: ["profile photo", "focus area", "remove edges"],
	},
	"image-to-base64": {
		keywords: ["base64", "image", "encode", "embed"],
		description: "Convert images to Base64 data URI",
		useCases: ["embed in HTML", "CSS background", "API upload"],
	},
	"image-rotator": {
		keywords: ["rotate", "flip", "image", "photo", "turn"],
		description: "Rotate and flip images",
		useCases: ["fix orientation", "mirror", "creative"],
	},
	"image-watermark": {
		keywords: ["watermark", "image", "photo", "text", "brand"],
		description: "Add text watermarks to images",
		useCases: ["copyright", "branding", "protection"],
	},
	"photo-filters": {
		keywords: ["filter", "photo", "image", "vintage", "cool", "warm", "effect"],
		description: "Apply photo filters and effects",
		useCases: ["social media", "artistic", "enhance"],
	},
	"svg-optimizer": {
		keywords: ["svg", "optimize", "compress", "vector", "clean"],
		description: "Optimize SVG files",
		useCases: ["reduce file size", "clean code", "web optimization"],
	},
	"word-counter": {
		keywords: ["word", "count", "character", "text", "length", "essay"],
		description: "Count words, characters, sentences, paragraphs",
		useCases: ["essay limits", "social media", "SEO"],
	},
	"case-converter": {
		keywords: ["case", "uppercase", "lowercase", "title", "camel", "snake"],
		description: "Convert text between cases",
		useCases: ["coding", "formatting", "consistency"],
	},
	"slug-generator": {
		keywords: ["slug", "url", "permalink", "seo", "friendly"],
		description: "Generate URL slugs from text",
		useCases: ["blog URLs", "SEO", "clean links"],
	},
	"text-reverser": {
		keywords: ["reverse", "text", "backwards", "flip"],
		description: "Reverse text, words, or lines",
		useCases: ["fun", "puzzle", "encoding"],
	},
	"json-formatter": {
		keywords: ["json", "format", "beautify", "validate", "minify", "prettify"],
		description: "Format, validate, and minify JSON",
		useCases: ["API response", "debugging", "readability"],
	},
	"base64-encoder": {
		keywords: ["base64", "encode", "decode", "text", "data"],
		description: "Encode and decode Base64",
		useCases: ["email encoding", "data transfer", "embed images"],
	},
	"url-encoder": {
		keywords: ["url", "encode", "decode", "percent", "uri"],
		description: "Encode and decode URLs",
		useCases: ["web development", "API calls", "special characters"],
	},
	"hash-generator": {
		keywords: ["hash", "sha", "md5", "checksum", "fingerprint", "digest"],
		description: "Generate SHA-1, SHA-256, SHA-512 hashes",
		useCases: ["file verification", "password storage", "data integrity"],
	},
	"regex-tester": {
		keywords: ["regex", "regular", "expression", "pattern", "match", "test"],
		description: "Test regular expressions with live highlighting",
		useCases: ["pattern matching", "validation", "text processing"],
	},
	"password-generator": {
		keywords: ["password", "generate", "secure", "random", "strong"],
		description: "Generate secure passwords",
		useCases: ["account security", "new accounts", "strong passwords"],
	},
	"qr-code-generator": {
		keywords: ["qr", "code", "scan", "generate", "url", "link"],
		description: "Generate QR codes from text or URL",
		useCases: ["marketing", "sharing links", "business cards"],
	},
	"color-picker": {
		keywords: ["color", "pick", "hex", "rgb", "hsl", "palette"],
		description: "Pick and convert colors",
		useCases: ["design", "web development", "CSS"],
	},
	"percentage-calculator": {
		keywords: ["percentage", "calculate", "tip", "discount", "tax"],
		description: "Calculate percentages, tips, discounts",
		useCases: ["shopping", "tipping", "math"],
	},
	"unit-converter": {
		keywords: ["convert", "unit", "length", "weight", "temperature", "distance"],
		description: "Convert between units",
		useCases: ["cooking", "travel", "science"],
	},
	"bmi-calculator": {
		keywords: ["bmi", "body", "mass", "index", "weight", "health"],
		description: "Calculate Body Mass Index",
		useCases: ["health tracking", "fitness", "weight management"],
	},
	"loan-calculator": {
		keywords: ["loan", "mortgage", "payment", "interest", "emi"],
		description: "Calculate loan payments",
		useCases: ["home loan", "car loan", "financial planning"],
	},
	"age-calculator": {
		keywords: ["age", "birthday", "born", "calculate", "zodiac"],
		description: "Calculate exact age",
		useCases: ["birthday", "zodiac", "age difference"],
	},
	"currency-converter": {
		keywords: ["currency", "convert", "dollar", "euro", "exchange", "money"],
		description: "Convert between currencies",
		useCases: ["travel", "shopping", "business"],
	},
	"text-summarizer": {
		keywords: ["summarize", "summary", "shorten", "article", "long text"],
		description: "Summarize long texts using AI",
		useCases: ["research", "study", "quick reading"],
	},
	ocr: {
		keywords: ["ocr", "image", "text", "extract", "scan", "recognize", "read"],
		description: "Extract text from images using AI",
		useCases: ["scanned documents", "screenshots", "photos with text"],
	},
	"background-remover": {
		keywords: ["background", "remove", "transparent", "cutout", "isolate"],
		description: "Remove image backgrounds with AI",
		useCases: ["product photos", "profile pictures", "composites"],
	},
	"grammar-checker": {
		keywords: ["grammar", "check", "spelling", "correct", "proofread"],
		description: "Check and fix grammar mistakes",
		useCases: ["emails", "essays", "professional writing"],
	},
	"text-translator": {
		keywords: ["translate", "translation", "language", "english", "vietnamese", "chinese"],
		description: "Translate text between languages",
		useCases: ["communication", "learning", "travel"],
	},
	"speech-to-text": {
		keywords: ["speech", "transcribe", "audio", "voice", "record", "whisper"],
		description: "Transcribe audio to text",
		useCases: ["meetings", "interviews", "notes"],
	},
	"text-to-speech": {
		keywords: ["speech", "tts", "voice", "read aloud", "speak"],
		description: "Convert text to speech",
		useCases: ["accessibility", "learning", "proofreading"],
	},
	ner: {
		keywords: [
			"ner",
			"named entity",
			"entity recognition",
			"name",
			"place",
			"organization",
			"detect",
		],
		description: "Detect and highlight names, places, and organizations in text using AI",
		useCases: [
			"Extracting names from documents",
			"Identifying locations in text",
			"Finding organizations in articles",
		],
	},
	"face-detection": {
		keywords: ["face", "detection", "blur", "privacy", "person", "people"],
		description: "Detect and blur faces in images using AI",
		useCases: ["Privacy protection", "Photo anonymization", "Social media content moderation"],
	},
	"paraphrase-generator": {
		keywords: ["paraphrase", "rewrite", "rephrase", "synonym", "different wording"],
		description: "Rewrite text in different ways using AI",
		useCases: ["Avoiding plagiarism", "Improving writing", "Content variation"],
	},
	"language-detector": {
		keywords: ["language", "detect", "identify", "unicode", "script"],
		description: "Detect the language of any text instantly",
		useCases: ["Content moderation", "Translation prep", "Multilingual documents"],
	},
	"keyword-extractor": {
		keywords: ["keyword", "extract", "important", "topic", "embedding", "nlp"],
		description: "Extract the most relevant keywords and phrases from text",
		useCases: ["SEO optimization", "Content tagging", "Document summarization"],
	},
	"number-base-converter": {
		keywords: ["binary", "hex", "octal", "decimal", "base", "number system"],
		description: "Convert between number bases",
		useCases: ["programming", "computer science", "debugging"],
	},
	"json-to-xml": {
		keywords: ["json", "xml", "convert", "format"],
		description: "Convert JSON to XML",
		useCases: ["data migration", "API integration", "configuration"],
	},
	"xml-to-json": {
		keywords: ["xml", "json", "convert", "parse"],
		description: "Convert XML to JSON",
		useCases: ["web development", "API response", "data processing"],
	},
	"html-entity-encoder": {
		keywords: ["html", "entity", "encode", "decode", "special characters"],
		description: "Encode/decode HTML entities",
		useCases: ["web development", "XSS prevention", "display special chars"],
	},
	"morse-code-converter": {
		keywords: ["morse", "code", "dot", "dash", "sos"],
		description: "Convert text to/from Morse code",
		useCases: ["fun", "learning", "puzzles"],
	},
	"roman-numeral-converter": {
		keywords: ["roman", "numeral", "number", "ancient"],
		description: "Convert between Roman numerals and numbers",
		useCases: ["history", "clocks", "outlines"],
	},
	"text-to-binary": {
		keywords: ["binary", "text", "0", "1", "bits", "encode"],
		description: "Convert text to/from binary",
		useCases: ["computer science", "learning", "encoding"],
	},
	"csv-to-json": {
		keywords: ["csv", "json", "convert", "spreadsheet", "data"],
		description: "Convert CSV to JSON",
		useCases: ["data processing", "API integration", "analysis"],
	},
	"json-to-csv": {
		keywords: ["json", "csv", "convert", "spreadsheet", "export"],
		description: "Convert JSON to CSV",
		useCases: ["data export", "Excel", "analysis"],
	},
	"pdf-merger": {
		keywords: ["pdf", "merge", "combine", "join", "multiple"],
		description: "Combine multiple PDFs into one",
		useCases: ["documents", "reports", "contracts"],
	},
	"pdf-splitter": {
		keywords: ["pdf", "split", "extract", "pages", "separate"],
		description: "Split PDF by page range",
		useCases: ["extract chapters", "separate pages", "reduce size"],
	},
	"pdf-compressor": {
		keywords: ["pdf", "compress", "reduce", "size", "optimize"],
		description: "Reduce PDF file size",
		useCases: ["email attachment", "upload limits", "storage"],
	},
	"countdown-timer": {
		keywords: ["countdown", "timer", "event", "deadline", "days"],
		description: "Countdown to any date",
		useCases: ["events", "deadlines", "birthdays"],
	},
	"timezone-converter": {
		keywords: ["timezone", "convert", "time", "world", "clock"],
		description: "Convert time between timezones",
		useCases: ["meetings", "travel", "international"],
	},
	"uuid-generator": {
		keywords: ["uuid", "unique", "id", "generate", "random"],
		description: "Generate UUID v4 values",
		useCases: ["database IDs", "API keys", "unique identifiers"],
	},
	"jwt-decoder": {
		keywords: ["jwt", "token", "decode", "auth", "jsonwebtoken"],
		description: "Decode JWT tokens",
		useCases: ["debugging", "authentication", "API development"],
	},
	"markdown-to-html": {
		keywords: ["markdown", "html", "convert", "render", "preview"],
		description: "Convert Markdown to HTML",
		useCases: ["documentation", "blog posts", "README files"],
	},
	"css-gradient-generator": {
		keywords: ["css", "gradient", "linear", "radial", "background"],
		description: "Create CSS gradients",
		useCases: ["web design", "backgrounds", "buttons"],
	},
	"box-shadow-generator": {
		keywords: ["box", "shadow", "css", "elevation", "depth"],
		description: "Create CSS box-shadow",
		useCases: ["card design", "buttons", "UI depth"],
	},
	"text-diff": {
		keywords: ["diff", "compare", "text", "difference", "changes"],
		description: "Compare two texts side by side",
		useCases: ["code review", "document comparison", "version control"],
	},
	"gitignore-generator": {
		keywords: ["gitignore", "git", "ignore", "template"],
		description: "Generate .gitignore files",
		useCases: ["new projects", "git setup", "clean repo"],
	},
	"json-to-typescript": {
		keywords: ["json", "typescript", "interface", "type", "convert"],
		description: "Convert JSON to TypeScript interfaces",
		useCases: ["API types", "development", "type safety"],
	},
	"readability-score": {
		keywords: ["readability", "score", "grade", "level", "flesch"],
		description: "Calculate readability scores",
		useCases: ["content writing", "education", "accessibility"],
	},
	"emoji-picker": {
		keywords: ["emoji", "pick", "search", "copy", "icon"],
		description: "Browse and search emojis",
		useCases: ["social media", "messages", "documents"],
	},
	"tax-calculator": {
		keywords: ["tax", "income", "federal", "calculate"],
		description: "Calculate income tax",
		useCases: ["financial planning", "tax season", "budgeting"],
	},
	"compound-interest": {
		keywords: ["compound", "interest", "investment", "savings", "growth"],
		description: "Calculate compound interest",
		useCases: ["investments", "savings", "financial planning"],
	},
	"budget-tracker": {
		keywords: ["budget", "expense", "income", "track", "money"],
		description: "Track income and expenses",
		useCases: ["personal finance", "savings", "spending analysis"],
	},
	"calorie-calculator": {
		keywords: ["calorie", "tdee", "bmr", "diet", "weight"],
		description: "Calculate daily calorie needs",
		useCases: ["diet planning", "weight loss", "fitness"],
	},
	"water-intake": {
		keywords: ["water", "intake", "hydration", "daily", "health"],
		description: "Calculate daily water intake",
		useCases: ["health", "fitness", "hydration"],
	},
	"sleep-cycle": {
		keywords: ["sleep", "cycle", "wake", "bedtime", "rest"],
		description: "Calculate optimal sleep times",
		useCases: ["better sleep", "energy", "health"],
	},
	"flashcard-maker": {
		keywords: ["flashcard", "study", "memory", "learn", "cards"],
		description: "Create and study flashcards",
		useCases: ["studying", "exam prep", "language learning"],
	},
	"quiz-maker": {
		keywords: ["quiz", "test", "exam", "questions", "study"],
		description: "Create and take quizzes",
		useCases: ["studying", "teaching", "self-assessment"],
	},
	"grade-calculator": {
		keywords: ["grade", "average", "weighted", "score", "calculate"],
		description: "Calculate weighted average grades",
		useCases: ["students", "academic", "transcripts"],
	},
	"random-number-generator": {
		keywords: ["random", "number", "generate", "lottery", "pick"],
		description: "Generate random numbers",
		useCases: ["lottery", "games", "sampling"],
	},
	"dice-roller": {
		keywords: ["dice", "roll", "dnd", "game", "random"],
		description: "Roll virtual dice",
		useCases: ["board games", "D&D", "probability"],
	},
	"coin-flipper": {
		keywords: ["coin", "flip", "heads", "tails", "decide"],
		description: "Flip a virtual coin",
		useCases: ["decisions", "games", "random"],
	},
	"wheel-spinner": {
		keywords: ["wheel", "spin", "random", "pick", "winner"],
		description: "Spin the wheel to pick randomly",
		useCases: ["raffle", "decisions", "games"],
	},
	"barcode-generator": {
		keywords: ["barcode", "ean", "upc", "code128", "generate"],
		description: "Generate barcodes",
		useCases: ["products", "inventory", "retail"],
	},
	"otp-generator": {
		keywords: ["otp", "totp", "2fa", "authenticator", "code"],
		description: "Generate 2FA codes",
		useCases: ["security", "authentication", "accounts"],
	},
	"punycode-converter": {
		keywords: ["punycode", "idn", "domain", "unicode", "international"],
		description: "Convert domain names to/from Punycode",
		useCases: ["international domains", "web development", "DNS"],
	},
	"quoted-printable-encoder": {
		keywords: ["quoted", "printable", "email", "encoding"],
		description: "Encode/decode Quoted-Printable",
		useCases: ["email encoding", "MIME", "special characters"],
	},
	"html-to-text": {
		keywords: ["html", "text", "strip", "plain", "clean"],
		description: "Strip HTML tags to plain text",
		useCases: ["content extraction", "cleaning", "processing"],
	},
	"seconds-to-time": {
		keywords: ["seconds", "time", "convert", "hhmmss", "duration"],
		description: "Convert seconds to time format",
		useCases: ["time calculation", "video editing", "sports"],
	},
	"time-to-seconds": {
		keywords: ["time", "seconds", "convert", "hhmmss", "duration"],
		description: "Convert time to total seconds",
		useCases: ["programming", "calculations", "video editing"],
	},
};

// ─── Response Generator ──────────────────────────────────────────────────────

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

function findMatchingTools(query: string): {
	id: string;
	name: string;
	slug: string;
	category: string;
	score: number;
}[] {
	const q = query.toLowerCase();
	const words = q.split(/\s+/).filter(Boolean);
	const results: {
		id: string;
		name: string;
		slug: string;
		category: string;
		score: number;
	}[] = [];

	for (const tool of tools) {
		const knowledge = toolKnowledge[tool.id];
		let score = 0;

		// Match against tool name
		if (q.includes(tool.name.toLowerCase())) score += 10;

		// Match against keywords
		if (knowledge) {
			for (const keyword of knowledge.keywords) {
				if (words.some((w) => w.includes(keyword) || keyword.includes(w))) {
					score += 3;
				}
				if (q.includes(keyword)) score += 2;
			}
			for (const useCase of knowledge.useCases) {
				if (words.some((w) => useCase.includes(w))) score += 2;
			}
		}

		// Match against tags
		if (tool.tags) {
			for (const tag of tool.tags) {
				if (words.some((w) => w.includes(tag) || tag.includes(w))) score += 2;
			}
		}

		// Match against description
		if (tool.description.toLowerCase().includes(q)) score += 1;

		if (score > 0) {
			results.push({
				id: tool.id,
				name: tool.name,
				slug: tool.slug,
				category: tool.category,
				score,
			});
		}
	}

	return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

function getCategoryTools(categoryId: string): string[] {
	return tools.filter((t) => t.category === categoryId).map((t) => t.name);
}

function detectIntent(query: string): string {
	const q = query.toLowerCase();

	if (q.match(/\b(how|help|how to|tutorial|guide)\b/)) return "how-to";
	if (q.match(/\b(what|which|list|show|find)\b.*\b(tool|tools)\b/)) return "list-tools";
	if (q.match(/\b(convert|transform|change|turn)\b/)) return "convert";
	if (q.match(/\b(generate|create|make|build)\b/)) return "generate";
	if (q.match(/\b(calculate|compute|math)\b/)) return "calculate";
	if (q.match(/\b(encode|decode|encrypt|decrypt)\b/)) return "encode";
	if (q.match(/\b(format|beautify|prettify|minify)\b/)) return "format";
	if (q.match(/\b(compare|diff|difference)\b/)) return "compare";
	if (q.match(/\b(compress|optimize|reduce|smaller)\b/)) return "optimize";
	if (q.match(/\b(category|categories)\b/)) return "categories";
	if (q.match(/\b(hello|hi|hey|xin chao)\b/)) return "greeting";
	if (q.match(/\b(thank|thanks|cam on)\b/)) return "thanks";

	return "search";
}

export function generateResponse(query: string): string {
	const intent = detectIntent(query);
	const matchedTools = findMatchingTools(query);

	// Greeting
	if (intent === "greeting") {
		return "Hello! 👋 I'm your ToolBundle assistant. I can help you find the right tool for any task. Just describe what you need, and I'll recommend the best tool!";
	}

	// Thanks
	if (intent === "thanks") {
		return "You're welcome! 😊 Let me know if you need help with anything else.";
	}

	// Categories
	if (intent === "categories") {
		const catList = categories.map((c) => `• **${c.name}** — ${c.description}`).join("\n");
		return `Here are all ${categories.length} categories:\n\n${catList}\n\nBrowse them all at the [homepage](/)!`;
	}

	// List tools
	if (intent === "list-tools") {
		const q = query.toLowerCase();
		const matchedCat = categories.find((c) => q.includes(c.id) || q.includes(c.name.toLowerCase()));
		if (matchedCat) {
			const catTools = getCategoryTools(matchedCat.id);
			return `Here are all ${catTools.length} tools in **${matchedCat.name}**:\n\n${catTools.map((t) => `• ${t}`).join("\n")}\n\nBrowse them at [/${matchedCat.id}](/${matchedCat.id})!`;
		}
	}

	// Convert intent
	if (intent === "convert" && matchedTools.length > 0) {
		const top = matchedTools[0];
		const knowledge = toolKnowledge[top.id];
		let response = `To convert, use the **${top.name}** tool:\n\n`;
		response += `🔗 [/${top.category}/${top.slug}](/${top.category}/${top.slug})\n\n`;
		if (knowledge) {
			response += `${knowledge.description}.\n\n`;
			response += `**Common uses:** ${knowledge.useCases.join(", ")}`;
		}
		if (matchedTools.length > 1) {
			response += "\n\n**Other options:**\n";
			response += matchedTools
				.slice(1, 4)
				.map((t) => `• [${t.name}](/${t.category}/${t.slug})`)
				.join("\n");
		}
		return response;
	}

	// General search with matches
	if (matchedTools.length > 0) {
		const top = matchedTools[0];
		const knowledge = toolKnowledge[top.id];
		let response = `I found **${matchedTools.length}** tools that might help:\n\n`;

		for (const tool of matchedTools.slice(0, 5)) {
			const k = toolKnowledge[tool.id];
			response += `• **${tool.name}** — ${k?.description || "Tool available"}\n  [/${tool.category}/${tool.slug}](/${tool.category}/${tool.slug})\n\n`;
		}

		if (knowledge) {
			response += `**Recommended:** Try **${top.name}** first — ${knowledge.useCases.join(", ")}.`;
		}

		return response;
	}

	// No matches
	return `I couldn't find a specific tool for that. Here are some suggestions:\n\n• **Browse all ${tools.length} tools** at the [homepage](/)\n• **Use Ctrl+K** to search tools by name\n• **Check categories** — we have ${categories.length} categories covering images, text, developer tools, and more\n\nTry rephrasing your question or describe what you want to do!`;
}

export function getQuickActions(): { label: string; query: string }[] {
	return [
		{ label: "🖼️ Convert images", query: "convert image" },
		{ label: "📝 Format JSON", query: "format json" },
		{ label: "🔐 Generate password", query: "generate password" },
		{ label: "🎨 Pick colors", query: "color picker" },
		{ label: "📊 Calculate BMI", query: "calculate bmi" },
		{ label: "🔤 Count words", query: "count words" },
	];
}
