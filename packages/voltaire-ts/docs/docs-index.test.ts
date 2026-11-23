/**
 * Docs index integrity: llms.txt links, Mintlify docs.json navigation,
 * and discoverability of ENS and Osaka/Amsterdam pages (issue #350).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tsDocs = dirname(fileURLToPath(import.meta.url));
const effectDocs = join(tsDocs, "../../voltaire-effect/docs");
const zigDocs = join(tsDocs, "../../voltaire-zig/docs");

function pageExists(root: string, page: string): boolean {
	const p = page.replace(/^\//, "").replace(/[#?].*$/, "");
	if (p === "") return existsSync(join(root, "index.mdx"));
	return (
		existsSync(join(root, `${p}.mdx`)) ||
		existsSync(join(root, `${p}.md`)) ||
		existsSync(join(root, p, "index.mdx"))
	);
}

/** Links under /zig/ are served from voltaire-zig/docs; everything else from voltaire-ts/docs. */
function linkExists(link: string): boolean {
	const m = link.match(/^\/zig(\/.*)?$/);
	return m ? pageExists(zigDocs, m[1] ?? "/") : pageExists(tsDocs, link);
}

function navPages(root: string): string[] {
	const json = JSON.parse(readFileSync(join(root, "docs.json"), "utf8"));
	const pages: string[] = [];
	const keys = [
		"pages",
		"groups",
		"tabs",
		"anchors",
		"dropdowns",
		"versions",
		"languages",
	];
	const walk = (node: unknown): void => {
		if (typeof node === "string") {
			pages.push(node);
			return;
		}
		if (Array.isArray(node)) {
			for (const n of node) walk(n);
			return;
		}
		if (node && typeof node === "object") {
			const obj = node as Record<string, unknown>;
			for (const k of keys) if (obj[k]) walk(obj[k]);
		}
	};
	walk(json.navigation);
	return pages;
}

function llms(root: string): string {
	return readFileSync(join(root, "llms.txt"), "utf8");
}

/** Site-relative markdown links: [text](/path) */
function markdownLinks(text: string): string[] {
	return [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1] as string);
}

function mdxPages(root: string, dir: string): string[] {
	return readdirSync(join(root, dir))
		.filter((f) => f.endsWith(".mdx"))
		.map((f) => `${dir}/${f.replace(/\.mdx$/, "")}`);
}

describe("docs.json", () => {
	it.each([
		["voltaire-ts", tsDocs],
		["voltaire-effect", effectDocs],
	])("%s docs.json parses and every non-zig nav page exists", (_, root) => {
		const missing = navPages(root)
			.filter((p) => !p.startsWith("zig/"))
			.filter((p) => !pageExists(root, p));
		expect(missing).toEqual([]);
	});

	it("voltaire-ts nav has no duplicate pages", () => {
		const pages = navPages(tsDocs);
		const dupes = pages.filter((p, i) => pages.indexOf(p) !== i);
		expect(dupes).toEqual([]);
	});
});

describe("llms.txt", () => {
	it("voltaire-ts llms.txt links resolve to pages", () => {
		const missing = markdownLinks(llms(tsDocs)).filter((p) => !linkExists(p));
		expect(missing).toEqual([]);
	});

	it("voltaire-zig llms.txt links resolve to pages", () => {
		const missing = markdownLinks(llms(zigDocs)).filter((p) => !linkExists(p));
		expect(missing).toEqual([]);
	});

	it("voltaire-effect llms.txt site links resolve to pages", () => {
		const text = llms(effectDocs);
		const urls = [
			...text.matchAll(/https:\/\/voltaire-effect\.tevm\.sh(\/[^)\s#]*)/g),
		].map((m) => m[1] as string);
		const paths = [...text.matchAll(/`(\/(?:[a-z0-9-]+\/?)+)`/g)]
			.map((m) => m[1] as string)
			.filter((p) => !p.startsWith("/docs/"));
		const missing = [...urls, ...paths].filter(
			(p) => !pageExists(effectDocs, p),
		);
		expect(missing).toEqual([]);
	});
});

describe("ENS discoverability (issue #350)", () => {
	const ensPages = mdxPages(tsDocs, "primitives/ens");

	it("every primitives/ens page is in Mintlify navigation", () => {
		const nav = new Set(navPages(tsDocs));
		const missing = ensPages.filter(
			(p) => !nav.has(p) && !(p.endsWith("/index") && nav.has(p.slice(0, -6))),
		);
		expect(missing).toEqual([]);
	});

	it("voltaire-ts llms.txt has an ENS section listing every ENS page and skill", () => {
		const text = llms(tsDocs);
		expect(text).toMatch(/^## ENS/m);
		const links = new Set(markdownLinks(text).map((p) => p.slice(1)));
		for (const p of ensPages) {
			const page = p.replace(/\/index$/, "");
			expect(links.has(page), page).toBe(true);
		}
		expect(links.has("skills/ens")).toBe(true);
		expect(links.has("skills/ens-resolution")).toBe(true);
		expect(text).toContain("voltaire-effect.tevm.sh/services/ens");
	});

	it("voltaire-effect llms.txt has an ENS section naming the service and primitive", () => {
		const text = llms(effectDocs);
		const section = text.split(/^## ENS/m)[1]?.split(/^## /m)[0] ?? "";
		for (const name of [
			"EnsService",
			"DefaultEns",
			"getEnsAddress",
			"getEnsName",
			"getEnsText",
			"getEnsAvatar",
			"getEnsResolver",
			"namehash",
			"labelhash",
			"normalize",
			"/services/ens",
			"/primitives/ens",
		]) {
			expect(section, name).toContain(name);
		}
	});

	it("voltaire-effect nav lists ENS in a dedicated group", () => {
		const json = JSON.parse(readFileSync(join(effectDocs, "docs.json"), "utf8"));
		const groups: { group: string; pages: unknown[] }[] = [];
		const walk = (n: unknown): void => {
			if (Array.isArray(n)) return n.forEach(walk);
			if (n && typeof n === "object") {
				const o = n as Record<string, unknown>;
				if (typeof o.group === "string" && Array.isArray(o.pages))
					groups.push(o as { group: string; pages: unknown[] });
				for (const v of Object.values(o)) walk(v);
			}
		};
		walk(json.navigation);
		const ens = groups.find((g) => g.group === "ENS");
		expect(ens?.pages).toEqual(["services/ens", "primitives/ens"]);
	});
});

describe("Osaka / Amsterdam docs parity", () => {
	const required = [
		"evm/precompiles/p256verify",
		"primitives/hardfork/osaka",
		"primitives/feemarket/blob-schedules",
		"primitives/rlp/block-size-limit",
		"primitives/receipt/receipt-manager",
		"primitives/block-access-list/index",
	];

	it.each(required)("%s exists, is in nav, and is in llms.txt", (page) => {
		expect(pageExists(tsDocs, page)).toBe(true);
		expect(navPages(tsDocs)).toContain(page);
		const links = markdownLinks(llms(tsDocs)).map((p) => p.slice(1));
		expect(links).toContain(page.replace(/\/index$/, ""));
	});

	it("hardfork docs state DEFAULT = OSAKA and the Osaka activation timestamp", () => {
		for (const f of ["index.mdx", "hardforks.mdx", "osaka.mdx"]) {
			const text = readFileSync(
				join(tsDocs, "primitives/hardfork", f),
				"utf8",
			);
			expect(text, f).not.toMatch(/DEFAULT[^\n]*PRAGUE/);
			expect(text, f).toMatch(/DEFAULT[^\n]*OSAKA/);
		}
		const osaka = readFileSync(
			join(tsDocs, "primitives/hardfork/osaka.mdx"),
			"utf8",
		);
		for (const fact of [
			"1764798551",
			"411392",
			"1765290071",
			"1767747671",
			"EIP-7951",
			"EIP-7918",
			"EIP-7934",
			"EIP-7892",
			"EIP-7594",
		]) {
			expect(osaka, fact).toContain(fact);
		}
	});

	it("precompile index lists P256VERIFY at 0x100 with 6900 gas gated on Osaka", () => {
		const text = readFileSync(
			join(tsDocs, "evm/precompiles/index.mdx"),
			"utf8",
		);
		expect(text).toMatch(
			/\| 0x100 \| \[P256VERIFY\]\(\/evm\/precompiles\/p256verify\) \| 6,900 \| Osaka \|/,
		);
	});

	it("blob schedule page states every contract schedule", () => {
		const text = readFileSync(
			join(tsDocs, "primitives/feemarket/blob-schedules.mdx"),
			"utf8",
		);
		for (const fact of [
			"3_338_477n",
			"5_007_716n",
			"8_346_193n",
			"11_684_671n",
			"BLOB_BASE_COST",
			"8_192n",
		]) {
			expect(text, fact).toContain(fact);
		}
	});

	it("RLP block size page states the EIP-7934 constants", () => {
		const text = readFileSync(
			join(tsDocs, "primitives/rlp/block-size-limit.mdx"),
			"utf8",
		);
		for (const fact of [
			"MAX_BLOCK_SIZE = 10_485_760",
			"SAFETY_MARGIN = 2_097_152",
			"MAX_RLP_BLOCK_SIZE = 8_388_608",
			"exceedsMaxRlpBlockSize",
		]) {
			expect(text, fact).toContain(fact);
		}
	});
});
