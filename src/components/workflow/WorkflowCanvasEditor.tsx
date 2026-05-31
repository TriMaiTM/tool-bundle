import { useState, useCallback, useRef, useEffect, useMemo } from "preact/hooks";
import {
	type StepResult,
	workflowTools,
	workflowTemplates,
	getToolsByCategory,
	executeWorkflow,
} from "../../utils/workflow";
import { translations } from "../../utils/translations";

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
	if (port === "out") return { x: node.x + 240, y: node.y + 34 };
	return { x: node.x, y: node.y + 34 };
}

function orthogonalPath(x1: number, y1: number, x2: number, y2: number): string {
	const offset = 24;
	const r = 8;
	const points: { x: number; y: number }[] = [];

	points.push({ x: x1, y: y1 });

	if (x2 >= x1 + offset * 2) {
		const xMid = (x1 + x2) / 2;
		points.push({ x: xMid, y: y1 });
		points.push({ x: xMid, y: y2 });
	} else {
		const yMid = (y1 + y2) / 2;
		points.push({ x: x1 + offset, y: y1 });
		points.push({ x: x1 + offset, y: yMid });
		points.push({ x: x2 - offset, y: yMid });
		points.push({ x: x2 - offset, y: y2 });
	}

	points.push({ x: x2, y: y2 });

	let path = `M ${points[0].x} ${points[0].y}`;

	for (let i = 1; i < points.length - 1; i++) {
		const pPrev = points[i - 1];
		const pCurr = points[i];
		const pNext = points[i + 1];

		const dxIn = pCurr.x - pPrev.x;
		const dyIn = pCurr.y - pPrev.y;
		const lenIn = Math.sqrt(dxIn * dxIn + dyIn * dyIn);

		const dxOut = pNext.x - pCurr.x;
		const dyOut = pNext.y - pCurr.y;
		const lenOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut);

		if (lenIn === 0 || lenOut === 0) continue;

		const currentR = Math.min(r, lenIn / 2, lenOut / 2);

		const ax = pCurr.x - (dxIn / lenIn) * currentR;
		const ay = pCurr.y - (dyIn / lenIn) * currentR;

		const bx = pCurr.x + (dxOut / lenOut) * currentR;
		const by = pCurr.y + (dyOut / lenOut) * currentR;

		path += ` L ${ax} ${ay} Q ${pCurr.x} ${pCurr.y} ${bx} ${by}`;
	}

	path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
	return path;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkflowCanvasEditor() {
	// Canvas state
	const [nodes, setNodes] = useState<CanvasNode[]>([]);
	const [edges, setEdges] = useState<CanvasEdge[]>([]);
	const [zoom, setZoom] = useState(1);
	const [panX, setPanX] = useState(0);
	const [panY, setPanY] = useState(0);

	// i18n Language detection
	const [lang, setLang] = useState<"en" | "vi">("en");
	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);
	const t = translations[lang];

	const getToolName = useCallback(
		(toolId: string) => {
			const key = `wf.tool.${toolId}.name`;
			return (t as any)[key] || workflowTools[toolId]?.name || toolId;
		},
		[t],
	);

	const getToolDesc = useCallback(
		(toolId: string) => {
			const key = `wf.tool.${toolId}.desc`;
			return (t as any)[key] || workflowTools[toolId]?.description || "";
		},
		[t],
	);

	const getTemplateName = useCallback(
		(templateId: string, defaultName: string) => {
			const key = `wf.template.${templateId}.name`;
			return (t as any)[key] || defaultName;
		},
		[t],
	);

	const getTemplateDesc = useCallback(
		(templateId: string, defaultDesc: string) => {
			const key = `wf.template.${templateId}.desc`;
			return (t as any)[key] || defaultDesc;
		},
		[t],
	);

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
	const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => {
			setToast(null);
		}, 3000);
		return () => clearTimeout(timer);
	}, [toast]);

	// Drag state
	const dragRef = useRef<DragState | null>(null);
	const connectRef = useRef<ConnectState | null>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
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

	const handleUpdateNodeSetting = useCallback((nodeId: string, key: string, value: any) => {
		setNodes((prev) =>
			prev.map((n) =>
				n.id === nodeId
					? {
							...n,
							settings: {
								...n.settings,
								[key]: value,
							},
						}
					: n,
			),
		);
	}, []);

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
			setError(t["wf.no_nodes"]);
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
	}, [nodes, inputText, getSortedNodes, t]);

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

	// ─── Import / Export ─────────────────────────────────────────────────

	const handleExportJSON = useCallback(() => {
		if (nodes.length === 0) return;
		const data = {
			version: "1.0",
			nodes,
			edges,
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `toolbundle-workflow-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		setToast({ text: t["wf.export_success"], type: "success" });
	}, [nodes, edges, t]);

	const handleImportButtonClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleImportJSON = useCallback(
		(e: Event) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const data = JSON.parse(event.target?.result as string);
					if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
						setNodes(data.nodes);
						setEdges(data.edges);
						setSelectedNode(null);
						setResults([]);
						setOutputText("");
						setError("");
						setToast({ text: t["wf.import_success"], type: "success" });
					} else {
						setToast({ text: t["wf.import_error"], type: "error" });
					}
				} catch (err) {
					setToast({ text: t["wf.import_error"], type: "error" });
				}
				target.value = "";
			};
			reader.readAsText(file);
		},
		[t],
	);

	// ─── Render ──────────────────────────────────────────────────────────

	return (
		<div style="display: flex; height: 700px; border: 1px solid var(--color-hairline); border-radius: 16px; overflow: hidden; background: var(--color-surface-soft);">
			{/* ─── Sidebar ─────────────────────────────────────────────────── */}
			{showSidebar && (
				<div style="width: 260px; border-right: 1px solid var(--color-hairline); background: var(--color-canvas); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
					{(() => {
						const selectedNodeData = nodes.find((n) => n.id === selectedNode);
						const selectedTool = selectedNodeData ? workflowTools[selectedNodeData.toolId] : null;

						if (selectedNodeData && selectedTool) {
							return (
								<div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
									{/* Inspector Header */}
									<div style="padding: 12px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
										<span style="font-size: 13px; font-weight: 600; color: var(--color-ink);">
											{t["wf.settings"]}
										</span>
										<button
											onClick={() => setSelectedNode(null)}
											style="font-size: 11px; background: none; border: none; cursor: pointer; color: var(--color-primary); font-weight: 600;"
										>
											{t["wf.back_tools"]}
										</button>
									</div>

									{/* Inspector Body */}
									<div style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
										<div>
											<div style="font-size: 14px; font-weight: 700; color: var(--color-ink);">
												{getToolName(selectedNodeData.toolId)}
											</div>
											<div style="font-size: 11px; color: var(--color-mute); margin-top: 4px; line-height: 1.4;">
												{getToolDesc(selectedNodeData.toolId)}
											</div>
										</div>

										{/* Dynamic settings forms */}
										{selectedTool.settings && selectedTool.settings.length > 0 ? (
											<div style="display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--color-hairline); padding-top: 12px;">
												{selectedTool.settings.map((setting) => {
													const currentValue =
														selectedNodeData.settings?.[setting.key] ?? setting.default;
													return (
														<div key={setting.key}>
															<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-mute); display: block; margin-bottom: 6px;">
																{setting.label}
															</label>
															{setting.type === "number" ? (
																<input
																	type="number"
																	class="input"
																	style="width: 100%; font-size: 13px; padding: 6px 10px;"
																	value={currentValue}
																	onChange={(e) =>
																		handleUpdateNodeSetting(
																			selectedNodeData.id,
																			setting.key,
																			Number((e.target as HTMLInputElement).value),
																		)
																	}
																/>
															) : setting.type === "select" ? (
																<select
																	class="input"
																	style="width: 100%; font-size: 13px; padding: 6px 10px; background: var(--color-canvas);"
																	value={currentValue}
																	onChange={(e) =>
																		handleUpdateNodeSetting(
																			selectedNodeData.id,
																			setting.key,
																			(e.target as HTMLSelectElement).value,
																		)
																	}
																>
																	{setting.options?.map((opt) => (
																		<option key={opt.value} value={opt.value}>
																			{opt.label}
																		</option>
																	))}
																</select>
															) : (
																<input
																	type="text"
																	class="input"
																	style="width: 100%; font-size: 13px; padding: 6px 10px;"
																	value={currentValue}
																	onInput={(e) =>
																		handleUpdateNodeSetting(
																			selectedNodeData.id,
																			setting.key,
																			(e.target as HTMLInputElement).value,
																		)
																	}
																/>
															)}
														</div>
													);
												})}
											</div>
										) : (
											<div style="font-size: 12px; color: var(--color-mute); font-style: italic; border-top: 1px solid var(--color-hairline); padding-top: 12px;">
												{t["wf.no_configs"]}
											</div>
										)}

										{/* Actions */}
										<div style="margin-top: auto; border-top: 1px solid var(--color-hairline); padding-top: 12px;">
											<button
												onClick={() => handleDeleteNode(selectedNodeData.id)}
												class="btn-secondary"
												style="width: 100%; padding: 8px; font-size: 12px; color: var(--color-primary); border-color: var(--color-hairline);"
											>
												{t["wf.delete_node"]}
											</button>
										</div>
									</div>
								</div>
							);
						}

						return (
							<>
								{/* Sidebar header */}
								<div style="padding: 12px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
									<span style="font-size: 13px; font-weight: 600; color: var(--color-ink);">
										{t["wf.tools"]}
									</span>
									<div style="display: flex; gap: 4px;">
										<button
											onClick={() => setShowTemplates(!showTemplates)}
											aria-label="Templates"
											style={`padding: 4px 8px; background: ${showTemplates ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${showTemplates ? "var(--color-on-primary)" : "var(--color-mute)"}; border: none; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600;`}
										>
											{t["wf.templates"]}
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
													{getTemplateName(t.id, t.name)}
												</div>
												<div style="font-size: 11px; color: var(--color-mute); margin-top: 2px;">
													{getTemplateDesc(t.id, t.description)}
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
														(e.target as HTMLElement).style.background =
															"var(--color-surface-card)";
													}}
													onMouseLeave={(e: MouseEvent) => {
														(e.target as HTMLElement).style.background = "none";
													}}
												>
													<span style="width: 6px; height: 6px; border-radius: 9999px; background: var(--color-primary); flex-shrink: 0;" />
													<span style="font-size: 13px; color: var(--color-body);">
														{getToolName(tool.id)}
													</span>
												</button>
											))}
										</div>
									))}
								</div>
							</>
						);
					})()}
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
						<span style="font-size: 12px; color: var(--color-mute);">
							{nodes.length} {t["wf.nodes"]}
						</span>
						<span style="font-size: 12px; color: var(--color-mute);">·</span>
						<span style="font-size: 12px; color: var(--color-mute);">
							{edges.length} {t["wf.connections"]}
						</span>
					</div>
					<button
						onClick={() => setShowIO(!showIO)}
						style={`padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; background: ${showIO ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${showIO ? "var(--color-on-primary)" : "var(--color-mute)"};`}
					>
						{t["wf.input_output"]}
					</button>
					<button
						onClick={handleRun}
						disabled={running || nodes.length === 0 || !inputText.trim()}
						class="btn-primary"
						style="padding: 6px 16px; font-size: 13px;"
					>
						{running ? t["wf.running"] : `▶ ${t["wf.run"]}`}
					</button>
					<button
						onClick={handleClear}
						class="btn-secondary"
						style="padding: 6px 12px; font-size: 12px;"
					>
						{t["wf.clear"]}
					</button>
					<button
						onClick={handleImportButtonClick}
						class="btn-secondary"
						style="padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 4px;"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						{t["wf.import_json"]}
					</button>
					<button
						onClick={handleExportJSON}
						disabled={nodes.length === 0}
						class="btn-secondary"
						style="padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 4px;"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						{t["wf.export_json"]}
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
											d={orthogonalPath(from.x, from.y, to.x, to.y)}
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
											d={orthogonalPath(
												from.x,
												from.y,
												connectingEdge.mouseX,
												connectingEdge.mouseY,
											)}
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
												{getToolName(node.toolId)}
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

									{/* Node body: description */}
									<div style="padding: 8px 14px;">
										<div style="font-size: 11px; color: var(--color-mute); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
											{getToolDesc(node.toolId)}
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
									{t["wf.build_workflow"]}
								</p>
								<p style="font-size: 13px; color: var(--color-mute); line-height: 1.5;">
									{t["wf.drag_instructions"]}
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
									{t["wf.input"]}
								</span>
							</div>
							<textarea
								style="flex: 1; padding: 10px 16px; background: transparent; border: none; outline: none; resize: none; font-size: 13px; font-family: var(--font-mono); color: var(--color-ink);"
								placeholder={t["wf.input_placeholder"]}
								value={inputText}
								onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>

						{/* Output */}
						<div style="flex: 1; display: flex; flex-direction: column;">
							<div style="padding: 8px 16px; border-bottom: 1px solid var(--color-hairline); display: flex; align-items: center; justify-content: space-between;">
								<span style="font-size: 12px; font-weight: 600; color: var(--color-ink);">
									{t["wf.output"]}
								</span>
								{outputText && (
									<button
										onClick={handleCopyOutput}
										style="font-size: 11px; background: none; border: none; cursor: pointer; color: var(--color-primary); font-weight: 600;"
									>
										{t["wf.copy"]}
									</button>
								)}
							</div>
							<textarea
								style="flex: 1; padding: 10px 16px; background: transparent; border: none; outline: none; resize: none; font-size: 13px; font-family: var(--font-mono); color: var(--color-ink);"
								placeholder={t["wf.output_placeholder"]}
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

			{/* Hidden file input for import */}
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleImportJSON}
				accept=".json"
				style="display: none;"
			/>

			{/* Toast Notification */}
			{toast && (
				<div
					style={
						"position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: var(--color-surface-card); color: var(--color-ink); border: 1px solid var(--color-hairline); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 10px 20px; border-radius: 9999px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-size: 13px; font-weight: 600; z-index: 99999; display: flex; align-items: center; gap: 10px; animation: fadeInUp 0.2s ease-out;"
					}
				>
					{toast.type === "success" ? (
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--color-accent-emerald)"
							stroke-width="3"
							style="flex-shrink: 0;"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					) : (
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--color-error)"
							stroke-width="3"
							style="flex-shrink: 0;"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
					)}
					<span>{toast.text}</span>
				</div>
			)}

			{/* Custom animations */}
			<style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
		</div>
	);
}
