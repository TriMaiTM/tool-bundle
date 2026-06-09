import { useCallback, useEffect, useState } from "preact/hooks";

interface ValidationError {
	path: string;
	keyword: string;
	message: string;
}

export default function JsonSchemaValidator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const defaultSchema = {
		$schema: "http://json-schema.org/draft-07/schema#",
		title: "User Profile",
		type: "object",
		properties: {
			id: {
				type: "integer",
				minimum: 1,
			},
			name: {
				type: "string",
				minLength: 3,
			},
			email: {
				type: "string",
				format: "email",
			},
			role: {
				type: "string",
				enum: ["admin", "user", "guest"],
			},
			tags: {
				type: "array",
				items: {
					type: "string",
				},
				uniqueItems: true,
			},
		},
		required: ["id", "name", "email"],
		additionalProperties: false,
	};

	const defaultInstance = {
		id: 42,
		name: "Jane Doe",
		email: "jane.doe@example.com",
		role: "admin",
		tags: ["developer", "architect"],
	};

	const [schemaInput, setSchemaInput] = useState(JSON.stringify(defaultSchema, null, 2));
	const [instanceInput, setInstanceInput] = useState(JSON.stringify(defaultInstance, null, 2));

	const [schemaError, setSchemaError] = useState<string | null>(null);
	const [instanceError, setInstanceError] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
	const [isValid, setIsValid] = useState<boolean | null>(null);

	const t = {
		en: {
			title: "JSON Schema Validator",
			schemaLabel: "JSON Schema Draft-07",
			instanceLabel: "JSON Instance Data",
			validateBtn: "Validate JSON",
			clearBtn: "Clear",
			presetTitle: "Presets",
			presetUser: "User Profile",
			presetProduct: "Product Item",
			validMsg: "Success! JSON is fully valid against the schema.",
			invalidMsg: "Validation failed! Found errors below:",
			invalidJson: "Invalid JSON format",
			colPath: "Property Path",
			colKeyword: "Keyword",
			colMessage: "Validation Message",
			schemaPlaceholder: "Paste JSON Schema here...",
			instancePlaceholder: "Paste JSON Data here...",
		},
		vi: {
			title: "JSON Schema Validator",
			schemaLabel: "Cấu trúc JSON Schema",
			instanceLabel: "Dữ liệu JSON",
			validateBtn: "Kiểm tra hợp lệ",
			clearBtn: "Xóa sạch",
			presetTitle: "Mẫu sẵn có",
			presetUser: "Hồ sơ người dùng",
			presetProduct: "Thông tin sản phẩm",
			validMsg: "Thành công! Dữ liệu hợp lệ theo cấu trúc Schema.",
			invalidMsg: "Thất bại! Phát hiện lỗi kiểm tra bên dưới:",
			invalidJson: "Định dạng JSON không hợp lệ",
			colPath: "Đường dẫn",
			colKeyword: "Từ khóa",
			colMessage: "Thông báo lỗi",
			schemaPlaceholder: "Dán cấu trúc JSON Schema vào đây...",
			instancePlaceholder: "Dán dữ liệu JSON cần xác thực vào đây...",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const validateSchema = (value: any, schema: any, path = ""): ValidationError[] => {
		const errors: ValidationError[] = [];
		if (!schema || typeof schema !== "object") return errors;

		// 1. Type check
		if (schema.type) {
			const types = Array.isArray(schema.type) ? schema.type : [schema.type];
			let match = false;
			for (const t of types) {
				if (t === "null" && value === null) match = true;
				else if (t === "boolean" && typeof value === "boolean") match = true;
				else if (t === "string" && typeof value === "string") match = true;
				else if (t === "number" && typeof value === "number") match = true;
				else if (t === "integer" && Number.isInteger(value)) match = true;
				else if (
					t === "object" &&
					value !== null &&
					typeof value === "object" &&
					!Array.isArray(value)
				)
					match = true;
				else if (t === "array" && Array.isArray(value)) match = true;
			}
			if (!match) {
				errors.push({
					path: path || "/",
					keyword: "type",
					message: `should be ${types.join(" or ")}`,
				});
				return errors; // Skip child properties if base type fails
			}
		}

		// 2. Object property validation
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			if (schema.properties) {
				for (const [propName, propSchema] of Object.entries(schema.properties)) {
					if (propName in value) {
						errors.push(...validateSchema(value[propName], propSchema, `${path}/${propName}`));
					}
				}
			}
			if (schema.required && Array.isArray(schema.required)) {
				for (const req of schema.required) {
					if (!(req in value)) {
						errors.push({
							path: `${path}/${req}`,
							keyword: "required",
							message: "is required but missing",
						});
					}
				}
			}
			if (schema.additionalProperties === false && schema.properties) {
				const allowed = new Set(Object.keys(schema.properties));
				for (const key of Object.keys(value)) {
					if (!allowed.has(key)) {
						errors.push({
							path: `${path}/${key}`,
							keyword: "additionalProperties",
							message: "is not allowed to be present",
						});
					}
				}
			}
			if (
				typeof schema.minProperties === "number" &&
				Object.keys(value).length < schema.minProperties
			) {
				errors.push({
					path: path || "/",
					keyword: "minProperties",
					message: `should have at least ${schema.minProperties} properties`,
				});
			}
			if (
				typeof schema.maxProperties === "number" &&
				Object.keys(value).length > schema.maxProperties
			) {
				errors.push({
					path: path || "/",
					keyword: "maxProperties",
					message: `should have at most ${schema.maxProperties} properties`,
				});
			}
		}

		// 3. Array validation
		if (Array.isArray(value)) {
			if (schema.items) {
				if (Array.isArray(schema.items)) {
					for (let i = 0; i < schema.items.length; i++) {
						if (i < value.length) {
							errors.push(...validateSchema(value[i], schema.items[i], `${path}/${i}`));
						}
					}
				} else {
					for (let i = 0; i < value.length; i++) {
						errors.push(...validateSchema(value[i], schema.items, `${path}/${i}`));
					}
				}
			}
			if (typeof schema.minItems === "number" && value.length < schema.minItems) {
				errors.push({
					path: path || "/",
					keyword: "minItems",
					message: `should have at least ${schema.minItems} items`,
				});
			}
			if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
				errors.push({
					path: path || "/",
					keyword: "maxItems",
					message: `should have at most ${schema.maxItems} items`,
				});
			}
			if (schema.uniqueItems === true) {
				const seen = new Set();
				let hasDuplicates = false;
				for (const item of value) {
					const str = JSON.stringify(item);
					if (seen.has(str)) {
						hasDuplicates = true;
						break;
					}
					seen.add(str);
				}
				if (hasDuplicates) {
					errors.push({
						path: path || "/",
						keyword: "uniqueItems",
						message: "should not contain duplicate items",
					});
				}
			}
		}

		// 4. String validation
		if (typeof value === "string") {
			if (typeof schema.minLength === "number" && value.length < schema.minLength) {
				errors.push({
					path: path || "/",
					keyword: "minLength",
					message: `should not be shorter than ${schema.minLength} characters`,
				});
			}
			if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
				errors.push({
					path: path || "/",
					keyword: "maxLength",
					message: `should not be longer than ${schema.maxLength} characters`,
				});
			}
			if (schema.pattern) {
				try {
					const regex = new RegExp(schema.pattern);
					if (!regex.test(value)) {
						errors.push({
							path: path || "/",
							keyword: "pattern",
							message: `should match pattern "${schema.pattern}"`,
						});
					}
				} catch {
					// Invalid regex in schema
				}
			}
			if (schema.format) {
				let valid = true;
				if (schema.format === "email") {
					valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
				} else if (schema.format === "uri") {
					try {
						new URL(value);
					} catch {
						valid = false;
					}
				} else if (schema.format === "ipv4") {
					valid =
						/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
							value,
						);
				} else if (schema.format === "date-time") {
					valid = !Number.isNaN(Date.parse(value));
				}
				if (!valid) {
					errors.push({
						path: path || "/",
						keyword: "format",
						message: `should match format "${schema.format}"`,
					});
				}
			}
		}

		// 5. Number/Integer validation
		if (typeof value === "number") {
			if (typeof schema.minimum === "number" && value < schema.minimum) {
				errors.push({
					path: path || "/",
					keyword: "minimum",
					message: `should be >= ${schema.minimum}`,
				});
			}
			if (typeof schema.maximum === "number" && value > schema.maximum) {
				errors.push({
					path: path || "/",
					keyword: "maximum",
					message: `should be <= ${schema.maximum}`,
				});
			}
			if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) {
				errors.push({
					path: path || "/",
					keyword: "exclusiveMinimum",
					message: `should be > ${schema.exclusiveMinimum}`,
				});
			}
			if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) {
				errors.push({
					path: path || "/",
					keyword: "exclusiveMaximum",
					message: `should be < ${schema.exclusiveMaximum}`,
				});
			}
			if (typeof schema.multipleOf === "number" && value % schema.multipleOf !== 0) {
				errors.push({
					path: path || "/",
					keyword: "multipleOf",
					message: `should be a multiple of ${schema.multipleOf}`,
				});
			}
		}

		// 6. Enum & Const
		if (schema.enum && Array.isArray(schema.enum)) {
			const valStr = JSON.stringify(value);
			const matched = schema.enum.some((e: any) => JSON.stringify(e) === valStr);
			if (!matched) {
				errors.push({
					path: path || "/",
					keyword: "enum",
					message: `should be one of: ${schema.enum.map((e: any) => JSON.stringify(e)).join(", ")}`,
				});
			}
		}
		if (schema.const !== undefined) {
			if (JSON.stringify(value) !== JSON.stringify(schema.const)) {
				errors.push({
					path: path || "/",
					keyword: "const",
					message: `should be equal to constant "${JSON.stringify(schema.const)}"`,
				});
			}
		}

		// 7. Combinators (anyOf, allOf, oneOf, not)
		if (schema.anyOf && Array.isArray(schema.anyOf)) {
			const anyMatches = schema.anyOf.some((s: any) => validateSchema(value, s, path).length === 0);
			if (!anyMatches) {
				errors.push({
					path: path || "/",
					keyword: "anyOf",
					message: "should match at least one schema in anyOf",
				});
			}
		}
		if (schema.oneOf && Array.isArray(schema.oneOf)) {
			const matchesCount = schema.oneOf.reduce(
				(acc: number, s: any) => acc + (validateSchema(value, s, path).length === 0 ? 1 : 0),
				0,
			);
			if (matchesCount !== 1) {
				errors.push({
					path: path || "/",
					keyword: "oneOf",
					message: `should match exactly one schema in oneOf (matched ${matchesCount})`,
				});
			}
		}
		if (schema.allOf && Array.isArray(schema.allOf)) {
			for (const s of schema.allOf) {
				errors.push(...validateSchema(value, s, path));
			}
		}
		if (schema.not && typeof schema.not === "object") {
			if (validateSchema(value, schema.not, path).length === 0) {
				errors.push({
					path: path || "/",
					keyword: "not",
					message: "should NOT match schema specified in not",
				});
			}
		}

		return errors;
	};

	const handleValidate = useCallback(() => {
		setSchemaError(null);
		setInstanceError(null);
		setValidationErrors([]);
		setIsValid(null);

		let schemaObj: any;
		try {
			schemaObj = JSON.parse(schemaInput);
		} catch (err: any) {
			setSchemaError(err.message || t.invalidJson);
			return;
		}

		let instanceObj: any;
		try {
			instanceObj = JSON.parse(instanceInput);
		} catch (err: any) {
			setInstanceError(err.message || t.invalidJson);
			return;
		}

		const errors = validateSchema(instanceObj, schemaObj, "");
		setValidationErrors(errors);
		setIsValid(errors.length === 0);
	}, [schemaInput, instanceInput, t.invalidJson]);

	useEffect(() => {
		handleValidate();
	}, [handleValidate]);

	const loadPreset = (type: "user" | "product") => {
		if (type === "user") {
			setSchemaInput(JSON.stringify(defaultSchema, null, 2));
			setInstanceInput(JSON.stringify(defaultInstance, null, 2));
		} else {
			const productSchema = {
				$schema: "http://json-schema.org/draft-07/schema#",
				title: "Product Item",
				type: "object",
				properties: {
					sku: { type: "string", pattern: "^[A-Z]{3}-[0-9]{4}$" },
					name: { type: "string" },
					price: { type: "number", exclusiveMinimum: 0 },
					inStock: { type: "boolean" },
				},
				required: ["sku", "name", "price"],
			};
			const productInstance = {
				sku: "ABC-1234",
				name: "Mechanic Keyboard",
				price: 99.99,
				inStock: true,
			};
			setSchemaInput(JSON.stringify(productSchema, null, 2));
			setInstanceInput(JSON.stringify(productInstance, null, 2));
		}
	};

	const handleClear = () => {
		setSchemaInput("");
		setInstanceInput("");
		setValidationErrors([]);
		setIsValid(null);
	};

	return (
		<div class="space-y-6">
			{/* Preset & Action Selector */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm flex flex-wrap gap-4 items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-body-sm-strong text-muted">{t.presetTitle}:</span>
					<button class="btn-secondary py-1.5 px-3 text-xs" onClick={() => loadPreset("user")}>
						{t.presetUser}
					</button>
					<button class="btn-secondary py-1.5 px-3 text-xs" onClick={() => loadPreset("product")}>
						{t.presetProduct}
					</button>
				</div>
				<button class="btn-tertiary text-xs py-1.5 px-3" onClick={handleClear}>
					{t.clearBtn}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Schema Input */}
				<div class="lg:col-span-6 space-y-2">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.schemaLabel}</label>
						<textarea
							class={`textarea font-mono text-body-sm w-full ${
								schemaError ? "border-accent-rose focus:border-accent-rose" : ""
							}`}
							style={{ minHeight: "350px" }}
							placeholder={t.schemaPlaceholder}
							value={schemaInput}
							onInput={(e) => setSchemaInput((e.target as HTMLTextAreaElement).value)}
						/>
						{schemaError && <p class="text-xs font-bold text-accent-rose mt-1">{schemaError}</p>}
					</div>
				</div>

				{/* Instance Input */}
				<div class="lg:col-span-6 space-y-2">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
						<label class="text-body-sm-strong text-ink block">{t.instanceLabel}</label>
						<textarea
							class={`textarea font-mono text-body-sm w-full ${
								instanceError ? "border-accent-rose focus:border-accent-rose" : ""
							}`}
							style={{ minHeight: "350px" }}
							placeholder={t.instancePlaceholder}
							value={instanceInput}
							onInput={(e) => setInstanceInput((e.target as HTMLTextAreaElement).value)}
						/>
						{instanceError && (
							<p class="text-xs font-bold text-accent-rose mt-1">{instanceError}</p>
						)}
					</div>
				</div>
			</div>

			{/* Validation Result */}
			{isValid !== null && (
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<div class="flex items-center gap-3">
						{isValid ? (
							<div class="w-8 h-8 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
						) : (
							<div class="w-8 h-8 rounded-full bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center text-accent-rose">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</div>
						)}
						<h3
							class={`text-body-strong font-bold ${isValid ? "text-accent-emerald" : "text-accent-rose"}`}
						>
							{isValid ? t.validMsg : t.invalidMsg}
						</h3>
					</div>

					{!isValid && validationErrors.length > 0 && (
						<div class="overflow-x-auto border border-hairline rounded-lg">
							<table class="w-full text-left border-collapse text-body-sm font-mono">
								<thead>
									<tr class="bg-surface-soft border-b border-hairline text-ink">
										<th class="p-3 font-bold">{t.colPath}</th>
										<th class="p-3 font-bold">{t.colKeyword}</th>
										<th class="p-3 font-bold">{t.colMessage}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-hairline">
									{validationErrors.map((err, index) => (
										<tr key={index} class="hover:bg-surface-soft/50 text-ink">
											<td class="p-3 text-primary font-bold">{err.path}</td>
											<td class="p-3 text-muted">{err.keyword}</td>
											<td class="p-3 text-accent-rose font-bold">{err.message}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
