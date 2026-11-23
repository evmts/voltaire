/**
 * Tests for bls12-pairing.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import {
	bls12Pairing,
	execute,
	PrecompileAddress,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("bls12-pairing.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should perform pairing check on BLS12-381 curve", () => {
			// Doc states: performs a pairing check on the BLS12-381 elliptic curve
			// A pair of infinity points contributes the multiplicative identity.
			const input = new Uint8Array(384);
			const result = bls12Pairing(input, 120000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});
	});

	describe("Gas Cost section", () => {
		it("should follow formula: 32600 * k + 37700", () => {
			// Doc states: Formula: 32600 * k + 37700 where k = number of point pairs
			const testCases = [
				{ pairs: 1, expectedGas: 70300n }, // 32600*1 + 37700 = 70300
				{ pairs: 2, expectedGas: 102900n }, // 32600*2 + 37700 = 102900
				{ pairs: 3, expectedGas: 135500n },
				{ pairs: 4, expectedGas: 168100n }, // 32600*4 + 37700 = 168100
			];

			for (const { pairs, expectedGas } of testCases) {
				// Each pair is 384 bytes (128-byte G1 + 256-byte G2)
				const input = new Uint8Array(384 * pairs);
				const result = bls12Pairing(input, 300000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(expectedGas);
			}
		});

		it("should fail with insufficient gas for two pairs", () => {
			const input = new Uint8Array(768);
			const result = bls12Pairing(input, 102899n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should fail with insufficient gas for 1 pair", () => {
			const input = new Uint8Array(384);
			const result = bls12Pairing(input, 70299n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should accept nonempty multiples of 384 bytes", () => {
			// Doc states: Input must be a multiple of 384 bytes (128-byte G1 + 256-byte G2)
			const validSizes = [384, 768, 1152];

			for (const size of validSizes) {
				const input = new Uint8Array(size);
				const pairs = size / 384;
				const gasNeeded = 32600n * BigInt(pairs) + 37700n;
				const result = bls12Pairing(input, gasNeeded + 10000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(gasNeeded);
			}
		});

		it("should fail for input not multiple of 384", () => {
			// Doc states: Input length not multiple of 384 -> error
			const invalidSizes = [1, 100, 383, 385, 500];

			for (const size of invalidSizes) {
				const input = new Uint8Array(size);
				const result = bls12Pairing(input, 200000n);
				expect(result.success).toBe(false);
			}
		});

		it("should reject empty input (k=0)", () => {
			const input = new Uint8Array(0);
			const result = bls12Pairing(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
			expect(result.gasUsed).toBe(100000n);
			expect(result.output).toHaveLength(0);
		});
	});

	describe("Output Format section", () => {
		it("should return 32 bytes", () => {
			// Doc states: Total output length: 32 bytes
			const input = new Uint8Array(384);
			const result = bls12Pairing(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should return 1 for successful pairing check", () => {
			// Doc states: Success: 0x0000...0001 (last byte = 1)
			const input = new Uint8Array(384);
			const result = bls12Pairing(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output[31]).toBe(1);
			// Other bytes should be zero
			expect([...result.output.slice(0, 31)].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Error Conditions section", () => {
		it("should fail with out of gas", () => {
			const input = new Uint8Array(384);
			const result = bls12Pairing(input, 1000n);
			expect(result.success).toBe(false);
		});

		it("should fail for input length not multiple of 384", () => {
			const input = new Uint8Array(100);
			const result = bls12Pairing(input, 200000n);
			expect(result.success).toBe(false);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_PAIRING", () => {
			const input = new Uint8Array(384);
			const result = execute(
				PrecompileAddress.BLS12_PAIRING,
				input,
				100000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(70300n);
			expect(result.output[31]).toBe(1);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(384);
			const result = execute(
				PrecompileAddress.BLS12_PAIRING,
				input,
				100000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			const { isPrecompile } = await import(
				"../../../src/evm/precompiles/precompiles.js"
			);
			expect(
				isPrecompile(PrecompileAddress.BLS12_PAIRING, Hardfork.PRAGUE),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.BLS12_PAIRING, Hardfork.CANCUN),
			).toBe(false);
		});
	});

	describe("Security section", () => {
		it("should reject an on-curve G1 point outside the subgroup", () => {
			const input = new Uint8Array(384);
			input[127] = 2; // G1 (0, 2) is on the curve, with order 3.
			const result = bls12Pairing(input, 100000n);
			expect(result.success).toBe(false);
			expect(result.error).toContain("subgroup");
			expect(result.gasUsed).toBe(100000n);
			expect(result.output).toHaveLength(0);
		});
	});
});
