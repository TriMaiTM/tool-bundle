import { useState, useMemo } from "preact/hooks";
import yaml from "js-yaml";

export default function YamlToJson() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			const parsed = yaml.load(input);
			return JSON.stringify(parsed, null, 2);
		} catch (e: any) {
			return `Error: ${e.message}`;
		}
	}, [input]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Error")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">YAML Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						placeholder="server:\n  host: localhost\n  port: 8080\n\ndatabase:\n  url: postgres://..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">JSON Output</label>
						{result && !result.startsWith("Error") && (
							<button
								class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
								onClick={handleCopy}
							>
								Copy
							</button>
						)}
					</div>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="JSON output..."
					/>
				</div>
			</div>
		</div>
	);
}
