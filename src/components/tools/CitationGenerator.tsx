import { useState, useCallback, useMemo } from "preact/hooks";

type SourceType = "book" | "journal" | "website" | "newspaper" | "magazine";

interface CitationInput {
  sourceType: SourceType;
  authorLast: string;
  authorFirst: string;
  title: string;
  publisher: string;
  year: string;
  volume: string;
  issue: string;
  pages: string;
  url: string;
  doi: string;
  accessDate: string;
}

interface CitationEntry {
  id: string;
  input: CitationInput;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const EMPTY_INPUT: CitationInput = {
  sourceType: "book",
  authorLast: "",
  authorFirst: "",
  title: "",
  publisher: "",
  year: "",
  volume: "",
  issue: "",
  pages: "",
  url: "",
  doi: "",
  accessDate: "",
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  book: "Book",
  journal: "Journal Article",
  website: "Website",
  newspaper: "Newspaper",
  magazine: "Magazine",
};

function formatAuthorInitials(first: string): string {
  return first
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(n => n[0].toUpperCase() + ".")
    .join(" ");
}

function formatAuthorLastFirst(last: string, first: string): string {
  const initials = formatAuthorInitials(first);
  return `${last}, ${initials}`;
}

function generateApa(input: CitationInput): string {
  const author = formatAuthorLastFirst(input.authorLast, input.authorFirst);
  const year = input.year || "n.d.";
  const title = input.title || "Untitled";
  const publisher = input.publisher || "";

  switch (input.sourceType) {
    case "book":
      return `${author} (${year}). *${title}*. ${publisher}.`;
    case "journal": {
      const vol = input.volume ? `, *${input.volume}*` : "";
      const iss = input.issue ? `(${input.issue})` : "";
      const pp = input.pages ? `, ${input.pages}` : "";
      const doi = input.doi ? ` https://doi.org/${input.doi}` : "";
      return `${author} (${year}). ${title}. *${publisher}*${vol}${iss}${pp}.${doi}`;
    }
    case "website": {
      const access = input.accessDate ? ` Retrieved ${input.accessDate}, from ` : " ";
      const url = input.url || "";
      return `${author} (${year}). *${title}*.${access}${url}`;
    }
    case "newspaper":
    case "magazine": {
      const pp = input.pages ? `, ${input.pages}` : "";
      return `${author} (${year}). ${title}. *${publisher}*${pp}.`;
    }
    default:
      return `${author} (${year}). *${title}*. ${publisher}.`;
  }
}

function generateMla(input: CitationInput): string {
  const author = formatAuthorLastFirst(input.authorLast, input.authorFirst);
  const title = input.title || "Untitled";
  const publisher = input.publisher || "";
  const year = input.year || "";

  switch (input.sourceType) {
    case "book":
      return `${author} *${title}*. ${publisher}, ${year}.`;
    case "journal": {
      const vol = input.volume ? ` vol. ${input.volume},` : "";
      const iss = input.issue ? ` no. ${input.issue},` : "";
      const pp = input.pages ? ` pp. ${input.pages}.` : "";
      const doi = input.doi ? ` doi:${input.doi}.` : "";
      return `${author} "${title}." *${publisher}*${vol}${iss} ${year},${pp}${doi}`;
    }
    case "website": {
      const access = input.accessDate ? ` Accessed ${input.accessDate}.` : "";
      const url = input.url ? ` ${input.url}.` : "";
      return `${author} "${title}." *${publisher}*, ${year}.${url}${access}`;
    }
    case "newspaper":
    case "magazine": {
      const pp = input.pages ? ` pp. ${input.pages}.` : "";
      return `${author} "${title}." *${publisher}*, ${year}.${pp}`;
    }
    default:
      return `${author} *${title}*. ${publisher}, ${year}.`;
  }
}

function generateChicago(input: CitationInput): string {
  const author = formatAuthorLastFirst(input.authorLast, input.authorFirst);
  const title = input.title || "Untitled";
  const publisher = input.publisher || "";
  const year = input.year || "";

  switch (input.sourceType) {
    case "book":
      return `${author} *${title}*. ${publisher}, ${year}.`;
    case "journal": {
      const vol = input.volume ? ` ${input.volume}` : "";
      const iss = input.issue ? `, no. ${input.issue}` : "";
      const pp = input.pages ? `: ${input.pages}` : "";
      return `${author} "${title}." *${publisher}*${vol}${iss} (${year})${pp}.`;
    }
    case "website": {
      const access = input.accessDate ? ` Accessed ${input.accessDate}.` : "";
      const url = input.url ? ` ${input.url}.` : "";
      return `${author} "${title}." ${publisher}, ${year}.${url}${access}`;
    }
    case "newspaper":
    case "magazine": {
      const pp = input.pages ? ` ${input.pages}.` : "";
      return `${author} "${title}." *${publisher}*, ${year}.${pp}`;
    }
    default:
      return `${author} *${title}*. ${publisher}, ${year}.`;
  }
}

function stripMarkdown(s: string): string {
  return s.replace(/\*/g, "").replace(/"/g, '"').replace(/"/g, '"');
}

export default function CitationGenerator() {
  const [input, setInput] = useState<CitationInput>({ ...EMPTY_INPUT });
  const [bibliography, setBibliography] = useState<CitationEntry[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const updateField = useCallback((field: keyof CitationInput, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  }, []);

  const apa = useMemo(() => generateApa(input), [input]);
  const mla = useMemo(() => generateMla(input), [input]);
  const chicago = useMemo(() => generateChicago(input), [input]);

  const addToBibliography = useCallback(() => {
    if (!input.title.trim() || !input.authorLast.trim()) return;
    if (editId) {
      setBibliography(prev =>
        prev.map(e => (e.id === editId ? { ...e, input: { ...input } } : e))
      );
      setEditId(null);
    } else {
      setBibliography(prev => [...prev, { id: generateId(), input: { ...input } }]);
    }
    setInput({ ...EMPTY_INPUT });
  }, [input, editId]);

  const removeFromBibliography = useCallback((id: string) => {
    setBibliography(prev => prev.filter(e => e.id !== id));
  }, []);

  const editBibEntry = useCallback((entry: CitationEntry) => {
    setInput({ ...entry.input });
    setEditId(entry.id);
  }, []);

  const sortedBibliography = useMemo(() => {
    return [...bibliography].sort((a, b) => {
      const nameA = a.input.authorLast.toLowerCase();
      const nameB = b.input.authorLast.toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      const titleA = a.input.title.toLowerCase();
      const titleB = b.input.title.toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }, [bibliography]);

  const exportBibliography = useCallback((format: "apa" | "mla" | "chicago") => {
    const generator = format === "apa" ? generateApa : format === "mla" ? generateMla : generateChicago;
    const text = sortedBibliography.map(e => stripMarkdown(generator(e.input))).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibliography-${format}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedBibliography]);

  const copyToClipboard = useCallback(async (text: string, format: string) => {
    await navigator.clipboard.writeText(stripMarkdown(text));
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1500);
  }, []);

  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div class="space-y-6">
      {/* Source Type */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">Source Information</h3>
        <div class="mb-4">
          <label class="text-caption-uppercase text-muted block mb-2">Source Type</label>
          <select
            class="input w-full"
            value={input.sourceType}
            onChange={(e) => updateField("sourceType", (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Author Last Name</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Smith"
              value={input.authorLast}
              onInput={(e) => updateField("authorLast", (e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Author First Name</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. John"
              value={input.authorFirst}
              onInput={(e) => updateField("authorFirst", (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="sm:col-span-2">
            <label class="text-caption-uppercase text-muted block mb-2">Title</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Introduction to Psychology"
              value={input.title}
              onInput={(e) => updateField("title", (e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              {input.sourceType === "journal" ? "Journal Name" : "Publisher"}
            </label>
            <input
              type="text"
              class="input w-full"
              placeholder={input.sourceType === "journal" ? "e.g. Journal of Psychology" : "e.g. Oxford University Press"}
              value={input.publisher}
              onInput={(e) => updateField("publisher", (e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Year</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. 2023"
              value={input.year}
              onInput={(e) => updateField("year", (e.target as HTMLInputElement).value)}
            />
          </div>

          {(input.sourceType === "journal") && (
            <>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Volume</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="e.g. 42"
                  value={input.volume}
                  onInput={(e) => updateField("volume", (e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Issue</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="e.g. 3"
                  value={input.issue}
                  onInput={(e) => updateField("issue", (e.target as HTMLInputElement).value)}
                />
              </div>
            </>
          )}

          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Pages</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. 1-15 or 45-67"
              value={input.pages}
              onInput={(e) => updateField("pages", (e.target as HTMLInputElement).value)}
            />
          </div>

          {(input.sourceType === "journal") && (
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">DOI</label>
              <input
                type="text"
                class="input w-full"
                placeholder="e.g. 10.1000/xyz123"
                value={input.doi}
                onInput={(e) => updateField("doi", (e.target as HTMLInputElement).value)}
              />
            </div>
          )}

          {input.sourceType === "website" && (
            <>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">URL</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="https://example.com"
                  value={input.url}
                  onInput={(e) => updateField("url", (e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Access Date</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="e.g. January 15, 2024"
                  value={input.accessDate}
                  onInput={(e) => updateField("accessDate", (e.target as HTMLInputElement).value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Generated Citations */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">Generated Citations</h3>
        <div class="space-y-4">
          {[
            { label: "APA 7th Edition", text: apa, key: "apa" },
            { label: "MLA 9th Edition", text: mla, key: "mla" },
            { label: "Chicago 17th Edition", text: chicago, key: "chicago" },
          ].map(({ label, text, key }) => (
            <div key={key} class="p-3 border border-hairline rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-caption-uppercase text-muted">{label}</span>
                <button
                  class="btn-secondary text-body-sm"
                  onClick={() => copyToClipboard(text, key)}
                >
                  {copiedFormat === key ? "Copied!" : "Copy"}
                </button>
              </div>
              <div class="text-body-sm">{renderMarkdown(text)}</div>
            </div>
          ))}
        </div>
        <button class="btn-primary mt-4" onClick={addToBibliography}>
          {editId ? "Update in Bibliography" : "Add to Bibliography"}
        </button>
      </div>

      {/* Bibliography */}
      {sortedBibliography.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-title-lg text-primary">Bibliography ({sortedBibliography.length})</h3>
            <div class="flex gap-2">
              <button class="btn-secondary text-body-sm" onClick={() => exportBibliography("apa")}>
                Export APA
              </button>
              <button class="btn-secondary text-body-sm" onClick={() => exportBibliography("mla")}>
                Export MLA
              </button>
              <button class="btn-secondary text-body-sm" onClick={() => exportBibliography("chicago")}>
                Export Chicago
              </button>
            </div>
          </div>
          <div class="space-y-3">
            {sortedBibliography.map((entry) => (
              <div key={entry.id} class="p-3 border border-hairline rounded-lg">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="text-body-sm mb-1">
                      <span class="badge badge-yellow mr-2">{SOURCE_TYPE_LABELS[entry.input.sourceType]}</span>
                    </div>
                    <div class="text-body-sm">{renderMarkdown(generateApa(entry.input))}</div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button class="btn-secondary text-body-sm" onClick={() => editBibEntry(entry)}>
                      Edit
                    </button>
                    <button class="btn-secondary text-body-sm" onClick={() => removeFromBibliography(entry.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
