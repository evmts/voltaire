import { describe, it, expect } from "vitest";
import { toHex } from "./toHex.js";
import { from } from "./from.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint128.toHex", () => {
	it("converts zero", () => {
		expect(toHex(ZERO)).toBe("0x0");
	});

	it("converts one", () => {
		expect(toHex(ONE)).toBe("0x1");
	});

	it("converts 255", () => {
		expect(toHex(from(255n))).toBe("0xff");
	});

	it("converts MAX", () => {
		expect(toHex(MAX)).toBe("0xffffffffffffffffffffffffffffffff");
	});

	it("converts Uint64 MAX", () => {
		expect(toHex(from(18446744073709551615n))).toBe("0xffffffffffffffff");
	});

	it("no padding on small values", () => {
		expect(toHex(from(0xabcn))).toBe("0xabc");
	});

	it("converts large value", () => {
		const val = from(1n << 100n);
		const hex = toHex(val);
		expect(hex.startsWith("0x")).toBe(true);
	});

	it("round-trips with fromHex", () => {
		const original = from(123456789123456789n);
		const hex = toHex(original);
		expect(from(hex)).toBe(original);
	});
});
