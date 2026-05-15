import { useCallback, useMemo, useState } from "preact/hooks";

interface StatusCode {
	code: number;
	phrase: string;
	description: string;
	category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
	causes?: string;
}

const STATUS_CODES: StatusCode[] = [
	// 1xx Informational
	{
		code: 100,
		phrase: "Continue",
		description:
			"The server has received the request headers and the client should proceed to send the request body.",
		category: "1xx",
	},
	{
		code: 101,
		phrase: "Switching Protocols",
		description:
			"The requester has asked the server to switch protocols and the server has agreed to do so.",
		category: "1xx",
	},
	{
		code: 102,
		phrase: "Processing",
		description:
			"The server has received and is processing the request, but no response is available yet.",
		category: "1xx",
	},
	{
		code: 103,
		phrase: "Early Hints",
		description: "Used to return some response headers before the final HTTP message.",
		category: "1xx",
	},

	// 2xx Success
	{ code: 200, phrase: "OK", description: "The request has succeeded.", category: "2xx" },
	{
		code: 201,
		phrase: "Created",
		description: "The request has been fulfilled and a new resource has been created.",
		category: "2xx",
		causes: "POST requests that create resources",
	},
	{
		code: 202,
		phrase: "Accepted",
		description:
			"The request has been accepted for processing, but the processing has not been completed.",
		category: "2xx",
	},
	{
		code: 204,
		phrase: "No Content",
		description: "The server successfully processed the request but is not returning any content.",
		category: "2xx",
		causes: "DELETE requests, PUT updates",
	},
	{
		code: 206,
		phrase: "Partial Content",
		description:
			"The server is delivering only part of the resource due to a range header sent by the client.",
		category: "2xx",
		causes: "Video streaming, file downloads with Range header",
	},

	// 3xx Redirection
	{
		code: 301,
		phrase: "Moved Permanently",
		description: "This and all future requests should be directed to the given URI.",
		category: "3xx",
		causes: "URL changes, domain migration",
	},
	{
		code: 302,
		phrase: "Found",
		description: "The resource temporarily resides under a different URI.",
		category: "3xx",
		causes: "Temporary redirects",
	},
	{
		code: 303,
		phrase: "See Other",
		description: "The response can be found under a different URI using a GET method.",
		category: "3xx",
	},
	{
		code: 304,
		phrase: "Not Modified",
		description: "The resource has not been modified since the last requested version.",
		category: "3xx",
		causes: "Caching, If-Modified-Since headers",
	},
	{
		code: 307,
		phrase: "Temporary Redirect",
		description:
			"The request should be repeated with another URI, but future requests should still use the original URI.",
		category: "3xx",
	},
	{
		code: 308,
		phrase: "Permanent Redirect",
		description: "The request and all future requests should be repeated using another URI.",
		category: "3xx",
	},

	// 4xx Client Error
	{
		code: 400,
		phrase: "Bad Request",
		description: "The server could not understand the request due to invalid syntax.",
		category: "4xx",
		causes: "Malformed request, invalid JSON, missing required fields",
	},
	{
		code: 401,
		phrase: "Unauthorized",
		description: "The client must authenticate itself to get the requested response.",
		category: "4xx",
		causes: "Missing or invalid authentication token",
	},
	{
		code: 403,
		phrase: "Forbidden",
		description: "The client does not have access rights to the content.",
		category: "4xx",
		causes: "Insufficient permissions, IP blocking",
	},
	{
		code: 404,
		phrase: "Not Found",
		description: "The server cannot find the requested resource.",
		category: "4xx",
		causes: "Wrong URL, deleted resource, broken link",
	},
	{
		code: 405,
		phrase: "Method Not Allowed",
		description: "The request HTTP method is not allowed for the target resource.",
		category: "4xx",
		causes: "Using POST on a GET-only endpoint",
	},
	{
		code: 406,
		phrase: "Not Acceptable",
		description:
			"The resource cannot generate content matching the Accept headers sent by the client.",
		category: "4xx",
	},
	{
		code: 407,
		phrase: "Proxy Authentication Required",
		description: "The client must first authenticate itself with the proxy.",
		category: "4xx",
	},
	{
		code: 408,
		phrase: "Request Timeout",
		description: "The server timed out waiting for the request.",
		category: "4xx",
		causes: "Slow connection, server overload",
	},
	{
		code: 409,
		phrase: "Conflict",
		description: "The request conflicts with the current state of the server.",
		category: "4xx",
		causes: "Duplicate resource, edit conflict",
	},
	{
		code: 410,
		phrase: "Gone",
		description:
			"The resource requested has been permanently removed and will not be available again.",
		category: "4xx",
	},
	{
		code: 411,
		phrase: "Length Required",
		description: "The server requires the Content-Length header to be defined.",
		category: "4xx",
	},
	{
		code: 412,
		phrase: "Precondition Failed",
		description: "The server does not meet one or more preconditions in the request header fields.",
		category: "4xx",
	},
	{
		code: 413,
		phrase: "Payload Too Large",
		description: "The request is larger than the server is willing or able to process.",
		category: "4xx",
		causes: "File upload too large",
	},
	{
		code: 414,
		phrase: "URI Too Long",
		description: "The URI provided was too long for the server to process.",
		category: "4xx",
	},
	{
		code: 415,
		phrase: "Unsupported Media Type",
		description: "The request entity has a media type which the server does not support.",
		category: "4xx",
		causes: "Wrong Content-Type header",
	},
	{
		code: 416,
		phrase: "Range Not Satisfiable",
		description: "The client has asked for a portion of the file that the server cannot supply.",
		category: "4xx",
	},
	{
		code: 418,
		phrase: "I'm a Teapot",
		description: "The server refuses the attempt to brew coffee with a teapot.",
		category: "4xx",
	},
	{
		code: 422,
		phrase: "Unprocessable Entity",
		description:
			"The request was well-formed but was unable to be followed due to semantic errors.",
		category: "4xx",
		causes: "Validation errors, invalid data",
	},
	{
		code: 425,
		phrase: "Too Early",
		description: "The server is unwilling to risk processing a request that might be replayed.",
		category: "4xx",
	},
	{
		code: 426,
		phrase: "Upgrade Required",
		description: "The server refuses to perform the request using the current protocol.",
		category: "4xx",
	},
	{
		code: 428,
		phrase: "Precondition Required",
		description: "The origin server requires the request to be conditional.",
		category: "4xx",
	},
	{
		code: 429,
		phrase: "Too Many Requests",
		description: "The user has sent too many requests in a given amount of time.",
		category: "4xx",
		causes: "Rate limiting, API throttling",
	},
	{
		code: 431,
		phrase: "Request Header Fields Too Large",
		description:
			"The server is unwilling to process the request because its header fields are too large.",
		category: "4xx",
	},
	{
		code: 451,
		phrase: "Unavailable For Legal Reasons",
		description: "The resource is unavailable due to legal reasons.",
		category: "4xx",
	},

	// 5xx Server Error
	{
		code: 500,
		phrase: "Internal Server Error",
		description: "The server has encountered a situation it does not know how to handle.",
		category: "5xx",
		causes: "Server bugs, unhandled exceptions, database errors",
	},
	{
		code: 501,
		phrase: "Not Implemented",
		description: "The request method is not supported by the server and cannot be handled.",
		category: "5xx",
	},
	{
		code: 502,
		phrase: "Bad Gateway",
		description: "The server received an invalid response from an upstream server.",
		category: "5xx",
		causes: "Reverse proxy issues, upstream server down",
	},
	{
		code: 503,
		phrase: "Service Unavailable",
		description:
			"The server is not ready to handle the request, often due to maintenance or overload.",
		category: "5xx",
		causes: "Server maintenance, overload, deployment",
	},
	{
		code: 504,
		phrase: "Gateway Timeout",
		description: "The server did not receive a timely response from an upstream server.",
		category: "5xx",
		causes: "Slow upstream server, network issues",
	},
	{
		code: 505,
		phrase: "HTTP Version Not Supported",
		description: "The HTTP version used in the request is not supported by the server.",
		category: "5xx",
	},
	{
		code: 507,
		phrase: "Insufficient Storage",
		description: "The server is unable to store the representation needed to complete the request.",
		category: "5xx",
	},
	{
		code: 508,
		phrase: "Loop Detected",
		description: "The server detected an infinite loop while processing the request.",
		category: "5xx",
	},
	{
		code: 511,
		phrase: "Network Authentication Required",
		description: "The client needs to authenticate to gain network access.",
		category: "5xx",
		causes: "Captive portals, Wi-Fi login",
	},
];

const CATEGORIES = ["1xx", "2xx", "3xx", "4xx", "5xx"] as const;

const CATEGORY_LABELS: Record<string, string> = {
	"1xx": "Informational",
	"2xx": "Success",
	"3xx": "Redirection",
	"4xx": "Client Error",
	"5xx": "Server Error",
};

export default function HttpStatusCodes() {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [expanded, setExpanded] = useState<Set<number>>(new Set());
	const [copiedCode, setCopiedCode] = useState<number | null>(null);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return STATUS_CODES.filter((sc) => {
			if (activeCategory !== "all" && sc.category !== activeCategory) return false;
			if (!q) return true;
			return (
				sc.code.toString().includes(q) ||
				sc.phrase.toLowerCase().includes(q) ||
				sc.description.toLowerCase().includes(q) ||
				sc.causes?.toLowerCase().includes(q)
			);
		});
	}, [search, activeCategory]);

	const toggleExpand = useCallback((code: number) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(code)) {
				next.delete(code);
			} else {
				next.add(code);
			}
			return next;
		});
	}, []);

	const handleCopy = useCallback(async (sc: StatusCode) => {
		const text = `${sc.code} ${sc.phrase}`;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopiedCode(sc.code);
		setTimeout(() => setCopiedCode(null), 2000);
	}, []);

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<div class="flex-1" style="min-width: 200px">
					<input
						type="text"
						class="input w-full"
						placeholder="Search by code, phrase, or description..."
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				<button
					class={`btn-secondary text-body-sm ${activeCategory === "all" ? "btn-primary" : ""}`}
					onClick={() => setActiveCategory("all")}
				>
					All
				</button>
				{CATEGORIES.map((cat) => (
					<button
						key={cat}
						class={`btn-secondary text-body-sm ${activeCategory === cat ? "btn-primary" : ""}`}
						onClick={() => setActiveCategory(cat)}
					>
						{cat} {CATEGORY_LABELS[cat]}
					</button>
				))}
			</div>

			<div class="text-body-sm text-muted mb-3">
				{filtered.length} code{filtered.length !== 1 ? "s" : ""} found
			</div>

			<div class="space-y-2">
				{filtered.map((sc) => {
					const isExpanded = expanded.has(sc.code);
					return (
						<div key={sc.code} class="card">
							<div
								class="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
								onClick={() => toggleExpand(sc.code)}
							>
								<span
									class="font-mono font-bold text-body-lg"
									style={`color: ${sc.category === "1xx" ? "var(--color-info)" : sc.category === "2xx" ? "var(--color-success)" : sc.category === "3xx" ? "var(--color-warning)" : sc.category === "4xx" ? "var(--color-error)" : "var(--color-error)"}`}
								>
									{sc.code}
								</span>
								<span class="font-medium flex-1">{sc.phrase}</span>
								<span class="badge">{sc.category}</span>
								<button
									class="btn-secondary text-body-sm"
									onClick={(e) => {
										e.stopPropagation();
										handleCopy(sc);
									}}
								>
									{copiedCode === sc.code ? "Copied!" : "Copy"}
								</button>
							</div>

							{isExpanded && (
								<div class="px-4 pb-4 pt-0 border-t border-hairline">
									<p class="text-body-sm text-muted mt-3">{sc.description}</p>
									{sc.causes && (
										<div class="mt-2">
											<span class="text-caption-uppercase text-muted">Common causes: </span>
											<span class="text-body-sm">{sc.causes}</span>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
