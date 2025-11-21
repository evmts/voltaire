import { describe, it, expect } from "vitest";
import { toHex } from "./toHex.js";
import { from } from "./from.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint64.toHex", () => {
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
		expect(toHex(MAX)).toBe("0xffffffffffffffff");
	});

	it("converts power of 2", () => {
		expect(toHex(from(256n))).toBe("0x100");
	});

	it("converts 0xdeadbeef", () => {
		expect(toHex(from(0xdeadbeefn))).toBe("0xdeadbeef");
	});

	it("no padding on small values", () => {
		expect(toHex(from(0xabcn))).toBe("0xabc");
	});

	it("round-trips with fromHex", () => {
		const original = from(123456789n);
		const hex = toHex(original);
		expect(from(hex)).toBe(original);
	});
});
