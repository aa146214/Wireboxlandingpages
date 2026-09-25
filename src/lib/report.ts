import { LRUCache } from "lru-cache"

export type DisplayMode =
	| 'fraction'
	| 'binary'
	| 'notApplicable'
	| 'error'
	| 'manual';

export interface Metric {
	percentile: number,
	distributions: Array<{ min: number, max: number, proportion: number }>,
	category: string
}

export interface Metrics {
	CUMULATIVE_LAYOUT_SHIFT: Metric,
	FIRST_CONTENTFUL_PAINT: Metric,
	LARGEST_CONTENTFUL_PAINT: Metric,
	INTERACTION_TO_NEXT_PAINT: Metric,
	overall_category: string
}

export interface ApiCategory {
	id: string;
	title: string;
	score: number | undefined;
	description?: string;
	manualDescription?: string;
	categoryScoreDisplayMode?: DisplayMode;
}

export interface Problem {
	id: string;
	title: string;
	description: string;
	score: number | null;
	scoreDisplayMode: DisplayMode;
	weight: number;
	categories: string[];
	lostWeight: number;
	displayValue?: string;
	errorMessage?: string;
	numericValue?: number;
	numericUnit?: string;
	details?: any;
	metricSavings?: { TBT?: number, CLS?: number };
}

export interface KeyIssue {
	title: string,
	description: string,
	recommendedFix: string,
	score: number
}

export interface ApiResponse {
	categories: ApiCategory[];
	problems: Problem[];
	metrics: Metrics;
	date: string,
	url: string,
	keyIssues: KeyIssue[],
	plan: Record<"shortTerm"|"midTerm"|"longTerm", string[]>;
}

export type DisplayCategory = { title: string, description: string, problems: Problem[], score: number };
export type DisplayCategories = Record<string, DisplayCategory>;
export interface AuditReport {
	categories: DisplayCategories,
	problems: Problem[],
	metrics: Metrics,
	date: Date,
	url: string,
	keyIssues: KeyIssue[],
	plan: Record<"shortTerm"|"midTerm"|"longTerm", string[]>;
}

let cache = new LRUCache<string, AuditReport>({ max: 500 });

const NO_SCORE_PROBLEMS = [
	"lcp-breakdown-insight",
	"resource-summary",
	"main-thread-tasks",
	"script-treemap-data",
	"diagnostics",
	"metrics",
	"final-screenshot",
	"network-requests",
	"screenshot-thumbnails",
	"document-request-latency",
	"long-tasks",
	"cls-culprits-insight"
];
export async function getReport(id: string): Promise<AuditReport | null> {
	try {
		let cacheEntry;
		if (cacheEntry = cache.get(id)) {
			return cacheEntry;
		}

		const json: ApiResponse = await fetch(`https://wirebox.app.n8n.cloud/webhook/8e02871b-0428-4051-8f62-dcc8f4ff168c/report/${id}`)
			.then(res => res.json());

		json.problems.filter(problem => NO_SCORE_PROBLEMS.includes(problem.id))
			.forEach(problem => problem.score = null);

		const report: AuditReport = {
			...json,
			categories: {
				seo: {
					title: 'SEO',
					description: 'Optimizations to help search engines discover, crawl, and understand your content.',
					problems: [],
					score: json.categories.find(cat => cat.id === "seo")?.score ?? 1
				},
				performance: {
					title: 'Performance',
					description: 'Metrics and opportunities to improve page loading speed, responsiveness, and user experience.',
					problems: [],
					score: json.categories.find(cat => cat.id === "performance")?.score ?? 1
				},
				"agentic-browsing": {
					title: 'Agentic Browsing',
					description: 'Enhancements to help AI agents, web scrapers, and automated systems navigate your site effectively.',
					problems: [],
					score: json.categories.find(cat => cat.id === "agentic-browsing")?.score ?? 1
				}
			},
			date: new Date(json.date),
			problems: [],
		};

		function cleanDescription(desc?: string) {
			if (!desc) return '';
			let cleaned = desc;
			cleaned = cleaned.replace(/\[Learn[\s\S]*/i, '').trim();
			cleaned = cleaned.replace(/Learn more about [\s\S]*/, '').trim();
			cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
			if (cleaned.startsWith("Run the ")) cleaned = "";
			return cleaned;
		}

		function getProblemCategories(item: { categories: string[] }) {
			if (item.categories && item.categories.length > 0) return item.categories;
			return ['performance'];
		}

		json.problems.forEach(problem => {
			problem.description = cleanDescription(problem.description);
			getProblemCategories(problem).forEach(catId => {
				report.categories[catId]?.problems.push(problem);
			});
		});

		Object.values(report.categories).forEach(category => {
			category.problems.sort((a, b) => (b.lostWeight || 0) - (a.lostWeight || 0));
		});

		report.problems.push(...json.problems); // already sorted

		cache.set(id, report);

		return report;
	} catch (e) {
		console.error("error fetching report:", (e as Error)?.stack ?? String(e));
		return null;
	}
}

export async function requestReport(body: { email: string, url: string }): Promise<"ok" | "already-generated" | "fail"> {
	const response = await fetch(`https://wirebox.app.n8n.cloud/webhook/seo-report-generate`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
	try {
		if (!response.ok) {
			throw new Error("response not ok");
		}

		const json = await response.json();
		return json.status;
	} catch (e) {
		console.error(`[requestReport] request failed: ${response.status} ${e}`);
		response.text().then(e => console.error(`[requestReport] response body: ${e}`)).catch(() => {});
		return "fail";
	}
}
