import { load } from "js-yaml";
import { useCallback, useEffect, useState } from "preact/hooks";

export default function SwaggerViewer() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const defaultYaml = `openapi: 3.0.0
info:
  title: Sample Petstore API
  description: A sample API to illustrate OpenAPI/Swagger viewer capabilities.
  version: 1.0.1
servers:
  - url: https://api.petstore.example.com/v1
    description: Production server
  - url: https://staging-api.petstore.example.com/v1
    description: Staging server
paths:
  /pets:
    get:
      summary: List all pets
      description: Returns a list of all pets in the store database.
      parameters:
        - name: limit
          in: query
          description: How many items to return at one time (max 100)
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: A successful response matching pet list.
    post:
      summary: Create a pet
      description: Add a new pet record to the store repository.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                tag:
                  type: string
      responses:
        '201':
          description: Pet created successfully.
  /pets/{petId}:
    get:
      summary: Info for a specific pet
      parameters:
        - name: petId
          in: path
          required: true
          description: The id of the pet to retrieve
          schema:
            type: string
      responses:
        '200':
          description: Expected response to a valid request.`;

	const [inputText, setInputText] = useState(defaultYaml);
	const [parsedDoc, setParsedDoc] = useState<any>(null);
	const [parseError, setParseError] = useState<string | null>(null);

	const t = {
		en: {
			title: "OpenAPI & Swagger Specification Viewer",
			lblInput: "OpenAPI Specification (YAML or JSON)",
			lblOutput: "API Documentation Preview",
			placeholderSpec: "Paste OpenAPI YAML or JSON specification here...",
			errParse: "Error parsing OpenAPI spec: ",
			lblServers: "Servers",
			lblParameters: "Parameters",
			lblRequestBody: "Request Body",
			lblResponses: "Responses",
			colName: "Name",
			colIn: "Location",
			colRequired: "Required",
			colType: "Type",
			colDesc: "Description",
			clearBtn: "Clear",
			demoBtn: "Load Demo Spec",
		},
		vi: {
			title: "Trình xem đặc tả OpenAPI & Swagger",
			lblInput: "Đặc tả OpenAPI (Định dạng YAML hoặc JSON)",
			lblOutput: "Giao diện tài liệu API sinh ra",
			placeholderSpec: "Dán mã đặc tả OpenAPI YAML hoặc JSON vào đây...",
			errParse: "Lỗi phân tích cú pháp OpenAPI: ",
			lblServers: "Danh sách máy chủ (Servers)",
			lblParameters: "Các tham số (Parameters)",
			lblRequestBody: "Nội dung yêu cầu (Request Body)",
			lblResponses: "Phản hồi đầu ra (Responses)",
			colName: "Tên tham số",
			colIn: "Vị trí",
			colRequired: "Bắt buộc",
			colType: "Kiểu dữ liệu",
			colDesc: "Mô tả",
			clearBtn: "Xóa sạch",
			demoBtn: "Tải bản mẫu demo",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const handleParse = useCallback(() => {
		setParseError(null);
		setParsedDoc(null);

		const text = inputText.trim();
		if (!text) return;

		try {
			let doc: any;
			if (text.startsWith("{")) {
				doc = JSON.parse(text);
			} else {
				doc = load(text);
			}

			if (!doc || typeof doc !== "object") {
				throw new Error("Invalid spec structure. Expected an object.");
			}

			// Simple OpenAPI structure validation
			if (!doc.openapi && !doc.swagger) {
				throw new Error("Missing openapi or swagger version declaration.");
			}

			setParsedDoc(doc);
		} catch (err: any) {
			setParseError(err.message || "Failed to parse spec");
		}
	}, [inputText]);

	useEffect(() => {
		handleParse();
	}, [handleParse]);

	const getMethodBadgeClass = (method: string) => {
		switch (method.toLowerCase()) {
			case "get":
				return "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald";
			case "post":
				return "bg-primary/10 border-primary/20 text-primary";
			case "put":
				return "bg-warning/10 border-warning/20 text-warning";
			case "delete":
				return "bg-accent-rose/10 border-accent-rose/20 text-accent-rose";
			case "patch":
				return "bg-indigo-500/10 border-indigo-500/20 text-indigo-500";
			default:
				return "bg-surface-soft border-hairline text-ink";
		}
	};

	const loadDemo = () => {
		setInputText(defaultYaml);
	};

	return (
		<div class="space-y-6">
			{/* Controls */}
			<div class="flex gap-2 justify-end">
				<button class="btn-secondary py-1.5 px-3 text-xs" onClick={loadDemo}>
					{t.demoBtn}
				</button>
				<button class="btn-tertiary py-1.5 px-3 text-xs" onClick={() => setInputText("")}>
					{t.clearBtn}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input Column */}
				<div class="lg:col-span-5 space-y-2">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<textarea
							class={`textarea font-mono text-body-sm w-full ${
								parseError ? "border-accent-rose focus:border-accent-rose" : ""
							}`}
							style={{ minHeight: "550px" }}
							placeholder={t.placeholderSpec}
							value={inputText}
							onInput={(e) => setInputText((e.target as HTMLTextAreaElement).value)}
						/>
						{parseError && (
							<p class="text-xs font-bold text-accent-rose mt-1">
								{t.errParse} {parseError}
							</p>
						)}
					</div>
				</div>

				{/* Documentation Viewer Column */}
				<div class="lg:col-span-7 space-y-4">
					{parsedDoc ? (
						<div class="bg-surface-elevated rounded-lg p-6 border border-hairline shadow-sm space-y-6">
							{/* API Info */}
							<div class="border-b border-hairline pb-4 space-y-1">
								<h2 class="text-title-md font-bold text-ink">
									{parsedDoc.info?.title || "API Documentation"}
								</h2>
								<p class="text-xs font-bold text-primary">
									Version {parsedDoc.info?.version || "1.0.0"}
								</p>
								{parsedDoc.info?.description && (
									<p class="text-body-sm text-muted mt-2 whitespace-pre-line">
										{parsedDoc.info.description}
									</p>
								)}
							</div>

							{/* Servers */}
							{parsedDoc.servers && parsedDoc.servers.length > 0 && (
								<div class="space-y-2">
									<h3 class="text-body-strong text-ink font-bold">{t.lblServers}</h3>
									<div class="space-y-2">
										{parsedDoc.servers.map((srv: any, idx: number) => (
											<div
												key={idx}
												class="p-3 bg-surface-soft border border-hairline rounded-lg font-mono text-xs text-ink"
											>
												<span class="font-bold text-primary">{srv.url}</span>
												{srv.description && (
													<div class="text-muted mt-1 text-[11px]">{srv.description}</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* API Endpoints */}
							<div class="space-y-4 pt-2">
								{Object.entries(parsedDoc.paths || {}).map(([path, pathItem]: [string, any]) => (
									<div key={path} class="space-y-4">
										{Object.entries(pathItem).map(([method, op]: [string, any]) => {
											if (
												!["get", "post", "put", "delete", "patch", "options", "head"].includes(
													method.toLowerCase(),
												)
											) {
												return null;
											}

											return (
												<div
													key={method}
													class="border border-hairline rounded-lg p-5 bg-surface-soft/30 space-y-3"
												>
													{/* Method / Path Bar */}
													<div class="flex flex-wrap items-center gap-3">
														<span
															class={`px-2.5 py-1 text-xs font-bold uppercase border rounded-md ${getMethodBadgeClass(
																method,
															)}`}
														>
															{method}
														</span>
														<span class="font-mono text-body-sm-strong text-ink font-bold">
															{path}
														</span>
													</div>

													{/* Operation Summary */}
													{(op.summary || op.description) && (
														<div class="space-y-1">
															{op.summary && (
																<h4 class="text-body-sm-strong text-ink font-bold">{op.summary}</h4>
															)}
															{op.description && (
																<p class="text-xs text-muted leading-relaxed whitespace-pre-line">
																	{op.description}
																</p>
															)}
														</div>
													)}

													{/* Parameters */}
													{op.parameters && op.parameters.length > 0 && (
														<div class="space-y-1.5 pt-2 border-t border-hairline/50">
															<span class="text-xs font-bold text-ink uppercase tracking-wider">
																{t.lblParameters}
															</span>
															<div class="overflow-x-auto border border-hairline rounded-md bg-surface-elevated">
																<table class="w-full text-left border-collapse text-xs">
																	<thead>
																		<tr class="bg-surface-soft border-b border-hairline text-ink font-bold">
																			<th class="p-2">{t.colName}</th>
																			<th class="p-2">{t.colIn}</th>
																			<th class="p-2">{t.colRequired}</th>
																			<th class="p-2">{t.colType}</th>
																			<th class="p-2">{t.colDesc}</th>
																		</tr>
																	</thead>
																	<tbody class="divide-y divide-hairline font-mono text-ink">
																		{op.parameters.map((param: any, pIdx: number) => (
																			<tr key={pIdx}>
																				<td class="p-2 font-bold text-primary">{param.name}</td>
																				<td class="p-2 text-muted">{param.in}</td>
																				<td class="p-2">
																					<span
																						class={
																							param.required
																								? "text-accent-rose font-bold"
																								: "text-muted"
																						}
																					>
																						{param.required ? "Yes" : "No"}
																					</span>
																				</td>
																				<td class="p-2 text-muted">
																					{param.schema?.type || "any"}
																				</td>
																				<td class="p-2 font-sans text-muted">
																					{param.description || "-"}
																				</td>
																			</tr>
																		))}
																	</tbody>
																</table>
															</div>
														</div>
													)}

													{/* Request Body */}
													{op.requestBody && (
														<div class="space-y-1.5 pt-2 border-t border-hairline/50">
															<span class="text-xs font-bold text-ink uppercase tracking-wider">
																{t.lblRequestBody}
															</span>
															<div class="p-3 bg-surface-elevated border border-hairline rounded-md space-y-2">
																{op.requestBody.description && (
																	<p class="text-xs text-muted">{op.requestBody.description}</p>
																)}
																{op.requestBody.content &&
																	Object.entries(op.requestBody.content).map(
																		([mType, val]: [string, any]) => (
																			<div key={mType} class="text-xs space-y-1">
																				<div class="font-mono text-[11px] text-muted">
																					Content-Type:{" "}
																					<span class="text-primary font-bold">{mType}</span>
																				</div>
																				{val.schema && (
																					<pre class="bg-surface-soft font-mono text-[10px] p-2 rounded border border-hairline overflow-x-auto text-ink">
																						{JSON.stringify(val.schema, null, 2)}
																					</pre>
																				)}
																			</div>
																		),
																	)}
															</div>
														</div>
													)}

													{/* Responses */}
													{op.responses && (
														<div class="space-y-2 pt-2 border-t border-hairline/50">
															<span class="text-xs font-bold text-ink uppercase tracking-wider">
																{t.lblResponses}
															</span>
															<div class="space-y-2">
																{Object.entries(op.responses).map(([code, resp]: [string, any]) => (
																	<div
																		key={code}
																		class="p-3 bg-surface-elevated border border-hairline rounded-md space-y-1.5"
																	>
																		<div class="flex items-center gap-2">
																			<span
																				class={`font-mono font-bold text-xs ${code.startsWith("2") ? "text-accent-emerald" : "text-accent-rose"}`}
																			>
																				{code}
																			</span>
																			<span class="text-xs font-bold text-ink">
																				{resp.description}
																			</span>
																		</div>
																		{resp.content &&
																			Object.entries(resp.content).map(
																				([mType, val]: [string, any]) => (
																					<div key={mType} class="text-[11px] pt-1">
																						<span class="font-mono text-muted">Type: {mType}</span>
																						{val.schema && (
																							<pre class="bg-surface-soft font-mono text-[9px] p-2 mt-1 rounded border border-hairline overflow-x-auto text-ink">
																								{JSON.stringify(val.schema, null, 2)}
																							</pre>
																						)}
																					</div>
																				),
																			)}
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											);
										})}
									</div>
								))}
							</div>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm text-center py-12 text-muted text-body-sm">
							Provide a valid OpenAPI/Swagger specification on the left to view documentation.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
