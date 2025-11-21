/**
 * Tests for Hardfork.hasEIP4844
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./index.js";
import { hasEIP4844 } from "./hasEIP4844.js";

describe("Hardfork.hasEIP4844", () => {
	it("returns false for Shanghai", () => {
		expect(hasEIP4844(Hardfork.SHANGHAI)).toBe(false);
	});

	it("returns false for Merge", () => {
		expect(hasEIP4844(Hardfork.MERGE)).toBe(false);
	});

	it("returns false for London", () => {
		expect(hasEIP4844(Hardfork.LONDON)).toBe(false);
	});

	it("returns false for Berlin", () => {
		expect(hasEIP4844(Hardfork.BERLIN)).toBe(false);
	});

	it("returns true for Cancun", () => {
		expect(hasEIP4844(Hardfork.CANCUN)).toBe(true);
	});

	it("returns true for Prague", () => {
		expect(hasEIP4844(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for all pre-Cancun hardforks", () => {
		const preCancun = [
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
			Hardfork.MERGE,
			Hardfork.SHANGHAI,
		];

		for (const fork of preCancun) {
			expect(hasEIP4844(fork)).toBe(false);
		}
	});
});
