import { useCallback, useEffect, useState } from "preact/hooks";

interface EnvPair {
	key: string;
	value: string;
	comment?: string;
}

export default function EnvParser() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const defaultEnv = `# Sample Environment Config
PORT=3000
DB_HOST=127.0.0.1
DB_PASS=supersecretpassword
API_KEY=xyz-998877-abc
# Feature Flags
ENABLE_LOGGING=true`;

	const [inputText, setInputText] = useState(defaultEnv);
	const [parsedPairs, setParsedPairs] = useState<EnvPair[]>([]);
	const [masked, setMasked] = useState(true);
	const [activeFormat, setActiveFormat] = useState<"table" | "json" | "shell" | "docker" | "k8s">(
		"table",
	);

	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "ENV File Parser & Converter",
			lblInput: "Raw .env content",
			lblOutput: "Parsed Output",
			btnMask: "Toggle Mask Secrets",
			btnClear: "Clear",
			btnCopy: "Copy Config",
			copied: "Copied!",
			colKey: "Variable Name",
			colVal: "Value",
			tabTable: "Table View",
			tabJson: "JSON",
			tabShell: "Shell Export",
			tabDocker: "Docker Compose",
			tabK8s: "K8s ConfigMap",
			placeholderInput: "Paste your .env file here...",
		},
		vi: {
			title: "Trình phân tích & Chuyển đổi tệp .env",
			lblInput: "Nội dung tệp .env thô",
			lblOutput: "Kết quả phân tích",
			btnMask: "Ẩn / Hiện mật khẩu/khóa",
			btnClear: "Xóa sạch",
			btnCopy: "Sao chép cấu hình",
			copied: "Đã copy!",
			colKey: "Tên biến",
			colVal: "Giá trị",
			tabTable: "Bảng dữ liệu",
			tabJson: "Định dạng JSON",
			tabShell: "Lệnh Export Shell",
			tabDocker: "Docker Compose",
			tabK8s: "K8s ConfigMap",
			placeholderInput: "Dán nội dung tệp .env của bạn vào đây...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleParse = useCallback(() => {
		const lines = inputText.split("\n");
		const pairs: EnvPair[] = [];

		for (let line of lines) {
			line = line.trim();
			if (!line) continue;

			// Handle comments
			if (line.startsWith("#")) {
				continue;
			}

			const equalIndex = line.indexOf("=");
			if (equalIndex === -1) continue;

			const key = line.substring(0, equalIndex).trim();
			let value = line.substring(equalIndex + 1).trim();

			// Remove surrounding quotes if any
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.substring(1, value.length - 1);
			}

			if (key) {
				pairs.push({ key, value });
			}
		}

		setParsedPairs(pairs);
	}, [inputText]);

	useEffect(() => {
		handleParse();
	}, [handleParse]);

	// Convert helper
	const getFormattedOutput = (): string => {
		if (activeFormat === "json") {
			const obj: Record<string, string> = {};
			for (const pair of parsedPairs) {
				obj[pair.key] = pair.value;
			}
			return JSON.stringify(obj, null, 2);
		}

		if (activeFormat === "shell") {
			return parsedPairs.map((p) => `export ${p.key}="${p.value}"`).join("\n");
		}

		if (activeFormat === "docker") {
			let res = "environment:\n";
			for (const p of parsedPairs) {
				res += `  - ${p.key}=${p.value}\n`;
			}
			return res;
		}

		if (activeFormat === "k8s") {
			let res = "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: my-app-config\ndata:\n";
			for (const p of parsedPairs) {
				res += `  ${p.key}: "${p.value}"\n`;
			}
			return res;
		}

		return "";
	};

	const handleCopy = () => {
		const text = getFormattedOutput();
		if (!text) return;
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const maskValue = (val: string): string => {
		if (!masked) return val;
		if (val.length <= 4) return "••••";
		return `${val.substring(0, 2)}••••${val.substring(val.length - 2)}`;
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input Column */}
				<div class="lg:col-span-5 space-y-2">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<div class="flex justify-between items-center">
							<label class="text-body-sm-strong text-ink">{t.lblInput}</label>
							<button class="btn-tertiary text-xs py-1 px-3" onClick={() => setInputText("")}>
								{t.btnClear}
							</button>
						</div>
						<textarea
							class="textarea font-mono text-body-sm w-full"
							style={{ minHeight: "450px" }}
							placeholder={t.placeholderInput}
							value={inputText}
							onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
						/>
					</div>
				</div>

				{/* Output Parser Tabbed Column */}
				<div class="lg:col-span-7 space-y-4">
					<div class="flex border-b border-hairline gap-2 flex-wrap">
						<button
							class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
								activeFormat === "table"
									? "border-primary text-primary"
									: "border-transparent text-muted hover:text-ink"
							}`}
							onClick={() => setActiveFormat("table")}
						>
							{t.tabTable}
						</button>
						<button
							class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
								activeFormat === "json"
									? "border-primary text-primary"
									: "border-transparent text-muted hover:text-ink"
							}`}
							onClick={() => setActiveFormat("json")}
						>
							{t.tabJson}
						</button>
						<button
							class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
								activeFormat === "shell"
									? "border-primary text-primary"
									: "border-transparent text-muted hover:text-ink"
							}`}
							onClick={() => setActiveFormat("shell")}
						>
							{t.tabShell}
						</button>
						<button
							class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
								activeFormat === "docker"
									? "border-primary text-primary"
									: "border-transparent text-muted hover:text-ink"
							}`}
							onClick={() => setActiveFormat("docker")}
						>
							{t.tabDocker}
						</button>
						<button
							class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
								activeFormat === "k8s"
									? "border-primary text-primary"
									: "border-transparent text-muted hover:text-ink"
							}`}
							onClick={() => setActiveFormat("k8s")}
						>
							{t.tabK8s}
						</button>
					</div>

					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						{activeFormat === "table" ? (
							<div class="space-y-4">
								<div class="flex justify-end">
									<button
										class="btn-secondary py-1 px-3 text-xs font-bold"
										onClick={() => setMasked(!masked)}
									>
										{t.btnMask}
									</button>
								</div>

								<div class="overflow-x-auto border border-hairline rounded-lg">
									<table class="w-full text-left border-collapse text-body-sm font-mono">
										<thead>
											<tr class="bg-surface-soft border-b border-hairline text-ink">
												<th class="p-3 font-bold">{t.colKey}</th>
												<th class="p-3 font-bold">{t.colVal}</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-hairline">
											{parsedPairs.length > 0 ? (
												parsedPairs.map((pair, idx) => (
													<tr key={idx} class="hover:bg-surface-soft/50 text-ink">
														<td class="p-3 font-bold text-primary">{pair.key}</td>
														<td class="p-3 break-all">{maskValue(pair.value)}</td>
													</tr>
												))
											) : (
												<tr>
													<td colspan={2} class="p-8 text-center text-muted font-sans">
														No variables detected. Write or paste a valid .env configuration.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div class="space-y-3">
								<div class="flex justify-end">
									<button
										class="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer font-bold rounded-full"
										onClick={handleCopy}
									>
										{copied ? t.copied : t.btnCopy}
									</button>
								</div>
								<textarea
									class="textarea font-mono text-body-sm w-full bg-surface-soft"
									style={{ minHeight: "350px" }}
									readOnly
									value={getFormattedOutput()}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
