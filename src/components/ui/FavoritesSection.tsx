import { useCallback, useEffect, useState } from "preact/hooks";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Props {
  tools: Tool[];
  categories: Category[];
}

export default function FavoritesSection({ tools, categories }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">(
    "favorites",
  );

  const loadData = useCallback(() => {
    try {
      setFavoriteIds(
        JSON.parse(localStorage.getItem("toolbundle_favorites") || "[]"),
      );
      const history = JSON.parse(
        localStorage.getItem("toolbundle_history") || "[]",
      );
      setRecentIds(history.map((h: { toolId: string }) => h.toolId));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    // Listen for storage changes from other components
    const handler = () => loadData();
    window.addEventListener("storage", handler);
    // Also poll for same-tab changes
    const interval = setInterval(loadData, 1000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [loadData]);

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  const favoriteTools = favoriteIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  const recentTools = recentIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 12) as Tool[];

  const removeFavorite = useCallback((toolId: string) => {
    try {
      const favorites: string[] = JSON.parse(
        localStorage.getItem("toolbundle_favorites") || "[]",
      );
      const updated = favorites.filter((id) => id !== toolId);
      localStorage.setItem("toolbundle_favorites", JSON.stringify(updated));
      setFavoriteIds(updated);
    } catch {}
  }, []);

  const displayTools = activeTab === "favorites" ? favoriteTools : recentTools;
  const isEmpty = displayTools.length === 0;

  return (
    <section style="max-width: 80rem; margin: 0 auto; padding: 48px 16px 0;">
      {/* Tabs */}
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <h2
          style="font-size: 24px; font-weight: 600; color: var(--color-ink); margin: 0;"
          id="favorites-heading"
        >
          {activeTab === "favorites" ? "Your Favorites" : "Recently Used"}
        </h2>
        <div
          style="display: flex; gap: 4px; margin-left: auto;"
          role="tablist"
          aria-label="Favorites and recent tools"
        >
          <button
            onClick={() => setActiveTab("favorites")}
            style={`padding: 6px 14px; border-radius: 16px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; background: ${activeTab === "favorites" ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${activeTab === "favorites" ? "var(--color-on-primary)" : "var(--color-mute)"};`}
            role="tab"
            aria-selected={activeTab === "favorites"}
            aria-controls="favorites-panel"
          >
            Favorites {favoriteIds.length > 0 && `(${favoriteIds.length})`}
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            style={`padding: 6px 14px; border-radius: 16px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; background: ${activeTab === "recent" ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${activeTab === "recent" ? "var(--color-on-primary)" : "var(--color-mute)"};`}
            role="tab"
            aria-selected={activeTab === "recent"}
            aria-controls="recent-panel"
          >
            Recent {recentIds.length > 0 && `(${recentIds.length})`}
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div style="text-align: center; padding: 48px 0;" role="status">
          <p style="font-size: 14px; color: var(--color-mute);">
            {activeTab === "favorites"
              ? "No favorites yet. Click the heart icon on any tool to save it here."
              : "No recently visited tools yet. Start using tools to see your history."}
          </p>
        </div>
      ) : (
        <div
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;"
          id="favorites-panel"
          role="tabpanel"
          aria-labelledby="favorites-heading"
        >
          {displayTools.map((tool) => {
            const cat = getCategory(tool.category);
            return (
              <a
                href={`/${tool.category}/${tool.slug}`}
                style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-surface-card); border: 1px solid var(--color-hairline); border-radius: 16px; text-decoration: none; transition: all 0.15s ease;"
              >
                <span
                  style={`width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: ${cat?.color || "var(--color-ash)"};`}
                />
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 14px; font-weight: 500; color: var(--color-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {tool.name}
                  </div>
                  <div style="font-size: 12px; color: var(--color-mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {cat?.name?.replace(" Tools", "")}
                  </div>
                </div>
                {activeTab === "favorites" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(tool.id);
                    }}
                    style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--color-primary); cursor: pointer; flex-shrink: 0;"
                    aria-label={`Remove ${tool.name} from favorites`}
                  >
                    <svg
                      width="14"
                      height="14"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
