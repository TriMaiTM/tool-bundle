import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";

interface Tool {
	id: string;
	name: string;
	description: string;
	category: string;
	slug: string;
	tags?: string[];
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

const RECENT_KEY = "toolbundle_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
	try {
		return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
	} catch {
		return [];
	}
}

function saveRecentSearch(query: string) {
	const recent = getRecentSearches().filter((s) => s !== query);
	recent.unshift(query);
	localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function getRecentTools(): string[] {
	try {
		return JSON.parse(localStorage.getItem("toolbundle_recent_tools") || "[]");
	} catch {
		return [];
	}
}

function saveRecentTool(toolId: string) {
	const recent = getRecentTools().filter((id) => id !== toolId);
	recent.unshift(toolId);
	localStorage.setItem("toolbundle_recent_tools", JSON.stringify(recent.slice(0, 10)));
}

export default function SearchModal({ tools, categories }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Build Fuse index
	const fuse = useMemo(
		() =>
			new Fuse(tools, {
				keys: [
					{ name: "name", weight: 0.5 },
					{ name: "description", weight: 0.3 },
					{ name: "tags", weight: 0.2 },
				],
				threshold: 0.4,
				includeScore: true,
			}),
		[tools],
	);

	// Get category info for a tool
	const getCategory = useCallback(
		(categoryId: string) => categories.find((c) => c.id === categoryId),
		[categories],
	);

	// Search results
	const results = useMemo(() => {
		if (!query.trim()) {
			// Show recent tools when no query
			const recentIds = getRecentTools();
			const recentTools = recentIds
				.map((id) => tools.find((t) => t.id === id))
				.filter(Boolean) as Tool[];
			return recentTools.slice(0, 8);
		}
		return fuse
			.search(query)
			.map((r) => r.item)
			.slice(0, 12);
	}, [query, fuse, tools]);

	// Open/close handlers
	const handleOpen = useCallback(() => {
		setIsOpen(true);
		setQuery("");
		setSelectedIndex(0);
	}, []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setQuery("");
		setSelectedIndex(0);
	}, []);

	const handleSelect = useCallback(
		(tool: Tool) => {
			saveRecentTool(tool.id);
			if (query.trim()) saveRecentSearch(query.trim());
			window.location.href = `/${tool.category}/${tool.slug}`;
		},
		[query],
	);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd/Ctrl + K to open
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				if (isOpen) {
					handleClose();
				} else {
					handleOpen();
				}
				return;
			}

			if (!isOpen) return;

			// Escape to close
			if (e.key === "Escape") {
				e.preventDefault();
				handleClose();
				return;
			}

			// Arrow navigation
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
				return;
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
				return;
			}

			// Enter to select
			if (e.key === "Enter" && results[selectedIndex]) {
				e.preventDefault();
				handleSelect(results[selectedIndex]);
				return;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, results, selectedIndex, handleOpen, handleClose, handleSelect]);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	// Scroll selected item into view
	useEffect(() => {
		if (listRef.current) {
			const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			selected?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Reset selected index when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [results.length]);

	const recentSearches = getRecentSearches();

	return (
		<>
			{/* Trigger Button */}
			<button
				class="flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-hairline rounded-md text-body-sm text-muted hover:border-hairline-strong transition-colors"
				onClick={handleOpen}
				aria-label="Search tools (Ctrl+K)"
				aria-haspopup="dialog"
			>
				<svg
					class="w-4 h-4"
					aria-hidden="true"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<span class="hidden sm:inline">Search tools...</span>
				<kbd class="hidden sm:inline text-xs bg-surface-elevated px-1.5 py-0.5 rounded text-muted-soft">
					&#8984;K
				</kbd>
			</button>

			{/* Modal */}
			{isOpen && (
				<div
					style="position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding-top: 15vh;"
					onClick={(e) => {
						if (e.target === e.currentTarget) handleClose();
					}}
				>
					{/* Backdrop */}
					<div style="position: absolute; inset: 0; background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(4px);" />

					{/* Modal */}
					<div
						style="position: relative; width: 100%; max-width: 32rem; margin: 0 1rem; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;"
						role="dialog"
						aria-modal="true"
						aria-label="Search tools"
					>
						{/* Search Input */}
						<div style="display: flex; align-items: center; gap: 12px; padding: 0 16px; border-bottom: 1px solid #2a2a2a;">
							<svg
								class="w-5 h-5 text-muted shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.35-4.35" />
							</svg>
							<input
								ref={inputRef}
								type="text"
								style="flex: 1; height: 48px; min-width: 0; background: transparent; color: #ffffff; font-size: 16px; outline: none; border: none;"
								placeholder="Search tools..."
								aria-label="Search tools"
								aria-autocomplete="list"
								aria-controls="search-results-list"
								aria-activedescendant={
									results.length > 0 ? `search-result-${selectedIndex}` : undefined
								}
								value={query}
								onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
							/>
							<kbd class="hidden sm:inline text-caption text-muted-soft bg-surface-elevated px-1.5 py-0.5 rounded">
								ESC
							</kbd>
						</div>

						{/* Results */}
						<div
							ref={listRef}
							id="search-results-list"
							role="listbox"
							aria-label="Search results"
							tabIndex={-1}
							style="max-height: 50vh; overflow-y: auto; padding: 8px 0;"
						>
							{/* Live region for screen readers */}
							<div class="sr-only" aria-live="polite" aria-atomic="true">
								{query.trim()
									? `${results.length} result${results.length !== 1 ? "s" : ""} found`
									: ""}
							</div>
							{/* Recent searches (when no query) */}
							{!query.trim() && recentSearches.length > 0 && (
								<div class="px-3 py-1.5">
									<div class="text-caption-uppercase text-muted px-2 mb-1">Recent Searches</div>
									{recentSearches.map((search) => (
										<button
											class="w-full text-left px-3 py-1.5 text-body-sm text-muted hover:text-on-dark hover:bg-surface-elevated rounded-md transition-colors"
											onClick={() => setQuery(search)}
										>
											{search}
										</button>
									))}
								</div>
							)}

							{/* Section header */}
							{query.trim() ? (
								<div class="px-3 py-1.5">
									<div class="text-caption-uppercase text-muted px-2 mb-1">
										Results ({results.length})
									</div>
								</div>
							) : !recentSearches.length ? (
								<div class="px-3 py-1.5">
									<div class="text-caption-uppercase text-muted px-2 mb-1">Recent Tools</div>
								</div>
							) : null}

							{/* Tool results */}
							{results.length > 0 ? (
								results.map((tool, index) => {
									const cat = getCategory(tool.category);
									return (
										<button
											key={tool.id}
											id={`search-result-${index}`}
											data-index={index}
											role="option"
											aria-selected={index === selectedIndex}
											class={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors ${
												index === selectedIndex
													? "bg-surface-elevated"
													: "hover:bg-surface-elevated"
											}`}
											onClick={() => handleSelect(tool)}
											onMouseEnter={() => setSelectedIndex(index)}
										>
											{/* Category dot */}
											<span
												class="w-2 h-2 rounded-full shrink-0"
												style={`background-color: ${cat?.color || "#888"}`}
											/>

											{/* Tool info */}
											<div class="flex-1 min-w-0">
												<div class="text-body-sm text-on-dark truncate">{tool.name}</div>
												<div class="text-caption text-muted truncate">{tool.description}</div>
											</div>

											{/* Category badge */}
											<span class="text-caption text-muted-soft shrink-0 hidden sm:block">
												{cat?.name.replace(" Tools", "").replace(" & ", " ")}
											</span>

											{/* Selection indicator */}
											{index === selectedIndex && (
												<svg
													class="w-4 h-4 text-primary shrink-0"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
												>
													<polyline points="9 18 15 12 9 6" />
												</svg>
											)}
										</button>
									);
								})
							) : query.trim() ? (
								<div class="px-4 py-8 text-center">
									<p class="text-body-sm text-muted">No tools found for "{query}"</p>
									<p class="text-caption text-muted-soft mt-1">Try a different search term</p>
								</div>
							) : null}
						</div>

						{/* Footer */}
						<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-top: 1px solid #2a2a2a; background: #121212;">
							<div class="flex items-center gap-3 text-caption text-muted-soft">
								<span class="flex items-center gap-1">
									<kbd class="bg-surface-elevated px-1 py-0.5 rounded text-[10px]">↑↓</kbd>
									Navigate
								</span>
								<span class="flex items-center gap-1">
									<kbd class="bg-surface-elevated px-1 py-0.5 rounded text-[10px]">↵</kbd>
									Open
								</span>
								<span class="flex items-center gap-1">
									<kbd class="bg-surface-elevated px-1 py-0.5 rounded text-[10px]">Esc</kbd>
									Close
								</span>
							</div>
							<span class="text-caption text-muted-soft">{tools.length} tools</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
