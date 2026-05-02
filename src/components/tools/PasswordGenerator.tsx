import { useState, useCallback, useMemo, useEffect } from "preact/hooks";

type CharacterSets = {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [charSets, setCharSets] = useState<CharacterSets>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const similarChars = useMemo(() => "0O1lI", []);
  const ambiguousChars = useMemo(() => "{}[]()/\\'\"`~,;:.<>", []);

  const charPool = useMemo(() => {
    let chars = "";
    if (charSets.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (charSets.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (charSets.numbers) chars += "0123456789";
    if (charSets.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (excludeSimilar) {
      chars = chars.split("").filter(c => !similarChars.includes(c)).join("");
    }
    if (excludeAmbiguous) {
      chars = chars.split("").filter(c => !ambiguousChars.includes(c)).join("");
    }

    return chars;
  }, [charSets, excludeSimilar, excludeAmbiguous, similarChars, ambiguousChars]);

  const generatePassword = useCallback(() => {
    if (charPool.length === 0) return "";

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    let password = "";
    for (let i = 0; i < length; i++) {
      password += charPool[array[i] % charPool.length];
    }
    return password;
  }, [length, charPool]);

  const generatePasswords = useCallback(() => {
    const newPasswords: string[] = [];
    for (let i = 0; i < count; i++) {
      newPasswords.push(generatePassword());
    }
    setPasswords(newPasswords);
  }, [count, generatePassword]);

  const handleCopy = useCallback(async (password: string, index: number) => {
    await navigator.clipboard.writeText(password);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (passwords.length > 0) {
      await navigator.clipboard.writeText(passwords.join("\n"));
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  }, [passwords]);

  const getStrength = useCallback((password: string) => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 25, label: "Weak", color: "text-accent-rose" };
    if (score <= 4) return { level: 50, label: "Medium", color: "text-yellow-500" };
    if (score <= 6) return { level: 75, label: "Strong", color: "text-accent-emerald" };
    return { level: 100, label: "Very Strong", color: "text-primary" };
  }, []);

  useEffect(() => {
    generatePasswords();
  }, [generatePasswords]);

  return (
    <div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Password Length: {length}</label>
          <input
            type="range"
            min="8"
            max="128"
            value={length}
            onInput={(e) => setLength(parseInt((e.target as HTMLInputElement).value))}
            class="w-full"
          />
          <div class="flex justify-between text-body-sm text-muted-soft mt-1">
            <span>8</span>
            <span>128</span>
          </div>
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Number of Passwords: {count}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={count}
            onInput={(e) => setCount(parseInt((e.target as HTMLInputElement).value))}
            class="w-full"
          />
          <div class="flex justify-between text-body-sm text-muted-soft mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <label class="text-caption-uppercase text-muted block mb-3">Character Sets</label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["uppercase", "lowercase", "numbers", "symbols"] as const).map((set) => (
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                checked={charSets[set]}
                onChange={(e) => setCharSets({ ...charSets, [set]: (e.target as HTMLInputElement).checked })}
                class="rounded border-hairline"
              />
              <span class="text-body-sm text-body capitalize">{set}</span>
            </label>
          ))}
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={excludeSimilar}
            onChange={(e) => setExcludeSimilar((e.target as HTMLInputElement).checked)}
            class="rounded border-hairline"
          />
          <span class="text-body-sm text-body">Exclude similar characters (0/O, 1/l/I)</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(e) => setExcludeAmbiguous((e.target as HTMLInputElement).checked)}
            class="rounded border-hairline"
          />
          <span class="text-body-sm text-body">Exclude ambiguous characters ({`{ } [ ] ( ) / \\ ' " `} etc.)</span>
        </label>
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-caption-uppercase text-muted">Generated Passwords</label>
          <div class="flex gap-2">
            <button
              class="btn-secondary text-body-sm"
              onClick={generatePasswords}
            >
              Regenerate
            </button>
            {passwords.length > 1 && (
              <button
                class="btn-secondary text-body-sm"
                onClick={handleCopyAll}
              >
                {copiedIndex === -1 ? "Copied!" : "Copy All"}
              </button>
            )}
          </div>
        </div>
        <div class="space-y-2">
          {passwords.map((password, index) => {
            const strength = getStrength(password);
            return (
              <div class="bg-surface-elevated rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class={`badge ${strength.color}`}>{strength.label}</span>
                    <span class="text-body-sm text-muted-soft">{password.length} chars</span>
                  </div>
                  <button
                    class="text-body-sm text-primary hover:text-primary-active transition-colors"
                    onClick={() => handleCopy(password, index)}
                  >
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code class="text-body-sm text-body-strong break-all block" style="font-family: var(--font-mono)">
                  {password}
                </code>
                <div class="mt-2 h-1 bg-hairline rounded-full overflow-hidden">
                  <div
                    class={`h-full ${strength.level === 25 ? "bg-accent-rose" : strength.level === 50 ? "bg-yellow-500" : strength.level === 75 ? "bg-accent-emerald" : "bg-primary"}`}
                    style={{ width: `${strength.level}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {charPool.length === 0 && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mt-6 text-body-sm text-accent-rose">
          Please select at least one character set.
        </div>
      )}
    </div>
  );
}
