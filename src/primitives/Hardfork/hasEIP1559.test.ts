/**
 * Tests for Hardfork.hasEIP1559
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./index.js";
import { hasEIP1559 } from "./hasEIP1559.js";

describe("Hardfork.hasEIP1559", () => {
	it("returns false for Berlin", () => {
		expect(hasEIP1559(Hardfork.BERLIN)).toBe(false);
	});

	it("returns true for London", () => {
		expect(hasEIP1559(Hardfork.LONDON)).toBe(true);
	});

	it("returns true for Arrow Glacier", () => {
		expect(hasEIP1559(Hardfork.ARROW_GLACIER)).toBe(true);
	});

	it("returns true for Gray Glacier", () => {
		expect(hasEIP1559(Hardfork.GRAY_GLACIER)).toBe(true);
	});

	it("returns true for Merge", () => {
		expect(hasEIP1559(Hardfork.MERGE)).toBe(true);
	});

	it("returns true for Shanghai", () => {
		expect(hasEIP1559(Hardfork.SHANGHAI)).toBe(true);
	});

	it("returns true for Cancun", () => {
		expect(hasEIP1559(Hardfork.CANCUN)).toBe(true);
	});

	it("returns true for Prague", () => {
		expect(hasEIP1559(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for Frontier", () => {
		expect(hasEIP1559(Hardfork.FRONTIER)).toBe(false);
	});

	it("returns false for Homestead", () => {
		expect(hasEIP1559(Hardfork.HOMESTEAD)).toBe(false);
	});

	it("returns false for Byzantium", () => {
		expect(hasEIP1559(Hardfork.BYZANTIUM)).toBe(false);
	});

	it("returns false for Constantinople", () => {
		expect(hasEIP1559(Hardfork.CONSTANTINOPLE)).toBe(false);
	});

	it("returns false for Istanbul", () => {
		expect(hasEIP1559(Hardfork.ISTANBUL)).toBe(false);
	});
});
