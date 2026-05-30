import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
	type ToolCollection,
	getCollections,
	createCollection,
	updateCollection,
	deleteCollection,
	removeToolFromCollection,
	DEFAULT_COLORS,
} from "../../utils/collections";
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

export default function CollectionManager({ tools, categories }: Props) {
	const [collections, setCollections] = useState<ToolCollection[]>([]);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [formName, setFormName] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formColor, setFormColor] = useState(DEFAULT_COLORS[0]);
	const [lang, setLang] = useState<"en" | "vi">("en");
	const nameInputRef = useRef<HTMLInputElement>(null);

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

	useEffect(() => {
		if (showCreateForm && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [showCreateForm]);

	const getCategory = (catId: string) => categories.find((c) => c.id === catId);

	const getTool = (toolId: string) => tools.find((t) => t.id === toolId);

	const handleCreate = useCallback(() => {
		if (!formName.trim()) return;
		if (editId) {
			updateCollection(editId, {
				name: formName.trim(),
				description: formDescription.trim(),
				color: formColor,
			});
			setEditId(null);
		} else {
			createCollection(formName.trim(), formDescription.trim(), formColor);
		}
		setFormName("");
		setFormDescription("");
		setFormColor(DEFAULT_COLORS[0]);
		setShowCreateForm(false);
		loadCollections();
	}, [formName, formDescription, formColor, editId, loadCollections]);

	const handleEdit = useCallback((collection: ToolCollection) => {
		setFormName(collection.name);
		setFormDescription(collection.description);
		setFormColor(collection.color);
		setEditId(collection.id);
		setShowCreateForm(true);
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			deleteCollection(id);
			if (expandedId === id) setExpandedId(null);
			setDeleteConfirmId(null);
			loadCollections();
		},
		[expandedId, loadCollections],
	);

	const handleRemoveTool = useCallback(
		(collectionId: string, toolId: string) => {
			removeToolFromCollection(collectionId, toolId);
			loadCollections();
		},
		[loadCollections],
	);

	const handleCancel = useCallback(() => {
		setShowCreateForm(false);
		setEditId(null);
		setFormName("");
		setFormDescription("");
		setFormColor(DEFAULT_COLORS[0]);
	}, []);

	return (
		<section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-heading-xl font-bold" id="collections-heading">
						{t["coll.your_collections"]}
					</h2>
					<p class="text-body-sm text-muted mt-1">{t["coll.desc"]}</p>
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
				{!showCreateForm && (
					<button class="btn-primary" onClick={() => setShowCreateForm(true)}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="display: inline-block; vertical-align: -2px; margin-right: 6px;"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						{t["coll.new_collection"]}
					</button>
				)}
			</div>

			{/* Create / Edit Form */}
			{showCreateForm && (
				<div class="bg-surface-card border border-hairline rounded-lg p-6 mb-6">
					<h3 class="text-title-sm mb-4 font-bold">
						{editId ? t["coll.edit"] : t["coll.create_new"]}
					</h3>
					<div class="flex flex-col gap-4">
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								{t["coll.name_label"]}
							</label>
							<input
								ref={nameInputRef}
								type="text"
								class="input"
								value={formName}
								onInput={(e: Event) => setFormName((e.target as HTMLInputElement).value)}
								placeholder={t["coll.name_placeholder"]}
								maxLength={50}
							/>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								{t["coll.desc_label"]}
							</label>
							<textarea
								class="textarea"
								value={formDescription}
								onInput={(e: Event) => setFormDescription((e.target as HTMLTextAreaElement).value)}
								placeholder={t["coll.desc_placeholder"]}
								rows={2}
								maxLength={200}
							/>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">
								{t["coll.color_label"]}
							</label>
							<div class="flex gap-2 flex-wrap">
								{DEFAULT_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										onClick={() => setFormColor(color)}
										style={`width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${formColor === color ? "var(--color-on-dark)" : "transparent"}; background-color: ${color}; cursor: pointer; transition: all 0.15s ease; outline: ${formColor === color ? `2px solid ${color}` : "none"}; outline-offset: 2px;`}
										aria-label={`Select color ${color}`}
									/>
								))}
							</div>
						</div>
						<div class="flex gap-2 justify-end">
							<button class="btn-secondary" onClick={handleCancel}>
								{t["coll.cancel"]}
							</button>
							<button class="btn-primary" onClick={handleCreate} disabled={!formName.trim()}>
								{editId ? t["coll.save"] : t["coll.create"]}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Collections Grid */}
			{collections.length === 0 && !showCreateForm ? (
				<div class="text-center py-12" role="status">
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
					<p class="text-caption text-muted mb-4">{t["coll.no_collections_desc"]}</p>
					<button class="btn-primary" onClick={() => setShowCreateForm(true)}>
						{t["coll.create_first"]}
					</button>
				</div>
			) : (
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
					{collections.map((collection) => {
						const isExpanded = expandedId === collection.id;
						const collTools = collection.toolIds.map((id) => getTool(id)).filter(Boolean) as Tool[];
						const previewTools = collTools.slice(0, 5);

						return (
							<div
								key={collection.id}
								class="collection-card-wrapper"
								style={`--card-color-solid: ${collection.color}; --card-color-glow: ${collection.color}35;`}
							>
								<div class="collection-card">
									{/* Card header */}
									<div
										class="p-5 cursor-pointer select-none"
										onClick={() => setExpandedId(isExpanded ? null : collection.id)}
									>
										<div class="flex items-center gap-3 mb-3">
											<div
												class="collection-icon"
												style={`background: ${collection.color}15; color: ${collection.color};`}
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
												<h3 class="text-body-sm-strong truncate">{collection.name}</h3>
												{collection.description && (
													<p class="text-caption text-muted mt-0.5 line-clamp-1">
														{collection.description}
													</p>
												)}
											</div>
											<div
												class="collection-badge"
												style={`background: ${collection.color}12; color: ${collection.color};`}
											>
												{collTools.length}
											</div>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												class="text-muted transition-transform duration-200 shrink-0"
												style={`transform: rotate(${isExpanded ? "180" : "0"}deg);`}
											>
												<polyline points="6 9 12 15 18 9" />
											</svg>
										</div>

										{/* Tool preview grid */}
										{previewTools.length > 0 && (
											<div class="flex gap-2 mt-4">
												{previewTools.map((tool) => {
													const cat = getCategory(tool.category);
													return (
														<div
															key={tool.id}
															style={`width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background-color: ${cat?.color || "var(--color-mute)"}15; color: ${cat?.color || "var(--color-mute)"}; font-size: 10px; font-weight: 600;`}
															title={tool.name}
														>
															{tool.name.charAt(0)}
														</div>
													);
												})}
												{collTools.length > 5 && (
													<div class="text-caption text-muted flex items-center">
														+{collTools.length - 5}
													</div>
												)}
											</div>
										)}

										{previewTools.length === 0 && (
											<p class="text-caption text-muted mt-4 h-8 flex items-center">
												{t["coll.no_tools"]}
											</p>
										)}
									</div>

									{/* Expanded tools list */}
									{isExpanded && (
										<div class="border-t border-hairline bg-surface-soft/30">
											<div class="p-4">
												<div class="flex items-center justify-between mb-3">
													<span class="text-caption-uppercase text-muted">
														{t["coll.tools_in_coll"]}
													</span>
													<div class="flex gap-2">
														<button
															class="btn-secondary"
															style="padding: 4px 10px; font-size: 12px;"
															onClick={(e: Event) => {
																e.stopPropagation();
																handleEdit(collection);
															}}
														>
															{t["coll.edit_btn"]}
														</button>
														{deleteConfirmId === collection.id ? (
															<div class="flex gap-1 items-center">
																<button
																	style="padding: 4px 10px; font-size: 12px; border-radius: 6px; border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-dark); cursor: pointer;"
																	onClick={(e: Event) => {
																		e.stopPropagation();
																		handleDelete(collection.id);
																	}}
																>
																	{t["coll.confirm_btn"]}
																</button>
																<button
																	class="btn-secondary"
																	style="padding: 4px 10px; font-size: 12px;"
																	onClick={(e: Event) => {
																		e.stopPropagation();
																		setDeleteConfirmId(null);
																	}}
																>
																	{t["coll.cancel"]}
																</button>
															</div>
														) : (
															<button
																class="btn-secondary"
																style="padding: 4px 10px; font-size: 12px; color: var(--color-primary);"
																onClick={(e: Event) => {
																	e.stopPropagation();
																	setDeleteConfirmId(collection.id);
																}}
															>
																{t["coll.delete_btn"]}
															</button>
														)}
													</div>
												</div>

												{collTools.length > 0 ? (
													<div class="flex flex-col gap-1">
														{collTools.map((tool) => {
															const cat = getCategory(tool.category);
															return (
																<div
																	key={tool.id}
																	class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
																	style="background: transparent;"
																	onMouseEnter={(e: Event) => {
																		(e.currentTarget as HTMLElement).style.background =
																			"var(--color-surface-soft)";
																	}}
																	onMouseLeave={(e: Event) => {
																		(e.currentTarget as HTMLElement).style.background =
																			"transparent";
																	}}
																>
																	<span
																		class="w-2 h-2 rounded-full shrink-0"
																		style={`background-color: ${cat?.color || "var(--color-mute)"};`}
																	/>
																	<a
																		href={`/${tool.category}/${tool.slug}`}
																		class="flex-1 min-w-0 text-body-sm no-underline truncate"
																		style="color: var(--color-ink);"
																		onClick={(e: Event) => e.stopPropagation()}
																	>
																		{tool.name}
																	</a>
																	<button
																		onClick={(e: Event) => {
																			e.stopPropagation();
																			handleRemoveTool(collection.id, tool.id);
																		}}
																		class="p-1 text-muted transition-colors shrink-0"
																		style="background: none; border: none; cursor: pointer;"
																		aria-label={`Remove ${tool.name} from collection`}
																		onMouseEnter={(e: Event) => {
																			(e.currentTarget as HTMLElement).style.color =
																				"var(--color-primary)";
																		}}
																		onMouseLeave={(e: Event) => {
																			(e.currentTarget as HTMLElement).style.color =
																				"var(--color-mute)";
																		}}
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
																		>
																			<line x1="18" y1="6" x2="6" y2="18" />
																			<line x1="6" y1="6" x2="18" y2="18" />
																		</svg>
																	</button>
																</div>
															);
														})}
													</div>
												) : (
													<p class="text-caption text-muted text-center py-4">
														{t["coll.no_tools_in_coll"]}
													</p>
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
