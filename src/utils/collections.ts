/**
 * Tool Collections management via localStorage
 */

const COLLECTIONS_KEY = "toolbundle_collections";

const DEFAULT_COLORS = [
	"#3b82f6", // blue
	"#22c55e", // green
	"#a855f7", // purple
	"#f59e0b", // amber
	"#ef4444", // red
	"#ec4899", // pink
	"#14b8a6", // teal
	"#f97316", // orange
];

export interface ToolCollection {
	id: string;
	name: string;
	description: string;
	toolIds: string[];
	createdAt: number;
	updatedAt: number;
	color: string;
}

function generateId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

function getNextColor(): string {
	try {
		const collections: ToolCollection[] = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || "[]");
		const index = collections.length % DEFAULT_COLORS.length;
		return DEFAULT_COLORS[index];
	} catch {
		return DEFAULT_COLORS[0];
	}
}

// ============================================
// Collections CRUD
// ============================================

export function getCollections(): ToolCollection[] {
	try {
		return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || "[]");
	} catch {
		return [];
	}
}

export function getCollectionById(id: string): ToolCollection | undefined {
	return getCollections().find((c) => c.id === id);
}

export function createCollection(
	name: string,
	description?: string,
	color?: string,
): ToolCollection {
	const now = Date.now();
	const collection: ToolCollection = {
		id: generateId(),
		name,
		description: description || "",
		toolIds: [],
		createdAt: now,
		updatedAt: now,
		color: color || getNextColor(),
	};

	try {
		const collections = getCollections();
		collections.push(collection);
		localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
	} catch {}

	return collection;
}

export function updateCollection(id: string, updates: Partial<ToolCollection>): void {
	try {
		const collections = getCollections();
		const index = collections.findIndex((c) => c.id === id);
		if (index >= 0) {
			collections[index] = {
				...collections[index],
				...updates,
				id: collections[index].id,
				createdAt: collections[index].createdAt,
				updatedAt: Date.now(),
			};
			localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
		}
	} catch {}
}

export function deleteCollection(id: string): void {
	try {
		const collections = getCollections().filter((c) => c.id !== id);
		localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
	} catch {}
}

// ============================================
// Tool-Collection membership
// ============================================

export function addToolToCollection(collectionId: string, toolId: string): void {
	try {
		const collections = getCollections();
		const index = collections.findIndex((c) => c.id === collectionId);
		if (index >= 0 && !collections[index].toolIds.includes(toolId)) {
			collections[index].toolIds.push(toolId);
			collections[index].updatedAt = Date.now();
			localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
		}
	} catch {}
}

export function removeToolFromCollection(collectionId: string, toolId: string): void {
	try {
		const collections = getCollections();
		const index = collections.findIndex((c) => c.id === collectionId);
		if (index >= 0) {
			collections[index].toolIds = collections[index].toolIds.filter((id) => id !== toolId);
			collections[index].updatedAt = Date.now();
			localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
		}
	} catch {}
}

export function isToolInCollection(collectionId: string, toolId: string): boolean {
	const collection = getCollectionById(collectionId);
	return collection ? collection.toolIds.includes(toolId) : false;
}

export function getCollectionsForTool(toolId: string): ToolCollection[] {
	return getCollections().filter((c) => c.toolIds.includes(toolId));
}

// ============================================
// Import / Export
// ============================================

export function exportCollections(): string {
	return JSON.stringify(getCollections(), null, 2);
}

export function importCollections(json: string): boolean {
	try {
		const data = JSON.parse(json);
		if (!Array.isArray(data)) return false;

		const valid = data.filter(
			(item) =>
				item &&
				typeof item.id === "string" &&
				typeof item.name === "string" &&
				Array.isArray(item.toolIds),
		);

		if (valid.length === 0) return false;

		const existing = getCollections();
		const mergedIds = new Set(existing.map((c) => c.id));
		const merged = [...existing];

		for (const col of valid) {
			if (!mergedIds.has(col.id)) {
				merged.push({
					id: col.id,
					name: col.name,
					description: col.description || "",
					toolIds: col.toolIds,
					createdAt: col.createdAt || Date.now(),
					updatedAt: col.updatedAt || Date.now(),
					color: col.color || getNextColor(),
				});
			}
		}

		localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(merged));
		return true;
	} catch {
		return false;
	}
}

export { DEFAULT_COLORS };
