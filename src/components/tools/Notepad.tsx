import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";

interface Note {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

const STORAGE_KEY = "notepad-notes";
const FONT_SIZES: Record<string, string> = {
	small: "13px",
	medium: "15px",
	large: "18px",
};

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

export default function Notepad() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
	const [fontSize, setFontSize] = useState<string>("medium");
	const [darkPaper, setDarkPaper] = useState(false);
	const [autoSave, setAutoSave] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Load from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as Note[];
				if (Array.isArray(parsed) && parsed.length > 0) {
					setNotes(parsed);
					setActiveNoteId(parsed[0].id);
				} else {
					// Create a default note
					const defaultNote: Note = {
						id: generateId(),
						title: "My First Note",
						content: "",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					setNotes([defaultNote]);
					setActiveNoteId(defaultNote.id);
				}
			} else {
				const defaultNote: Note = {
					id: generateId(),
					title: "My First Note",
					content: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				setNotes([defaultNote]);
				setActiveNoteId(defaultNote.id);
			}
		} catch {
			const defaultNote: Note = {
				id: generateId(),
				title: "My First Note",
				content: "",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			setNotes([defaultNote]);
			setActiveNoteId(defaultNote.id);
		}
	}, []);

	// Save to localStorage
	const saveNotes = useCallback((updatedNotes: Note[]) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
		} catch {
			// ignore
		}
	}, []);

	// Auto-save timer
	useEffect(() => {
		if (!autoSave) return;
		saveTimerRef.current = setInterval(() => {
			saveNotes(notes);
		}, 2000);
		return () => {
			if (saveTimerRef.current) clearInterval(saveTimerRef.current);
		};
	}, [autoSave, notes, saveNotes]);

	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId) || null,
		[notes, activeNoteId],
	);

	const filteredNotes = useMemo(() => {
		if (!searchQuery.trim()) return notes;
		const q = searchQuery.toLowerCase();
		return notes.filter(
			(n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
		);
	}, [notes, searchQuery]);

	const updateNoteContent = useCallback(
		(content: string) => {
			if (!activeNoteId) return;
			setNotes((prev) =>
				prev.map((n) =>
					n.id === activeNoteId ? { ...n, content, updatedAt: new Date().toISOString() } : n,
				),
			);
		},
		[activeNoteId],
	);

	const updateNoteTitle = useCallback(
		(title: string) => {
			if (!activeNoteId) return;
			setNotes((prev) =>
				prev.map((n) =>
					n.id === activeNoteId ? { ...n, title, updatedAt: new Date().toISOString() } : n,
				),
			);
		},
		[activeNoteId],
	);

	const createNote = useCallback(() => {
		const newNote: Note = {
			id: generateId(),
			title: `Note ${notes.length + 1}`,
			content: "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		setNotes((prev) => [newNote, ...prev]);
		setActiveNoteId(newNote.id);
	}, [notes.length]);

	const deleteNote = useCallback(
		(id: string) => {
			setNotes((prev) => {
				const filtered = prev.filter((n) => n.id !== id);
				if (activeNoteId === id) {
					setActiveNoteId(filtered.length > 0 ? filtered[0].id : null);
				}
				return filtered;
			});
		},
		[activeNoteId],
	);

	const selectNote = useCallback(
		(id: string) => {
			// Save current before switching
			if (autoSave) saveNotes(notes);
			setActiveNoteId(id);
		},
		[autoSave, notes, saveNotes],
	);

	const exportTxt = useCallback(() => {
		if (!activeNote) return;
		const blob = new Blob([activeNote.content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${activeNote.title || "note"}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [activeNote]);

	const exportMd = useCallback(() => {
		if (!activeNote) return;
		const blob = new Blob([activeNote.content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${activeNote.title || "note"}.md`;
		a.click();
		URL.revokeObjectURL(url);
	}, [activeNote]);

	const handlePrint = useCallback(() => {
		window.print();
	}, []);

	const clearNote = useCallback(() => {
		if (!activeNoteId) return;
		updateNoteContent("");
	}, [activeNoteId, updateNoteContent]);

	// Word and character count
	const wordCount = useMemo(() => {
		if (!activeNote?.content) return 0;
		return activeNote.content
			.trim()
			.split(/\s+/)
			.filter((w) => w.length > 0).length;
	}, [activeNote?.content]);

	const charCount = useMemo(() => activeNote?.content?.length || 0, [activeNote?.content]);

	return (
		<div>
			<div class="flex gap-4" style="height: 600px">
				{/* Sidebar */}
				{sidebarOpen && (
					<div
						class="card"
						style="width: 260px; flex-shrink: 0; display: flex; flex-direction: column; padding: 16px; overflow: hidden"
					>
						{/* Sidebar header */}
						<div class="flex items-center justify-between mb-3">
							<label class="text-caption-uppercase text-muted">Notes</label>
							<button
								class="btn-secondary"
								style="height: 28px; font-size: 11px; padding: 0 8px"
								onClick={createNote}
							>
								+ New
							</button>
						</div>

						{/* Search */}
						<input
							class="input"
							placeholder="Search notes..."
							value={searchQuery}
							onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
							style="height: 36px; font-size: 13px; margin-bottom: 12px"
						/>

						{/* Note list */}
						<div style="flex: 1; overflow-y: auto">
							{filteredNotes.map((note) => (
								<div
									key={note.id}
									class="flex items-start justify-between gap-1"
									style={`padding: 8px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; background-color: ${note.id === activeNoteId ? "var(--color-surface-card)" : "transparent"}`}
									onClick={() => selectNote(note.id)}
								>
									<div style="min-width: 0; flex: 1">
										<p
											class="text-body-sm"
											style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
										>
											{note.title || "Untitled"}
										</p>
										<p
											class="text-caption"
											style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
										>
											{note.content.slice(0, 40) || "Empty note"}
										</p>
										<p class="text-caption" style="font-size: 10px; color: var(--color-ash)">
											{formatDate(note.updatedAt)}
										</p>
									</div>
									<button
										style="flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: var(--color-ash); font-size: 14px; border-radius: 4px"
										onClick={(e) => {
											e.stopPropagation();
											deleteNote(note.id);
										}}
										onMouseEnter={(e) => {
											(e.target as HTMLElement).style.color = "var(--color-error)";
										}}
										onMouseLeave={(e) => {
											(e.target as HTMLElement).style.color = "var(--color-ash)";
										}}
									>
										×
									</button>
								</div>
							))}
							{filteredNotes.length === 0 && (
								<p
									class="text-caption"
									style="color: var(--color-ash); text-align: center; padding: 16px"
								>
									{searchQuery ? "No matching notes" : "No notes yet"}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Main Editor */}
				<div
					class="card"
					style="flex: 1; display: flex; flex-direction: column; padding: 16px; overflow: hidden"
				>
					{/* Toolbar */}
					<div class="flex items-center gap-2 flex-wrap mb-3">
						<button
							class="btn-secondary"
							style="height: 32px; font-size: 12px"
							onClick={() => setSidebarOpen(!sidebarOpen)}
						>
							{sidebarOpen ? "◀ Hide" : "▶ Notes"}
						</button>

						<select
							class="input"
							style="width: auto; height: 32px; font-size: 12px"
							value={fontSize}
							onChange={(e) => setFontSize((e.target as HTMLSelectElement).value)}
						>
							<option value="small">Small</option>
							<option value="medium">Medium</option>
							<option value="large">Large</option>
						</select>

						<button
							class={darkPaper ? "btn-primary" : "btn-secondary"}
							style="height: 32px; font-size: 12px"
							onClick={() => setDarkPaper(!darkPaper)}
						>
							{darkPaper ? "☀ Light" : "🌙 Dark"}
						</button>

						<label class="flex items-center gap-1 cursor-pointer" style="font-size: 12px">
							<input
								type="checkbox"
								checked={autoSave}
								onChange={(e) => setAutoSave((e.target as HTMLInputElement).checked)}
							/>
							<span class="text-caption">Auto-save</span>
						</label>

						<div style="flex: 1" />

						<button class="btn-secondary" style="height: 32px; font-size: 12px" onClick={exportTxt}>
							Export .txt
						</button>
						<button class="btn-secondary" style="height: 32px; font-size: 12px" onClick={exportMd}>
							Export .md
						</button>
						<button
							class="btn-secondary"
							style="height: 32px; font-size: 12px"
							onClick={handlePrint}
						>
							Print
						</button>
						<button class="btn-secondary" style="height: 32px; font-size: 12px" onClick={clearNote}>
							Clear
						</button>
					</div>

					{activeNote ? (
						<>
							{/* Title */}
							<input
								class="input"
								placeholder="Note title..."
								value={activeNote.title}
								onInput={(e) => updateNoteTitle((e.target as HTMLInputElement).value)}
								style="font-weight: 600; font-size: 16px; height: 40px; margin-bottom: 8px"
							/>

							{/* Timestamps */}
							<div class="flex gap-4 mb-2">
								<p class="text-caption" style="color: var(--color-ash)">
									Created: {formatDate(activeNote.createdAt)}
								</p>
								<p class="text-caption" style="color: var(--color-ash)">
									Modified: {formatDate(activeNote.updatedAt)}
								</p>
							</div>

							{/* Content */}
							<textarea
								class="textarea"
								placeholder="Start writing..."
								value={activeNote.content}
								onInput={(e) => updateNoteContent((e.target as HTMLTextAreaElement).value)}
								style={`flex: 1; min-height: auto; font-size: ${FONT_SIZES[fontSize]}; line-height: 1.7; background-color: ${darkPaper ? "var(--color-surface-dark)" : "var(--color-canvas)"}; color: ${darkPaper ? "var(--color-on-dark)" : "var(--color-ink)"}`}
							/>

							{/* Stats bar */}
							<div class="flex items-center gap-4 mt-2">
								<span class="text-caption" style="color: var(--color-ash)">
									{wordCount} word{wordCount !== 1 ? "s" : ""}
								</span>
								<span class="text-caption" style="color: var(--color-ash)">
									{charCount} character{charCount !== 1 ? "s" : ""}
								</span>
								{autoSave && (
									<span class="text-caption" style="color: var(--color-success)">
										✓ Auto-saving
									</span>
								)}
							</div>
						</>
					) : (
						<div class="flex items-center justify-center" style="flex: 1; color: var(--color-ash)">
							<p>Create a new note to get started</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
