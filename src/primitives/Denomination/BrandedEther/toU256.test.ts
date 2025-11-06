import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { toU256 } from "./toU256.js";

describe("toU256", () => {
	it("converts Ether to Uint256", () => {
		const ether = from(1n);
		const u256 = toU256(ether);
		expect(typeof u256).toBe("bigint");
		expect(u256).toBe(1n);
	});

	it("converts zero Ether", () => {
		const ether = from(0n);
		const u256 = toU256(ether);
		expect(u256).toBe(0n);
	});

	it("converts large Ether value", () => {
		const ether = from(1_000_000n);
		const u256 = toU256(ether);
		expect(u256).toBe(1_000_000n);
	});

	it("preserves exact value (no conversion)", () => {
		const ether = from(123_456_789n);
		const u256 = toU256(ether);
		expect(u256).toBe(123_456_789n);
	});
});
