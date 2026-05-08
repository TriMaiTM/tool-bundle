import { useCallback, useMemo, useState } from "preact/hooks";

export default function SlugGenerator() {
	const [text, setText] = useState("");
	const [separator, setSeparator] = useState("-");
	const [lowercase, setLowercase] = useState(true);

	const result = useMemo(() => {
		if (!text.trim()) return "";
		let slug = text
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-zA-Z0-9\s-]/g, "")
			.trim()
			.replace(/[\s-]+/g, separator);
		if (lowercase) slug = slug.toLowerCase();
		return slug;
	}, [text, separator, lowercase]);

	const handleCopy = useCallback(async () => {
		if (result) await navigator.clipboard.writeText(result);
	}, [result]);

	return (
		<div>
			<div class="flex flex-wrap items-center gap-4 mb-6">
				<label class="flex items-center gap-2 text-body-sm text-body">
					<span class="text-muted">Separator:</span>
					<select
						class="input"
						style="width: auto; height: 36px"
						value={separator}
						onChange={(e) => setSeparator((e.target as HTMLSelectElement).value)}
					>
						<option value="-">Hyphen (-)</option>
						<option value="_">Underscore (_)</option>
						<option value=".">Dot (.)</option>
					</select>
				</label>
				<label class="flex items-center gap-2 text-body-sm text-body cursor-pointer">
					<input
						type="checkbox"
						checked={lowercase}
						onChange={(e) => setLowercase((e.target as HTMLInputElement).checked)}
					/>
					Lowercase
				</label>
			</div>

			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Input</label>
				<textarea
					class="textarea"
					style="min-height: 150px"
					placeholder="Enter text to convert to URL slug...\ne.g. Hello World! This is a Test"
					value={text}
					onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Slug</label>
					{result && (
						<button
							class="text-body-sm text-primary hover:text-primary-active transition-colors"
							onClick={handleCopy}
						>
							Copy
						</button>
					)}
				</div>
				<textarea
					class="textarea"
					style="min-height: 60px; font-family: var(--font-mono)"
					value={result}
					readOnly
					placeholder="slug-will-appear-here"
				/>
			</div>
		</div>
	);
}
