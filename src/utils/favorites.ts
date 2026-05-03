/**
 * Favorites and History management via localStorage
 */

const FAVORITES_KEY = "toolbundle_favorites";
const HISTORY_KEY = "toolbundle_history";
const MAX_HISTORY = 30;

export interface FavoriteEntry {
  toolId: string;
  addedAt: number;
}

export interface HistoryEntry {
  toolId: string;
  visitedAt: number;
  path: string;
}

// ============================================
// Favorites
// ============================================

export function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId);
}

export function toggleFavorite(toolId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(toolId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(toolId);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return index < 0; // returns true if now favorited
}

export function addFavorite(toolId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(toolId)) {
    favorites.push(toolId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(toolId: string): void {
  const favorites = getFavorites().filter((id) => id !== toolId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function exportFavorites(): string {
  return JSON.stringify(getFavorites(), null, 2);
}

export function importFavorites(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return false;
    const valid = data.filter((item) => typeof item === "string");
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}

// ============================================
// History
// ============================================

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToHistory(toolId: string, path: string): void {
  const history = getHistory().filter((entry) => entry.toolId !== toolId);
  history.unshift({ toolId, visitedAt: Date.now(), path });
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY))
  );
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getRecentToolIds(): string[] {
  return getHistory().map((entry) => entry.toolId);
}
