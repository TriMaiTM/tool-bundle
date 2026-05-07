export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  slug: string;
  featured?: boolean;
  tags?: string[];
}

export const tools: Tool[] = [
  // ============================================
  // Image Tools
  // ============================================
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    description:
      "Convert PNG images to JPG with quality control and batch support.",
    category: "image",
    icon: "image",
    slug: "png-to-jpg",
    featured: true,
    tags: ["convert", "png", "jpg"],
  },
  {
    id: "jpg-to-png",
    name: "JPG to PNG",
    description: "Convert JPG images to lossless PNG format.",
    category: "image",
    icon: "image",
    slug: "jpg-to-png",
    tags: ["convert", "jpg", "png"],
  },
  {
    id: "jpg-to-webp",
    name: "JPG to WebP",
    description: "Convert JPG to WebP for smaller, higher-quality files.",
    category: "image",
    icon: "image",
    slug: "jpg-to-webp",
    featured: true,
    tags: ["convert", "jpg", "webp"],
  },
  {
    id: "png-to-webp",
    name: "PNG to WebP",
    description: "Convert PNG to WebP for dramatically smaller file sizes.",
    category: "image",
    icon: "image",
    slug: "png-to-webp",
    tags: ["convert", "png", "webp"],
  },
  {
    id: "webp-to-png",
    name: "WebP to PNG",
    description: "Convert WebP images to universally compatible PNG format.",
    category: "image",
    icon: "image",
    slug: "webp-to-png",
    tags: ["convert", "webp", "png"],
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description:
      "Resize images by pixels, percentage, or social media presets.",
    category: "image",
    icon: "maximize-2",
    slug: "image-resizer",
    featured: true,
    tags: ["resize", "dimensions"],
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description:
      "Compress images with quality control and before/after preview.",
    category: "image",
    icon: "minimize-2",
    slug: "image-compressor",
    featured: true,
    tags: ["compress", "optimize"],
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with aspect ratio presets and rotation.",
    category: "image",
    icon: "crop",
    slug: "image-cropper",
    tags: ["crop", "trim"],
  },

  // ============================================
  // Text Tools
  // ============================================
  {
    id: "word-counter",
    name: "Word Counter",
    description:
      "Count words, characters, sentences, and paragraphs instantly.",
    category: "text",
    icon: "hash",
    slug: "word-counter",
    featured: true,
    tags: ["count", "words", "characters"],
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description:
      "Convert text between uppercase, lowercase, title case, and more.",
    category: "text",
    icon: "case-upper",
    slug: "case-converter",
    featured: true,
    tags: ["case", "uppercase", "lowercase"],
  },
  {
    id: "slug-generator",
    name: "Slug Generator",
    description: "Generate clean URL slugs from any text with bulk mode.",
    category: "text",
    icon: "link",
    slug: "slug-generator",
    tags: ["slug", "url", "seo"],
  },
  {
    id: "text-reverser",
    name: "Text Reverser",
    description: "Reverse text, words, or character order instantly.",
    category: "text",
    icon: "arrow-left-right",
    slug: "text-reverser",
    tags: ["reverse", "flip"],
  },
  {
    id: "line-counter",
    name: "Line Counter",
    description: "Count lines, blank lines, and non-blank lines.",
    category: "text",
    icon: "align-left",
    slug: "line-counter",
    tags: ["count", "lines"],
  },

  // ============================================
  // Developer Tools
  // ============================================
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting.",
    category: "developer",
    icon: "braces",
    slug: "json-formatter",
    featured: true,
    tags: ["json", "format", "validate"],
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 for text and files.",
    category: "developer",
    icon: "binary",
    slug: "base64-encoder",
    featured: true,
    tags: ["base64", "encode", "decode"],
  },
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs and URI components.",
    category: "developer",
    icon: "globe",
    slug: "url-encoder",
    tags: ["url", "encode", "decode"],
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, SHA-512 hashes from text.",
    category: "developer",
    icon: "fingerprint",
    slug: "hash-generator",
    tags: ["hash", "md5", "sha"],
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description:
      "Test regular expressions with live highlighting and match details.",
    category: "developer",
    icon: "regex",
    slug: "regex-tester",
    featured: true,
    tags: ["regex", "pattern", "test"],
  },
  {
    id: "lorem-generator",
    name: "Lorem Ipsum Generator",
    description:
      "Generate placeholder text by paragraphs, sentences, or words.",
    category: "developer",
    icon: "text",
    slug: "lorem-generator",
    tags: ["lorem", "placeholder", "dummy"],
  },

  // ============================================
  // PDF Tools
  // ============================================
  {
    id: "pdf-merger",
    name: "PDF Merger",
    description: "Combine multiple PDFs into one — private and instant.",
    category: "pdf",
    icon: "file-text",
    slug: "pdf-merger",
    featured: true,
    tags: ["pdf", "merge", "combine"],
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    description: "Split PDFs by page range or extract specific pages.",
    category: "pdf",
    icon: "scissors",
    slug: "pdf-splitter",
    tags: ["pdf", "split", "pages"],
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    description: "Reduce PDF file size — no uploads, instant compression.",
    category: "pdf",
    icon: "minimize-2",
    slug: "pdf-compressor",
    tags: ["pdf", "compress", "optimize"],
  },
  {
    id: "pdf-rotator",
    name: "PDF Rotator",
    description: "Rotate PDF pages — 90°, 180°, 270° clockwise.",
    category: "pdf",
    icon: "rotate-cw",
    slug: "pdf-rotator",
    tags: ["pdf", "rotate", "pages"],
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract text from any PDF — search, copy, or download.",
    category: "pdf",
    icon: "file-type",
    slug: "pdf-to-text",
    tags: ["pdf", "text", "extract"],
  },

  // ============================================
  // Math Tools
  // ============================================
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages, tips, discounts, and tax instantly.",
    category: "math",
    icon: "percent",
    slug: "percentage-calculator",
    featured: true,
    tags: ["percentage", "tip", "discount"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description:
      "Convert units across 5 categories: length, weight, temperature, speed, data.",
    category: "math",
    icon: "arrow-left-right",
    slug: "unit-converter",
    featured: true,
    tags: ["convert", "units", "measurement"],
  },
  {
    id: "bmi-calculator",
    name: "BMI Calculator",
    description:
      "Calculate Body Mass Index with ideal weight and health insights.",
    category: "math",
    icon: "heart-pulse",
    slug: "bmi-calculator",
    tags: ["bmi", "health", "weight"],
  },
  {
    id: "loan-calculator",
    name: "Loan Calculator",
    description: "Calculate loan payments with amortization schedule.",
    category: "math",
    icon: "landmark",
    slug: "loan-calculator",
    tags: ["loan", "mortgage", "payment"],
  },
  {
    id: "age-calculator",
    name: "Age Calculator",
    description:
      "Calculate exact age with zodiac sign and next birthday countdown.",
    category: "math",
    icon: "cake",
    slug: "age-calculator",
    tags: ["age", "birthday", "zodiac"],
  },

  // ============================================
  // Security Tools
  // ============================================
  {
    id: "password-generator",
    name: "Password Generator",
    description:
      "Generate secure passwords with custom length and character sets.",
    category: "security",
    icon: "key-round",
    slug: "password-generator",
    featured: true,
    tags: ["password", "generate", "secure"],
  },
  {
    id: "password-strength-checker",
    name: "Password Strength Checker",
    description:
      "Test password strength with entropy and crack time estimates.",
    category: "security",
    icon: "shield-check",
    slug: "password-strength-checker",
    tags: ["password", "strength", "security"],
  },
  {
    id: "otp-generator",
    name: "OTP Generator",
    description:
      "Generate TOTP 2FA codes with countdown timer and auto-refresh.",
    category: "security",
    icon: "timer",
    slug: "otp-generator",
    tags: ["otp", "totp", "2fa", "authenticator"],
  },

  // ============================================
  // Text Tools (Extended)
  // ============================================
  {
    id: "text-repeater",
    name: "Text Repeater",
    description: "Repeat text N times with custom separator options.",
    category: "text",
    icon: "repeat",
    slug: "text-repeater",
    tags: ["repeat", "duplicate", "text"],
  },
  {
    id: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    description:
      "Remove duplicate lines from text — case-sensitive or insensitive.",
    category: "text",
    icon: "list-minus",
    slug: "remove-duplicate-lines",
    tags: ["duplicate", "lines", "dedupe"],
  },
  {
    id: "text-sorter",
    name: "Text Sorter",
    description: "Sort lines alphabetically, by length, or randomly.",
    category: "text",
    icon: "arrow-up-down",
    slug: "text-sorter",
    tags: ["sort", "alphabetical", "lines"],
  },
  {
    id: "reading-time-calculator",
    name: "Reading Time Calculator",
    description: "Estimate reading and speaking time with adjustable WPM.",
    category: "text",
    icon: "clock",
    slug: "reading-time-calculator",
    tags: ["reading", "time", "wpm"],
  },

  // ============================================
  // Developer Tools (Extended)
  // ============================================
  {
    id: "markdown-to-html",
    name: "Markdown to HTML",
    description: "Convert Markdown to HTML with live preview.",
    category: "developer",
    icon: "file-code",
    slug: "markdown-to-html",
    tags: ["markdown", "html", "convert"],
  },
  {
    id: "html-to-markdown",
    name: "HTML to Markdown",
    description: "Convert HTML to clean Markdown — all elements supported.",
    category: "developer",
    icon: "code",
    slug: "html-to-markdown",
    tags: ["html", "markdown", "convert"],
  },
  {
    id: "css-formatter",
    name: "CSS Formatter",
    description: "Format, beautify, and minify CSS with custom indentation.",
    category: "developer",
    icon: "paintbrush",
    slug: "css-formatter",
    tags: ["css", "format", "minify"],
  },
  {
    id: "yaml-formatter",
    name: "YAML Formatter",
    description: "Format, validate, and beautify YAML with error details.",
    category: "developer",
    icon: "file-cog",
    slug: "yaml-formatter",
    tags: ["yaml", "format", "validate"],
  },

  // ============================================
  // Color Tools
  // ============================================
  {
    id: "color-picker",
    name: "Color Picker",
    description:
      "Pick and convert colors between HEX, RGB, and HSL with live preview.",
    category: "color",
    icon: "pipette",
    slug: "color-picker",
    featured: true,
    tags: ["color", "hex", "rgb", "hsl"],
  },
  {
    id: "color-palette-generator",
    name: "Color Palette Generator",
    description: "Generate harmonious color palettes from any base color.",
    category: "color",
    icon: "palette",
    slug: "color-palette-generator",
    tags: ["color", "palette", "harmony"],
  },
  {
    id: "contrast-checker",
    name: "Contrast Checker WCAG",
    description: "Check WCAG color contrast — AA and AAA compliance.",
    category: "color",
    icon: "eye",
    slug: "contrast-checker",
    tags: ["contrast", "wcag", "accessibility"],
  },
  {
    id: "css-gradient-generator",
    name: "CSS Gradient Generator",
    description: "Create CSS gradients with live preview and presets.",
    category: "color",
    icon: "blend",
    slug: "css-gradient-generator",
    tags: ["gradient", "css", "linear", "radial"],
  },

  // ============================================
  // Date & Time Tools
  // ============================================
  {
    id: "countdown-timer",
    name: "Countdown Timer",
    description: "Countdown to any date with presets and alerts.",
    category: "datetime",
    icon: "timer",
    slug: "countdown-timer",
    featured: true,
    tags: ["countdown", "timer", "date"],
  },
  {
    id: "timezone-converter",
    name: "Timezone Converter",
    description: "Convert time between timezones with world clock.",
    category: "datetime",
    icon: "globe",
    slug: "timezone-converter",
    tags: ["timezone", "convert", "world"],
  },
  {
    id: "date-difference-calculator",
    name: "Date Difference Calculator",
    description: "Calculate the exact difference between two dates.",
    category: "datetime",
    icon: "calendar-days",
    slug: "date-difference-calculator",
    tags: ["date", "difference", "duration"],
  },
  {
    id: "unix-timestamp-converter",
    name: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to dates and back.",
    category: "datetime",
    icon: "clock",
    slug: "unix-timestamp-converter",
    tags: ["unix", "timestamp", "epoch"],
  },

  // ============================================
  // SEO & Marketing Tools
  // ============================================
  {
    id: "meta-tag-generator",
    name: "Meta Tag Generator",
    description: "Generate SEO meta tags with Open Graph and SERP preview.",
    category: "seo",
    icon: "tags",
    slug: "meta-tag-generator",
    featured: true,
    tags: ["meta", "seo", "opengraph"],
  },
  {
    id: "robots-txt-generator",
    name: "Robots.txt Generator",
    description: "Generate robots.txt with rules and sitemap.",
    category: "seo",
    icon: "bot",
    slug: "robots-txt-generator",
    tags: ["robots", "seo", "crawl"],
  },
  {
    id: "sitemap-generator",
    name: "Sitemap Generator",
    description: "Generate XML sitemaps with priority and frequency.",
    category: "seo",
    icon: "map",
    slug: "sitemap-generator",
    tags: ["sitemap", "seo", "xml"],
  },

  // ============================================
  // Data & Spreadsheet Tools
  // ============================================
  {
    id: "csv-to-json",
    name: "CSV to JSON",
    description: "Convert CSV to JSON with auto-delimiter detection.",
    category: "data",
    icon: "file-json",
    slug: "csv-to-json",
    featured: true,
    tags: ["csv", "json", "convert"],
  },
  {
    id: "json-to-csv",
    name: "JSON to CSV",
    description: "Convert JSON arrays to CSV with nested object flattening.",
    category: "data",
    icon: "file-spreadsheet",
    slug: "json-to-csv",
    tags: ["json", "csv", "convert"],
  },
  {
    id: "csv-formatter",
    name: "CSV Formatter",
    description: "Format, validate, and preview CSV data with table view.",
    category: "data",
    icon: "table",
    slug: "csv-formatter",
    tags: ["csv", "format", "validate"],
  },

  // ============================================
  // Image Tools (Extended Phase 5)
  // ============================================
  {
    id: "image-to-base64",
    name: "Image to Base64",
    description: "Convert images to Base64 — data URI or raw.",
    category: "image",
    icon: "binary",
    slug: "image-to-base64",
    tags: ["image", "base64", "encode"],
  },
  {
    id: "image-rotator",
    name: "Image Rotator & Flipper",
    description: "Rotate and flip images — 90, 180, 270 or custom.",
    category: "image",
    icon: "rotate-cw",
    slug: "image-rotator",
    tags: ["rotate", "flip", "image"],
  },
  {
    id: "image-watermark",
    name: "Image Watermark Adder",
    description: "Add text watermarks to images — position, opacity, rotation.",
    category: "image",
    icon: "stamp",
    slug: "image-watermark",
    tags: ["watermark", "image", "text"],
  },
  {
    id: "photo-filters",
    name: "Photo Filters",
    description:
      "Apply photo filters — Vintage, Cool, Warm, Dramatic and more.",
    category: "image",
    icon: "aperture",
    slug: "photo-filters",
    tags: ["filters", "photo", "instagram"],
  },
  {
    id: "svg-optimizer",
    name: "SVG Optimizer",
    description: "Optimize SVG — remove comments, whitespace, shorten colors.",
    category: "image",
    icon: "file-code-2",
    slug: "svg-optimizer",
    tags: ["svg", "optimize", "compress"],
  },

  // ============================================
  // Developer Tools (Extended Phase 5)
  // ============================================
  {
    id: "html-formatter",
    name: "HTML Formatter",
    description: "Format and beautify HTML with custom indentation.",
    category: "developer",
    icon: "code-2",
    slug: "html-formatter",
    tags: ["html", "format", "beautify"],
  },
  {
    id: "sql-formatter",
    name: "SQL Formatter",
    description:
      "Format SQL queries with uppercase keywords and proper indentation.",
    category: "developer",
    icon: "database",
    slug: "sql-formatter",
    tags: ["sql", "format", "database"],
  },
  {
    id: "xml-formatter",
    name: "XML Formatter",
    description: "Format, beautify, and minify XML with validation.",
    category: "developer",
    icon: "file-code",
    slug: "xml-formatter",
    tags: ["xml", "format", "validate"],
  },

  // ============================================
  // Fun & Utility Tools
  // ============================================
  {
    id: "random-number-generator",
    name: "Random Number Generator",
    description:
      "Generate secure random numbers with batch mode and formatting.",
    category: "fun",
    icon: "dices",
    slug: "random-number-generator",
    featured: true,
    tags: ["random", "number", "generate"],
  },
  {
    id: "dice-roller",
    name: "Dice Roller",
    description: "Roll virtual dice — D4 to D100 with stats and history.",
    category: "fun",
    icon: "dice-5",
    slug: "dice-roller",
    tags: ["dice", "roll", "game"],
  },
  {
    id: "coin-flipper",
    name: "Coin Flipper",
    description: "Flip a coin with animation — track history and stats.",
    category: "fun",
    icon: "circle-dot",
    slug: "coin-flipper",
    tags: ["coin", "flip", "random"],
  },
  {
    id: "random-name-picker",
    name: "Random Name Picker",
    description: "Pick random names with animation from a list.",
    category: "fun",
    icon: "shuffle",
    slug: "random-name-picker",
    tags: ["name", "picker", "random"],
  },
  {
    id: "wheel-spinner",
    name: "Wheel Spinner",
    description: "Spin the wheel to pick a random winner.",
    category: "fun",
    icon: "disc-3",
    slug: "wheel-spinner",
    tags: ["wheel", "spinner", "random"],
  },
  {
    id: "decision-maker",
    name: "Decision Maker Spinner",
    description: "Spin the wheel to decide — add custom options.",
    category: "fun",
    icon: "git-branch",
    slug: "decision-maker",
    tags: ["decision", "decide", "random"],
  },
  {
    id: "placeholder-image",
    name: "Placeholder Image Generator",
    description: "Generate custom placeholder images instantly.",
    category: "fun",
    icon: "image",
    slug: "placeholder-image",
    tags: ["placeholder", "image", "dummy"],
  },

  // ============================================
  // Text Tools (Extended Phase 6)
  // ============================================
  {
    id: "fancy-text",
    name: "Fancy Text Generator",
    description: "Generate fancy Unicode text — multiple styles.",
    category: "text",
    icon: "sparkles",
    slug: "fancy-text",
    tags: ["fancy", "unicode", "text"],
  },
  {
    id: "readability-score",
    name: "Readability Score",
    description: "Calculate readability scores — 6 formulas with grade levels.",
    category: "text",
    icon: "book-open",
    slug: "readability-score",
    tags: ["readability", "score", "grade"],
  },
  {
    id: "text-to-hashtags",
    name: "Text to Hashtags",
    description: "Generate hashtags from text — keywords extraction.",
    category: "text",
    icon: "hash",
    slug: "text-to-hashtags",
    tags: ["hashtag", "keywords", "social"],
  },
  {
    id: "emoji-picker",
    name: "Emoji Picker & Search",
    description: "Browse and search emojis — click to copy.",
    category: "text",
    icon: "smile",
    slug: "emoji-picker",
    tags: ["emoji", "picker", "search"],
  },

  // ============================================
  // Developer Tools (Extended Phase 6)
  // ============================================
  {
    id: "js-formatter",
    name: "JS Formatter",
    description: "Format and beautify JavaScript with proper indentation.",
    category: "developer",
    icon: "braces",
    slug: "js-formatter",
    tags: ["javascript", "format", "beautify"],
  },
  {
    id: "typescript-to-js",
    name: "TypeScript to JS Converter",
    description: "Convert TypeScript to JavaScript — strip type annotations.",
    category: "developer",
    icon: "file-type-2",
    slug: "typescript-to-js",
    tags: ["typescript", "javascript", "convert"],
  },
  {
    id: "color-system-generator",
    name: "Color System Generator",
    description: "Generate a full color system from one color.",
    category: "developer",
    icon: "palette",
    slug: "color-system-generator",
    tags: ["color", "design", "system"],
  },

  // ============================================
  // Education & Students Tools
  // ============================================
  {
    id: "flashcard-maker",
    name: "Flashcard Maker",
    description: "Create and study flashcards — saved locally.",
    category: "education",
    icon: "layers",
    slug: "flashcard-maker",
    featured: true,
    tags: ["flashcard", "study", "memory"],
  },
  {
    id: "quiz-maker",
    name: "Quiz Maker",
    description: "Create and take quizzes — free and private.",
    category: "education",
    icon: "clipboard-list",
    slug: "quiz-maker",
    tags: ["quiz", "test", "education"],
  },
  {
    id: "grade-calculator",
    name: "Grade Calculator",
    description: "Calculate weighted average grades.",
    category: "education",
    icon: "calculator",
    slug: "grade-calculator",
    tags: ["grade", "average", "school"],
  },
  {
    id: "gpa-calculator",
    name: "GPA Calculator",
    description: "Calculate GPA from course grades.",
    category: "education",
    icon: "award",
    slug: "gpa-calculator",
    tags: ["gpa", "grade", "university"],
  },
  {
    id: "citation-generator",
    name: "Citation Generator",
    description: "Generate APA, MLA, Chicago citations instantly.",
    category: "education",
    icon: "quote",
    slug: "citation-generator",
    tags: ["citation", "apa", "mla"],
  },
  {
    id: "study-planner",
    name: "Study Planner",
    description: "Plan your study schedule around exams.",
    category: "education",
    icon: "calendar-check",
    slug: "study-planner",
    tags: ["study", "plan", "exam"],
  },
  {
    id: "fraction-calculator",
    name: "Fraction Calculator",
    description: "Calculate fractions with step-by-step solutions.",
    category: "education",
    icon: "divide",
    slug: "fraction-calculator",
    tags: ["fraction", "math", "calculator"],
  },

  // ============================================
  // Finance & Money Tools
  // ============================================
  {
    id: "currency-converter",
    name: "Currency Converter",
    description: "Convert between major currencies with live rates.",
    category: "finance",
    icon: "banknote",
    slug: "currency-converter",
    featured: true,
    tags: ["currency", "convert", "exchange"],
  },
  {
    id: "compound-interest",
    name: "Compound Interest Calculator",
    description: "Calculate compound interest with charts and goals.",
    category: "finance",
    icon: "trending-up",
    slug: "compound-interest",
    tags: ["compound", "interest", "savings"],
  },
  {
    id: "tax-calculator",
    name: "Tax Calculator",
    description: "Calculate US federal income tax with brackets.",
    category: "finance",
    icon: "receipt",
    slug: "tax-calculator",
    tags: ["tax", "income", "federal"],
  },
  {
    id: "budget-tracker",
    name: "Budget Tracker",
    description: "Track income and expenses with categories.",
    category: "finance",
    icon: "pie-chart",
    slug: "budget-tracker",
    tags: ["budget", "expense", "income"],
  },
  {
    id: "investment-calculator",
    name: "Investment Calculator",
    description: "Project investment growth with compound returns.",
    category: "finance",
    icon: "line-chart",
    slug: "investment-calculator",
    tags: ["investment", "growth", "returns"],
  },
  {
    id: "net-worth-calculator",
    name: "Net Worth Calculator",
    description: "Calculate your net worth — assets minus liabilities.",
    category: "finance",
    icon: "wallet",
    slug: "net-worth-calculator",
    tags: ["net-worth", "assets", "liabilities"],
  },
  {
    id: "break-even-calculator",
    name: "Break Even Calculator",
    description: "Calculate your break-even point for business.",
    category: "finance",
    icon: "target",
    slug: "break-even-calculator",
    tags: ["break-even", "business", "profit"],
  },

  // ============================================
  // Health & Medical Tools
  // ============================================
  {
    id: "calorie-calculator",
    name: "Calorie Calculator TDEE",
    description: "Calculate your daily calorie needs — BMR and TDEE.",
    category: "health",
    icon: "flame",
    slug: "calorie-calculator",
    featured: true,
    tags: ["calorie", "tdee", "bmr"],
  },
  {
    id: "water-intake",
    name: "Water Intake Calculator",
    description: "Calculate your daily water intake needs.",
    category: "health",
    icon: "droplets",
    slug: "water-intake",
    tags: ["water", "hydration", "health"],
  },
  {
    id: "sleep-cycle",
    name: "Sleep Cycle Calculator",
    description: "Calculate optimal sleep and wake times.",
    category: "health",
    icon: "moon",
    slug: "sleep-cycle",
    tags: ["sleep", "wake", "cycle"],
  },
  {
    id: "body-fat-calculator",
    name: "Body Fat Calculator",
    description: "Calculate body fat percentage — Navy method.",
    category: "health",
    icon: "activity",
    slug: "body-fat-calculator",
    tags: ["body-fat", "fitness", "health"],
  },
  {
    id: "pregnancy-due-date",
    name: "Pregnancy Due Date Calculator",
    description: "Calculate your due date and track milestones.",
    category: "health",
    icon: "baby",
    slug: "pregnancy-due-date",
    tags: ["pregnancy", "due-date", "baby"],
  },

  // ============================================
  // Video & Audio Tools
  // ============================================
  {
    id: "video-to-audio",
    name: "Video to MP3",
    description: "Extract audio from any video file — private.",
    category: "video",
    icon: "music",
    slug: "video-to-audio",
    featured: true,
    tags: ["video", "audio", "extract"],
  },
  {
    id: "audio-trimmer",
    name: "Audio Trimmer",
    description: "Trim and cut audio files — browser-based.",
    category: "video",
    icon: "scissors",
    slug: "audio-trimmer",
    tags: ["audio", "trim", "cut"],
  },
  {
    id: "volume-booster",
    name: "Audio Volume Booster",
    description: "Boost or reduce audio volume — preview and download.",
    category: "video",
    icon: "volume-2",
    slug: "volume-booster",
    tags: ["volume", "boost", "audio"],
  },
  {
    id: "audio-converter",
    name: "Audio Converter",
    description: "Convert audio files to WAV or OGG — browser-based.",
    category: "video",
    icon: "refresh-cw",
    slug: "audio-converter",
    tags: ["audio", "convert", "wav"],
  },
  {
    id: "video-speed-changer",
    name: "Video Speed Changer",
    description: "Speed up or slow down any video — 0.25x to 4x.",
    category: "video",
    icon: "fast-forward",
    slug: "video-speed-changer",
    tags: ["video", "speed", "slow"],
  },

  // ============================================
  // AI Tools
  // ============================================
  {
    id: "ocr",
    name: "OCR — Image to Text",
    description:
      "Extract text from images using AI-powered OCR. Supports 15 languages.",
    category: "ai",
    icon: "scan-text",
    slug: "ocr",
    featured: true,
    tags: ["ocr", "text", "image", "ai", "recognize"],
  },
  {
    id: "background-remover",
    name: "Background Remover",
    description: "Remove image backgrounds instantly with AI. 100% in-browser.",
    category: "ai",
    icon: "eraser",
    slug: "background-remover",
    featured: true,
    tags: ["background", "remove", "image", "ai", "transparent"],
  },
  {
    id: "text-summarizer",
    name: "Text Summarizer",
    description:
      "Summarize long articles and texts using AI. Adjustable length.",
    category: "ai",
    icon: "text-quote",
    slug: "text-summarizer",
    tags: ["summarize", "text", "ai", "article"],
  },
  {
    id: "object-detection",
    name: "Object Detection",
    description:
      "Detect and label objects in images using AI. Annotated results.",
    category: "ai",
    icon: "scan",
    slug: "object-detection",
    tags: ["detect", "object", "image", "ai", "yolo"],
  },
  {
    id: "grammar-checker",
    name: "Grammar Checker",
    description:
      "Check and fix grammar mistakes using AI. Supports English text.",
    category: "ai",
    icon: "spell-check",
    slug: "grammar-checker",
    tags: ["grammar", "check", "ai", "spelling", "correct"],
  },
  {
    id: "image-captioning",
    name: "Image Captioning",
    description:
      "Generate natural language descriptions for any image using AI.",
    category: "ai",
    icon: "message-square-text",
    slug: "image-captioning",
    tags: ["caption", "image", "ai", "describe", "vision"],
  },
  {
    id: "sentiment-analysis",
    name: "Sentiment Analysis",
    description:
      "Analyze the emotional tone of text — positive, negative, or neutral.",
    category: "ai",
    icon: "heart",
    slug: "sentiment-analysis",
    tags: ["sentiment", "analysis", "ai", "emotion", "nlp"],
  },
  {
    id: "question-answering",
    name: "Question Answering",
    description:
      "Ask questions about a passage and get AI-powered answers instantly.",
    category: "ai",
    icon: "help-circle",
    slug: "question-answering",
    tags: ["question", "answer", "ai", "qa", "nlp"],
  },
  {
    id: "text-translator",
    name: "AI Translator",
    description:
      "Translate text between 9 languages using AI — EN, VI, ZH, JA, KO, FR, DE, ES, RU. Multilingual models, only 2 models for all languages.",
    category: "ai",
    icon: "languages",
    slug: "text-translator",
    featured: true,
    tags: ["translate", "translation", "ai", "language", "marianmt"],
  },
  {
    id: "speech-to-text",
    name: "Speech to Text",
    description:
      "Transcribe audio files or microphone recordings to text using AI — Whisper model.",
    category: "ai",
    icon: "mic",
    slug: "speech-to-text",
    featured: true,
    tags: ["speech", "transcribe", "audio", "ai", "whisper"],
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description:
      "Convert text to speech with voice selection, speed, pitch, and volume control — instant, no download.",
    category: "text",
    icon: "volume-2",
    slug: "text-to-speech",
    featured: true,
    tags: ["speech", "tts", "ai", "voice", "audio"],
  },
];

/**
 * Get all tools for a specific category
 */
export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((t) => t.category === categoryId);
}

/**
 * Get a tool by its slug and category
 */
export function getToolBySlug(
  categoryId: string,
  slug: string,
): Tool | undefined {
  return tools.find((t) => t.category === categoryId && t.slug === slug);
}

/**
 * Get featured tools across all categories
 */
export function getFeaturedTools(): Tool[] {
  return tools.filter((t) => t.featured);
}

/**
 * Search tools by query
 */
export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.includes(q)),
  );
}
