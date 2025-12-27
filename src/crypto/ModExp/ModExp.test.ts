import { describe, expect, it } from "vitest";
import { ModExp, calculateGas, modexp, modexpBytes } from "./ModExp.js";

describe("ModExp", () => {
	describe("modexp (BigInt API)", () => {
		it("should compute 2^3 mod 5 = 3", () => {
			expect(modexp(2n, 3n, 5n)).toBe(3n);
		});

		it("should compute 3^7 mod 13 = 3", () => {
			expect(modexp(3n, 7n, 13n)).toBe(3n);
		});

		it("should compute 2^10 mod 1000 = 24", () => {
			expect(modexp(2n, 10n, 1000n)).toBe(24n);
		});

		it("should compute large exponent 2^100 mod 1000", () => {
			const expected = 2n ** 100n % 1000n;
			expect(modexp(2n, 100n, 1000n)).toBe(expected);
		});

		it("should handle zero base (0^n = 0 for n > 0)", () => {
			expect(modexp(0n, 5n, 7n)).toBe(0n);
		});

		it("should handle zero exponent (n^0 = 1)", () => {
			expect(modexp(5n, 0n, 7n)).toBe(1n);
		});

		it("should handle modulus = 1 (always 0)", () => {
			expect(modexp(999n, 999n, 1n)).toBe(0n);
		});

		it("should throw on zero modulus", () => {
			expect(() => modexp(2n, 3n, 0n)).toThrow("Division by zero");
		});

		it("should handle base >= modulus", () => {
			expect(modexp(10n, 2n, 7n)).toBe(2n); // 10^2 mod 7 = 100 mod 7 = 2
		});

		it("should handle 0^0 = 1", () => {
			expect(modexp(0n, 0n, 7n)).toBe(1n);
		});

		it("should handle Fermat's little theorem (a^(p-1) mod p = 1)", () => {
			const p = 97n;
			const a = 3n;
			expect(modexp(a, p - 1n, p)).toBe(1n);
		});

		it("should handle very large numbers (256-bit)", () => {
			const base = 2n ** 256n - 1n;
			const exp = 3n;
			const mod = 2n ** 128n - 1n;
			const result = modexp(base, exp, mod);
			expect(result < mod).toBe(true);
		});
	});

	describe("modexpBytes (Uint8Array API)", () => {
		it("should compute 2^3 mod 5 = 3", () => {
			const base = new Uint8Array([0x02]);
			const exp = new Uint8Array([0x03]);
			const mod = new Uint8Array([0x05]);
			const result = modexpBytes(base, exp, mod);
			expect(result).toEqual(new Uint8Array([0x03]));
		});

		it("should pad output to modulus length", () => {
			const base = new Uint8Array([0x02]);
			const exp = new Uint8Array([0x02]); // 2^2 = 4
			const mod = new Uint8Array([0x00, 0x64]); // 100 in 2 bytes
			const result = modexpBytes(base, exp, mod);
			expect(result.length).toBe(2);
			expect(result).toEqual(new Uint8Array([0x00, 0x04]));
		});

		it("should handle empty inputs as zero", () => {
			const base = new Uint8Array([]);
			const exp = new Uint8Array([0x05]);
			const mod = new Uint8Array([0x07]);
			const result = modexpBytes(base, exp, mod);
			expect(result).toEqual(new Uint8Array([0x00])); // 0^5 mod 7 = 0
		});

		it("should throw on zero modulus", () => {
			const base = new Uint8Array([0x02]);
			const exp = new Uint8Array([0x03]);
			const mod = new Uint8Array([0x00]);
			expect(() => modexpBytes(base, exp, mod)).toThrow("Division by zero");
		});

		it("should handle multi-byte numbers", () => {
			// 256^2 mod 1000 = 65536 mod 1000 = 536
			const base = new Uint8Array([0x01, 0x00]); // 256
			const exp = new Uint8Array([0x02]); // 2
			const mod = new Uint8Array([0x03, 0xe8]); // 1000
			const result = modexpBytes(base, exp, mod);
			// 536 = 0x218
			expect(result).toEqual(new Uint8Array([0x02, 0x18]));
		});
	});

	describe("calculateGas", () => {
		it("should return minimum 200 for small inputs", () => {
			expect(calculateGas(1n, 1n, 1n, 1n)).toBe(200n);
		});

		it("should calculate higher gas for larger inputs", () => {
			const gas = calculateGas(32n, 32n, 32n, 2n ** 255n);
			expect(gas).toBeGreaterThan(200n);
		});

		it("should scale with base/mod length (quadratic for small)", () => {
			const gas1 = calculateGas(1n, 1n, 1n, 1n);
			const gas64 = calculateGas(64n, 1n, 64n, 1n);
			expect(gas64).toBeGreaterThan(gas1);
		});

		it("should scale with exponent size", () => {
			const gasSmallExp = calculateGas(32n, 1n, 32n, 2n);
			const gasLargeExp = calculateGas(32n, 32n, 32n, 2n ** 255n);
			expect(gasLargeExp).toBeGreaterThan(gasSmallExp);
		});
	});

	describe("ModExp namespace", () => {
		it("should be callable directly", () => {
			expect(ModExp(2n, 3n, 5n)).toBe(3n);
		});

		it("should have modexp method", () => {
			expect(ModExp.modexp(2n, 3n, 5n)).toBe(3n);
		});

		it("should have modexpBytes method", () => {
			const result = ModExp.modexpBytes(
				new Uint8Array([0x02]),
				new Uint8Array([0x03]),
				new Uint8Array([0x05]),
			);
			expect(result).toEqual(new Uint8Array([0x03]));
		});

		it("should have calculateGas method", () => {
			expect(ModExp.calculateGas(1n, 1n, 1n, 1n)).toBe(200n);
		});
	});
});
