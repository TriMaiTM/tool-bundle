import { useCallback, useEffect, useState } from "preact/hooks";
import {
	type ToolCollection,
	getCollections,
	createCollection,
	addToolToCollection,
} from "../../utils/collections";
import CollectionManager from "./CollectionManager";
import { translations } from "../../utils/translations";

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

export default function CollectionsSection({ tools, categories }: Props) {
	const [collections, setCollections] = useState<ToolCollection[]>([]);
	const [showManager, setShowManager] = useState(false);
	const [lang, setLang] = useState<"en" | "vi">("en");

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

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const t = translations[lang];

	const suggestedCollections = [
		{
			name: lang === "vi" ? "Lập trình Cơ bản" : "Developer Essentials",
			description:
				lang === "vi"
					? "Các công cụ cần thiết cho phát triển phần mềm"
					: "Must-have tools for software development",
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
			name: lang === "vi" ? "Sáng tạo Nội dung" : "Content Creator",
			description:
				lang === "vi"
					? "Công cụ cho người viết lách, blogger và quản lý mạng xã hội"
					: "Tools for writers, bloggers, and social media managers",
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
			name: lang === "vi" ? "Học tập & Nghiên cứu" : "Student Toolkit",
			description:
				lang === "vi"
					? "Học tập thông minh hơn với các công cụ học tập thiết yếu này"
					: "Study smarter with these essential student tools",
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

	const getCategory = (catId: string) => categories.find((c) => c.id === catId);

	const getTool = (toolId: string) => tools.find((t) => t.id === toolId);

	const handleAddSuggested = useCallback(
		(suggested: (typeof suggestedCollections)[0]) => {
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
					<h2 class="text-heading-xl font-bold" id="collections-heading">
						{t["coll.your_collections"]}
					</h2>
					<p class="text-body-sm text-muted mt-1">{t["coll.desc"]}</p>
				</div>
			</div>

			<style>{`
				.collection-card-wrapper {
					position: relative;
					z-index: 10;
					margin-right: 8px;
					margin-bottom: 12px;
					transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
				}
				.collection-card-wrapper::before,
				.collection-card-wrapper::after {
					content: "";
					position: absolute;
					inset: 0;
					border: 1px solid var(--color-hairline);
					border-radius: var(--radius-md);
					transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
				}
				/* Middle Card Layer */
				.collection-card-wrapper::before {
					z-index: -1;
					background: var(--color-surface-card);
					transform: translate(4px, 6px);
				}
				/* Deepest Card Layer */
				.collection-card-wrapper::after {
					z-index: -2;
					background: var(--color-surface-soft);
					transform: translate(8px, 12px);
				}

				/* Main Top Card */
				.collection-card {
					position: relative;
					z-index: 1;
					background: var(--color-canvas);
					border: 1px solid var(--color-hairline);
					border-radius: var(--radius-md);
					overflow: hidden;
					transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
				}

				/* Hover Dynamics */
				.collection-card-wrapper:hover .collection-card {
					transform: translateY(-4px) translateX(-2px);
					border-color: var(--card-color-solid);
					box-shadow: 
						0 12px 24px -10px var(--card-color-glow),
						0 4px 12px -5px rgba(0, 0, 0, 0.05);
				}
				.collection-card-wrapper:hover::before {
					transform: translate(6px, 10px);
					border-color: var(--color-hairline-soft);
				}
				.collection-card-wrapper:hover::after {
					transform: translate(12px, 18px);
					border-color: var(--color-hairline-soft);
				}

				.collection-icon {
					width: 40px;
					height: 40px;
					border-radius: 10px;
					display: flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;
					transition: transform 0.2s ease;
				}
				.collection-card-wrapper:hover .collection-icon {
					transform: scale(1.08);
				}
				.collection-badge {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					padding: 3px 10px;
					border-radius: 9999px;
					font-size: 11px;
					font-weight: 600;
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
				<p class="text-body-sm text-muted mb-2 font-bold">{t["coll.no_collections"]}</p>
				<p class="text-caption text-muted mb-6">{t["coll.no_collections_desc"]}</p>
				<button class="btn-primary mb-2" onClick={() => setShowManager(true)}>
					{t["coll.create_custom"]}
				</button>
			</div>

			{/* Suggested Collections */}
			<div>
				<h3 class="text-body-sm-strong mb-6">{t["coll.suggested"]}</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
					{suggestedCollections.map((suggested) => {
						const collTools = suggested.toolIds.map((id) => getTool(id)).filter(Boolean) as Tool[];
						const previewTools = collTools.slice(0, 5);

						return (
							<div
								key={suggested.name}
								class="collection-card-wrapper"
								style={`--card-color-solid: ${suggested.color}; --card-color-glow: ${suggested.color}35;`}
							>
								<div class="collection-card">
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
											<div class="flex gap-2 mt-4">
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
											class="btn-secondary w-full mt-5"
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
											{t["coll.add_to_my"]}
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
