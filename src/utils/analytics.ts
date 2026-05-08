/**
 * Privacy-First Analytics — 100% client-side, no cookies, no external requests
 * Stores analytics data in localStorage.
 * Can be connected to Cloudflare Web Analytics / Plausible later.
 */

const ANALYTICS_KEY = "toolbundle_analytics";
const MAX_ENTRIES = 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PageView {
	path: string;
	title: string;
	referrer: string;
	timestamp: number;
}

export interface ToolEvent {
	toolId: string;
	category: string;
	action: "view" | "use" | "copy" | "download";
	timestamp: number;
}

export interface AnalyticsData {
	pageViews: PageView[];
	toolEvents: ToolEvent[];
	sessions: number;
	firstVisit: number;
	lastVisit: number;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function getData(): AnalyticsData {
	try {
		const raw = localStorage.getItem(ANALYTICS_KEY);
		if (raw) return JSON.parse(raw);
	} catch {}
	return {
		pageViews: [],
		toolEvents: [],
		sessions: 0,
		firstVisit: Date.now(),
		lastVisit: Date.now(),
	};
}

function saveData(data: AnalyticsData): void {
	try {
		if (data.pageViews.length > MAX_ENTRIES) {
			data.pageViews = data.pageViews.slice(-MAX_ENTRIES);
		}
		if (data.toolEvents.length > MAX_ENTRIES) {
			data.toolEvents = data.toolEvents.slice(-MAX_ENTRIES);
		}
		data.lastVisit = Date.now();
		localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
	} catch {}
}

// ─── Tracking Functions ──────────────────────────────────────────────────────

export function trackPageView(path: string, title: string): void {
	const data = getData();
	data.pageViews.push({
		path,
		title,
		referrer: document.referrer || "direct",
		timestamp: Date.now(),
	});
	saveData(data);
}

export function trackToolEvent(
	toolId: string,
	category: string,
	action: ToolEvent["action"],
): void {
	const data = getData();
	data.toolEvents.push({
		toolId,
		category,
		action,
		timestamp: Date.now(),
	});
	saveData(data);
}

export function incrementSession(): void {
	const data = getData();
	data.sessions += 1;
	saveData(data);
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export function getAnalytics(): AnalyticsData {
	return getData();
}

export function getTotalPageViews(): number {
	return getData().pageViews.length;
}

export function getTotalToolUses(): number {
	return getData().toolEvents.filter((e) => e.action === "use").length;
}

export function getTopTools(limit = 10): { toolId: string; count: number }[] {
	const events = getData().toolEvents.filter((e) => e.action === "use");
	const counts: Record<string, number> = {};
	for (const event of events) {
		counts[event.toolId] = (counts[event.toolId] || 0) + 1;
	}
	return Object.entries(counts)
		.map(([toolId, count]) => ({ toolId, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

export function getTopPages(limit = 10): { path: string; count: number }[] {
	const views = getData().pageViews;
	const counts: Record<string, number> = {};
	for (const view of views) {
		counts[view.path] = (counts[view.path] || 0) + 1;
	}
	return Object.entries(counts)
		.map(([path, count]) => ({ path, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

export function getCategoryUsage(): { category: string; count: number }[] {
	const events = getData().toolEvents.filter((e) => e.action === "use");
	const counts: Record<string, number> = {};
	for (const event of events) {
		counts[event.category] = (counts[event.category] || 0) + 1;
	}
	return Object.entries(counts)
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count);
}

export function getRecentActivity(days = 7): ToolEvent[] {
	const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
	return getData().toolEvents.filter((e) => e.timestamp >= cutoff);
}

export function clearAnalytics(): void {
	localStorage.removeItem(ANALYTICS_KEY);
}

export function exportAnalytics(): string {
	return JSON.stringify(getData(), null, 2);
}
