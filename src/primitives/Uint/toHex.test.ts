import { describe, it, expect } from "vitest";
import { toHex } from "./toHex.js";
import { from } from "./from.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint256.toHex", () => {
	describe("padded (default)", () => {
		it("converts zero with padding", () => {
			expect(toHex(ZERO)).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		it("converts one with padding", () => {
			expect(toHex(ONE)).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
		});

		it("converts 255 with padding", () => {
			expect(toHex(from(255n))).toBe(
				"0x00000000000000000000000000000000000000000000000000000000000000ff",
			);
		});

		it("converts MAX", () => {
			expect(toHex(MAX)).toBe(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
		});

		it("pads to 64 hex digits", () => {
			const result = toHex(from(0xabcn));
			expect(result.length).toBe(66); // 0x + 64 digits
		});
	});

	describe("unpadded", () => {
		it("converts zero without padding", () => {
			expect(toHex(ZERO, false)).toBe("0x0");
		});

		it("converts one without padding", () => {
			expect(toHex(ONE, false)).toBe("0x1");
		});

		it("converts 255 without padding", () => {
			expect(toHex(from(255n), false)).toBe("0xff");
		});

		it("no padding on small values", () => {
			expect(toHex(from(0xabcn), false)).toBe("0xabc");
		});

		it("converts large value without padding", () => {
			const val = from(1n << 200n);
			const hex = toHex(val, false);
			expect(hex.startsWith("0x")).toBe(true);
		});
	});

	describe("round-trip", () => {
		it("round-trips with fromHex (padded)", () => {
			const original = from(123456789123456789123456789n);
			const hex = toHex(original);
			expect(from(hex)).toBe(original);
		});

		it("round-trips with fromHex (unpadded)", () => {
			const original = from(123456789123456789123456789n);
			const hex = toHex(original, false);
			expect(from(hex)).toBe(original);
		});
	});
});
