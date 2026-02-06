/**
 * Tests for Hardfork.range
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./index.js";
import { range } from "./range.js";

describe("Hardfork.range", () => {
	it("returns single element for same start and end", () => {
		const result = range(Hardfork.CANCUN, Hardfork.CANCUN);
		expect(result).toEqual([Hardfork.CANCUN]);
	});

	it("returns range in ascending order", () => {
		const result = range(Hardfork.BERLIN, Hardfork.ARROW_GLACIER);
		expect(result).toContain(Hardfork.BERLIN);
		expect(result).toContain(Hardfork.LONDON);
		expect(result).toContain(Hardfork.ARROW_GLACIER);
	});

	it("returns range in descending order when reversed", () => {
		const result = range(Hardfork.LONDON, Hardfork.BERLIN);
		expect(result[0]).toBe(Hardfork.LONDON);
		expect(result[result.length - 1]).toBe(Hardfork.BERLIN);
	});

	it("includes all intermediate hardforks", () => {
		const result = range(Hardfork.BERLIN, Hardfork.SHANGHAI);
		expect(result).toContain(Hardfork.BERLIN);
		expect(result).toContain(Hardfork.LONDON);
		expect(result).toContain(Hardfork.ARROW_GLACIER);
		expect(result).toContain(Hardfork.GRAY_GLACIER);
		expect(result).toContain(Hardfork.MERGE);
		expect(result).toContain(Hardfork.SHANGHAI);
	});

	it("works with adjacent hardforks", () => {
		const result = range(Hardfork.SHANGHAI, Hardfork.CANCUN);
		expect(result).toHaveLength(2);
		expect(result).toEqual([Hardfork.SHANGHAI, Hardfork.CANCUN]);
	});

	it("works from frontier to latest", () => {
		const result = range(Hardfork.FRONTIER, Hardfork.PRAGUE);
		expect(result[0]).toBe(Hardfork.FRONTIER);
		expect(result[result.length - 1]).toBe(Hardfork.PRAGUE);
		expect(result.length).toBeGreaterThan(10);
	});

	it("works with early hardforks", () => {
		const result = range(Hardfork.FRONTIER, Hardfork.HOMESTEAD);
		expect(result).toEqual([Hardfork.FRONTIER, Hardfork.HOMESTEAD]);
	});

	it("handles DAO hardfork in range", () => {
		const result = range(Hardfork.HOMESTEAD, Hardfork.TANGERINE_WHISTLE);
		expect(result).toContain(Hardfork.DAO);
	});

	it("handles difficulty bomb delays", () => {
		const result = range(Hardfork.LONDON, Hardfork.MERGE);
		expect(result).toContain(Hardfork.ARROW_GLACIER);
		expect(result).toContain(Hardfork.GRAY_GLACIER);
	});

	it("throws InvalidFormatError for invalid start hardfork", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
		expect(() => range("invalid" as any, Hardfork.CANCUN)).toThrow(
			"Invalid hardfork in range",
		);
		try {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			range("invalid" as any, Hardfork.CANCUN);
		} catch (e) {
			expect((e as Error).name).toBe("InvalidFormatError");
		}
	});

	it("throws InvalidFormatError for invalid end hardfork", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
		expect(() => range(Hardfork.BERLIN, "invalid" as any)).toThrow(
			"Invalid hardfork in range",
		);
		try {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			range(Hardfork.BERLIN, "invalid" as any);
		} catch (e) {
			expect((e as Error).name).toBe("InvalidFormatError");
		}
	});

	it("throws InvalidFormatError for both invalid hardforks", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
		expect(() => range("invalid1" as any, "invalid2" as any)).toThrow(
			"Invalid hardfork in range",
		);
		try {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			range("invalid1" as any, "invalid2" as any);
		} catch (e) {
			expect((e as Error).name).toBe("InvalidFormatError");
		}
	});
});
