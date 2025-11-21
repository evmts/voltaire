/**
 * Tests for Hardfork.isPoS
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./index.js";
import { isPoS } from "./isPoS.js";

describe("Hardfork.isPoS", () => {
	it("returns false for Berlin", () => {
		expect(isPoS(Hardfork.BERLIN)).toBe(false);
	});

	it("returns false for London", () => {
		expect(isPoS(Hardfork.LONDON)).toBe(false);
	});

	it("returns false for Arrow Glacier", () => {
		expect(isPoS(Hardfork.ARROW_GLACIER)).toBe(false);
	});

	it("returns false for Gray Glacier", () => {
		expect(isPoS(Hardfork.GRAY_GLACIER)).toBe(false);
	});

	it("returns true for Merge", () => {
		expect(isPoS(Hardfork.MERGE)).toBe(true);
	});

	it("returns true for Shanghai", () => {
		expect(isPoS(Hardfork.SHANGHAI)).toBe(true);
	});

	it("returns true for Cancun", () => {
		expect(isPoS(Hardfork.CANCUN)).toBe(true);
	});

	it("returns true for Prague", () => {
		expect(isPoS(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for all PoW hardforks", () => {
		const pow = [
			Hardfork.FRONTIER,
			Hardfork.HOMESTEAD,
			Hardfork.DAO,
			Hardfork.TANGERINE_WHISTLE,
			Hardfork.SPURIOUS_DRAGON,
			Hardfork.BYZANTIUM,
			Hardfork.CONSTANTINOPLE,
			Hardfork.PETERSBURG,
			Hardfork.ISTANBUL,
			Hardfork.MUIR_GLACIER,
			Hardfork.BERLIN,
			Hardfork.LONDON,
			Hardfork.ARROW_GLACIER,
			Hardfork.GRAY_GLACIER,
		];

		for (const fork of pow) {
			expect(isPoS(fork)).toBe(false);
		}
	});

	it("returns true for all post-Merge hardforks", () => {
		const pos = [
			Hardfork.MERGE,
			Hardfork.SHANGHAI,
			Hardfork.CANCUN,
			Hardfork.PRAGUE,
		];

		for (const fork of pos) {
			expect(isPoS(fork)).toBe(true);
		}
	});
});
