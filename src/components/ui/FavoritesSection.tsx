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
	const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");

	const loadData = useCallback(() => {
		try {
			const favRaw = localStorage.getItem("toolbundle_favorites");
			if (favRaw) setFavoriteIds(JSON.parse(favRaw));
		} catch {}
		try {
			const histRaw = localStorage.getItem("toolbundle_history");
			if (histRaw) {
				const history = JSON.parse(histRaw);
				if (Array.isArray(history)) {
					setRecentIds(history.map((h: any) => h.toolId).filter(Boolean));
				}
			}
		} catch {}
	}, []);

	useEffect(() => {
		loadData();
		const handler = () => loadData();
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
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
			const favorites: string[] = JSON.parse(localStorage.getItem("toolbundle_favorites") || "[]");
			const updated = favorites.filter((id) => id !== toolId);
			localStorage.setItem("toolbundle_favorites", JSON.stringify(updated));
			setFavoriteIds(updated);
		} catch {}
	}, []);

	const displayTools = activeTab === "favorites" ? favoriteTools : recentTools;
	const isEmpty = displayTools.length === 0;

	return (
		<section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
			{/* Tabs */}
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-heading-xl" id="favorites-heading">
					{activeTab === "favorites" ? "Your Favorites" : "Recently Used"}
				</h2>
				<div class="flex gap-2" role="tablist" aria-label="Favorites and recent tools">
					<button
						class={activeTab === "favorites" ? "btn-primary" : "btn-secondary"}
						style="padding: 6px 14px; font-size: 13px;"
						onClick={() => setActiveTab("favorites")}
						role="tab"
						aria-selected={activeTab === "favorites"}
					>
						Favorites {favoriteIds.length > 0 && `(${favoriteIds.length})`}
					</button>
					<button
						class={activeTab === "recent" ? "btn-primary" : "btn-secondary"}
						style="padding: 6px 14px; font-size: 13px;"
						onClick={() => setActiveTab("recent")}
						role="tab"
						aria-selected={activeTab === "recent"}
					>
						Recent {recentIds.length > 0 && `(${recentIds.length})`}
					</button>
				</div>
			</div>

			{isEmpty ? (
				<div class="text-center py-12" role="status">
					<p class="text-body-sm text-muted">
						{activeTab === "favorites"
							? "No favorites yet. Click the heart icon on any tool to save it here."
							: "No recently visited tools yet. Start using tools to see your history."}
					</p>
				</div>
			) : (
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
					id="favorites-panel"
					role="tabpanel"
				>
					{displayTools.map((tool) => {
						const cat = getCategory(tool.category);
						return (
							<a
								href={`/${tool.category}/${tool.slug}`}
								class="flex items-center gap-3 px-4 py-3 bg-surface-card border border-hairline rounded-lg transition-all duration-200 hover:border-hairline-strong no-underline"
							>
								<span
									class="w-2 h-2 rounded-full shrink-0"
									style={`background-color: ${cat?.color || "#91918c"};`}
								/>
								<div class="flex-1 min-w-0">
									<div class="text-body-sm-strong truncate">{tool.name}</div>
									<div class="text-caption text-muted truncate">
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
										class="p-1 text-muted hover:text-primary transition-colors"
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
