import { useState, useMemo } from "preact/hooks";

function xmlToJson(xml: string): any {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const errorNode = doc.querySelector("parsererror");
	if (errorNode) throw new Error("Invalid XML");
	return elementToObj(doc.documentElement);
}

function elementToObj(el: Element): any {
	const obj: any = {};
	if (el.attributes) {
		for (let i = 0; i < el.attributes.length; i++) {
			obj[`@${el.attributes[i].name}`] = el.attributes[i].value;
		}
	}
	const children = el.childNodes;
	if (children.length === 1 && children[0].nodeType === 3) return el.textContent?.trim() || "";
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.nodeType !== 1) continue;
		const childEl = child as Element;
		const value = elementToObj(childEl);
		if (obj[childEl.nodeName]) {
			if (!Array.isArray(obj[childEl.nodeName])) obj[childEl.nodeName] = [obj[childEl.nodeName]];
			obj[childEl.nodeName].push(value);
		} else obj[childEl.nodeName] = value;
	}
	return obj;
}

export default function XmlToJson() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		try {
			return JSON.stringify(xmlToJson(input), null, 2);
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
					<label class="text-caption-uppercase text-muted block mb-2">XML Input</label>
					<textarea
						class="textarea"
						style="min-height: 300px; font-family: var(--font-mono)"
						placeholder="<root><name>John</name><age>30</age></root>"
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
