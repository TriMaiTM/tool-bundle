# ToolBundle

> Power Locally. Process Instantly.

A collection of free, privacy-first browser tools for images, text, PDFs, math, developer utilities, and security. Every tool runs entirely in your browser — no file uploads, no accounts, no limits.
![Preview](./preview3.png)

## Features

- **100% Client-Side** — Your files never leave your browser. All processing happens locally using JavaScript and Canvas API.
- **Privacy First** — No server uploads, no data collection, no cookies. What you process stays on your device.
- **Instant Results** — No upload waits, no queues. Results appear instantly because everything runs on your machine.
- **Free Forever** — No accounts, no subscriptions, no paywalls. Every tool is free for everyone.
- **306 Tools** — Across 19 categories: Image, Text, Developer, PDF, Math, Security, Color, Date & Time, SEO, Data, Fun & Utility, Education, Finance, Health, Video & Audio, and **AI Tools**.
- **Dark UI** — Clean dark canvas with electric yellow accent. Built with a consistent design system.
- **New: Workflow Builder** — Build and automate your workflows with a visual drag-and-drop interface.
![Preview](./preview5.png)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build/) |
| UI Components | [Preact](https://preactjs.com/) (~3KB) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Language | TypeScript |
| Hosting | Static (Cloudflare) |

## Getting Started

```bash
git clone https://github.com/your-username/toolbundle.git
cd toolbundle
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Documentation

Full documentation is available in the [`docs/`](./docs/) directory:

| Document | Description |
|---|---|
| [Getting Started](./docs/getting-started.md) | Installation, development, and deployment |
| [Tech Stack](./docs/tech-stack.md) | Technologies and architecture decisions |
| [Project Structure](./docs/project-structure.md) | Directory layout and file organization |
| [Adding New Tools](./docs/adding-tools.md) | Step-by-step guide to add a new tool |
| [Tools List](./docs/tools-list.md) | Complete list of all 306 tools |
| [Design System](./docs/design-system.md) | UI components, colors, typography |

## Available Tools

### Image Tools (23)
PNG to JPG, JPG to PNG, JPG to WebP, PNG to WebP, WebP to PNG, Image Resizer, Image Compressor, Image Cropper, AVIF Converter, HEIC Converter, Image Enlarger / Upscaler, Image Background Color Changer, Image Blur & Pixelate, Passport Photo Maker, Social Media Resizer, EXIF Metadata Manager, Image Color Extractor, Image to Base64, Image Rotator & Flipper, Image Watermark Adder, Photo Filters, SVG Optimizer, Meme Generator

### Text Tools (33)
Word Counter, Case Converter, Slug Generator, Text Reverser, Line Counter, Vietnamese Lorem & Fake Data Generator, Text Cleaner & Unicode Normalizer, Vietnamese Accent Remover, Add Line Numbers, Prefix/Suffix Lines, Text Splitter, Text Joiner, CSV / Text Column Extractor, Regex Find & Replace Builder, Profanity Filter & Bad Words Detector, Text Repeater, Remove Duplicate Lines, Text Sorter, Reading Time Calculator, Fancy Text Generator, Readability Score, Text to Hashtags, Emoji Picker & Search, Find & Replace, Whitespace Remover, Text Statistics, Text Wrap, Text Truncate, Text to Speech, Morse Code Converter, Roman Numeral Converter, Text to ASCII Art, Upside Down Text

### Developer Tools (81)
JSON Formatter, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Regex Tester, Lorem Ipsum Generator, Markdown to HTML, HTML to Markdown, CSS Formatter, YAML Formatter, HTML Formatter, SQL Formatter, XML Formatter, JS Formatter, TypeScript to JS Converter, Color System Generator, Regex Explainer, .gitignore Generator, JSON to TypeScript, JWT Decoder, UUID Generator, Text Diff, Box Shadow Generator, CSS Grid Generator, CSS Flexbox Generator, Border Radius Generator, CSS Units Converter, URL Parser, User Agent Parser, MIME Type Lookup, HTTP Status Codes, CSS Minifier, Number Base Converter, Binary to Decimal, Decimal to Binary, Hex to Decimal, Decimal to Hex, JSON to XML, XML to JSON, CSV to XML, XML to CSV, HTML Entity Encoder/Decoder, Unicode Encoder/Decoder, Text to Binary / Binary to Text, Punycode Converter, Binary to Hex, Hex to Binary, Number to Words, Scientific Notation Converter, Octal Converter, TOML to JSON, JSON to TOML, YAML to JSON, Base32 Encoder/Decoder, Text to Hex / Hex to Text, ROT13 Encoder/Decoder, Quoted-Printable Encoder/Decoder, Seconds to HH:MM:SS, HH:MM:SS to Seconds, HTML to Text, Workflow Builder, API Request Tester, cURL Builder, cURL Converter, JSON Path Tester, JSON Schema Validator, GraphQL Formatter & Tester, Cron Expression Generator, Dockerfile Generator, Nginx Config Generator, .htaccess Generator, OpenAPI & Swagger Viewer, ENV File Parser & Converter, JWT Verifier, HMAC Hash Generator, UUID Validator & Extractor, ULID Generator & Decoder, NanoID Generator, QR Payload Decoder, HTML / CSS / JS Sandbox, CSS Specificity Calculator

### PDF Tools (17)
PDF Merger, PDF Splitter, PDF Compressor, PDF Rotator, PDF to Text, Image to PDF, PDF to Images, PDF Page Reorder, PDF Page Delete, Add Page Numbers, Add Watermark, PDF Password Protect, PDF Unlock, PDF Metadata Viewer, PDF Form Filler, PDF OCR, PDF Signature Tool

### Math & Calculators (18)
Percentage Calculator, Scientific Calculator, Fraction to Decimal Converter, Ratio Calculator, Proportion Calculator, Average Calculator (Mean, Median, Mode), Standard Deviation Calculator, Triangle Calculator, Area & Perimeter Calculator, Volume & Surface Area Calculator, Probability Calculator, Matrix Calculator, Equation Solver, Unit Converter, BMI Calculator, Loan Calculator, Age Calculator, Bill Splitter & Tip Calculator

### Security Tools (24)
Password Generator, Password Strength Checker, OTP Generator, AES Encrypt/Decrypt, RSA Key Generator, Public/Private Key Matcher, SSH Key Generator, PGP Encrypt/Decrypt, HMAC Signature Validator, Checksum Verifier, Secure Notes Encryptor, Random Token Generator, API Key Generator, Common Ports & Services Reference, Security Headers Evaluator, QR Code Generator, Barcode Generator, JWT Encoder, Hash File, IP Address Lookup, DNS Lookup, SSL Checker, Password Breach Checker, CSP Evaluator

### Color Tools (22)
Color Picker, Color Palette Generator, Contrast Checker WCAG, CSS Gradient Generator, Color Mixer, Color Shades, Color Tints, CMYK Converter, RGB to HEX Converter, HSL to HEX Converter, OKLCH Color Converter, Color Blindness Simulator, Palette From Image, Material Color Generator, Tailwind Color Palette Generator, Brand Color Palette Extractor, Gradient Palette Generator, Duotone Generator, Color Name Finder, HEX to RGB Converter, RGB to HSL Converter, Color Format Converter

### Date & Time Tools (16)
Countdown Timer, Timezone Converter, Date Difference Calculator, Unix Timestamp Converter, World Clock, Business Days Calculator, Add/Subtract Date Calculator, Week Number Calculator, Time Duration Calculator, Meeting Time Planner, Stopwatch, Pomodoro Timer, Calendar Generator, ISO Date Converter, Time Ago Calculator, Date Format Converter

### SEO & Marketing (3)
Meta Tag Generator, Robots.txt Generator, Sitemap Generator

### Data & Spreadsheet (6)
CSV to JSON, JSON to CSV, CSV Formatter, JSON to YAML, TSV to JSON, JSON to TSV

### Fun & Utility (8)
Random Number Generator, Dice Roller, Coin Flipper, Random Name Picker, Wheel Spinner, Decision Maker Spinner, Placeholder Image Generator, Typing Speed Test

### Education & Students (7)
Flashcard Maker, Quiz Maker, Grade Calculator, GPA Calculator, Citation Generator, Study Planner, Fraction Calculator

### Finance & Money (7)
Currency Converter, Compound Interest Calculator, Tax Calculator, Budget Tracker, Investment Calculator, Net Worth Calculator, Break Even Calculator

### Health & Medical (6)
Calorie Calculator TDEE, Water Intake Calculator, Sleep Cycle Calculator, Body Fat Calculator, Pregnancy Due Date Calculator, Period & Ovulation Tracker

### Video & Audio (5)
Video to MP3, Audio Trimmer, Audio Volume Booster, Audio Converter, Video Speed Changer

### AI Tools (15)
OCR: Image to Text, Background Remover, Text Summarizer, Object Detection, Grammar Checker, Image Captioning, Sentiment Analysis, Question Answering, AI Translator, Speech to Text, Named Entity Recognition, Face Detection, Paraphrase Generator, Language Detector, Keyword Extractor

### Utility Tools (5)
Link Shortener, Invoice Generator, Signature Generator, Favicon Generator, Online Notepad

### Account & Identity (5)
Username Generator, Email Validator, Phone Validator, Credit Card Validator, IBAN Validator

### Game Tools (5)
Error Code Lookup, DPI Calculator, Sensitivity Converter, Crosshair Generator, Game Timer

## License

MIT

---
