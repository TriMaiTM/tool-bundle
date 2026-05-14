import { useCallback, useEffect, useState } from "preact/hooks";
import {
	type ToolCollection,
	getCollections,
	createCollection,
	addToolToCollection,
	deleteCollection,
} from "../../utils/collections";
import CollectionManager from "./CollectionManager";

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

const SUGGESTED_COLLECTIONS = [
	{
		name: "Developer Essentials",
		description: "Must-have tools for software development",
		color: "#a855f7",
		toolIds: [
			"json-formatter",
			"base64-encoder",
			"hash-generator",
			"regex-tester",
			"uuid-generator",
		],
	},
	{
		name: "Content Creator",
		description: "Tools for writers, bloggers, and social media managers",
		color: "#ec4899",
		toolIds: [
			"word-counter",
			"case-converter",
			"image-compressor",
			"text-to-speech",
			"qr-code-generator",
		],
	},
	{
		name: "Student Toolkit",
		description: "Study smarter with these essential student tools",
		color: "#6366f1",
		toolIds: [
			"flashcard-maker",
			"grade-calculator",
			"citation-generator",
			"word-counter",
			"text-to-speech",
		],
	},
];

export default function CollectionsSection({ tools, categories }: Props) {
	const [collections, setCollections] = useState<ToolCollection[]>([]);
	const [showManager, setShowManager] = useState(false);

	const loadCollections = useCallback(() => {
		try {
			setCollections(getCollections());
		} catch {}
	}, []);

	useEffect(() => {
		loadCollections();
		const handler = () => loadCollections();
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
	}, [loadCollections]);

	const getCategory = (catId: string) => categories.find((c) => c.id === catId);

	const getTool = (toolId: string) => tools.find((t) => t.id === toolId);

	const handleAddSuggested = useCallback(
		(suggested: (typeof SUGGESTED_COLLECTIONS)[0]) => {
			const col = createCollection(suggested.name, suggested.description, suggested.color);
			for (const toolId of suggested.toolIds) {
				if (tools.find((t) => t.id === toolId)) {
					addToolToCollection(col.id, toolId);
				}
			}
			loadCollections();
		},
		[tools, loadCollections],
	);

	// If user has collections, show the full manager
	if (showManager || collections.length > 0) {
		return (
			<div>
				<CollectionManager tools={tools} categories={categories} />
			</div>
		);
	}

	// Empty state: show suggested collections
	return (
		<section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-heading-xl" id="collections-heading">
						Your Collections
					</h2>
					<p class="text-body-sm text-muted mt-1">
						Organize tools into custom groups for quick access
					</p>
				</div>
			</div>

			<style>{`
						.collection-card {
							position: relative;
							background: var(--color-surface-card);
							border: 1px solid var(--color-hairline);
							border-radius: 16px;
							overflow: hidden;
							transition: all 0.2s ease;
						}
						.collection-card::before {
							content: "";
							position: absolute; top: 0; left: 0; right: 0;
							height: 6px;
							background: var(--card-accent);
						}
						.collection-card:hover {
							transform: translateY(-3px);
							box-shadow: 0 8px 25px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
							border-color: var(--color-hairline-strong, var(--color-ash));
						}
						.collection-icon {
							width: 40px; height: 40px; border-radius: 10px;
							display: flex; align-items: center; justify-content: center;
							flex-shrink: 0;
						}
						.collection-badge {
							display: inline-flex; align-items: center; gap: 4px;
							padding: 3px 10px; border-radius: 9999px;
							font-size: 11px; font-weight: 600;
						}
					`}</style>

			<div class="text-center py-8 mb-8">
				<div class="w-16 h-16 rounded-full bg-surface-card border border-hairline flex items-center justify-center mx-auto mb-4">
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-muted"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
					</svg>
				</div>
				<p class="text-body-sm text-muted mb-2">No collections yet</p>
				<p class="text-caption text-muted mb-6">
					Create your first collection to organize your favorite tools, or start with a suggestion
					below.
				</p>
				<button class="btn-primary mb-2" onClick={() => setShowManager(true)}>
					Create Custom Collection
				</button>
			</div>

			{/* Suggested Collections */}
			<div>
				<h3 class="text-title-sm mb-4">Suggested Collections</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{SUGGESTED_COLLECTIONS.map((suggested) => {
						const collTools = suggested.toolIds.map((id) => getTool(id)).filter(Boolean) as Tool[];
						const previewTools = collTools.slice(0, 5);

						return (
							<div
								key={suggested.name}
								class="collection-card"
								style={`--card-accent: linear-gradient(135deg, ${suggested.color}, ${suggested.color}cc);`}
							>
								<div class="p-5">
									<div class="flex items-center gap-3 mb-3">
										<div
											class="collection-icon"
											style={`background: ${suggested.color}15; color: ${suggested.color};`}
										>
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
											</svg>
										</div>
										<div class="flex-1 min-w-0">
											<h4 class="text-body-sm-strong truncate">{suggested.name}</h4>
											<p class="text-caption text-muted mt-0.5">{suggested.description}</p>
										</div>
										<div
											class="collection-badge"
											style={`background: ${suggested.color}12; color: ${suggested.color};`}
										>
											{collTools.length}
										</div>
									</div>

									{/* Tool preview grid */}
									{previewTools.length > 0 && (
										<div class="flex gap-2 mt-3">
											{previewTools.map((tool) => {
												const cat = getCategory(tool.category);
												return (
													<div
														key={tool.id}
														style={`width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background-color: ${cat?.color || "#91918c"}15; color: ${cat?.color || "#91918c"}; font-size: 10px; font-weight: 600;`}
														title={tool.name}
													>
														{tool.name.charAt(0)}
													</div>
												);
											})}
										</div>
									)}

									<button
										class="btn-secondary w-full mt-4"
										style="padding: 6px 12px; font-size: 13px;"
										onClick={() => handleAddSuggested(suggested)}
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											style="display: inline-block; vertical-align: -2px; margin-right: 4px;"
										>
											<line x1="12" y1="5" x2="12" y2="19" />
											<line x1="5" y1="12" x2="19" y2="12" />
										</svg>
										Add to My Collections
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
