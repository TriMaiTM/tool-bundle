import { useState, useCallback, useMemo } from "preact/hooks";
import {
	type WorkflowStep,
	type StepResult,
	workflowTools,
	workflowTemplates,
	getToolsByCategory,
	createStepId,
	executeWorkflow,
} from "../../utils/workflow";

export default function WorkflowBuilder() {
	const [steps, setSteps] = useState<WorkflowStep[]>([]);
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [running, setRunning] = useState(false);
	const [results, setResults] = useState<StepResult[]>([]);
	const [currentStep, setCurrentStep] = useState(-1);
	const [selectedTemplate, setSelectedTemplate] = useState("");
	const [showToolPicker, setShowToolPicker] = useState(false);
	const [error, setError] = useState("");

	const toolsByCategory = useMemo(() => getToolsByCategory(), []);

	const handleSelectTemplate = useCallback((templateId: string) => {
		setSelectedTemplate(templateId);
		const template = workflowTemplates.find((t) => t.id === templateId);
		if (template) {
			setSteps(
				template.steps.map((s) => ({
					id: createStepId(),
					toolId: s.toolId,
					settings: s.settings,
				})),
			);
		}
		setOutput("");
		setResults([]);
		setError("");
	}, []);

	const handleAddStep = useCallback((toolId: string) => {
		setSteps((prev) => [...prev, { id: createStepId(), toolId }]);
		setShowToolPicker(false);
		setSelectedTemplate("");
		setOutput("");
		setResults([]);
	}, []);

	const handleRemoveStep = useCallback((id: string) => {
		setSteps((prev) => prev.filter((s) => s.id !== id));
		setSelectedTemplate("");
		setOutput("");
		setResults([]);
	}, []);

	const handleMoveStep = useCallback((index: number, direction: -1 | 1) => {
		setSteps((prev) => {
			const newSteps = [...prev];
			const targetIndex = index + direction;
			if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
			[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
			return newSteps;
		});
		setSelectedTemplate("");
		setOutput("");
		setResults([]);
	}, []);

	const handleRun = useCallback(async () => {
		if (steps.length === 0 || !input.trim()) return;
		setRunning(true);
		setOutput("");
		setResults([]);
		setError("");
		setCurrentStep(-1);

		const {
			results: stepResults,
			finalOutput,
			success,
		} = await executeWorkflow(
			steps,
			input,
			(index) => setCurrentStep(index),
			() => {},
			(_, err) => setError(err),
		);

		setResults(stepResults);
		setCurrentStep(-1);

		if (success) {
			setOutput(finalOutput);
		} else {
			setError(stepResults.find((r) => !r.success)?.error || "Unknown error");
		}
		setRunning(false);
	}, [steps, input]);

	const handleCopyOutput = useCallback(async () => {
		if (output) await navigator.clipboard.writeText(output);
	}, [output]);

	const handleClear = useCallback(() => {
		setSteps([]);
		setInput("");
		setOutput("");
		setResults([]);
		setError("");
		setSelectedTemplate("");
		setCurrentStep(-1);
	}, []);

	return (
		<div>
			{/* Template Selector */}
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Quick Start Templates</label>
				<div class="flex flex-wrap gap-2">
					{workflowTemplates.map((t) => (
						<button
							class={selectedTemplate === t.id ? "btn-primary" : "btn-secondary"}
							style="padding: 6px 14px; font-size: 13px;"
							onClick={() => handleSelectTemplate(t.id)}
						>
							{t.name}
						</button>
					))}
				</div>
			</div>

			{/* Steps */}
			<div class="mb-6">
				<div class="flex items-center justify-between mb-3">
					<label class="text-caption-uppercase text-muted">Pipeline Steps ({steps.length})</label>
					{steps.length > 0 && (
						<button
							class="btn-tertiary"
							style="padding: 4px 10px; font-size: 12px;"
							onClick={handleClear}
						>
							Clear All
						</button>
					)}
				</div>

				{steps.length === 0 && (
					<div class="text-body-sm text-muted text-center py-8 bg-surface-card rounded-lg border border-hairline">
						Select a template above or add steps manually
					</div>
				)}

				<div class="space-y-3">
					{steps.map((step, index) => {
						const tool = workflowTools[step.toolId];
						const isActive = running && currentStep === index;
						const result = results[index];
						return (
							<div key={step.id}>
								{index > 0 && (
									<div class="flex items-center justify-center py-1">
										<svg
											class="w-4 h-4 text-muted"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<line x1="12" y1="5" x2="12" y2="19" />
											<polyline points="19 12 12 19 5 12" />
										</svg>
									</div>
								)}
								<div
									class={`bg-surface-card rounded-lg border ${isActive ? "border-primary" : result && !result.success ? "border-error" : "border-hairline"} px-4 py-3`}
								>
									<div class="flex items-center gap-3">
										{/* Step number */}
										<div
											class={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-caption ${
												result?.success
													? "bg-accent-emerald/10 text-accent-emerald"
													: result && !result.success
														? "bg-error/10 text-error"
														: isActive
															? "bg-primary/10 text-primary"
															: "bg-surface-elevated text-muted"
											}`}
										>
											{result?.success ? (
												"✓"
											) : result && !result.success ? (
												"✕"
											) : isActive ? (
												<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
											) : (
												index + 1
											)}
										</div>

										{/* Tool info */}
										<div class="flex-1 min-w-0">
											<div class="text-body-sm-strong text-on-dark">
												{tool?.name || step.toolId}
											</div>
											<div class="text-caption text-muted">{tool?.description || ""}</div>
											{result?.success && (
												<div class="text-caption text-accent-emerald mt-1">
													Done in {result.duration}ms
												</div>
											)}
											{result && !result.success && (
												<div class="text-caption text-error mt-1">{result.error}</div>
											)}
										</div>

										{/* Actions */}
										{!running && (
											<div class="flex items-center gap-1">
												<button
													class="text-muted hover:text-on-dark transition-colors"
													style="padding: 4px; background: none; border: none; cursor: pointer;"
													onClick={() => handleMoveStep(index, -1)}
													disabled={index === 0}
													aria-label="Move up"
												>
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<polyline points="18 15 12 9 6 15" />
													</svg>
												</button>
												<button
													class="text-muted hover:text-on-dark transition-colors"
													style="padding: 4px; background: none; border: none; cursor: pointer;"
													onClick={() => handleMoveStep(index, 1)}
													disabled={index === steps.length - 1}
													aria-label="Move down"
												>
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<polyline points="6 9 12 15 18 9" />
													</svg>
												</button>
												<button
													class="text-muted hover:text-error transition-colors"
													style="padding: 4px; background: none; border: none; cursor: pointer;"
													onClick={() => handleRemoveStep(step.id)}
													aria-label="Remove step"
												>
													<svg
														class="w-4 h-4"
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
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Add Step */}
				{!running && (
					<div class="mt-3">
						{!showToolPicker ? (
							<button
								class="btn-secondary"
								style="padding: 6px 14px; font-size: 13px;"
								onClick={() => setShowToolPicker(true)}
							>
								+ Add Step
							</button>
						) : (
							<div class="bg-surface-card rounded-lg border border-hairline p-4">
								<div class="flex items-center justify-between mb-3">
									<span class="text-body-sm-strong text-on-dark">Select a tool</span>
									<button
										class="text-muted hover:text-on-dark"
										style="background: none; border: none; cursor: pointer;"
										onClick={() => setShowToolPicker(false)}
									>
										<svg
											class="w-4 h-4"
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
								<div class="space-y-4">
									{Object.entries(toolsByCategory).map(([cat, tools]) => (
										<div key={cat}>
											<div class="text-caption-uppercase text-muted mb-2">{cat}</div>
											<div class="flex flex-wrap gap-2">
												{tools.map((tool) => (
													<button
														class="btn-secondary"
														style="padding: 4px 10px; font-size: 12px;"
														onClick={() => handleAddStep(tool.id)}
													>
														{tool.name}
													</button>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Input */}
			<div class="mb-6">
				<label class="text-caption-uppercase text-muted block mb-2">Input</label>
				<textarea
					class="textarea"
					style="min-height: 150px; font-family: var(--font-mono)"
					placeholder="Paste your input text here..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					disabled={running}
				/>
			</div>

			{/* Run Button */}
			<div class="flex flex-wrap gap-3 mb-6">
				<button
					class="btn-primary"
					onClick={handleRun}
					disabled={running || steps.length === 0 || !input.trim()}
				>
					{running ? "Running..." : `Run Pipeline (${steps.length} steps)`}
				</button>
				<button class="btn-secondary" onClick={handleClear} disabled={running}>
					Reset
				</button>
			</div>

			{/* Error */}
			{error && (
				<div class="bg-error/10 border border-error/30 rounded-lg p-4 mb-6">
					<div class="text-body-sm" style="color: var(--color-error);">
						{error}
					</div>
				</div>
			)}

			{/* Output */}
			{(output || results.length > 0) && (
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Output</label>
						{output && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopyOutput}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 150px; font-family: var(--font-mono)"
						value={output}
						readOnly
						placeholder="Output will appear here..."
					/>

					{/* Step results summary */}
					{results.length > 0 && (
						<div class="mt-4 text-caption text-muted">
							{results.filter((r) => r.success).length}/{results.length} steps completed
							{" · "}
							Total: {results.reduce((sum, r) => sum + r.duration, 0)}ms
						</div>
					)}
				</div>
			)}
		</div>
	);
}
