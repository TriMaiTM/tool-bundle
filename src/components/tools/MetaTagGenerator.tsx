import { useState, useCallback, useMemo } from "preact/hooks";

const LOCALES = [
  "en_US", "en_GB", "vi_VN", "ja_JP", "ko_KR", "zh_CN", "zh_TW",
  "fr_FR", "de_DE", "es_ES", "pt_BR", "it_IT", "ru_RU", "ar_SA",
  "th_TH", "hi_IN", "tr_TR", "pl_PL", "nl_NL", "sv_SE",
];

const OG_TYPES = ["website", "article", "product"];

interface MetaState {
  title: string;
  description: string;
  keywords: string;
  author: string;
  ogImage: string;
  siteUrl: string;
  twitterHandle: string;
  ogType: string;
  locale: string;
}

const initial: MetaState = {
  title: "",
  description: "",
  keywords: "",
  author: "",
  ogImage: "",
  siteUrl: "",
  twitterHandle: "",
  ogType: "website",
  locale: "en_US",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function MetaTagGenerator() {
  const [state, setState] = useState<MetaState>(initial);
  const [copied, setCopied] = useState<string | null>(null);

  const update = useCallback(
    (field: keyof MetaState) => (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      setState((s) => ({ ...s, [field]: target.value }));
    },
    []
  );

  const titleLen = state.title.length;
  const descLen = state.description.length;
  const titleWarning = titleLen > 60;
  const titleOk = titleLen >= 50 && titleLen <= 60;
  const descWarning = descLen > 160;
  const descOk = descLen >= 150 && descLen <= 160;

  const standardTags = useMemo(() => {
    const lines: string[] = [];
    if (state.title) lines.push(`<title>${escapeHtml(state.title)}</title>`);
    if (state.description) lines.push(`<meta name="description" content="${escapeHtml(state.description)}" />`);
    if (state.keywords) lines.push(`<meta name="keywords" content="${escapeHtml(state.keywords)}" />`);
    if (state.author) lines.push(`<meta name="author" content="${escapeHtml(state.author)}" />`);
    if (state.siteUrl) lines.push(`<link rel="canonical" href="${escapeHtml(state.siteUrl)}" />`);
    return lines.join("\n");
  }, [state]);

  const ogTags = useMemo(() => {
    const lines: string[] = [];
    if (state.title) lines.push(`<meta property="og:title" content="${escapeHtml(state.title)}" />`);
    if (state.description) lines.push(`<meta property="og:description" content="${escapeHtml(state.description)}" />`);
    if (state.ogImage) lines.push(`<meta property="og:image" content="${escapeHtml(state.ogImage)}" />`);
    if (state.siteUrl) lines.push(`<meta property="og:url" content="${escapeHtml(state.siteUrl)}" />`);
    lines.push(`<meta property="og:type" content="${escapeHtml(state.ogType)}" />`);
    lines.push(`<meta property="og:locale" content="${escapeHtml(state.locale)}" />`);
    return lines.join("\n");
  }, [state]);

  const twitterTags = useMemo(() => {
    const lines: string[] = [];
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
    if (state.title) lines.push(`<meta name="twitter:title" content="${escapeHtml(state.title)}" />`);
    if (state.description) lines.push(`<meta name="twitter:description" content="${escapeHtml(state.description)}" />`);
    if (state.ogImage) lines.push(`<meta name="twitter:image" content="${escapeHtml(state.ogImage)}" />`);
    if (state.twitterHandle) lines.push(`<meta name="twitter:site" content="${escapeHtml(state.twitterHandle)}" />`);
    return lines.join("\n");
  }, [state]);

  const allTags = useMemo(
    () => [standardTags, ogTags, twitterTags].filter(Boolean).join("\n"),
    [standardTags, ogTags, twitterTags]
  );

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    },
    []
  );

  const handleLoadSample = useCallback(() => {
    setState({
      title: "Best Developer Tools - Free Online Utilities | ToolBundle",
      description:
        "Free online developer tools including JSON formatter, Base64 encoder, CSV converter, and more. No signup required, privacy-first.",
      keywords: "developer tools, online tools, JSON formatter, Base64, CSV converter",
      author: "ToolBundle",
      ogImage: "https://toolbundle.dev/og-image.png",
      siteUrl: "https://toolbundle.dev",
      twitterHandle: "@toolbundle",
      ogType: "website",
      locale: "en_US",
    });
  }, []);

  return (
    <div>
      {/* Inputs */}
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <span class="badge badge-yellow">SEO</span>
        </div>
        <button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleLoadSample}>
          Load Sample
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Page Title</label>
            <span
              class={`text-caption ${titleWarning ? "text-accent-rose" : titleOk ? "text-accent-emerald" : "text-muted"}`}
            >
              {titleLen}/60
            </span>
          </div>
          <input
            class="input"
            type="text"
            placeholder="My Awesome Page"
            value={state.title}
            onInput={update("title")}
          />
          {titleWarning && (
            <p class="text-caption text-accent-rose mt-1">Title is too long. Recommended: 50-60 characters.</p>
          )}
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Description</label>
            <span
              class={`text-caption ${descWarning ? "text-accent-rose" : descOk ? "text-accent-emerald" : "text-muted"}`}
            >
              {descLen}/160
            </span>
          </div>
          <textarea
            class="textarea"
            style="min-height: 80px"
            placeholder="A brief description of your page..."
            value={state.description}
            onInput={update("description")}
            maxLength={300}
          />
          {descWarning && (
            <p class="text-caption text-accent-rose mt-1">Description is too long. Recommended: 150-160 characters.</p>
          )}
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Keywords (comma-separated)</label>
          <input
            class="input"
            type="text"
            placeholder="tools, developer, web"
            value={state.keywords}
            onInput={update("keywords")}
          />
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Author</label>
          <input
            class="input"
            type="text"
            placeholder="Your Name"
            value={state.author}
            onInput={update("author")}
          />
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">OG Image URL</label>
          <input
            class="input"
            type="text"
            placeholder="https://example.com/image.png"
            value={state.ogImage}
            onInput={update("ogImage")}
          />
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Site URL</label>
          <input
            class="input"
            type="text"
            placeholder="https://example.com"
            value={state.siteUrl}
            onInput={update("siteUrl")}
          />
        </div>

        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Twitter Handle</label>
          <input
            class="input"
            type="text"
            placeholder="@username"
            value={state.twitterHandle}
            onInput={update("twitterHandle")}
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">OG Type</label>
            <select class="input" value={state.ogType} onChange={update("ogType")}>
              {OG_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Locale</label>
            <select class="input" value={state.locale} onChange={update("locale")}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SERP Preview */}
      <div class="bg-surface-elevated rounded-lg p-3 mb-6">
        <label class="text-caption-uppercase text-muted block mb-3">SERP Preview</label>
        <div class="rounded-lg p-4" style="background: #202124; border: 1px solid #3c4043">
          {state.siteUrl && (
            <div class="flex items-center gap-2 mb-1">
              <div
                class="rounded-full"
                style="width: 26px; height: 26px; background: #3c4043; display: flex; align-items: center; justify-content: center"
              >
                <span style="font-size: 12px; color: #9aa0a6">
                  {state.siteUrl ? state.siteUrl.replace(/^https?:\/\//, "").charAt(0).toUpperCase() : "?"}
                </span>
              </div>
              <div>
                <div class="text-body-sm" style="color: #bdc1c6">
                  {state.siteUrl ? state.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "example.com"}
                </div>
              </div>
            </div>
          )}
          <a
            href="#"
            class="block mb-1"
            style="font-size: 20px; color: #8ab4f8; text-decoration: none; line-height: 1.3"
            onClick={(e) => e.preventDefault()}
          >
            {state.title || "Page Title - Your Site Name"}
          </a>
          <p class="text-body-sm" style="color: #bdc1c6; line-height: 1.5">
            {state.description
              ? state.description.length > 160
                ? state.description.slice(0, 160) + "..."
                : state.description
              : "A description of your page will appear here. This is what users will see in search engine results..."}
          </p>
        </div>
      </div>

      {/* Generated Tags */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">HTML Meta Tags</label>
            {standardTags && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={() => handleCopy(standardTags, "meta")}
              >
                {copied === "meta" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre class="code-block" style="min-height: 120px; white-space: pre-wrap; font-size: 12px">
            {standardTags || "<!-- Fill in the fields above -->"}
          </pre>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Open Graph Tags</label>
            {ogTags && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={() => handleCopy(ogTags, "og")}
              >
                {copied === "og" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre class="code-block" style="min-height: 120px; white-space: pre-wrap; font-size: 12px">
            {ogTags || "<!-- Fill in the fields above -->"}
          </pre>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Twitter Card Tags</label>
            {twitterTags && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={() => handleCopy(twitterTags, "twitter")}
              >
                {copied === "twitter" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre class="code-block" style="min-height: 120px; white-space: pre-wrap; font-size: 12px">
            {twitterTags || "<!-- Fill in the fields above -->"}
          </pre>
        </div>
      </div>

      {allTags && (
        <button class="btn-primary" onClick={() => handleCopy(allTags, "all")}>
          {copied === "all" ? "Copied All!" : "Copy All Tags"}
        </button>
      )}
    </div>
  );
}
