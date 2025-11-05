import { describe, expect, it } from "vitest";
import * as Uint from "../../Uint/index.js";
import { from } from "./from.js";
import { toU256 } from "./toU256.js";

describe("toU256", () => {
	it("converts Wei to Uint256", () => {
		const wei = from(1_000_000_000);
		const u256 = toU256(wei);
		expect(u256).toBe(1_000_000_000n);
	});

	it("converts 0 Wei to 0 Uint256", () => {
		const wei = from(0);
		const u256 = toU256(wei);
		expect(u256).toBe(0n);
	});

	it("preserves exact value", () => {
		const wei = from(123_456_789_012_345_678_901n);
		const u256 = toU256(wei);
		expect(u256).toBe(123_456_789_012_345_678_901n);
	});

	it("converts large Wei value", () => {
		const wei = from(2n ** 200n);
		const u256 = toU256(wei);
		expect(u256).toBe(2n ** 200n);
	});

	it("result is valid Uint256", () => {
		const wei = from(42);
		const u256 = toU256(wei);
		expect(Uint.isValid(u256)).toBe(true);
	});

	it("maintains type cast (passthrough)", () => {
		const wei = from(999n);
		const u256 = toU256(wei);
		// Both should be the same bigint value
		expect(wei).toBe(u256);
	});
});
