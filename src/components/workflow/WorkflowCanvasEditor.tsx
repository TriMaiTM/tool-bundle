import { useState, useCallback, useRef, useEffect, useMemo } from "preact/hooks";
import {
	type StepResult,
	workflowTools,
	workflowTemplates,
	getToolsByCategory,
	executeWorkflow,
} from "../../utils/workflow";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CanvasNode {
	id: string;
	toolId: string;
	x: number;
	y: number;
	settings?: Record<string, any>;
}

interface CanvasEdge {
	id: string;
	sourceId: string;
	targetId: string;
}

interface DragState {
	type: "node" | "pan";
	nodeId?: string;
	startX: number;
	startY: number;
	startNodeX?: number;
	startNodeY?: number;
}

interface ConnectState {
	sourceId: string;
	mouseX: number;
	mouseY: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
	return Math.random().toString(36).slice(2, 10);
}

function getNodeCenter(node: CanvasNode): { x: number; y: number } {
	return { x: node.x + 120, y: node.y + 30 };
}

function getPortPos(node: CanvasNode, port: "out" | "in"): { x: number; y: number } {
	if (port === "out") return { x: node.x + 240, y: node.y + 30 };
	return { x: node.x, y: node.y + 30 };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
	const dx = Math.abs(x2 - x1) * 0.5;
	return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkflowCanvasEditor() {
	// Canvas state
	const [nodes, setNodes] = useState<CanvasNode[]>([]);
	const [edges, setEdges] = useState<CanvasEdge[]>([]);
	const [zoom, setZoom] = useState(1);
	const [panX, setPanX] = useState(0);
	const [panY, setPanY] = useState(0);

	// UI state
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [showSidebar, setShowSidebar] = useState(true);
	const [showTemplates, setShowTemplates] = useState(false);
	const [running, setRunning] = useState(false);
	const [results, setResults] = useState<StepResult[]>([]);
	const [currentStep, setCurrentStep] = useState(-1);
	const [inputText, setInputText] = useState("");
	const [outputText, setOutputText] = useState("");
	const [error, setError] = useState("");
	const [showIO, setShowIO] = useState(false);

	// Drag state
	const dragRef = useRef<DragState | null>(null);
	const connectRef = useRef<ConnectState | null>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const [connectingEdge, setConnectingEdge] = useState<ConnectState | null>(null);

	const toolsByCategory = useMemo(() => getToolsByCategory(), []);

	// ─── Canvas Mouse Handlers ───────────────────────────────────────────

	const handleCanvasMouseDown = useCallback(
		(e: MouseEvent) => {
			if (
				e.target === canvasRef.current ||
				(e.target as HTMLElement).classList.contains("canvas-bg")
			) {
				dragRef.current = {
					type: "pan",
					startX: e.clientX - panX,
					startY: e.clientY - panY,
				};
				setSelectedNode(null);
			}
		},
		[panX, panY],
	);

	const handleCanvasMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!dragRef.current) {
				if (connectRef.current) {
					const rect = canvasRef.current!.getBoundingClientRect();
					setConnectingEdge({
						sourceId: connectRef.current.sourceId,
						mouseX: (e.clientX - rect.left - panX) / zoom,
						mouseY: (e.clientY - rect.top - panY) / zoom,
					});
				}
				return;
			}

			if (dragRef.current.type === "pan") {
				setPanX(e.clientX - dragRef.current.startX);
				setPanY(e.clientY - dragRef.current.startY);
			} else if (dragRef.current.type === "node" && dragRef.current.nodeId) {
				const dx = (e.clientX - dragRef.current.startX) / zoom;
				const dy = (e.clientY - dragRef.current.startY) / zoom;
				setNodes((prev) =>
					prev.map((n) =>
						n.id === dragRef.current!.nodeId
							? {
									...n,
									x: dragRef.current!.startNodeX! + dx,
									y: dragRef.current!.startNodeY! + dy,
								}
							: n,
					),
				);
			}
		},
		[panX, panY, zoom],
	);

	const handleCanvasMouseUp = useCallback(() => {
		if (connectRef.current && connectingEdge) {
			// Check if we dropped on an input port
			const targetNode = nodes.find((n) => {
				const portPos = getPortPos(n, "in");
				const dx = Math.abs(connectingEdge.mouseX - portPos.x);
				const dy = Math.abs(connectingEdge.mouseY - portPos.y);
				return dx < 30 && dy < 30;
			});

			if (targetNode && targetNode.id !== connectRef.current.sourceId) {
				// Check if edge already exists
				const exists = edges.some(
					(e) => e.sourceId === connectRef.current!.sourceId && e.targetId === targetNode.id,
				);
				if (!exists) {
					setEdges((prev) => [
						...prev,
						{
							id: uid(),
							sourceId: connectRef.current!.sourceId,
							targetId: targetNode.id,
						},
					]);
				}
			}
		}

		dragRef.current = null;
		connectRef.current = null;
		setConnectingEdge(null);
	}, [connectingEdge, nodes, edges]);

	// Wheel zoom
	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		setZoom((prev) => Math.min(2, Math.max(0.3, prev * delta)));
	}, []);

	// ─── Node Handlers ───────────────────────────────────────────────────

	const handleNodeMouseDown = useCallback(
		(e: MouseEvent, nodeId: string) => {
			e.stopPropagation();
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return;
			dragRef.current = {
				type: "node",
				nodeId,
				startX: e.clientX,
				startY: e.clientY,
				startNodeX: node.x,
				startNodeY: node.y,
			};
			setSelectedNode(nodeId);
		},
		[nodes],
	);

	const handlePortMouseDown = useCallback((e: MouseEvent, nodeId: string) => {
		e.stopPropagation();
		connectRef.current = {
			sourceId: nodeId,
			mouseX: e.clientX,
			mouseY: e.clientY,
		};
	}, []);

	const handleAddNode = useCallback(
		(toolId: string, x?: number, y?: number) => {
			const newNode: CanvasNode = {
				id: uid(),
				toolId,
				x: x ?? 100 + nodes.length * 40,
				y: y ?? 100 + (nodes.length % 4) * 100,
			};
			setNodes((prev) => [...prev, newNode]);
			setSelectedNode(newNode.id);
		},
		[nodes.length],
	);

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			setNodes((prev) => prev.filter((n) => n.id !== nodeId));
			setEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
			if (selectedNode === nodeId) setSelectedNode(null);
		},
		[selectedNode],
	);

	const handleDeleteEdge = useCallback((edgeId: string) => {
		setEdges((prev) => prev.filter((e) => e.id !== edgeId));
	}, []);

	// ─── Topological Sort ────────────────────────────────────────────────

	const getSortedNodes = useCallback((): CanvasNode[] => {
		if (nodes.length === 0) return [];
		const adj: Record<string, string[]> = {};
		const inDeg: Record<string, number> = {};
		for (const n of nodes) {
			adj[n.id] = [];
			inDeg[n.id] = 0;
		}
		for (const e of edges) {
			adj[e.sourceId]?.push(e.targetId);
			inDeg[e.targetId] = (inDeg[e.targetId] || 0) + 1;
		}
		const queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
		const sorted: string[] = [];
		while (queue.length > 0) {
			const id = queue.shift()!;
			sorted.push(id);
			for (const next of adj[id] || []) {
				inDeg[next]--;
				if (inDeg[next] === 0) queue.push(next);
			}
		}
		return sorted.map((id) => nodes.find((n) => n.id === id)!).filter(Boolean);
	}, [nodes, edges]);

	// ─── Run Workflow ────────────────────────────────────────────────────

	const handleRun = useCallback(async () => {
		if (nodes.length === 0 || !inputText.trim()) return;
		setRunning(true);
		setOutputText("");
		setResults([]);
		setError("");
		setCurrentStep(-1);

		const sorted = getSortedNodes();
		if (sorted.length === 0) {
			setError("No nodes to execute");
			setRunning(false);
			return;
		}

		const steps = sorted.map((n) => ({
			id: n.id,
			toolId: n.toolId,
			settings: n.settings,
		}));

		const {
			results: stepResults,
			finalOutput,
			success,
		} = await executeWorkflow(
			steps,
			inputText,
			(index) => setCurrentStep(index),
			() => {},
			(_, err) => setError(err),
		);

		setResults(stepResults);
		setCurrentStep(-1);
		if (success) setOutputText(finalOutput);
		else setError(stepResults.find((r) => !r.success)?.error || "Unknown error");
		setRunning(false);
	}, [nodes, inputText, getSortedNodes]);

	// ─── Template Loader ─────────────────────────────────────────────────

	const handleLoadTemplate = useCallback((templateId: string) => {
		const template = workflowTemplates.find((t) => t.id === templateId);
		if (!template) return;

		const newNodes: CanvasNode[] = template.steps.map((step, i) => ({
			id: uid(),
			toolId: step.toolId,
			x: 100 + i * 300,
			y: 200,
			settings: step.settings,
		}));

		const newEdges: CanvasEdge[] = [];
		for (let i = 0; i < newNodes.length - 1; i++) {
			newEdges.push({
				id: uid(),
				sourceId: newNodes[i].id,
				targetId: newNodes[i + 1].id,
			});
		}

		setNodes(newNodes);
		setEdges(newEdges);
		setShowTemplates(false);
		setPanX(0);
		setPanY(0);
		setZoom(1);
		setOutputText("");
		setResults([]);
		setError("");
	}, []);

	// ─── Clear ───────────────────────────────────────────────────────────

	const handleClear = useCallback(() => {
		setNodes([]);
		setEdges([]);
		setSelectedNode(null);
		setInputText("");
		setOutputText("");
		setResults([]);
		setError("");
		setPanX(0);
		setPanY(0);
		setZoom(1);
	}, []);

	// ─── Copy Output ─────────────────────────────────────────────────────

	const handleCopyOutput = useCallback(async () => {
		if (outputText) await navigator.clipboard.writeText(outputText);
	}, [outputText]);

	// ─── Render ──────────────────────────────────────────────────────────

	return (
		<div style="display: flex; height: 700px; border: 1px solid var(--color-hairline); border-radius: 16px; overflow: hidden; background: var(--color-surface-soft);">
			{/* ─── Sidebar ─────────────────────────────────────────────────── */}
			{showSidebar && (
				<div style="width: 260px; border-right: 1px solid var(--color-hairline); background: var(--color-canvas); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
					{/* Sidebar header */}
					<div style="padding: 12px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
						<span style="font-size: 13px; font-weight: 600; color: var(--color-ink);">Tools</span>
						<div style="display: flex; gap: 4px;">
							<button
								onClick={() => setShowTemplates(!showTemplates)}
								aria-label="Templates"
								style={`padding: 4px 8px; background: ${showTemplates ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${showTemplates ? "var(--color-on-primary)" : "var(--color-mute)"}; border: none; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600;`}
							>
								Templates
							</button>
							<button
								onClick={() => setShowSidebar(false)}
								aria-label="Close sidebar"
								style="padding: 4px; background: none; border: none; cursor: pointer; color: var(--color-mute);"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>
					</div>

					{/* Templates list */}
					{showTemplates && (
						<div style="padding: 8px; border-bottom: 1px solid var(--color-hairline); max-height: 200px; overflow-y: auto;">
							{workflowTemplates.map((t) => (
								<button
									key={t.id}
									onClick={() => handleLoadTemplate(t.id)}
									style="width: 100%; text-align: left; padding: 8px 10px; background: none; border: none; cursor: pointer; border-radius: 8px; margin-bottom: 4px;"
									onMouseEnter={(e: MouseEvent) => {
										(e.target as HTMLElement).style.background = "var(--color-surface-card)";
									}}
									onMouseLeave={(e: MouseEvent) => {
										(e.target as HTMLElement).style.background = "none";
									}}
								>
									<div style="font-size: 13px; font-weight: 600; color: var(--color-ink);">
										{t.name}
									</div>
									<div style="font-size: 11px; color: var(--color-mute); margin-top: 2px;">
										{t.description}
									</div>
								</button>
							))}
						</div>
					)}

					{/* Tool list */}
					<div style="flex: 1; overflow-y: auto; padding: 8px;">
						{Object.entries(toolsByCategory).map(([cat, tools]) => (
							<div key={cat} style="margin-bottom: 12px;">
								<div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--color-mute); padding: 4px 8px; margin-bottom: 4px;">
									{cat}
								</div>
								{tools.map((tool) => (
									<button
										key={tool.id}
										onClick={() => handleAddNode(tool.id)}
										draggable
										onDragStart={(e: DragEvent) => {
											e.dataTransfer?.setData("toolId", tool.id);
										}}
										style="width: 100%; text-align: left; padding: 6px 10px; background: none; border: none; cursor: grab; border-radius: 8px; margin-bottom: 2px; display: flex; align-items: center; gap: 8px;"
										onMouseEnter={(e: MouseEvent) => {
											(e.target as HTMLElement).style.background = "var(--color-surface-card)";
										}}
										onMouseLeave={(e: MouseEvent) => {
											(e.target as HTMLElement).style.background = "none";
										}}
									>
										<span style="width: 6px; height: 6px; border-radius: 9999px; background: var(--color-primary); flex-shrink: 0;" />
										<span style="font-size: 13px; color: var(--color-body);">{tool.name}</span>
									</button>
								))}
							</div>
						))}
					</div>
				</div>
			)}

			{/* ─── Main Area ───────────────────────────────────────────────── */}
			<div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
				{/* Toolbar */}
				<div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--color-hairline); background: var(--color-canvas); flex-shrink: 0;">
					{!showSidebar && (
						<button
							onClick={() => setShowSidebar(true)}
							aria-label="Open sidebar"
							style="padding: 6px; background: none; border: none; cursor: pointer; color: var(--color-mute); border-radius: 8px;"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						</button>
					)}
					<div style="flex: 1; display: flex; align-items: center; gap: 4px;">
						<span style="font-size: 12px; color: var(--color-mute);">{nodes.length} nodes</span>
						<span style="font-size: 12px; color: var(--color-mute);">·</span>
						<span style="font-size: 12px; color: var(--color-mute);">
							{edges.length} connections
						</span>
					</div>
					<button
						onClick={() => setShowIO(!showIO)}
						style={`padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; background: ${showIO ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${showIO ? "var(--color-on-primary)" : "var(--color-mute)"};`}
					>
						Input / Output
					</button>
					<button
						onClick={handleRun}
						disabled={running || nodes.length === 0 || !inputText.trim()}
						class="btn-primary"
						style="padding: 6px 16px; font-size: 13px;"
					>
						{running ? "Running..." : "▶ Run"}
					</button>
					<button
						onClick={handleClear}
						class="btn-secondary"
						style="padding: 6px 12px; font-size: 12px;"
					>
						Clear
					</button>
					<button
						onClick={() => setZoom((z) => Math.min(2, z * 1.2))}
						style="padding: 6px; background: none; border: none; cursor: pointer; color: var(--color-mute); font-size: 16px;"
					>
						+
					</button>
					<span style="font-size: 11px; color: var(--color-mute); min-width: 36px; text-align: center;">
						{Math.round(zoom * 100)}%
					</span>
					<button
						onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
						style="padding: 6px; background: none; border: none; cursor: pointer; color: var(--color-mute); font-size: 16px;"
					>
						−
					</button>
				</div>

				{/* Canvas */}
				<div
					ref={canvasRef}
					style="flex: 1; position: relative; overflow: hidden; cursor: grab;"
					onMouseDown={handleCanvasMouseDown as any}
					onMouseMove={handleCanvasMouseMove as any}
					onMouseUp={handleCanvasMouseUp}
					onWheel={handleWheel as any}
					onDragOver={(e: DragEvent) => e.preventDefault()}
					onDrop={(e: DragEvent) => {
						e.preventDefault();
						const toolId = e.dataTransfer?.getData("toolId");
						if (toolId) {
							const rect = canvasRef.current!.getBoundingClientRect();
							const x = (e.clientX - rect.left - panX) / zoom;
							const y = (e.clientY - rect.top - panY) / zoom;
							handleAddNode(toolId, x - 120, y - 30);
						}
					}}
				>
					{/* Canvas background */}
					<div
						class="canvas-bg"
						style="position: absolute; inset: 0; background-image: radial-gradient(circle, var(--color-hairline) 1px, transparent 1px); background-size: 24px 24px; background-position: center center;"
					/>

					{/* Zoom/pan container */}
					<div
						style={`position: absolute; inset: 0; transform: translate(${panX}px, ${panY}px) scale(${zoom}); transform-origin: 0 0;`}
					>
						{/* SVG edges */}
						<svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;">
							{edges.map((edge) => {
								const source = nodes.find((n) => n.id === edge.sourceId);
								const target = nodes.find((n) => n.id === edge.targetId);
								if (!source || !target) return null;
								const from = getPortPos(source, "out");
								const to = getPortPos(target, "in");
								const isSelected = selectedNode === edge.sourceId || selectedNode === edge.targetId;
								return (
									<g key={edge.id}>
										<path
											d={bezierPath(from.x, from.y, to.x, to.y)}
											fill="none"
											stroke={isSelected ? "var(--color-primary)" : "var(--color-ash)"}
											stroke-width={isSelected ? 2.5 : 2}
											style="pointer-events: stroke; cursor: pointer;"
											onClick={(e: MouseEvent) => {
												e.stopPropagation();
												handleDeleteEdge(edge.id);
											}}
										/>
										{/* Arrow head */}
										<circle
											cx={to.x}
											cy={to.y}
											r="4"
											fill={isSelected ? "var(--color-primary)" : "var(--color-ash)"}
										/>
									</g>
								);
							})}

							{/* Connecting edge (while dragging) */}
							{connectingEdge &&
								(() => {
									const source = nodes.find((n) => n.id === connectingEdge.sourceId);
									if (!source) return null;
									const from = getPortPos(source, "out");
									return (
										<path
											d={bezierPath(from.x, from.y, connectingEdge.mouseX, connectingEdge.mouseY)}
											fill="none"
											stroke="var(--color-primary)"
											stroke-width="2"
											stroke-dasharray="6 4"
											opacity="0.6"
										/>
									);
								})()}
						</svg>

						{/* Nodes */}
						{nodes.map((node) => {
							const tool = workflowTools[node.toolId];
							const isSelected = selectedNode === node.id;
							const result = results.find((r) => r.stepId === node.id);
							const isRunning = running && currentStep === nodes.indexOf(node);
							const hasOutput = edges.some((e) => e.sourceId === node.id);
							const hasInput = edges.some((e) => e.targetId === node.id);

							return (
								<div
									key={node.id}
									style={`position: absolute; left: ${node.x}px; top: ${node.y}px; width: 240px; background: var(--color-canvas); border: 2px solid ${isSelected ? "var(--color-primary)" : result && !result.success ? "var(--color-error)" : "var(--color-hairline)"}; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: grab; user-select: none; transition: border-color 0.15s ease;`}
									onMouseDown={(e: MouseEvent) => handleNodeMouseDown(e, node.id)}
								>
									{/* Input port */}
									<div
										style={`position: absolute; left: -8px; top: 26px; width: 16px; height: 16px; border-radius: 9999px; background: ${hasInput ? "var(--color-primary)" : "var(--color-surface-card)"}; border: 2px solid ${hasInput ? "var(--color-primary)" : "var(--color-ash)"}; cursor: crosshair; z-index: 2;`}
										onMouseDown={(e: MouseEvent) => {
											e.stopPropagation();
											// Click on input port — could be used for connecting
										}}
									/>

									{/* Node header */}
									<div
										style={`padding: 10px 14px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--color-hairline); ${isRunning ? "background: var(--color-primary); color: var(--color-on-primary);" : ""}`}
									>
										{/* Status icon */}
										<div
											style={`width: 24px; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; ${
												result?.success
													? "background: var(--color-accent-emerald); color: white;"
													: result && !result.success
														? "background: var(--color-error); color: white;"
														: isRunning
															? "background: var(--color-primary); color: var(--color-on-primary);"
															: "background: var(--color-surface-card); color: var(--color-mute);"
											}`}
										>
											{result?.success ? (
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="3"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
											) : result && !result.success ? (
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="3"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											) : isRunning ? (
												<div style="width: 12px; height: 12px; border: 2px solid var(--color-on-primary); border-top-color: transparent; border-radius: 9999px; animation: spin 0.6s linear infinite;" />
											) : (
												<span style="font-size: 10px; font-weight: 700;">
													{nodes.indexOf(node) + 1}
												</span>
											)}
										</div>

										<div style="flex: 1; min-width: 0;">
											<div
												style={`font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${isRunning ? "color: var(--color-on-primary);" : "color: var(--color-ink);"}`}
											>
												{tool?.name || node.toolId}
											</div>
											{result?.success && (
												<div style="font-size: 10px; color: var(--color-accent-emerald);">
													{result.duration}ms
												</div>
											)}
											{result && !result.success && (
												<div style="font-size: 10px; color: var(--color-error);">
													{result.error?.slice(0, 30)}
												</div>
											)}
										</div>

										{/* Delete button */}
										{!running && (
											<button
												onClick={(e: MouseEvent) => {
													e.stopPropagation();
													handleDeleteNode(node.id);
												}}
												aria-label="Delete node"
												style="padding: 2px; background: none; border: none; cursor: pointer; color: var(--color-mute); border-radius: 4px; flex-shrink: 0;"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										)}
									</div>

									{/* Node body — description */}
									<div style="padding: 8px 14px;">
										<div style="font-size: 11px; color: var(--color-mute); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
											{tool?.description || ""}
										</div>
									</div>

									{/* Output port */}
									<div
										style={`position: absolute; right: -8px; top: 26px; width: 16px; height: 16px; border-radius: 9999px; background: ${hasOutput ? "var(--color-primary)" : "var(--color-surface-card)"}; border: 2px solid ${hasOutput ? "var(--color-primary)" : "var(--color-ash)"}; cursor: crosshair; z-index: 2;`}
										onMouseDown={(e: MouseEvent) => handlePortMouseDown(e, node.id)}
									/>
								</div>
							);
						})}
					</div>

					{/* Empty state */}
					{nodes.length === 0 && (
						<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
							<div style="text-align: center; max-width: 320px;">
								<svg
									width="48"
									height="48"
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--color-ash)"
									stroke-width="1.5"
									style="display: block; margin: 0 auto 16px auto;"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M8 12h8M12 8v8" />
								</svg>
								<p style="font-size: 14px; font-weight: 600; color: var(--color-ink); margin-bottom: 8px;">
									Build your workflow
								</p>
								<p style="font-size: 13px; color: var(--color-mute); line-height: 1.5;">
									Drag tools from the sidebar or click "Templates" to start with a pre-built
									workflow. Connect nodes by dragging from output ports to input ports.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* ─── Input / Output Panel ──────────────────────────────────── */}
				{showIO && (
					<div style="border-top: 1px solid var(--color-hairline); background: var(--color-canvas); display: flex; height: 180px; flex-shrink: 0;">
						{/* Input */}
						<div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--color-hairline);">
							<div style="padding: 8px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
								<span style="font-size: 12px; font-weight: 600; color: var(--color-ink);">
									Input
								</span>
							</div>
							<textarea
								style="flex: 1; padding: 10px 16px; background: transparent; border: none; outline: none; resize: none; font-size: 13px; font-family: var(--font-mono); color: var(--color-ink);"
								placeholder="Paste your input text here..."
								value={inputText}
								onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>

						{/* Output */}
						<div style="flex: 1; display: flex; flex-direction: column;">
							<div style="padding: 8px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
								<span style="font-size: 12px; font-weight: 600; color: var(--color-ink);">
									Output
								</span>
								{outputText && (
									<button
										onClick={handleCopyOutput}
										style="font-size: 11px; background: none; border: none; cursor: pointer; color: var(--color-primary); font-weight: 600;"
									>
										Copy
									</button>
								)}
							</div>
							<textarea
								style="flex: 1; padding: 10px 16px; background: transparent; border: none; outline: none; resize: none; font-size: 13px; font-family: var(--font-mono); color: var(--color-ink);"
								placeholder="Output will appear here..."
								value={outputText}
								readOnly
							/>
						</div>
					</div>
				)}

				{/* Error bar */}
				{error && (
					<div style="padding: 8px 16px; background: var(--color-error); color: white; font-size: 13px; flex-shrink: 0;">
						{error}
					</div>
				)}
			</div>

			{/* Spin animation */}
			<style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);
}
