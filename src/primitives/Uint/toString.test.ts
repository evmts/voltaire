import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the intended API name for this primitive
import { toString } from "./toString.js";

describe("Uint256.toString", () => {
	describe("default base (10)", () => {
		it("converts zero", () => {
			expect(toString(ZERO)).toBe("0");
		});

		it("converts one", () => {
			expect(toString(ONE)).toBe("1");
		});

		it("converts small values", () => {
			expect(toString(from(42n))).toBe("42");
		});

		it("converts large values", () => {
			expect(toString(from(1000000n))).toBe("1000000");
		});

		it("converts MAX", () => {
			expect(toString(MAX)).toBe(MAX.toString());
		});
	});

	describe("hexadecimal (base 16)", () => {
		it("converts zero", () => {
			expect(toString(ZERO, 16)).toBe("0");
		});

		it("converts small values", () => {
			expect(toString(from(255n), 16)).toBe("ff");
		});

		it("converts hex patterns", () => {
			expect(toString(from(0xabcdn), 16)).toBe("abcd");
		});

		it("converts large hex values", () => {
			expect(toString(from(0xdeadbeefn), 16)).toBe("deadbeef");
		});
	});

	describe("binary (base 2)", () => {
		it("converts zero", () => {
			expect(toString(ZERO, 2)).toBe("0");
		});

		it("converts one", () => {
			expect(toString(ONE, 2)).toBe("1");
		});

		it("converts powers of 2", () => {
			expect(toString(from(8n), 2)).toBe("1000");
			expect(toString(from(15n), 2)).toBe("1111");
		});
	});

	describe("octal (base 8)", () => {
		it("converts zero", () => {
			expect(toString(ZERO, 8)).toBe("0");
		});

		it("converts small values", () => {
			expect(toString(from(8n), 8)).toBe("10");
			expect(toString(from(64n), 8)).toBe("100");
		});
	});

	describe("edge cases", () => {
		it("handles MAX in different bases", () => {
			expect(toString(MAX, 10)).toBe(MAX.toString(10));
			expect(toString(MAX, 16)).toBe(MAX.toString(16));
			expect(toString(MAX, 2)).toBe(MAX.toString(2));
		});

		it("handles 128-bit boundary", () => {
			const value = from(1n << 128n);
			expect(toString(value, 10)).toBe((1n << 128n).toString(10));
			expect(toString(value, 16)).toBe((1n << 128n).toString(16));
		});
	});

	describe("round-trip", () => {
		it("from(BigInt(toString(x))) = x", () => {
			const values = [0n, 1n, 42n, 255n, 1000000n, 1n << 128n];
			for (const v of values) {
				const uint = from(v);
				const str = toString(uint);
				const restored = from(BigInt(str));
				expect(restored).toBe(uint);
			}
		});

		it("preserves hex values", () => {
			const values = [0xabcdn, 0xdeadbeefn, 0x123456789abcdefn];
			for (const v of values) {
				const uint = from(v);
				const hex = toString(uint, 16);
				const restored = from(BigInt(`0x${hex}`));
				expect(restored).toBe(uint);
			}
		});
	});
});
