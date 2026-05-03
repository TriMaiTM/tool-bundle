import { useState, useMemo } from "preact/hooks";

interface ReadabilityResult {
  name: string;
  value: number;
  label: string;
  description: string;
  difficulty: "easy" | "moderate" | "difficult";
}

// Count syllables in a word by counting vowel groups
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  // Remove trailing silent 'e'
  let cleaned = w.replace(/e$/, "");

  // Count vowel groups (a, e, i, o, u, y)
  const groups = cleaned.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 0;

  // Ensure at least 1 syllable
  return Math.max(1, count);
}

interface TextStats {
  words: number;
  sentences: number;
  syllables: number;
  characters: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  complexWords: number; // words with 3+ syllables
  letters: number; // only a-z characters
}

function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      words: 0, sentences: 0, syllables: 0, characters: 0,
      avgWordsPerSentence: 0, avgSyllablesPerWord: 0, complexWords: 0, letters: 0,
    };
  }

  const wordList = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const words = wordList.length;
  const sentences = Math.max(1, trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length);
  const characters = trimmed.length;
  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;

  let totalSyllables = 0;
  let complexWords = 0;

  for (const word of wordList) {
    const sy = countSyllables(word);
    totalSyllables += sy;
    if (sy >= 3) complexWords++;
  }

  return {
    words,
    sentences,
    syllables: totalSyllables,
    characters,
    avgWordsPerSentence: words / sentences,
    avgSyllablesPerWord: words > 0 ? totalSyllables / words : 0,
    complexWords,
    letters,
  };
}

function getDifficulty(score: number, thresholds: [number, number]): "easy" | "moderate" | "difficult" {
  if (score <= thresholds[0]) return "easy";
  if (score <= thresholds[1]) return "moderate";
  return "difficult";
}

function getBadgeClass(difficulty: "easy" | "moderate" | "difficult"): string {
  if (difficulty === "easy") return "badge";
  if (difficulty === "moderate") return "badge badge-yellow";
  return "badge"; // red would need custom, use badge base for difficult too
}

function getDifficultyColor(difficulty: "easy" | "moderate" | "difficult"): string {
  if (difficulty === "easy") return "var(--color-success, #22c55e)";
  if (difficulty === "moderate") return "var(--color-warning, #eab308)";
  return "var(--color-error, #ef4444)";
}

function getGradeDescription(score: number): string {
  if (score <= 1) return "Kindergarten level";
  if (score <= 3) return `Grade ${Math.round(score)} level - early elementary`;
  if (score <= 5) return `Grade ${Math.round(score)} level - elementary school`;
  if (score <= 8) return `Grade ${Math.round(score)} level - middle school`;
  if (score <= 10) return `Grade ${Math.round(score)} level - high school`;
  if (score <= 12) return `Grade ${Math.round(score)} level - high school senior`;
  if (score <= 14) return `Grade ${Math.round(score)} level - college`;
  if (score <= 16) return `Grade ${Math.round(score)} level - college graduate`;
  return `Grade ${Math.round(score)} level - postgraduate`;
}

function getFleschDescription(score: number): string {
  if (score >= 90) return "Very easy - 5th grade";
  if (score >= 80) return "Easy - 6th grade";
  if (score >= 70) return "Fairly easy - 7th grade";
  if (score >= 60) return "Standard - 8th-9th grade";
  if (score >= 50) return "Fairly difficult - 10th-12th grade";
  if (score >= 30) return "Difficult - college level";
  return "Very confusing - college graduate level";
}

function getAgeRange(grade: number): string {
  const age = Math.round(grade) + 5;
  return `${age}-${age + 2} year olds`;
}

function calculateScores(stats: TextStats): ReadabilityResult[] {
  const { words, sentences, syllables, complexWords, letters } = stats;
  if (words === 0) return [];

  const ASL = stats.avgWordsPerSentence; // average sentence length
  const ASW = stats.avgSyllablesPerWord; // average syllables per word

  // Flesch Reading Ease
  const fre = 206.835 - 1.015 * ASL - 84.6 * ASW;
  // Flesch-Kincaid Grade Level
  const fkg = 0.39 * ASL + 11.8 * ASW - 15.59;
  // Gunning Fog Index
  const gfi = 0.4 * (ASL + 100 * (complexWords / words));
  // Coleman-Liau Index
  const L = (letters / words) * 100; // average letters per 100 words
  const S = (sentences / words) * 100; // average sentences per 100 words
  const cli = 0.0588 * L - 0.296 * S - 15.8;
  // SMOG Index
  const smog = 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
  // Automated Readability Index
  const ari = 4.71 * (letters / words) + 0.5 * (words / sentences) - 21.43;
  // Dale-Chall (approximate - uses complex word ratio as proxy)
  const dcDifficultRatio = complexWords / words;
  const dcRaw = 0.1579 * (dcDifficultRatio * 100) + 0.0496 * ASL;
  const dcScore = dcDifficultRatio > 0.05 ? dcRaw + 3.6365 : dcRaw;

  return [
    {
      name: "Flesch Reading Ease",
      value: Math.max(0, Math.min(100, Math.round(fre * 10) / 10)),
      label: `${Math.round(fre)}/100`,
      description: getFleschDescription(fre),
      difficulty: getDifficulty(fre, [50, 30]), // reversed: higher = easier
    },
    {
      name: "Flesch-Kincaid Grade",
      value: Math.max(0, Math.round(fkg * 10) / 10),
      label: `Grade ${Math.round(fkg * 10) / 10}`,
      description: `${getGradeDescription(fkg)} - easily understood by ${getAgeRange(fkg)}`,
      difficulty: getDifficulty(fkg, [8, 12]),
    },
    {
      name: "Gunning Fog Index",
      value: Math.max(0, Math.round(gfi * 10) / 10),
      label: `${Math.round(gfi * 10) / 10} years`,
      description: `Requires ${Math.round(gfi)} years of education to understand`,
      difficulty: getDifficulty(gfi, [8, 12]),
    },
    {
      name: "Coleman-Liau Index",
      value: Math.max(0, Math.round(cli * 10) / 10),
      label: `Grade ${Math.round(cli * 10) / 10}`,
      description: getGradeDescription(cli),
      difficulty: getDifficulty(cli, [8, 12]),
    },
    {
      name: "SMOG Index",
      value: Math.max(0, Math.round(smog * 10) / 10),
      label: `${Math.round(smog * 10) / 10} years`,
      description: `Requires ${Math.round(smog)} years of education`,
      difficulty: getDifficulty(smog, [8, 12]),
    },
    {
      name: "Automated Readability Index",
      value: Math.max(0, Math.round(ari * 10) / 10),
      label: `Grade ${Math.round(ari * 10) / 10}`,
      description: getGradeDescription(ari),
      difficulty: getDifficulty(ari, [8, 12]),
    },
    {
      name: "Dale-Chall Score",
      value: Math.max(0, Math.round(dcScore * 10) / 10),
      label: `${Math.round(dcScore * 10) / 10}`,
      description: dcScore <= 4.9
        ? "Easily understood by 4th grade students"
        : dcScore <= 5.9
          ? "Easily understood by 5th-6th grade students"
          : dcScore <= 6.9
            ? "Understood by 7th-8th grade students"
            : "Understood by college-level students",
      difficulty: getDifficulty(dcScore, [4.9, 5.9]),
    },
  ];
}

export default function ReadabilityScore() {
  const [text, setText] = useState("");

  const stats = useMemo(() => analyzeText(text), [text]);
  const scores = useMemo(() => calculateScores(stats), [stats]);

  const statItems = [
    { label: "Words", value: stats.words },
    { label: "Sentences", value: stats.sentences },
    { label: "Syllables", value: stats.syllables },
    { label: "Characters", value: stats.characters },
    { label: "Avg Words/Sent", value: stats.avgWordsPerSentence.toFixed(1) },
    { label: "Avg Syl/Word", value: stats.avgSyllablesPerWord.toFixed(2) },
  ];

  return (
    <div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {statItems.map((item) => (
          <div key={item.label} class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{item.value}</div>
            <div class="text-caption-uppercase text-muted mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
        <textarea
          class="textarea"
          style="min-height: 200px"
          placeholder="Paste or type your text here to analyze readability..."
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {text.trim() && scores.length > 0 && (
        <div class="flex flex-col gap-3">
          <div class="text-caption-uppercase text-muted mb-1">Readability Scores</div>
          {scores.map((score) => (
            <div key={score.name} class="bg-surface-elevated rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-primary" style="font-weight: 600">{score.name}</span>
                <span
                  class={getBadgeClass(score.difficulty)}
                  style={`background-color: ${getDifficultyColor(score.difficulty)}; color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 13px`}
                >
                  {score.label}
                </span>
              </div>
              <div class="text-primary" style="font-size: 2rem; font-weight: 700; line-height: 1.2">
                {score.value}
              </div>
              <div class="text-caption-uppercase text-muted mt-1" style="font-size: 13px">
                {score.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {!text.trim() && (
        <div class="bg-surface-elevated rounded-lg p-3 text-center" style="padding: 2rem">
          <div class="text-caption-uppercase text-muted">
            Enter some text above to see readability scores
          </div>
        </div>
      )}
    </div>
  );
}
