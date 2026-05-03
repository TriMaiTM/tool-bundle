import { useState, useMemo, useCallback } from "preact/hooks";

interface StyleDef {
  name: string;
  description: string;
  convert: (text: string) => string;
}

// --- Character mapping tables ---

// Mathematical Double-Struck
const doubleStruckMap: Record<string, string> = {
  a: "𝕒", b: "𝕓", c: "𝕔", d: "𝕕", e: "𝕖", f: "𝕗", g: "𝕘", h: "𝕙", i: "𝕚", j: "𝕛",
  k: "𝕜", l: "𝕝", m: "𝕞", n: "𝕟", o: "𝕠", p: "𝕡", q: "𝕢", r: "𝕣", s: "𝕤", t: "𝕥",
  u: "𝕦", v: "𝕧", w: "𝕨", x: "𝕩", y: "𝕪", z: "𝕫",
  A: "𝔸", B: "𝔹", C: "ℂ", D: "𝔻", E: "𝔼", F: "𝔽", G: "𝔾", H: "ℍ", I: "𝕀", J: "𝕁",
  K: "𝕂", L: "𝕃", M: "𝕄", N: "ℕ", O: "𝕆", P: "ℙ", Q: "ℚ", R: "ℝ", S: "𝕊", T: "𝕋",
  U: "𝕌", V: "𝕍", W: "𝕎", X: "𝕏", Y: "𝕐", Z: "ℤ",
  "0": "𝟘", "1": "𝟙", "2": "𝟚", "3": "𝟛", "4": "𝟜", "5": "𝟝", "6": "𝟞", "7": "𝟟", "8": "𝟠", "9": "𝟡",
};

// Mathematical Script Bold
const scriptBoldMap: Record<string, string> = {
  a: "𝓪", b: "𝓫", c: "𝓬", d: "𝓭", e: "𝓮", f: "𝓯", g: "𝓰", h: "𝓱", i: "𝓲", j: "𝓳",
  k: "𝓴", l: "𝓵", m: "𝓶", n: "𝓷", o: "𝓸", p: "𝓹", q: "𝓺", r: "𝓻", s: "𝓼", t: "𝓽",
  u: "𝓾", v: "𝓿", w: "𝔀", x: "𝔁", y: "𝔂", z: "𝔃",
  A: "𝓐", B: "𝓑", C: "𝓒", D: "𝓓", E: "𝓔", F: "𝓕", G: "𝓖", H: "𝓗", I: "𝓘", J: "𝓙",
  K: "𝓚", L: "𝓛", M: "𝓜", N: "𝓝", O: "𝓞", P: "𝓟", Q: "𝓠", R: "𝓡", S: "𝓢", T: "𝓣",
  U: "𝓤", V: "𝓥", W: "𝓦", X: "𝓧", Y: "𝓨", Z: "𝓩",
};

// Mathematical Monospace
const monospaceMap: Record<string, string> = {
  a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓",
  k: "𝚔", l: "𝚕", m: "𝚖", n: "𝚗", o: "𝚘", p: "𝚙", q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝",
  u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢", z: "𝚣",
  A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸", J: "𝙹",
  K: "𝙺", L: "𝙻", M: "𝙼", N: "𝙽", O: "𝙾", P: "𝙿", Q: "𝚀", R: "𝚁", S: "𝚂", T: "𝚃",
  U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈", Z: "𝚉",
  "0": "𝟶", "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺", "5": "𝟻", "6": "𝟼", "7": "𝟽", "8": "𝟾", "9": "𝟿",
};

// Small Caps
const smallCapsMap: Record<string, string> = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
  k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "ꜱ", t: "ᴛ",
  u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
};

// Combining Overline (adds U+0305 after each character)
function combiningOverline(text: string): string {
  return text
    .split("")
    .map((ch) => (ch.trim() ? ch + "\u0305" : ch))
    .join("");
}

// Circled
const circledMap: Record<string, string> = {
  a: "ⓐ", b: "ⓑ", c: "ⓒ", d: "ⓓ", e: "ⓔ", f: "ⓕ", g: "ⓖ", h: "ⓗ", i: "ⓘ", j: "ⓙ",
  k: "ⓚ", l: "ⓛ", m: "ⓜ", n: "ⓝ", o: "ⓞ", p: "ⓟ", q: "ⓠ", r: "ⓡ", s: "ⓢ", t: "ⓣ",
  u: "ⓤ", v: "ⓥ", w: "ⓦ", x: "ⓧ", y: "ⓨ", z: "ⓩ",
  A: "Ⓐ", B: "Ⓑ", C: "Ⓒ", D: "Ⓓ", E: "Ⓔ", F: "Ⓕ", G: "Ⓖ", H: "Ⓗ", I: "Ⓘ", J: "Ⓙ",
  K: "Ⓚ", L: "Ⓛ", M: "Ⓜ", N: "Ⓝ", O: "Ⓞ", P: "Ⓟ", Q: "Ⓠ", R: "Ⓡ", S: "Ⓢ", T: "Ⓣ",
  U: "Ⓤ", V: "Ⓥ", W: "Ⓦ", X: "Ⓧ", Y: "Ⓨ", Z: "Ⓩ",
  "0": "⓪", "1": "①", "2": "②", "3": "③", "4": "④", "5": "⑤", "6": "⑥", "7": "⑦", "8": "⑧", "9": "⑨",
};

// Superscript
const superscriptMap: Record<string, string> = {
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ",
  k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", q: "q", r: "ʳ", s: "ˢ", t: "ᵗ",
  u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  A: "ᴬ", B: "ᴮ", C: "ᶜ", D: "ᴰ", E: "ᴱ", F: "ᶠ", G: "ᴳ", H: "ᴴ", I: "ᴵ", J: "ᴶ",
  K: "ᴷ", L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ", P: "ᴾ", Q: "Q", R: "ᴿ", S: "ˢ", T: "ᵀ",
  U: "ᵁ", V: "ⱽ", W: "ᵂ", X: "ˣ", Y: "ʸ", Z: "ᶻ",
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

// Greek-style substitution
const greekMap: Record<string, string> = {
  a: "Λ", b: "B", c: "ᄃ", d: "D", e: "Ξ", f: "F", g: "G", h: "Ή", i: "I", j: "J",
  k: "K", l: "ᄂ", m: "M", n: "П", o: "Ө", p: "P", q: "Q", r: "Я", s: "Ƨ", t: "Ƭ",
  u: "Ц", v: "V", w: "Щ", x: "X", y: "Y", z: "Z",
  A: "Λ", B: "B", C: "ᄃ", D: "D", E: "Ξ", F: "F", G: "G", H: "Ή", I: "I", J: "J",
  K: "K", L: "ᄂ", M: "M", N: "П", O: "Ө", P: "P", Q: "Q", R: "Я", S: "Ƨ", T: "Ƭ",
  U: "Ц", V: "V", W: "Щ", X: "X", Y: "Y", Z: "Z",
};

// Cherokee / random Unicode substitution
const cherokeeMap: Record<string, string> = {
  a: "ꭺ", b: "ꮃ", c: "ꮕ", d: "ꭰ", e: "ꭼ", f: "ꮁ", g: "ꭶ", h: "ꮒ", i: "ꭵ", j: "ꭻ",
  k: "ꮶ", l: "ꮮ", m: "ꮇ", n: "ꮑ", o: "ꭴ", p: "ꮖ", q: "ꮣ", r: "ꭱ", s: "ꌦ", t: "꓄",
  u: "ꭹ", v: "ꭴ", w: "ꮁ", x: "ꉼ", y: "ꭸ", z: "ꭿ",
  A: "꓄", B: "ꁝ", C: "꒐", D: "ꭰ", E: "ꍟ", F: "ꄞ", G: "ꍌ", H: "ꀍ", I: "ꀤ", J: "ꀭ",
  K: "ꀗ", L: "꒒", M: "ꂵ", N: "ꈤ", O: "ꄲ", P: "ꉣ", Q: "ꆰ", R: "ꋪ", S: "ꌗ", T: "꓄",
  U: "ꀎ", V: "ꏝ", W: "ꅐ", X: "ꉧ", Y: "ꌦ", Z: "ꁴ",
};

// Currency symbols substitution
const currencyMap: Record<string, string> = {
  a: "₳", b: "฿", c: "₵", d: "₫", e: "€", f: "ƒ", g: "₲", h: "Ⱨ", i: "ł", j: "J",
  k: "₭", l: "Ⱡ", m: "₥", n: "₦", o: "Ø", p: "₱", q: "Q", r: "Ɽ", s: "₴", t: "₮",
  u: "Ʉ", v: "V", w: "₩", x: "✕", y: "¥", z: "Ⱬ",
  A: "₳", B: "฿", C: "₵", D: "₫", E: "€", F: "ƒ", G: "₲", H: "Ⱨ", I: "ł", J: "J",
  K: "₭", L: "Ⱡ", M: "₥", N: "₦", O: "Ø", P: "₱", Q: "Q", R: "Ɽ", S: "₴", T: "₮",
  U: "Ʉ", V: "V", W: "₩", X: "✕", Y: "¥", Z: "Ⱬ",
};

function applyMap(map: Record<string, string>): (text: string) => string {
  return (text: string) =>
    text
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("");
}

const STYLES: StyleDef[] = [
  { name: "Double-Struck", description: "𝕋𝕙𝕚𝕤 · Mathematical Double-Struck", convert: applyMap(doubleStruckMap) },
  { name: "Script Bold", description: "𝓣𝓱𝓲𝓼 · Mathematical Script Bold", convert: applyMap(scriptBoldMap) },
  { name: "Monospace", description: "𝙏𝙝𝙞𝙨 · Mathematical Monospace", convert: applyMap(monospaceMap) },
  { name: "Small Caps", description: "ᴛʜɪꜱ · Small Capitals", convert: applyMap(smallCapsMap) },
  { name: "Combining Overline", description: "T⃗h⃗i⃗s⃗ · Combining Overline", convert: combiningOverline },
  { name: "Circled", description: "Ⓣⓗⓘⓢ · Circled Letters", convert: applyMap(circledMap) },
  { name: "Superscript", description: "ᵀʰⁱˢ · Superscript", convert: applyMap(superscriptMap) },
  { name: "Greek-Style", description: "ƬΉIƧ · Greek-Style Substitution", convert: applyMap(greekMap) },
  { name: "Cherokee-Style", description: "꓄ꁝ꒐ꌦ · Cherokee / Unicode Substitution", convert: applyMap(cherokeeMap) },
  { name: "Currency-Style", description: "₮Ⱨł₴ · Currency Symbol Substitution", convert: applyMap(currencyMap) },
];

export default function FancyTextGenerator() {
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const converted = useMemo(
    () => STYLES.map((s) => s.convert(input)),
    [input]
  );

  const handleCopy = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (!input.trim()) return;
    const lines = STYLES.map((s, i) => `${s.name}: ${converted[i]}`).join("\n\n");
    await navigator.clipboard.writeText(lines);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }, [input, converted]);

  return (
    <div>
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Enter your text</label>
        <textarea
          class="textarea"
          style="min-height: 100px"
          placeholder="Type or paste your text here..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {input.trim() && (
        <div class="flex items-center justify-between mb-4">
          <span class="text-caption-uppercase text-muted">
            {STYLES.length} styles available
          </span>
          <button
            class={copiedAll ? "btn-secondary" : "btn-primary"}
            onClick={handleCopyAll}
          >
            {copiedAll ? "✓ Copied All!" : "Copy All Styles"}
          </button>
        </div>
      )}

      <div class="flex flex-col gap-3">
        {STYLES.map((style, i) => {
          const result = converted[i];
          if (!input.trim()) {
            return (
              <div key={i} class="bg-surface-elevated rounded-lg p-3">
                <div class="text-caption-uppercase text-muted mb-1">{style.name}</div>
                <div class="text-primary" style="font-size: 1.25rem; opacity: 0.3">
                  {style.description}
                </div>
              </div>
            );
          }
          return (
            <div key={i} class="bg-surface-elevated rounded-lg p-3">
              <div class="flex items-center justify-between mb-1">
                <div class="text-caption-uppercase text-muted">{style.name}</div>
                <button
                  class={copiedIndex === i ? "btn-secondary" : "btn-primary"}
                  style="padding: 4px 12px; font-size: 13px"
                  onClick={() => handleCopy(result, i)}
                >
                  {copiedIndex === i ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div
                class="text-primary"
                style="font-size: 1.25rem; word-break: break-all; line-height: 1.6"
              >
                {result}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
