import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
	type ToolCollection,
	getCollections,
	createCollection,
	addToolToCollection,
	removeToolFromCollection,
	isToolInCollection,
} from "../../utils/collections";

interface Props {
	toolId: string;
}

export default function CollectionPicker({ toolId }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [collections, setCollections] = useState<ToolCollection[]>([]);
	const [showNewForm, setShowNewForm] = useState(false);
	const [newName, setNewName] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);

	const loadCollections = useCallback(() => {
		try {
			setCollections(getCollections());
		} catch {}
	}, []);

	useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setShowNewForm(false);
				setNewName("");
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	useEffect(() => {
		if (showNewForm && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [showNewForm]);

	const handleToggle = useCallback(
		(collectionId: string) => {
			try {
				if (isToolInCollection(collectionId, toolId)) {
					removeToolFromCollection(collectionId, toolId);
				} else {
					addToolToCollection(collectionId, toolId);
				}
				loadCollections();
			} catch {}
		},
		[toolId, loadCollections],
	);

	const handleCreateAndAdd = useCallback(() => {
		if (!newName.trim()) return;
		const newCol = createCollection(newName.trim());
		addToolToCollection(newCol.id, toolId);
		setNewName("");
		setShowNewForm(false);
		loadCollections();
	}, [newName, toolId, loadCollections]);

	const handleOpen = useCallback(() => {
		setIsOpen(true);
		loadCollections();
	}, [loadCollections]);

	return (
		<div class="relative" ref={containerRef}>
			<button
				class="btn-secondary"
				onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-hairline); background: transparent; color: var(--color-mute); font-size: 13px; cursor: pointer; transition: all 0.15s ease;"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
				</svg>
				Add to Collection
			</button>

			{isOpen && (
				<div
					class="absolute right-0 mt-2 w-72 bg-surface-card border border-hairline rounded-lg shadow-lg z-50"
					role="listbox"
					aria-label="Select collections"
					tabIndex={-1}
				>
					<div class="p-3">
						<span class="text-caption-uppercase text-muted block mb-2">Add to collection</span>
					</div>

					<div class="max-h-48 overflow-y-auto px-3">
						{collections.length === 0 ? (
							<p class="text-caption text-muted text-center py-3">No collections yet</p>
						) : (
							collections.map((col) => {
								const checked = col.toolIds.includes(toolId);
								return (
									<label
										key={col.id}
										class="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors duration-150"
										style="background: transparent;"
										onMouseEnter={(e: Event) => {
											(e.currentTarget as HTMLElement).style.background =
												"var(--color-surface-soft)";
										}}
										onMouseLeave={(e: Event) => {
											(e.currentTarget as HTMLElement).style.background = "transparent";
										}}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => handleToggle(col.id)}
											style="accent-color: var(--color-primary); width: 16px; height: 16px; cursor: pointer;"
										/>
										<span
											class="w-3 h-3 rounded-full shrink-0"
											style={`background-color: ${col.color}`}
										/>
										<span class="text-body-sm flex-1 truncate">{col.name}</span>
									</label>
								);
							})
						)}
					</div>

					<div class="border-t border-hairline mt-1 p-3">
						{showNewForm ? (
							<div class="flex flex-col gap-2">
								<input
									ref={nameInputRef}
									type="text"
									class="input"
									value={newName}
									onInput={(e: Event) => setNewName((e.target as HTMLInputElement).value)}
									placeholder="Collection name"
									maxLength={50}
									onKeyDown={(e: KeyboardEvent) => {
										if (e.key === "Enter") handleCreateAndAdd();
										if (e.key === "Escape") {
											setShowNewForm(false);
											setNewName("");
										}
									}}
								/>
								<div class="flex gap-2 justify-end">
									<button
										class="btn-secondary"
										style="padding: 4px 10px; font-size: 12px;"
										onClick={() => {
											setShowNewForm(false);
											setNewName("");
										}}
									>
										Cancel
									</button>
									<button
										class="btn-primary"
										style="padding: 4px 10px; font-size: 12px;"
										onClick={handleCreateAndAdd}
										disabled={!newName.trim()}
									>
										Create & Add
									</button>
								</div>
							</div>
						) : (
							<button
								class="w-full text-left text-body-sm cursor-pointer transition-colors duration-150"
								style="background: none; border: none; color: var(--color-primary); padding: 4px 0; display: flex; align-items: center; gap: 6px;"
								onClick={() => setShowNewForm(true)}
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
									<line x1="12" y1="5" x2="12" y2="19" />
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
								New Collection
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
