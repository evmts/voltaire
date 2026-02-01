/**
 * Tests for bls12-g1-msm.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, bls12G1Msm } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("bls12-g1-msm.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should perform multi-scalar multiplication on BLS12-381 G1 group", () => {
			// Doc states: computes the sum of multiple points each multiplied by their respective scalars
			// k1*P1 + k2*P2 + ... + kn*Pn
			const input = new Uint8Array(160); // One pair: 128-byte point + 32-byte scalar
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});

	describe("Gas Cost section", () => {
		it("should follow formula: (BASE_GAS * k * discount) / 1000", () => {
			// Doc states: Dynamic with discount: (BASE_GAS * k * discount) / 1000
			// BASE_GAS: 12000, k: Number of pairs
			// For k=1, discount=1000, gas = (12000 * 1 * 1000) / 1000 = 12000
			const input = new Uint8Array(160); // 1 pair
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(12000n);
		});

		it("should apply discount for 2-3 pairs", () => {
			// Doc states: 2-3 pairs: discount 820, gas per pair 9840
			// For k=2, gas = (12000 * 2 * 820) / 1000 = 19680
			const input = new Uint8Array(160 * 2); // 2 pairs
			const result = bls12G1Msm(input, 30000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(19680n);
		});

		it("should apply discount for 4-7 pairs", () => {
			// Doc states: 4-7 pairs: discount 580
			// For k=4, gas = (12000 * 4 * 580) / 1000 = 27840
			const input = new Uint8Array(160 * 4); // 4 pairs
			const result = bls12G1Msm(input, 40000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(27840n);
		});

		it("should fail with insufficient gas", () => {
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 11999n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require input length as multiple of 160", () => {
			// Doc states: Total input length: 160 * k bytes (must be exact multiple of 160)
			const validSizes = [160, 320, 480, 640];

			for (const size of validSizes) {
				const input = new Uint8Array(size);
				const k = size / 160;
				// Estimate gas with discounts
				const result = bls12G1Msm(input, 100000n);
				expect(result.success).toBe(true);
			}
		});

		it("should fail for invalid input length", () => {
			// Doc states: Invalid input length: input.len % 160 != 0 or input.len == 0
			const invalidSizes = [0, 100, 159, 161, 200];

			for (const size of invalidSizes) {
				const input = new Uint8Array(size);
				const result = bls12G1Msm(input, 100000n);
				expect(result.success).toBe(false);
			}
		});
	});

	describe("Output Format section", () => {
		it("should return 128 bytes (single aggregated point)", () => {
			// Doc states: Total output length: 128 bytes (single aggregated point)
			const input = new Uint8Array(160 * 3); // 3 pairs
			const result = bls12G1Msm(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});

	describe("MSM Properties from documentation", () => {
		it("should return zero for all zero scalars", () => {
			// Doc states: Zero scalars: Points with k=0 contribute nothing to sum
			const input = new Uint8Array(160 * 2); // 2 pairs, all zeros
			const result = bls12G1Msm(input, 30000n);

			expect(result.success).toBe(true);
			// All scalars zero -> result is point at infinity
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return zero for infinity points", () => {
			// Doc states: Point at infinity: Infinity points with any scalar contribute nothing
			const input = new Uint8Array(160);
			input[159] = 42; // scalar = 42, point = infinity
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			// Infinity * 42 = Infinity
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Gas Cost Comparison section", () => {
		it("should be more efficient than individual operations for large batches", () => {
			// Doc states: With 32 pairs, MSM is more efficient than individual ops
			// Actual API uses multiplier-based formula, not discount/1000
			const input = new Uint8Array(160 * 32);
			const result = bls12G1Msm(input, 500000n);

			expect(result.success).toBe(true);
			// Verify MSM works and returns reasonable gas (< individual: 32*12000 = 384000)
			expect(result.gasUsed).toBeLessThan(384000n);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_G1_MSM", () => {
			const input = new Uint8Array(160);
			const result = execute(
				PrecompileAddress.BLS12_G1_MSM,
				input,
				20000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(12000n);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(160);
			const result = execute(
				PrecompileAddress.BLS12_G1_MSM,
				input,
				20000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			// NOTE: execute() does not enforce hardfork availability
			// Use isPrecompile() to check availability
			const { isPrecompile } = await import("../../../src/evm/precompiles/precompiles.js");
			expect(isPrecompile(PrecompileAddress.BLS12_G1_MSM, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(PrecompileAddress.BLS12_G1_MSM, Hardfork.CANCUN)).toBe(false);
		});
	});

	describe("Discount Table from documentation", () => {
		it("should apply correct discount for each batch size range", () => {
			// API DISCREPANCY: Actual implementation uses EIP-2537 multiplier-based formula
			// not the simple discount/1000 formula from documentation
			// Actual: gas = BASE_GAS * multiplier where multiplier grows sub-linearly with k
			const testCases = [
				{ k: 1, expectedGas: 12000n },  // multiplier=1.0
				{ k: 2, expectedGas: 19680n },  // multiplier=1.64
				{ k: 4, expectedGas: 27840n },  // multiplier=2.32
			];

			for (const { k, expectedGas } of testCases) {
				const input = new Uint8Array(160 * k);
				const result = bls12G1Msm(input, 200000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(expectedGas);
			}
		});
	});
});
