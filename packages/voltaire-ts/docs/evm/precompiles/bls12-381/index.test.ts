/**
 * Tests for bls12-381/index.mdx documentation examples
 * Validates all BLS12-381 precompiles work as documented
 */
import { describe, expect, it } from "vitest";
import {
	bls12G1Add,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	execute,
	PrecompileAddress,
} from "../../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../../src/primitives/Hardfork/index.js";

describe("bls12-381/index.mdx (BLS12-381 Precompiles Overview) documentation", () => {
	describe("Precompile Summary Table", () => {
		it("should have correct addresses 0x0b–0x11", () => {
			expect(PrecompileAddress.BLS12_G1_ADD).toBe(
				"0x000000000000000000000000000000000000000b",
			);
			expect(PrecompileAddress.BLS12_G1_MSM).toBe(
				"0x000000000000000000000000000000000000000c",
			);
			expect(PrecompileAddress.BLS12_G2_ADD).toBe(
				"0x000000000000000000000000000000000000000d",
			);
			expect(PrecompileAddress.BLS12_G2_MSM).toBe(
				"0x000000000000000000000000000000000000000e",
			);
			expect(PrecompileAddress.BLS12_PAIRING).toBe(
				"0x000000000000000000000000000000000000000f",
			);
			expect(PrecompileAddress.BLS12_MAP_FP_TO_G1).toBe(
				"0x0000000000000000000000000000000000000010",
			);
			expect(PrecompileAddress.BLS12_MAP_FP2_TO_G2).toBe(
				"0x0000000000000000000000000000000000000011",
			);
		});

		it("should have correct fixed gas costs", () => {
			// Doc table shows fixed gas costs
			expect(bls12G1Add(new Uint8Array(256), 1000n).gasUsed).toBe(375n);
			expect(bls12G2Add(new Uint8Array(512), 2000n).gasUsed).toBe(600n);
			expect(bls12MapFpToG1(new Uint8Array(64), 10000n).gasUsed).toBe(5500n);
			expect(bls12MapFp2ToG2(new Uint8Array(128), 100000n).gasUsed).toBe(
				23800n,
			);
		});

		it("should have correct input/output sizes for G1 operations", () => {
			// Doc states: G1_ADD: 256 input, 128 output
			const addResult = bls12G1Add(new Uint8Array(256), 1000n);
			expect(addResult.success).toBe(true);
			expect(addResult.output.length).toBe(128);

			// Doc states: G1_MSM: 160k input, 128 output
			const msmResult = bls12G1Msm(new Uint8Array(160), 20000n);
			expect(msmResult.success).toBe(true);
			expect(msmResult.output.length).toBe(128);
		});

		it("should have correct input/output sizes for G2 operations", () => {
			// Doc states: G2_ADD: 512 input, 256 output
			const addResult = bls12G2Add(new Uint8Array(512), 2000n);
			expect(addResult.success).toBe(true);
			expect(addResult.output.length).toBe(256);

			// Doc states: G2_MSM: 288k input, 256 output
			const msmResult = bls12G2Msm(new Uint8Array(288), 50000n);
			expect(msmResult.success).toBe(true);
			expect(msmResult.output.length).toBe(256);
		});

		it("should have correct input/output sizes for pairing and map operations", () => {
			// Doc states: PAIRING: 384k input, 32 output
			const pairingResult = bls12Pairing(new Uint8Array(384), 100000n);
			expect(pairingResult.success).toBe(true);
			expect(pairingResult.output.length).toBe(32);

			// Doc states: MAP_FP_TO_G1: 64 input, 128 output
			const mapG1Result = bls12MapFpToG1(new Uint8Array(64), 10000n);
			expect(mapG1Result.success).toBe(true);
			expect(mapG1Result.output.length).toBe(128);

			// Doc states: MAP_FP2_TO_G2: 128 input, 256 output
			const mapG2Result = bls12MapFp2ToG2(new Uint8Array(128), 100000n);
			expect(mapG2Result.success).toBe(true);
			expect(mapG2Result.output.length).toBe(256);
		});
	});

	describe("G1 Operations", () => {
		it("should handle G1_ADD correctly", () => {
			// Doc states: Add two points on the G1 curve
			// Point at infinity + Point at infinity = Point at infinity
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(375n);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return infinity for a single G1 pair with a zero scalar", () => {
			// Doc states: Scalar multiplication on G1. Scalar is reduced modulo curve order.
			// Point * 0 = Point at infinity
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(12000n);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should handle G1_MSM discount calculation", () => {
			// Doc states: gas = (12000 × k × discount) / 1000
			// For k=4, discount=797: gas = (12000 × 4 × 797) / 1000 = 38256
			const input = new Uint8Array(160 * 4);
			const result = bls12G1Msm(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(38256n);
		});
	});

	describe("G2 Operations", () => {
		it("should handle G2_ADD correctly", () => {
			// Doc states: Add two points on the G2 curve
			const input = new Uint8Array(512);
			const result = bls12G2Add(input, 2000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(600n);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return infinity for a single G2 pair with a zero scalar", () => {
			// Doc states: Scalar multiplication on G2
			const input = new Uint8Array(288);
			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(22500n);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should handle G2_MSM discount calculation", () => {
			// For k=2, the G2 multiplier is 1000 and the per-pair base cost is 22500.
			const input = new Uint8Array(288 * 2);
			const result = bls12G2Msm(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(45000n);
		});
	});

	describe("Pairing Operation", () => {
		it("should reject BLS12_PAIRING with empty input", () => {
			// EIP-2537 requires at least one pair.
			const input = new Uint8Array(0);
			const result = bls12Pairing(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
			expect(result.gasUsed).toBe(100000n);
			expect(result.output).toHaveLength(0);
		});

		it("should calculate pairing gas correctly", () => {
			// For two pairs, EIP-2537 charges 37700 + 32600 * 2 gas.
			const input = new Uint8Array(384 * 2);
			const result = bls12Pairing(input, 200000n);

			expect(result.gasUsed).toBe(102900n);
		});
	});

	describe("Map Operations", () => {
		it("should handle MAP_FP_TO_G1 correctly", () => {
			// Doc states: Map a field element to a G1 point
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
			expect(result.output.length).toBe(128);
		});

		it("should handle MAP_FP2_TO_G2 correctly", () => {
			// Doc states: Map an Fp2 element to a G2 point
			const input = new Uint8Array(128);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(23800n);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Point Encoding section", () => {
		it("should use 128-byte G1 points (64+64)", () => {
			// Doc states: G1 Point (128 bytes): [x-coordinate (64 bytes)][y-coordinate (64 bytes)]
			const output = bls12G1Add(new Uint8Array(256), 1000n).output;
			expect(output.length).toBe(128);
		});

		it("should use 256-byte G2 points (4x64)", () => {
			// Doc states: G2 Point (256 bytes): [x.c0 (64)][x.c1 (64)][y.c0 (64)][y.c1 (64)]
			const output = bls12G2Add(new Uint8Array(512), 2000n).output;
			expect(output.length).toBe(256);
		});
	});

	describe("MSM Discount Table section", () => {
		it("should apply discounts from table for G1_MSM", () => {
			const testCases = [
				{ k: 1, expectedGas: 12000n },
				{ k: 2, expectedGas: 22776n },
				{ k: 4, expectedGas: 38256n },
			];

			for (const { k, expectedGas } of testCases) {
				const input = new Uint8Array(160 * k);
				const result = bls12G1Msm(input, 200000n);
				expect(result.gasUsed).toBe(expectedGas);
			}
		});
	});

	describe("Error Conditions section", () => {
		it("should fail for invalid G1_ADD input length", () => {
			// Doc states: Invalid input length (not 256 bytes)
			const result = bls12G1Add(new Uint8Array(255), 1000n);
			expect(result.success).toBe(false);
		});

		it("should reject a truncated G1_MSM pair", () => {
			// A G1 point-scalar pair occupies 160 bytes.
			const result = bls12G1Msm(new Uint8Array(159), 20000n);
			expect(result.success).toBe(false);
		});

		it("should fail for invalid G1_MSM empty input", () => {
			// Doc states: Empty input error
			const result = bls12G1Msm(new Uint8Array(0), 20000n);
			expect(result.success).toBe(false);
		});

		it("should fail for invalid pairing input length", () => {
			// Doc states: Invalid input length (not multiple of 384)
			const result = bls12Pairing(new Uint8Array(100), 200000n);
			expect(result.success).toBe(false);
		});
	});

	describe("Hardfork Availability section", () => {
		it("should be available from PRAGUE hardfork", () => {
			const operations = [
				{ address: PrecompileAddress.BLS12_G1_ADD, size: 256, gas: 375n },
				{ address: PrecompileAddress.BLS12_G1_MSM, size: 160, gas: 12000n },
				{ address: PrecompileAddress.BLS12_G2_ADD, size: 512, gas: 600n },
				{ address: PrecompileAddress.BLS12_G2_MSM, size: 288, gas: 22500n },
				{ address: PrecompileAddress.BLS12_PAIRING, size: 384, gas: 70300n },
				{ address: PrecompileAddress.BLS12_MAP_FP_TO_G1, size: 64, gas: 5500n },
				{
					address: PrecompileAddress.BLS12_MAP_FP2_TO_G2,
					size: 128,
					gas: 23800n,
				},
			];

			for (const { address, size, gas } of operations) {
				const input = new Uint8Array(size);
				expect(execute(address, input, gas, Hardfork.PRAGUE).success).toBe(
					true,
				);
				expect(execute(address, input, gas, Hardfork.CANCUN).error).toContain(
					"Unknown precompile",
				);
			}
		});

		it("should check hardfork availability via isPrecompile", async () => {
			const { isPrecompile } = await import(
				"../../../../src/evm/precompiles/precompiles.js"
			);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G1_ADD, Hardfork.PRAGUE),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G1_ADD, Hardfork.CANCUN),
			).toBe(false);
		});

		it("should be available in PRAGUE hardfork via execute", () => {
			const input = new Uint8Array(256);
			const result = execute(
				PrecompileAddress.BLS12_G1_ADD,
				input,
				1000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("Security Considerations section", () => {
		it("should enforce input validation", () => {
			// Doc states: Input points are validated, must satisfy curve equation
			// Invalid points return error
			const invalidInput = new Uint8Array(256);
			// Fill with non-zero invalid data
			invalidInput.fill(0xff, 0, 128);

			const result = bls12G1Add(invalidInput, 1000n);
			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(1000n);
			expect(result.output).toHaveLength(0);
		});
	});
});
