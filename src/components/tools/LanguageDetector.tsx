import { useCallback, useState } from "preact/hooks";

interface LanguageResult {
	code: string;
	name: string;
	confidence: number;
	charCount: number;
	totalChars: number;
}

interface DetectionResult {
	languages: LanguageResult[];
	charBreakdown: { name: string; count: number; percent: number }[];
}

// Unicode range checkers
function countChars(text: string, ranges: [number, number][]): number {
	let count = 0;
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		for (const [start, end] of ranges) {
			if (code >= start && code <= end) {
				count++;
				break;
			}
		}
	}
	return count;
}

// Vietnamese diacritics
function isVietnamese(text: string): { count: number; total: number } {
	// Vietnamese-specific characters
	const vnChars = /[đĐăĂâÂêÊôÔơƠưƯ]/g;
	// Vietnamese tone marks
	const vnTones = /[àáãảạÀÁÃẢẠèéẽẻẹÈÉẼẺẸìíĩỉịÌÍĨỈỊòóõỏọÒÓÕỎỌùúũủụÙÚŨỦỤỳýỹỷỵỲÝỸỶỴ]/g;
	const vnMatches = (text.match(vnChars) || []).length + (text.match(vnTones) || []).length;
	return { count: vnMatches, total: text.length };
}

function detectLanguages(text: string): DetectionResult {
	if (!text.trim()) {
		return { languages: [], charBreakdown: [] };
	}

	// Remove whitespace and punctuation for analysis
	const cleanText = text.replace(/[\s\d\p{P}]/gu, "");
	const totalAlpha = cleanText.length;
	if (totalAlpha === 0) {
		return { languages: [], charBreakdown: [] };
	}

	// Define Unicode ranges
	// Japanese Hiragana: U+3040-U+309F
	// Japanese Katakana: U+30A0-U+30FF
	// CJK Unified Ideographs: U+4E00-U+9FFF
	// Hangul: U+AC00-U+D7AF
	// Thai: U+0E00-U+0E7F
	// Arabic: U+0600-U+06FF
	// Cyrillic: U+0400-U+04FF
	// Devanagari: U+0900-U+097F
	// Latin Extended: U+00C0-U+024F (for Vietnamese etc.)

	const hiraganaCount = countChars(cleanText, [[0x3040, 0x309f]]);
	const katakanaCount = countChars(cleanText, [[0x30a0, 0x30ff]]);
	const cjkCount = countChars(cleanText, [[0x4e00, 0x9fff]]);
	const hangulCount = countChars(cleanText, [[0xac00, 0xd7af]]);
	const thaiCount = countChars(cleanText, [[0x0e00, 0x0e7f]]);
	const arabicCount = countChars(cleanText, [[0x0600, 0x06ff]]);
	const cyrillicCount = countChars(cleanText, [[0x0400, 0x04ff]]);
	const devanagariCount = countChars(cleanText, [[0x0900, 0x097f]]);
	const latinCount = countChars(cleanText, [
		[0x0041, 0x007a],
		[0x00c0, 0x024f],
	]);

	// Vietnamese detection
	const vnResult = isVietnamese(text);

	const results: LanguageResult[] = [];
	const charBreakdown: { name: string; count: number; percent: number }[] = [];

	// Japanese (Hiragana + Katakana present)
	if (hiraganaCount > 0 || katakanaCount > 0) {
		const jpCount = hiraganaCount + katakanaCount + cjkCount;
		results.push({
			code: "ja",
			name: "Japanese",
			confidence: Math.min(0.99, (hiraganaCount + katakanaCount) / Math.max(1, totalAlpha) + 0.3),
			charCount: jpCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Hiragana",
			count: hiraganaCount,
			percent: (hiraganaCount / totalAlpha) * 100,
		});
		charBreakdown.push({
			name: "Katakana",
			count: katakanaCount,
			percent: (katakanaCount / totalAlpha) * 100,
		});
		if (cjkCount > 0)
			charBreakdown.push({
				name: "CJK Ideographs",
				count: cjkCount,
				percent: (cjkCount / totalAlpha) * 100,
			});
	}
	// Korean (Hangul)
	else if (hangulCount > 0) {
		results.push({
			code: "ko",
			name: "Korean",
			confidence: Math.min(0.99, hangulCount / totalAlpha + 0.2),
			charCount: hangulCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Hangul",
			count: hangulCount,
			percent: (hangulCount / totalAlpha) * 100,
		});
	}
	// Chinese (CJK without Hiragana/Katakana)
	else if (cjkCount > 0) {
		results.push({
			code: "zh",
			name: "Chinese",
			confidence: Math.min(0.99, cjkCount / totalAlpha + 0.2),
			charCount: cjkCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "CJK Ideographs",
			count: cjkCount,
			percent: (cjkCount / totalAlpha) * 100,
		});
	}

	// Thai
	if (thaiCount > 0) {
		results.push({
			code: "th",
			name: "Thai",
			confidence: Math.min(0.99, thaiCount / totalAlpha + 0.2),
			charCount: thaiCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Thai Script",
			count: thaiCount,
			percent: (thaiCount / totalAlpha) * 100,
		});
	}

	// Arabic
	if (arabicCount > 0) {
		results.push({
			code: "ar",
			name: "Arabic",
			confidence: Math.min(0.99, arabicCount / totalAlpha + 0.2),
			charCount: arabicCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Arabic Script",
			count: arabicCount,
			percent: (arabicCount / totalAlpha) * 100,
		});
	}

	// Cyrillic (Russian)
	if (cyrillicCount > 0) {
		results.push({
			code: "ru",
			name: "Russian",
			confidence: Math.min(0.99, cyrillicCount / totalAlpha + 0.2),
			charCount: cyrillicCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Cyrillic",
			count: cyrillicCount,
			percent: (cyrillicCount / totalAlpha) * 100,
		});
	}

	// Devanagari (Hindi)
	if (devanagariCount > 0) {
		results.push({
			code: "hi",
			name: "Hindi",
			confidence: Math.min(0.99, devanagariCount / totalAlpha + 0.2),
			charCount: devanagariCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Devanagari",
			count: devanagariCount,
			percent: (devanagariCount / totalAlpha) * 100,
		});
	}

	// Vietnamese (Latin + diacritics)
	if (latinCount > 0 && vnResult.count > 2) {
		const vnRatio = vnResult.count / Math.max(1, vnResult.total);
		results.push({
			code: "vi",
			name: "Vietnamese",
			confidence: Math.min(0.99, vnRatio * 5 + 0.3),
			charCount: vnResult.count,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Vietnamese Diacritics",
			count: vnResult.count,
			percent: (vnResult.count / totalAlpha) * 100,
		});
	}
	// Default: English/Latin
	else if (latinCount > 0 && results.length === 0) {
		results.push({
			code: "en",
			name: "English",
			confidence: Math.min(0.95, latinCount / totalAlpha),
			charCount: latinCount,
			totalChars: totalAlpha,
		});
		charBreakdown.push({
			name: "Latin",
			count: latinCount,
			percent: (latinCount / totalAlpha) * 100,
		});
	}

	// Sort by confidence descending
	results.sort((a, b) => b.confidence - a.confidence);

	// If no results, assume English
	if (results.length === 0) {
		results.push({
			code: "en",
			name: "English",
			confidence: 0.5,
			charCount: totalAlpha,
			totalChars: totalAlpha,
		});
		charBreakdown.push({ name: "Latin", count: totalAlpha, percent: 100 });
	}

	return { languages: results, charBreakdown };
}

export default function LanguageDetector() {
	const [input, setInput] = useState("");
	const [result, setResult] = useState<DetectionResult | null>(null);

	const handleDetect = useCallback(() => {
		if (!input.trim()) return;
		const detected = detectLanguages(input);
		setResult(detected);
	}, [input]);

	const handleCopy = useCallback(async () => {
		if (!result) return;
		const text = result.languages
			.map((l) => `${l.name} (${l.code}) - ${(l.confidence * 100).toFixed(1)}% confidence`)
			.join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
	}, [result]);

	return (
		<div>
			{/* Input */}
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
				<textarea
					class="textarea"
					style="min-height: 160px"
					placeholder="Paste text to detect its language... e.g. 'Bonjour, comment allez-vous?' or 'こんにちは世界'"
					value={input}
					onInput={(e) => {
						setInput((e.target as HTMLTextAreaElement).value);
						setResult(null);
					}}
				/>
			</div>

			{/* Action */}
			<div class="mb-4">
				<button class="btn-primary" onClick={handleDetect} disabled={!input.trim()}>
					Detect Language
				</button>
			</div>

			{/* Results */}
			{result && (
				<div>
					{/* Detected languages */}
					<div class="card mb-4">
						<div class="text-caption-uppercase text-muted mb-3">
							Detected Language{result.languages.length > 1 ? "s" : ""}
						</div>
						<div class="space-y-4">
							{result.languages.map((lang) => (
								<div key={lang.code}>
									<div class="flex items-center justify-between mb-1">
										<div class="flex items-center gap-2">
											<span class="text-body-sm font-medium text-on-dark">{lang.name}</span>
											<span class="badge">{lang.code.toUpperCase()}</span>
										</div>
										<span class="text-body-sm text-primary font-mono">
											{(lang.confidence * 100).toFixed(1)}%
										</span>
									</div>
									<div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
										<div
											class="bg-primary h-2 rounded-full transition-all duration-500"
											style={{ width: `${Math.round(lang.confidence * 100)}%` }}
										/>
									</div>
									<div class="text-caption text-muted mt-1">
										{lang.charCount} character{lang.charCount !== 1 ? "s" : ""} detected
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Character breakdown */}
					{result.charBreakdown.length > 0 && (
						<div class="card mb-4">
							<div class="text-caption-uppercase text-muted mb-3">Character Breakdown</div>
							<div class="space-y-2">
								{result.charBreakdown.map((item) => (
									<div key={item.name} class="flex items-center justify-between">
										<span class="text-body-sm text-on-dark">{item.name}</span>
										<div class="flex items-center gap-2">
											<span class="text-caption text-muted">{item.count}</span>
											<span class="text-caption text-primary font-mono">
												{item.percent.toFixed(1)}%
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Actions */}
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary" onClick={handleCopy}>
							Copy Results
						</button>
						<button
							class="btn-secondary"
							onClick={() => {
								setResult(null);
							}}
						>
							Detect Again
						</button>
					</div>
				</div>
			)}

			{/* Info */}
			{!result && (
				<div class="bg-surface-elevated rounded-lg p-4 mt-2">
					<div class="text-caption-uppercase text-muted mb-2">Supported Languages</div>
					<div class="flex flex-wrap gap-2">
						{[
							"English",
							"Vietnamese",
							"Chinese",
							"Japanese",
							"Korean",
							"Thai",
							"Arabic",
							"Russian",
							"Hindi",
						].map((lang) => (
							<span key={lang} class="badge">
								{lang}
							</span>
						))}
					</div>
					<p class="text-caption text-muted mt-2">
						Instant detection using Unicode character analysis — no model download required.
					</p>
				</div>
			)}
		</div>
	);
}
