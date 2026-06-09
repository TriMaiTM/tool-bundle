import { useCallback, useMemo, useState } from "preact/hooks";

interface ParsedCurl {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: string;
	insecure: boolean;
	location: boolean;
}

// Simple cURL command parser
function parseCurl(curlCommand: string): ParsedCurl {
	const result: ParsedCurl = {
		url: "",
		method: "GET",
		headers: {},
		body: "",
		insecure: false,
		location: false,
	};

	const cmd = curlCommand.trim();
	if (!cmd) return result;

	// Remove line continuations (\)
	const cleanCmd = cmd.replace(/\\\n/g, " ");

	// Tokenize command while respecting single/double quotes
	const tokens: string[] = [];
	let currentToken = "";
	let inQuote: "'" | '"' | null = null;
	let escaped = false;

	for (let i = 0; i < cleanCmd.length; i++) {
		const char = cleanCmd[i];

		if (escaped) {
			currentToken += char;
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (inQuote) {
			if (char === inQuote) {
				inQuote = null;
			} else {
				currentToken += char;
			}
		} else {
			if (char === "'" || char === '"') {
				inQuote = char;
			} else if (char === " " || char === "\t") {
				if (currentToken) {
					tokens.push(currentToken);
					currentToken = "";
				}
			} else {
				currentToken += char;
			}
		}
	}
	if (currentToken) {
		tokens.push(currentToken);
	}

	// Iterate tokens to extract components
	for (let i = 1; i < tokens.length; i++) {
		const t = tokens[i];

		if (t === "-X" || t === "--request") {
			if (i + 1 < tokens.length) {
				result.method = tokens[++i].toUpperCase();
			}
		} else if (t === "-H" || t === "--header") {
			if (i + 1 < tokens.length) {
				const headerStr = tokens[++i];
				const colonIdx = headerStr.indexOf(":");
				if (colonIdx !== -1) {
					const key = headerStr.substring(0, colonIdx).trim();
					const val = headerStr.substring(colonIdx + 1).trim();
					result.headers[key] = val;
				}
			}
		} else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary") {
			if (i + 1 < tokens.length) {
				result.body = tokens[++i];
				if (result.method === "GET") {
					result.method = "POST"; // Default method to POST if data is provided
				}
			}
		} else if (t === "-k" || t === "--insecure") {
			result.insecure = true;
		} else if (t === "-L" || t === "--location") {
			result.location = true;
		} else if (t === "-u" || t === "--user") {
			if (i + 1 < tokens.length) {
				const auth = tokens[++i];
				result.headers.Authorization = `Basic ${btoa(auth)}`;
			}
		} else if (t.startsWith("http://") || t.startsWith("https://")) {
			result.url = t;
		} else if (!result.url && t && !t.startsWith("-")) {
			// Fallback: If it doesn't start with - and we don't have url yet, consider it as url
			// Clean it up from brackets/quotes if any
			result.url = t.replace(/^['"]|['"]$/g, "");
		}
	}

	if (!result.url) {
		result.url = "https://api.example.com";
	}

	return result;
}

export default function CurlConverter() {
	const [input, setInput] = useState(`curl -X POST https://api.example.com/v1/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"name": "Alice", "role": "admin"}'`);

	const [lang, setLang] = useState<"fetch" | "axios" | "python" | "go" | "php" | "rust">("fetch");
	const [copied, setCopied] = useState(false);

	const parsed = useMemo(() => parseCurl(input), [input]);

	const convertedCode = useMemo(() => {
		const { url, method, headers, body, insecure } = parsed;

		switch (lang) {
			case "fetch": {
				const hasHeaders = Object.keys(headers).length > 0;
				const hasBody = method !== "GET" && method !== "HEAD" && body;

				let code = `fetch('${url}', {\n  method: '${method}'`;

				if (hasHeaders) {
					code += ",\n  headers: {\n";
					code += Object.entries(headers)
						.map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}'`)
						.join(",\n");
					code += "\n  }";
				}

				if (hasBody) {
					// Check if it looks like JSON
					let isJson = false;
					try {
						JSON.parse(body);
						isJson = true;
					} catch {
						/* ignore */
					}

					if (isJson) {
						// Format JSON body code nicely
						const formattedJson = JSON.stringify(JSON.parse(body), null, 4);
						const indentedJson = formattedJson
							.split("\n")
							.map((l) => `    ${l}`)
							.join("\n")
							.trim();
						code += `,\n  body: JSON.stringify(${indentedJson})`;
					} else {
						code += `,\n  body: '${body.replace(/'/g, "\\'")}'`;
					}
				}

				code += `\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
				return code;
			}
			case "axios": {
				const hasHeaders = Object.keys(headers).length > 0;
				const hasBody = method !== "GET" && method !== "HEAD" && body;

				let code = `const axios = require('axios');\n\n`;
				code += `axios({\n  method: '${method.toLowerCase()}',\n  url: '${url}'`;

				if (hasHeaders) {
					code += ",\n  headers: {\n";
					code += Object.entries(headers)
						.map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}'`)
						.join(",\n");
					code += "\n  }";
				}

				if (hasBody) {
					let isJson = false;
					let parsedBody = {};
					try {
						parsedBody = JSON.parse(body);
						isJson = true;
					} catch {
						/* ignore */
					}

					if (isJson) {
						const formattedJson = JSON.stringify(parsedBody, null, 4);
						const indentedJson = formattedJson
							.split("\n")
							.map((l) => `    ${l}`)
							.join("\n")
							.trim();
						code += `,\n  data: ${indentedJson}`;
					} else {
						code += `,\n  data: '${body.replace(/'/g, "\\'")}'`;
					}
				}

				code +=
					"\n})\n.then(response => {\n  console.log(response.data);\n})\n.catch(error => {\n  console.error(error);\n});";
				return code;
			}
			case "python": {
				let code = "import requests\n";
				if (insecure) {
					code +=
						"import urllib3\nurllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)\n";
				}
				code += `\nurl = "${url}"\n`;

				const hasHeaders = Object.keys(headers).length > 0;
				if (hasHeaders) {
					code += "\nheaders = {\n";
					code += Object.entries(headers)
						.map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}"`)
						.join(",\n");
					code += "\n}\n";
				}

				const hasBody = method !== "GET" && method !== "HEAD" && body;
				if (hasBody) {
					let isJson = false;
					let parsedBody = {};
					try {
						parsedBody = JSON.parse(body);
						isJson = true;
					} catch {
						/* ignore */
					}

					if (isJson) {
						const formattedJson = JSON.stringify(parsedBody, null, 4);
						const indentedJson = formattedJson
							.split("\n")
							.map((l) => `    ${l}`)
							.join("\n")
							.trim();
						code += `\npayload = ${indentedJson.replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n`;
					} else {
						code += `\npayload = """${body}"""\n`;
					}
				}

				code += `\nresponse = requests.request(\n    "${method}",\n    url`;
				if (hasHeaders) code += ",\n    headers=headers";
				if (hasBody) {
					// Use json parameter if payload is a dict (JSON)
					let isJson = false;
					try {
						JSON.parse(body);
						isJson = true;
					} catch {
						/* ignore */
					}
					code += isJson ? ",\n    json=payload" : ",\n    data=payload";
				}
				if (insecure) code += ",\n    verify=False";
				code += "\n)\n\nprint(response.status_code)\nprint(response.text)\n";
				return code;
			}
			case "go": {
				let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n`;
				const hasBody = method !== "GET" && method !== "HEAD" && body;
				if (hasBody) {
					code += `\t"strings"\n`;
				}
				if (insecure) {
					code += `\t"crypto/tls"\n`;
				}
				code += ")\n\nfunc main() {\n";

				if (insecure) {
					code +=
						"\t// Skip verification\n\ttr := &http.Transport{\n\t\tTLSClientConfig: &tls.Config{InsecureSkipVerify: true},\n\t}\n\tclient := &http.Client{Transport: tr}\n\n";
				} else {
					code += "\tclient := &http.Client{}\n\n";
				}

				if (hasBody) {
					code += `\tpayload := strings.NewReader(\`${body.replace(/`/g, "'")}\`)\n`;
					code += `\treq, err := http.NewRequest("${method}", "${url}", payload)\n`;
				} else {
					code += `\treq, err := http.NewRequest("${method}", "${url}", nil)\n`;
				}

				code += "\tif err != nil {\n\t\tpanic(err)\n\t}\n\n";

				Object.entries(headers).forEach(([k, v]) => {
					code += `\treq.Header.Add("${k}", "${v}")\n`;
				});

				code +=
					"\n\tres, err := client.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer res.Body.Close()\n\n\tbody, err := io.ReadAll(res.Body)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\tfmt.Println(res.Status)\n\tfmt.Println(string(body))\n}\n";
				return code;
			}
			case "php": {
				let code = "<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, [\n";
				code += `    CURLOPT_URL => '${url}',\n`;
				code += "    CURLOPT_RETURNTRANSFER => true,\n";
				code += `    CURLOPT_ENCODING => '',\n`;
				code += "    CURLOPT_MAXREDIRS => 10,\n";
				code += "    CURLOPT_TIMEOUT => 0,\n";
				code += "    CURLOPT_FOLLOWLOCATION => true,\n";
				code += "    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n";
				code += `    CURLOPT_CUSTOMREQUEST => '${method}',\n`;

				const hasBody = method !== "GET" && method !== "HEAD" && body;
				if (hasBody) {
					code += `    CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',\n`;
				}

				if (insecure) {
					code += "    CURLOPT_SSL_VERIFYPEER => false,\n";
				}

				const headerList = Object.entries(headers).map(
					([k, v]) => `        '${k}: ${v.replace(/'/g, "\\'")}'`,
				);
				if (headerList.length > 0) {
					code += `    CURLOPT_HTTPHEADER => [\n${headerList.join(",\n")}\n    ],\n`;
				}

				code += `]);\n\n$response = curl_exec($curl);\n$err = curl_error($curl);\n\ncurl_close($curl);\n\nif ($err) {\n    echo "cURL Error #:" . $err;\n} else {\n    echo $response;\n}\n`;
				return code;
			}
			case "rust": {
				let code = "use std::collections::HashMap;\n\n";
				code += "#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n";
				if (insecure) {
					code +=
						"    let client = reqwest::Client::builder()\n        .danger_accept_invalid_certs(true)\n        .build()?;\n\n";
				} else {
					code += "    let client = reqwest::Client::new();\n\n";
				}

				const hasHeaders = Object.keys(headers).length > 0;
				if (hasHeaders) {
					code += "    let mut headers = reqwest::header::HeaderMap::new();\n";
					Object.entries(headers).forEach(([k, v]) => {
						code += `    headers.insert(\n        reqwest::header::HeaderName::from_bytes(b"${k.toLowerCase()}")?,\n        reqwest::header::HeaderValue::from_str("${v}")?\n    );\n`;
					});
					code += "\n";
				}

				const hasBody = method !== "GET" && method !== "HEAD" && body;
				code += `    let res = client.${method.toLowerCase()}("${url}")\n`;
				if (hasHeaders) code += "        .headers(headers)\n";
				if (hasBody) {
					let isJson = false;
					try {
						JSON.parse(body);
						isJson = true;
					} catch {
						/* ignore */
					}
					if (isJson) {
						code += `        .body(r#"${body}"#)\n        .header("content-type", "application/json")\n`;
					} else {
						code += `        .body(r#"${body}"#)\n`;
					}
				}
				code += `        .send()\n        .await?;\n\n    let body = res.text().await?;\n    println!("{}", body);\n    Ok(())\n}\n`;
				return code;
			}
			default:
				return "";
		}
	}, [parsed, lang]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(convertedCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}, [convertedCode]);

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* cURL Input */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2">
						Paste cURL Command
					</h3>
					<textarea
						class="textarea font-mono text-body-sm w-full"
						style="min-height: 300px; font-size: 12px; line-height: 1.5;"
						placeholder="Paste your curl command here... e.g. curl -X GET https://api.example.com"
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
					<div class="text-caption text-muted">
						Supported flags: <code>-X</code>, <code>--request</code>, <code>-H</code>,{" "}
						<code>--header</code>,<code>-d</code>, <code>--data</code>, <code>--data-raw</code>,{" "}
						<code>-u</code>, <code>--user</code>,<code>-k</code>, <code>--insecure</code>.
					</div>
				</div>

				{/* Target Language & Output */}
				<div class="lg:col-span-6 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-hairline pb-2 gap-2">
						<h3 class="text-body-strong text-ink">Converted Code</h3>
						<select
							class="input py-1 text-xs font-bold w-44"
							value={lang}
							onChange={(e) => setLang((e.target as HTMLSelectElement).value as any)}
						>
							<option value="fetch">JS Fetch API</option>
							<option value="axios">JS Axios</option>
							<option value="python">Python Requests</option>
							<option value="go">Go HTTP Client</option>
							<option value="php">PHP cURL</option>
							<option value="rust">Rust Reqwest</option>
						</select>
					</div>

					<div class="relative">
						<textarea
							class="textarea font-mono text-body-sm bg-surface-soft w-full"
							style="min-height: 250px; font-size: 12px; line-height: 1.6;"
							readOnly
							value={convertedCode}
						/>
					</div>

					<button
						class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
						onClick={handleCopy}
					>
						{copied ? (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
								Copied Code!
							</>
						) : (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
								Copy Code Snippet
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
