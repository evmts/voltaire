import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { fromBigInt } from "./fromBigInt.js";
import { toBigInt } from "./toBigInt.js";

describe("toBigInt", () => {
	it("converts zero", () => {
		expect(toBigInt("0x0" as BrandedHex)).toBe(0n);
		expect(toBigInt("0x00" as BrandedHex)).toBe(0n);
		expect(toBigInt("0x0000" as BrandedHex)).toBe(0n);
	});

	it("converts small values", () => {
		expect(toBigInt("0x1" as BrandedHex)).toBe(1n);
		expect(toBigInt("0xf" as BrandedHex)).toBe(15n);
		expect(toBigInt("0xff" as BrandedHex)).toBe(255n);
		expect(toBigInt("0x100" as BrandedHex)).toBe(256n);
		expect(toBigInt("0x1234" as BrandedHex)).toBe(0x1234n);
	});

	it("converts large values", () => {
		const large = "0xffffffffffffffffffffffffffffffff" as BrandedHex;
		expect(toBigInt(large)).toBe(0xffffffffffffffffffffffffffffffffn);
	});

	it("converts very large values (u256 max)", () => {
		const max =
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as BrandedHex;
		expect(toBigInt(max)).toBe(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		);
	});

	it("handles leading zeros", () => {
		expect(toBigInt("0x00ff" as BrandedHex)).toBe(255n);
		expect(toBigInt("0x0001" as BrandedHex)).toBe(1n);
		expect(toBigInt("0x00001234" as BrandedHex)).toBe(0x1234n);
	});

	it("handles uppercase hex", () => {
		expect(toBigInt("0xABCD" as BrandedHex)).toBe(0xabcdn);
		expect(toBigInt("0xDEADBEEF" as BrandedHex)).toBe(0xdeadbeefn);
	});

	it("handles mixed case", () => {
		expect(toBigInt("0xAbCd" as BrandedHex)).toBe(0xabcdn);
		expect(toBigInt("0xDeAdBeEf" as BrandedHex)).toBe(0xdeadbeefn);
	});

	it("round-trip conversions", () => {
		const values = [0n, 1n, 255n, 0x1234n, 0xffffffffn, 0xffffffffffffffffn];
		values.forEach((val) => {
			const hex = fromBigInt(val);
			expect(toBigInt(hex)).toBe(val);
		});
	});

	it("converts powers of 2", () => {
		expect(toBigInt("0x1" as BrandedHex)).toBe(1n);
		expect(toBigInt("0x2" as BrandedHex)).toBe(2n);
		expect(toBigInt("0x4" as BrandedHex)).toBe(4n);
		expect(toBigInt("0x100" as BrandedHex)).toBe(256n);
		expect(toBigInt("0x10000" as BrandedHex)).toBe(65536n);
		expect(toBigInt("0x10000000000000000" as BrandedHex)).toBe(2n ** 64n);
		expect(toBigInt("0x100000000000000000000000000000000" as BrandedHex)).toBe(
			2n ** 128n,
		);
	});

	it("handles wei conversions (18 decimals)", () => {
		const oneEther = 1_000_000_000_000_000_000n;
		const hex = fromBigInt(oneEther);
		expect(toBigInt(hex)).toBe(oneEther);
	});

	it("throws on empty hex", () => {
		expect(() => toBigInt("0x" as BrandedHex)).toThrow(SyntaxError);
	});

	it("handles values beyond Number.MAX_SAFE_INTEGER", () => {
		const beyond = "0xffffffffffffffff" as BrandedHex;
		expect(toBigInt(beyond)).toBe(0xffffffffffffffffn);
		expect(toBigInt(beyond)).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
	});
});
