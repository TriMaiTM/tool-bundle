import { useState, useMemo } from "preact/hooks";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!pattern || !testString) {
      setError(null);
      return [];
    }
    try {
      const regex = new RegExp(pattern, flags);
      const results: { match: string; index: number; groups?: Record<string, string> }[] = [];
      let match: RegExpExecArray | null;

      if (flags.includes("g")) {
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups ? { ...match.groups } : undefined,
          });
          if (match[0].length === 0) regex.lastIndex++;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups ? { ...match.groups } : undefined,
          });
        }
      }
      setError(null);
      return results;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, [pattern, flags, testString]);

  // Highlight matches in text
  const highlightedText = useMemo(() => {
    if (!pattern || !testString || error) return null;
    try {
      const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      return testString.replace(regex, (match) => `<<MARK>>${match}<</MARK>>`);
    } catch {
      return null;
    }
  }, [pattern, flags, testString, error]);

  return (
    <div>
      {/* Pattern input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Regular Expression</label>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" style="font-family: var(--font-mono)">/</span>
            <input
              type="text"
              class="input"
              style="padding-left: 20px; padding-right: 20px; font-family: var(--font-mono)"
              placeholder="Enter regex pattern..."
              value={pattern}
              onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-soft" style="font-family: var(--font-mono)">/</span>
          </div>
          <input
            type="text"
            class="input"
            style="width: 80px; font-family: var(--font-mono); text-align: center"
            placeholder="flags"
            value={flags}
            onInput={(e) => setFlags((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Test string */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Test String</label>
        <textarea
          class="textarea"
          style="min-height: 150px; font-family: var(--font-mono); font-size: 13px"
          placeholder="Enter text to test against..."
          value={testString}
          onInput={(e) => setTestString((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {/* Highlighted result */}
      {highlightedText && (
        <div class="mb-4">
          <label class="text-caption-uppercase text-muted block mb-2">Highlighted Matches</label>
          <div
            class="code-block"
            style="min-height: 60px"
            dangerouslySetInnerHTML={{
              __html: highlightedText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/&lt;&lt;MARK&gt;&gt;/g, '<mark style="background: #faff6930; color: #faff69; border-radius: 2px; padding: 1px 2px">')
                .replace(/&lt;&lt;\/MARK&gt;&gt;/g, "</mark>")
            }}
          />
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">
            Matches ({matches.length})
          </label>
          <div class="space-y-2">
            {matches.map((m, i) => (
              <div class="bg-surface-elevated rounded-lg p-3 flex items-start gap-3">
                <span class="badge-yellow text-caption" style="font-size: 11px">#{i + 1}</span>
                <div class="flex-1 min-w-0">
                  <code class="text-body-sm text-primary break-all" style="font-family: var(--font-mono)">
                    "{m.match}"
                  </code>
                  <div class="text-caption text-muted mt-1">Index: {m.index}</div>
                  {m.groups && (
                    <div class="text-caption text-muted mt-1">
                      Groups: {JSON.stringify(m.groups)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
