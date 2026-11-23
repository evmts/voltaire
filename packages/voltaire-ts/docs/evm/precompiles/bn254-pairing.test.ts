/**
 * Tests for bn254-pairing.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { FP_MOD } from "../../../src/crypto/bn254/constants.js";
import {
	bn254Pairing,
	execute,
	PrecompileAddress,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

// EIP-197 G2 generator, encoded as x.c1 || x.c0 || y.c1 || y.c0.
const G2_GENERATOR = [
	11559732032986387107991004021392285783925812861821192530917403151452391805634n,
	10857046999023057135944570762232829481370756359578518086990519993285655852781n,
	4082367875863433681332203403145435568316851327593401208105741076214120093531n,
	8495653923123431417604973247489272438418190587263600148770280649306958101930n,
];

function encodeWords(words: bigint[]): Uint8Array {
	const hex = words.map((word) => word.toString(16).padStart(64, "0")).join("");
	return Uint8Array.from(Buffer.from(hex, "hex"));
}

describe("bn254-pairing.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should pair generators encoded in EIP-197 wire order", () => {
			const input = encodeWords([1n, 2n, ...G2_GENERATOR]);
			const result = bn254Pairing(input, 100000n, Hardfork.ISTANBUL);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(79000n);
			expect(result.output).toEqual(new Uint8Array(32));
		});
	});

	describe("Gas Cost section", () => {
		it("should follow formula: 45000 + 34000 * k", () => {
			// Doc states: Formula: 45000 + 34000 * k where k = number of point pairs
			const testCases = [
				{ pairs: 0, expectedGas: 45000n }, // Empty input
				{ pairs: 1, expectedGas: 79000n }, // 45000 + 34000*1
				{ pairs: 2, expectedGas: 113000n }, // 45000 + 34000*2
				{ pairs: 4, expectedGas: 181000n }, // 45000 + 34000*4
			];

			for (const { pairs, expectedGas } of testCases) {
				const input = new Uint8Array(192 * pairs);
				const result = bn254Pairing(input, 200000n);
				expect(result.gasUsed).toBe(expectedGas);
			}
		});

		it("should fail with insufficient gas for empty input", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 44999n); // Need 45000
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should fail with insufficient gas for 1 pair", () => {
			const input = new Uint8Array(192);
			const result = bn254Pairing(input, 78999n); // Need 79000
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should accept input as multiple of 192 bytes", () => {
			// Doc states: Input must be a multiple of 192 bytes
			const validSizes = [0, 192, 384, 576, 768];

			for (const size of validSizes) {
				const input = new Uint8Array(size);
				const gasNeeded = 45000n + 34000n * BigInt(size / 192);
				const result = bn254Pairing(input, gasNeeded + 10000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(gasNeeded);
			}
		});

		it("should fail for input not multiple of 192", () => {
			// Doc states: Input length not multiple of 192 -> error
			const invalidSizes = [1, 100, 191, 193, 200];

			for (const size of invalidSizes) {
				const input = new Uint8Array(size);
				const result = bn254Pairing(input, 200000n);
				expect(result.success).toBe(false);
			}
		});

		it("should accept empty input (k=0)", () => {
			// Doc states: Empty input (0 bytes) is valid and returns success
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output[31]).toBe(1); // Pairing check passes (empty product = 1)
		});
	});

	describe("Output Format section", () => {
		it("should return 32 bytes", () => {
			// Doc states: Total output length: 32 bytes (single word)
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should return 1 for successful pairing check", () => {
			// Doc states: Success: 0x0000...0001 (last byte = 1)
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output[31]).toBe(1);
			// Other bytes should be zero
			expect([...result.output.slice(0, 31)].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Test Vectors from documentation", () => {
		it("should pass empty input (identity check)", () => {
			// Doc Vector 1: Empty input (identity check)
			// Empty product of pairings should equal 1 (success)
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(45000n);
			expect(result.output[31]).toBe(1);
		});
	});

	describe("Error Conditions section", () => {
		it("should fail with out of gas", () => {
			// Doc states: Out of gas
			const input = new Uint8Array(192);
			const result = bn254Pairing(input, 1000n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(1000n);
			expect(result.output).toHaveLength(0);
		});

		it("should fail for input length not multiple of 192", () => {
			// Doc states: Input length not multiple of 192
			const input = new Uint8Array(100);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
			expect(result.gasUsed).toBe(100000n);
			expect(result.output).toHaveLength(0);
		});

		it("should reject G2 components at or above the field modulus", () => {
			const gasLimit = 100000n;
			for (let i = 0; i < G2_GENERATOR.length; i++) {
				for (const invalid of [FP_MOD, FP_MOD + 1n]) {
					const words = [1n, 2n, ...G2_GENERATOR];
					words[i + 2] = invalid;
					const result = bn254Pairing(encodeWords(words), gasLimit);
					expect(result.success).toBe(false);
					expect(result.error).toContain("canonical field element");
					expect(result.gasUsed).toBe(gasLimit);
					expect(result.output).toHaveLength(0);
				}
			}
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BN254_PAIRING", () => {
			const input = new Uint8Array(0);
			const result = execute(
				PrecompileAddress.BN254_PAIRING,
				input,
				50000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(45000n);
			expect(result.output[31]).toBe(1);
		});

		it("should be available from BYZANTIUM hardfork", () => {
			// Doc states: Introduced: Byzantium (EIP-197)
			const input = new Uint8Array(0);
			const result = execute(
				PrecompileAddress.BN254_PAIRING,
				input,
				100000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(100000n);
		});
	});

	describe("Gas Cost Comparison section", () => {
		it("should charge the exact Byzantium and Istanbul prices for four pairs", () => {
			const input = new Uint8Array(192 * 4);
			const byzantium = bn254Pairing(input, 420000n, Hardfork.BYZANTIUM);
			const istanbul = bn254Pairing(input, 181000n, Hardfork.ISTANBUL);
			expect(byzantium.success).toBe(true);
			expect(byzantium.gasUsed).toBe(420000n);
			expect(istanbul.success).toBe(true);
			expect(istanbul.gasUsed).toBe(181000n);
		});
	});

	describe("Groth16 zkSNARK Verification section", () => {
		it("should support 4 pairs for Groth16 verification", () => {
			// Doc states: Gas cost for Groth16: 45000 + 34000*4 = 181,000 gas
			const pairs = 4;
			const input = new Uint8Array(192 * pairs);
			const gasNeeded = 45000n + 34000n * BigInt(pairs);

			const result = bn254Pairing(input, gasNeeded + 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(gasNeeded);
		});
	});
});
