import { useCallback, useEffect, useState } from "preact/hooks";

interface Preset {
	html: string;
	css: string;
	js: string;
}

export default function HtmlSandbox() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const presets: Record<string, Preset> = {
		counter: {
			html: `<h3>Interactive Counter</h3>
<button id="counter-btn">Count: 0</button>`,
			css: `body {
  font-family: sans-serif;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
}
button {
  background: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 9999px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: transform 0.1s;
}
button:active {
  transform: scale(0.95);
}`,
			js: `let count = 0;
const btn = document.getElementById('counter-btn');
btn.addEventListener('click', () => {
  count++;
  btn.innerText = 'Count: ' + count;
});`,
		},
		clock: {
			html: `<div class="clock-card">
  <div id="time">00:00:00</div>
</div>`,
			css: `body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
  background: #0f172a;
}
.clock-card {
  background: #1e293b;
  padding: 30px 50px;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}
#time {
  font-family: monospace;
  font-size: 3.5rem;
  color: #38bdf8;
  text-shadow: 0 0 10px #38bdf8;
}`,
			js: `function updateClock() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  document.getElementById('time').innerText = timeStr;
}
updateClock();
setInterval(updateClock, 1000);`,
		},
	};

	const [activePreset, setActivePreset] = useState<keyof typeof presets>("counter");
	const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

	const [htmlCode, setHtmlCode] = useState(presets.counter.html);
	const [cssCode, setCssCode] = useState(presets.counter.css);
	const [jsCode, setJsCode] = useState(presets.counter.js);

	const [srcDoc, setSrcDoc] = useState("");

	const t = {
		en: {
			title: "HTML / CSS / JS Sandbox",
			presetTitle: "Load Preset Templates",
			presetCounter: "Interactive Button",
			presetClock: "Neo-Digital Clock",
			btnRun: "Run / Update Preview",
			btnClear: "Clear Code",
			lblPreview: "Real-time Sandbox Preview",
			placeholderHtml: "Write your HTML structure here...",
			placeholderCss: "Write your custom CSS styles here...",
			placeholderJs: "Write your JavaScript interactive code here...",
		},
		vi: {
			title: "Hộp cát lập trình HTML / CSS / JS",
			presetTitle: "Mẫu giao diện sẵn có",
			presetCounter: "Nút bấm tăng số",
			presetClock: "Đồng hồ số Neon",
			btnRun: "Cập nhật kết quả",
			btnClear: "Xóa sạch mã",
			lblPreview: "Kết quả xem trước (Preview)",
			placeholderHtml: "Viết thẻ cấu trúc HTML của bạn vào đây...",
			placeholderCss: "Viết mã định dạng CSS của bạn vào đây...",
			placeholderJs: "Viết mã lệnh tương tác JavaScript của bạn vào đây...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleRun = useCallback(() => {
		const compiledDoc = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 16px; color: #1f2937; }
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch (err) {
      console.error(err);
      document.body.innerHTML += '<div style="color: #ef4444; margin-top: 20px; font-family: monospace; font-weight: bold; padding: 10px; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 8px;">JavaScript Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
		setSrcDoc(compiledDoc);
	}, [htmlCode, cssCode, jsCode]);

	useEffect(() => {
		handleRun();
	}, [handleRun]);

	const loadPreset = (key: keyof typeof presets) => {
		setActivePreset(key);
		const p = presets[key];
		setHtmlCode(p.html);
		setCssCode(p.css);
		setJsCode(p.js);
	};

	const handleClear = () => {
		setHtmlCode("");
		setCssCode("");
		setJsCode("");
		setSrcDoc("");
	};

	return (
		<div class="space-y-6">
			{/* Preset Bar */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex flex-wrap gap-4 items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-body-sm-strong text-muted">{t.presetTitle}:</span>
					<button
						class={`btn-secondary py-1.5 px-3 text-xs ${activePreset === "counter" ? "border-primary text-primary" : ""}`}
						onClick={() => loadPreset("counter")}
					>
						{t.presetCounter}
					</button>
					<button
						class={`btn-secondary py-1.5 px-3 text-xs ${activePreset === "clock" ? "border-primary text-primary" : ""}`}
						onClick={() => loadPreset("clock")}
					>
						{t.presetClock}
					</button>
				</div>
				<button class="btn-tertiary text-xs py-1.5 px-3" onClick={handleClear}>
					{t.btnClear}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
				{/* Editor Panels Column */}
				<div class="lg:col-span-6 flex flex-col space-y-4">
					<div class="bg-surface-elevated rounded-lg border border-hairline shadow-sm overflow-hidden flex flex-col flex-1">
						{/* Editor tabs */}
						<div class="flex bg-surface-soft border-b border-hairline px-3 pt-2 gap-1">
							{(
								[
									{ key: "html", label: "HTML" },
									{ key: "css", label: "CSS" },
									{ key: "js", label: "JavaScript" },
								] as const
							).map((tab) => (
								<button
									key={tab.key}
									class={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
										activeTab === tab.key
											? "bg-surface-elevated text-primary border-t border-x border-hairline"
											: "text-muted hover:text-ink"
									}`}
									onClick={() => setActiveTab(tab.key)}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Textarea fields */}
						<div class="p-5 flex-1 flex flex-col">
							{activeTab === "html" && (
								<textarea
									class="textarea font-mono text-body-sm w-full flex-1"
									style={{ minHeight: "350px" }}
									placeholder={t.placeholderHtml}
									value={htmlCode}
									onInput={(e) => setHtmlCode((e.target as HTMLTextAreaElement).value)}
								/>
							)}
							{activeTab === "css" && (
								<textarea
									class="textarea font-mono text-body-sm w-full flex-1"
									style={{ minHeight: "350px" }}
									placeholder={t.placeholderCss}
									value={cssCode}
									onInput={(e) => setCssCode((e.target as HTMLTextAreaElement).value)}
								/>
							)}
							{activeTab === "js" && (
								<textarea
									class="textarea font-mono text-body-sm w-full flex-1"
									style={{ minHeight: "350px" }}
									placeholder={t.placeholderJs}
									value={jsCode}
									onInput={(e) => setJsCode((e.target as HTMLTextAreaElement).value)}
								/>
							)}
						</div>
					</div>

					<button class="btn-primary w-full py-3 font-bold" onClick={handleRun}>
						{t.btnRun}
					</button>
				</div>

				{/* Iframe Preview Column */}
				<div class="lg:col-span-6 flex flex-col space-y-2">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex flex-col flex-1">
						<label class="text-body-sm-strong text-ink block mb-3">{t.lblPreview}</label>
						<div class="border border-hairline rounded-lg overflow-hidden bg-white flex-1 min-h-[396px] relative shadow-inner">
							<iframe
								srcDoc={srcDoc}
								sandbox="allow-scripts"
								class="w-full h-full border-none absolute inset-0 bg-white"
								title="HTML Preview Sandbox Output"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
