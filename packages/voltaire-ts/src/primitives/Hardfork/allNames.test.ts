/**
 * Tests for Hardfork.allNames
 */

import { describe, expect, it } from "vitest";
import { allNames } from "./allNames.js";

describe("Hardfork.allNames", () => {
	it("returns array of all hardfork names", () => {
		const names = allNames();
		expect(Array.isArray(names)).toBe(true);
		expect(names.length).toBeGreaterThan(0);
	});

	it("includes frontier", () => {
		const names = allNames();
		expect(names).toContain("frontier");
	});

	it("includes london", () => {
		const names = allNames();
		expect(names).toContain("london");
	});

	it("includes merge", () => {
		const names = allNames();
		expect(names).toContain("merge");
	});

	it("includes shanghai", () => {
		const names = allNames();
		expect(names).toContain("shanghai");
	});

	it("includes cancun", () => {
		const names = allNames();
		expect(names).toContain("cancun");
	});

	it("includes prague", () => {
		const names = allNames();
		expect(names).toContain("prague");
	});

	it("all names are lowercase strings", () => {
		const names = allNames();
		for (const name of names) {
			expect(typeof name).toBe("string");
			expect(name).toBe(name.toLowerCase());
		}
	});

	it("includes all major hardfork names", () => {
		const names = allNames();
		const major = [
			"frontier",
			"homestead",
			"byzantium",
			"constantinople",
			"istanbul",
			"berlin",
			"london",
			"merge",
			"shanghai",
			"cancun",
		];

		for (const name of major) {
			expect(names).toContain(name);
		}
	});

	it("includes difficulty bomb delays", () => {
		const names = allNames();
		expect(names).toContain("arrowglacier");
		expect(names).toContain("grayglacier");
		expect(names).toContain("muirglacier");
	});

	it("includes dao", () => {
		const names = allNames();
		expect(names).toContain("dao");
	});

	it("includes tangerine whistle", () => {
		const names = allNames();
		expect(names).toContain("tangerinewhistle");
	});

	it("includes spurious dragon", () => {
		const names = allNames();
		expect(names).toContain("spuriousdragon");
	});
});
