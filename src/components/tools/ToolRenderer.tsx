import { Suspense, lazy } from "preact/compat";

interface Props {
	toolId: string;
}

// Lazy-loaded tool components — each becomes its own chunk
const toolComponents: Record<string, ReturnType<typeof lazy>> = {
	// Image Tools
	"image-resizer": lazy(() => import("./ImageResizer")),
	"image-compressor": lazy(() => import("./ImageCompressor")),
	"image-cropper": lazy(() => import("./ImageCropper")),
	"image-to-base64": lazy(() => import("./ImageToBase64")),
	"image-rotator": lazy(() => import("./ImageRotator")),
	"image-watermark": lazy(() => import("./ImageWatermark")),
	"photo-filters": lazy(() => import("./PhotoFilters")),
	"svg-optimizer": lazy(() => import("./SvgOptimizer")),

	// Text Tools
	"word-counter": lazy(() => import("./WordCounter")),
	"case-converter": lazy(() => import("./CaseConverter")),
	"slug-generator": lazy(() => import("./SlugGenerator")),
	"text-reverser": lazy(() => import("./TextReverser")),
	"line-counter": lazy(() => import("./LineCounter")),
	"text-repeater": lazy(() => import("./TextRepeater")),
	"remove-duplicate-lines": lazy(() => import("./RemoveDuplicateLines")),
	"text-sorter": lazy(() => import("./TextSorter")),
	"reading-time-calculator": lazy(() => import("./ReadingTimeCalculator")),
	"fancy-text": lazy(() => import("./FancyTextGenerator")),
	"readability-score": lazy(() => import("./ReadabilityScore")),
	"text-to-hashtags": lazy(() => import("./TextToHashtags")),
	"emoji-picker": lazy(() => import("./EmojiPicker")),
	"find-replace": lazy(() => import("./FindReplace")),
	"whitespace-remover": lazy(() => import("./WhitespaceRemover")),
	"text-statistics": lazy(() => import("./TextStatistics")),
	"text-wrap": lazy(() => import("./TextWrap")),
	"text-truncate": lazy(() => import("./TextTruncate")),

	// Developer Tools
	"json-formatter": lazy(() => import("./JsonFormatter")),
	"base64-encoder": lazy(() => import("./Base64Encoder")),
	"url-encoder": lazy(() => import("./UrlEncoder")),
	"hash-generator": lazy(() => import("./HashGenerator")),
	"regex-tester": lazy(() => import("./RegexTester")),
	"lorem-generator": lazy(() => import("./LoremGenerator")),
	"markdown-to-html": lazy(() => import("./MarkdownToHtml")),
	"html-to-markdown": lazy(() => import("./HtmlToMarkdown")),
	"css-formatter": lazy(() => import("./CssFormatter")),
	"yaml-formatter": lazy(() => import("./YamlFormatter")),
	"html-formatter": lazy(() => import("./HtmlFormatter")),
	"sql-formatter": lazy(() => import("./SqlFormatter")),
	"xml-formatter": lazy(() => import("./XmlFormatter")),
	"js-formatter": lazy(() => import("./JavaScriptFormatter")),
	"typescript-to-js": lazy(() => import("./TypeScriptToJs")),
	"color-system-generator": lazy(() => import("./ColorSystemGenerator")),
	"regex-explainer": lazy(() => import("./RegexExplainer")),
	"gitignore-generator": lazy(() => import("./GitignoreGenerator")),
	"json-to-typescript": lazy(() => import("./JsonToTypescript")),
	"jwt-decoder": lazy(() => import("./JwtDecoder")),
	"uuid-generator": lazy(() => import("./UuidGenerator")),
	"text-diff": lazy(() => import("./TextDiff")),
	"box-shadow-generator": lazy(() => import("./BoxShadowGenerator")),
	"css-grid-generator": lazy(() => import("./CssGridGenerator")),
	"css-flexbox-generator": lazy(() => import("./CssFlexboxGenerator")),
	"border-radius-generator": lazy(() => import("./BorderRadiusGenerator")),
	"css-units-converter": lazy(() => import("./CssUnitsConverter")),
	"url-parser": lazy(() => import("./UrlParser")),
	"user-agent-parser": lazy(() => import("./UserAgentParser")),
	"mime-type-lookup": lazy(() => import("./MimeTypeLookup")),
	"http-status-codes": lazy(() => import("./HttpStatusCodes")),
	"css-minifier": lazy(() => import("./CssMinifier")),

	// PDF Tools
	"pdf-merger": lazy(() => import("./PdfMerger")),
	"pdf-splitter": lazy(() => import("./PdfSplitter")),
	"pdf-compressor": lazy(() => import("./PdfCompressor")),
	"pdf-rotator": lazy(() => import("./PdfRotator")),
	"pdf-to-text": lazy(() => import("./PdfToText")),

	// Math Tools
	"percentage-calculator": lazy(() => import("./PercentageCalculator")),
	"unit-converter": lazy(() => import("./UnitConverter")),
	"bmi-calculator": lazy(() => import("./BmiCalculator")),
	"loan-calculator": lazy(() => import("./LoanCalculator")),
	"age-calculator": lazy(() => import("./AgeCalculator")),

	// Security Tools
	"password-generator": lazy(() => import("./PasswordGenerator")),
	"password-strength-checker": lazy(() => import("./PasswordStrengthChecker")),
	"otp-generator": lazy(() => import("./OtpGenerator")),
	"qr-code-generator": lazy(() => import("./QrCodeGenerator")),
	"barcode-generator": lazy(() => import("./BarcodeGenerator")),
	"jwt-encoder": lazy(() => import("./JwtEncoder")),
	"hash-file": lazy(() => import("./HashFile")),
	"ip-lookup": lazy(() => import("./IpLookup")),
	"dns-lookup": lazy(() => import("./DnsLookup")),
	"ssl-checker": lazy(() => import("./SslChecker")),
	"password-breach": lazy(() => import("./PasswordBreach")),
	"csp-evaluator": lazy(() => import("./CspEvaluator")),

	// Color Tools
	"color-picker": lazy(() => import("./ColorPicker")),
	"color-palette-generator": lazy(() => import("./ColorPaletteGenerator")),
	"contrast-checker": lazy(() => import("./ContrastChecker")),
	"css-gradient-generator": lazy(() => import("./CssGradientGenerator")),
	"color-mixer": lazy(() => import("./ColorMixer")),
	"color-shades": lazy(() => import("./ColorShades")),
	"color-tints": lazy(() => import("./ColorTints")),

	// Date & Time Tools
	"countdown-timer": lazy(() => import("./CountdownTimer")),
	"timezone-converter": lazy(() => import("./TimezoneConverter")),
	"date-difference-calculator": lazy(() => import("./DateDifferenceCalculator")),
	"unix-timestamp-converter": lazy(() => import("./UnixTimestampConverter")),

	// SEO Tools
	"meta-tag-generator": lazy(() => import("./MetaTagGenerator")),
	"robots-txt-generator": lazy(() => import("./RobotsTxtGenerator")),
	"sitemap-generator": lazy(() => import("./SitemapGenerator")),

	// Data Tools
	"csv-to-json": lazy(() => import("./CsvToJson")),
	"json-to-csv": lazy(() => import("./JsonToCsv")),
	"csv-formatter": lazy(() => import("./CsvFormatter")),
	"json-to-yaml": lazy(() => import("./JsonToYaml")),
	"tsv-to-json": lazy(() => import("./TsvToJson")),
	"json-to-tsv": lazy(() => import("./JsonToTsv")),

	// Fun Tools
	"random-number-generator": lazy(() => import("./RandomNumberGenerator")),
	"dice-roller": lazy(() => import("./DiceRoller")),
	"coin-flipper": lazy(() => import("./CoinFlipper")),
	"random-name-picker": lazy(() => import("./RandomNamePicker")),
	"wheel-spinner": lazy(() => import("./WheelSpinner")),
	"decision-maker": lazy(() => import("./DecisionMaker")),
	"placeholder-image": lazy(() => import("./PlaceholderImage")),

	// Education Tools
	"flashcard-maker": lazy(() => import("./FlashcardMaker")),
	"quiz-maker": lazy(() => import("./QuizMaker")),
	"grade-calculator": lazy(() => import("./GradeCalculator")),
	"gpa-calculator": lazy(() => import("./GpaCalculator")),
	"citation-generator": lazy(() => import("./CitationGenerator")),
	"study-planner": lazy(() => import("./StudyPlanner")),
	"fraction-calculator": lazy(() => import("./FractionCalculator")),

	// Finance Tools
	"currency-converter": lazy(() => import("./CurrencyConverter")),
	"compound-interest": lazy(() => import("./CompoundInterest")),
	"tax-calculator": lazy(() => import("./TaxCalculator")),
	"budget-tracker": lazy(() => import("./BudgetTracker")),
	"investment-calculator": lazy(() => import("./InvestmentCalculator")),
	"net-worth-calculator": lazy(() => import("./NetWorthCalculator")),
	"break-even-calculator": lazy(() => import("./BreakEvenCalculator")),

	// Health Tools
	"calorie-calculator": lazy(() => import("./CalorieCalculator")),
	"water-intake": lazy(() => import("./WaterIntakeCalculator")),
	"sleep-cycle": lazy(() => import("./SleepCycleCalculator")),
	"body-fat-calculator": lazy(() => import("./BodyFatCalculator")),
	"pregnancy-due-date": lazy(() => import("./PregnancyDueDate")),

	// Video & Audio Tools
	"video-to-audio": lazy(() => import("./VideoToAudio")),
	"audio-trimmer": lazy(() => import("./AudioTrimmer")),
	"volume-booster": lazy(() => import("./VolumeBooster")),
	"audio-converter": lazy(() => import("./AudioConverter")),
	"video-speed-changer": lazy(() => import("./VideoSpeedChanger")),

	// AI Tools
	ocr: lazy(() => import("./OcrTool")),
	"background-remover": lazy(() => import("./BackgroundRemover")),
	"text-summarizer": lazy(() => import("./TextSummarizer")),
	"object-detection": lazy(() => import("./ObjectDetection")),
	"grammar-checker": lazy(() => import("./GrammarChecker")),
	"image-captioning": lazy(() => import("./ImageCaptioning")),
	"sentiment-analysis": lazy(() => import("./SentimentAnalysis")),
	"question-answering": lazy(() => import("./QuestionAnswering")),
	"text-translator": lazy(() => import("./TextTranslator")),
	"speech-to-text": lazy(() => import("./SpeechToText")),
	"text-to-speech": lazy(() => import("./TextToSpeech")),
	ner: lazy(() => import("./NamedEntityRecognition")),
	"face-detection": lazy(() => import("./FaceDetection")),
	"paraphrase-generator": lazy(() => import("./ParaphraseGenerator")),
	"language-detector": lazy(() => import("./LanguageDetector")),
	"keyword-extractor": lazy(() => import("./KeywordExtractor")),

	// Converter Tools — Number Systems
	"number-base-converter": lazy(() => import("./NumberBaseConverter")),
	"binary-to-decimal": lazy(() => import("./BinaryToDecimal")),
	"decimal-to-binary": lazy(() => import("./DecimalToBinary")),
	"hex-to-decimal": lazy(() => import("./HexToDecimal")),
	"decimal-to-hex": lazy(() => import("./DecimalToHex")),

	// Converter Tools — Data Formats
	"json-to-xml": lazy(() => import("./JsonToXml")),
	"xml-to-json": lazy(() => import("./XmlToJson")),
	"csv-to-xml": lazy(() => import("./CsvToXml")),
	"xml-to-csv": lazy(() => import("./XmlToCsv")),

	// Converter Tools — Text Encoding
	"html-entity-encoder": lazy(() => import("./HtmlEntityEncoder")),
	"unicode-encoder": lazy(() => import("./UnicodeEncoder")),
	"text-to-binary": lazy(() => import("./TextToBinary")),
	"punycode-converter": lazy(() => import("./PunycodeConverter")),

	// Converter Tools — Color
	"hex-to-rgb": lazy(() => import("./HexToRgb")),
	"rgb-to-hsl": lazy(() => import("./RgbToHsl")),
	"color-format-converter": lazy(() => import("./ColorFormatConverter")),

	// Converter Tools — Text & Fun
	"morse-code-converter": lazy(() => import("./MorseCodeConverter")),
	"roman-numeral-converter": lazy(() => import("./RomanNumeralConverter")),
	"text-to-ascii-art": lazy(() => import("./TextToAsciiArt")),
	"upside-down-text": lazy(() => import("./UpsideDownText")),

	// Converter Tools — Number/Math (Batch 2)
	"binary-to-hex": lazy(() => import("./BinaryToHex")),
	"hex-to-binary": lazy(() => import("./HexToBinary")),
	"number-to-words": lazy(() => import("./NumberToWords")),
	"scientific-notation-converter": lazy(() => import("./ScientificNotationConverter")),
	"octal-converter": lazy(() => import("./OctalConverter")),

	// Converter Tools — Data Format (Batch 2)
	"toml-to-json": lazy(() => import("./TomlToJson")),
	"json-to-toml": lazy(() => import("./JsonToToml")),
	"yaml-to-json": lazy(() => import("./YamlToJson")),

	// Converter Tools — Encoding (Batch 2)
	"base32-encoder": lazy(() => import("./Base32Encoder")),
	"text-to-hex": lazy(() => import("./TextToHex")),
	"rot13-encoder": lazy(() => import("./Rot13Encoder")),
	"quoted-printable-encoder": lazy(() => import("./QuotedPrintableEncoder")),

	// Converter Tools — Time & Other (Batch 2)
	"seconds-to-time": lazy(() => import("./SecondsToTime")),
	"time-to-seconds": lazy(() => import("./TimeToSeconds")),
	"html-to-text": lazy(() => import("./HtmlToText")),

	// Account Tools
	"username-generator": lazy(() => import("./UsernameGenerator")),
	"email-validator": lazy(() => import("./EmailValidator")),
	"phone-validator": lazy(() => import("./PhoneValidator")),
	"credit-card-validator": lazy(() => import("./CreditCardValidator")),
	"iban-validator": lazy(() => import("./IbanValidator")),

	// Game Tools
	"error-code-lookup": lazy(() => import("./ErrorCodeLookup")),
	"dpi-calculator": lazy(() => import("./DpiCalculator")),
	"sensitivity-converter": lazy(() => import("./SensitivityConverter")),
	"crosshair-generator": lazy(() => import("./CrosshairGenerator")),
	"game-timer": lazy(() => import("./GameTimer")),

	// Workflow
	"workflow-builder": lazy(() => import("../workflow/WorkflowCanvasEditor")),

	// Utility Tools
	"link-shortener": lazy(() => import("./LinkShortener")),
	"invoice-generator": lazy(() => import("./InvoiceGenerator")),
	"signature-generator": lazy(() => import("./SignatureGenerator")),
	"favicon-generator": lazy(() => import("./FaviconGenerator")),
	notepad: lazy(() => import("./Notepad")),
};

// Image converter tools with their specific configurations
const IMAGE_CONVERTER_CONFIGS: Record<
	string,
	{
		from: string;
		to: string;
		mime: "image/png" | "image/jpeg" | "image/webp";
		accept: string;
	}
> = {
	"png-to-jpg": {
		from: "PNG",
		to: "JPG",
		mime: "image/jpeg",
		accept: "image/png",
	},
	"jpg-to-png": {
		from: "JPG",
		to: "PNG",
		mime: "image/png",
		accept: "image/jpeg",
	},
	"jpg-to-webp": {
		from: "JPG",
		to: "WebP",
		mime: "image/webp",
		accept: "image/jpeg",
	},
	"png-to-webp": {
		from: "PNG",
		to: "WebP",
		mime: "image/webp",
		accept: "image/png",
	},
	"webp-to-png": {
		from: "WebP",
		to: "PNG",
		mime: "image/png",
		accept: "image/webp",
	},
};

// Lazy-loaded ImageConverter
const LazyImageConverter = lazy(() => import("./ImageConverter"));

function LoadingSpinner() {
	return (
		<div class="flex items-center justify-center py-16">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				<span class="text-caption text-muted">Loading tool...</span>
			</div>
		</div>
	);
}

export default function ToolRenderer({ toolId }: Props) {
	// Check if it's an image converter tool
	const converterConfig = IMAGE_CONVERTER_CONFIGS[toolId];
	if (converterConfig) {
		return (
			<Suspense fallback={<LoadingSpinner />}>
				<LazyImageConverter
					fromFormat={converterConfig.from}
					toFormat={converterConfig.to}
					targetMime={converterConfig.mime}
					accept={converterConfig.accept}
				/>
			</Suspense>
		);
	}

	// Look up the lazy component
	const Component = toolComponents[toolId];

	if (!Component) {
		return (
			<div class="text-center py-12">
				<p class="text-muted">This tool is coming soon.</p>
			</div>
		);
	}

	return (
		<Suspense fallback={<LoadingSpinner />}>
			<Component />
		</Suspense>
	);
}
