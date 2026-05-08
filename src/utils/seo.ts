/**
 * SEO Utility — JSON-LD Structured Data generators
 * Schema.org compliant structured data for rich search results
 */

const SITE_URL = "https://toolbundle.app";
const SITE_NAME = "ToolBundle";

// ─── WebSite Schema (Homepage) ───────────────────────────────────────────────
export function generateWebSiteSchema(): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		url: SITE_URL,
		description:
			"Free, privacy-first online tools that run 100% in your browser. No uploads, no accounts, no limits.",
		publisher: {
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
		},
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${SITE_URL}/?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
	return JSON.stringify(schema);
}

// ─── Organization Schema (Global) ────────────────────────────────────────────
export function generateOrganizationSchema(): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE_NAME,
		url: SITE_URL,
		description:
			"Free, privacy-first online tools — PDF, images, text, code, AI & more. Runs 100% in your browser.",
		sameAs: [],
	};
	return JSON.stringify(schema);
}

// ─── BreadcrumbList Schema ───────────────────────────────────────────────────
interface BreadcrumbItem {
	name: string;
	url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
	return JSON.stringify(schema);
}

// ─── CollectionPage Schema (Category pages) ──────────────────────────────────
export function generateCollectionPageSchema(
	categoryName: string,
	categoryDescription: string,
	toolNames: string[],
	categoryUrl: string,
): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${categoryName} — ${SITE_NAME}`,
		description: categoryDescription,
		url: categoryUrl,
		isPartOf: {
			"@type": "WebSite",
			name: SITE_NAME,
			url: SITE_URL,
		},
		about: {
			"@type": "Thing",
			name: categoryName,
		},
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: toolNames.length,
			itemListElement: toolNames.map((name, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name,
			})),
		},
	};
	return JSON.stringify(schema);
}

// ─── SoftwareApplication Schema (Tool pages) ─────────────────────────────────
export function generateToolSchema(
	toolName: string,
	toolDescription: string,
	toolUrl: string,
	categoryName: string,
	categorySlug: string,
): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: toolName,
		description: toolDescription,
		url: toolUrl,
		applicationCategory: "WebApplication",
		operatingSystem: "Any",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		isPartOf: {
			"@type": "WebSite",
			name: SITE_NAME,
			url: SITE_URL,
		},
		about: {
			"@type": "Thing",
			name: categoryName,
		},
		breadcrumb: {
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Home",
					item: SITE_URL,
				},
				{
					"@type": "ListItem",
					position: 2,
					name: categoryName,
					item: `${SITE_URL}/${categorySlug}`,
				},
				{
					"@type": "ListItem",
					position: 3,
					name: toolName,
					item: toolUrl,
				},
			],
		},
	};
	return JSON.stringify(schema);
}

// ─── FAQPage Schema (for pages with FAQ content) ─────────────────────────────
interface FAQItem {
	question: string;
	answer: string;
}

export function generateFAQSchema(items: FAQItem[]): string {
	const schema = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	};
	return JSON.stringify(schema);
}

// ─── Open Graph Helper ───────────────────────────────────────────────────────
export interface OGData {
	title: string;
	description: string;
	url: string;
	type?: string; // "website" | "article"
	siteName?: string;
}

export function buildOGTags(data: OGData): Record<string, string> {
	return {
		"og:title": data.title,
		"og:description": data.description,
		"og:url": data.url,
		"og:type": data.type || "website",
		"og:site_name": data.siteName || SITE_NAME,
		"og:locale": "en_US",
	};
}

export function buildTwitterTags(data: OGData): Record<string, string> {
	return {
		"twitter:card": "summary_large_image",
		"twitter:title": data.title,
		"twitter:description": data.description,
	};
}
