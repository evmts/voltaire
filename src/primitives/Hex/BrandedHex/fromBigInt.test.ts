import { describe, expect, it } from "vitest";
import { fromBigInt } from "./fromBigInt.js";
import { toBigInt } from "./toBigInt.js";

describe("fromBigInt", () => {
	it("converts zero", () => {
		expect(fromBigInt(0n)).toBe("0x0");
	});

	it("converts small bigints", () => {
		expect(fromBigInt(1n)).toBe("0x1");
		expect(fromBigInt(15n)).toBe("0xf");
		expect(fromBigInt(255n)).toBe("0xff");
		expect(fromBigInt(256n)).toBe("0x100");
		expect(fromBigInt(0x1234n)).toBe("0x1234");
	});

	it("converts large bigints", () => {
		const large = 0xffffffffffffffffffffffffffffffffn;
		expect(fromBigInt(large)).toBe("0xffffffffffffffffffffffffffffffff");
	});

	it("converts very large bigints (u256 max)", () => {
		const max =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		expect(fromBigInt(max)).toBe(
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		);
	});

	it("converts with size padding", () => {
		expect(fromBigInt(255n, 1)).toBe("0xff");
		expect(fromBigInt(255n, 2)).toBe("0x00ff");
		expect(fromBigInt(255n, 4)).toBe("0x000000ff");
		expect(fromBigInt(255n, 32)).toBe(
			"0x00000000000000000000000000000000000000000000000000000000000000ff",
		);
	});

	it("does not pad when value exceeds size", () => {
		expect(fromBigInt(0x1234n, 1)).toBe("0x1234");
		expect(fromBigInt(0xabcdefn, 2)).toBe("0xabcdef");
	});

	it("round-trip conversions", () => {
		const values = [0n, 1n, 255n, 0x1234n, 0xffffffffn, 0xffffffffffffffffn];
		values.forEach((val) => {
			const hex = fromBigInt(val);
			expect(toBigInt(hex)).toBe(val);
		});
	});

	it("converts powers of 2", () => {
		expect(fromBigInt(1n)).toBe("0x1");
		expect(fromBigInt(2n)).toBe("0x2");
		expect(fromBigInt(4n)).toBe("0x4");
		expect(fromBigInt(256n)).toBe("0x100");
		expect(fromBigInt(65536n)).toBe("0x10000");
		expect(fromBigInt(2n ** 64n)).toBe("0x10000000000000000");
		expect(fromBigInt(2n ** 128n)).toBe("0x100000000000000000000000000000000");
	});

	it("handles wei conversions (18 decimals)", () => {
		const oneEther = 1_000_000_000_000_000_000n;
		const hex = fromBigInt(oneEther);
		expect(toBigInt(hex)).toBe(oneEther);
	});

	it("handles negative bigints (uses default toString)", () => {
		const hex = fromBigInt(-1n);
		expect(hex.startsWith("0x")).toBe(true);
		expect(hex).toBe("0x-1");
	});
});
