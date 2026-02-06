/**
 * Tests for bls12-map-fp-to-g1.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, bls12MapFpToG1 } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("bls12-map-fp-to-g1.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should map field element to BLS12-381 G1 point", () => {
			// Doc states: maps a field element from Fp to a point in G1
			const input = new Uint8Array(64); // 64-byte field element
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 5500 gas", () => {
			// Doc states: Fixed: 5500 gas
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas: gasLimit < 5500
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 5499n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require exactly 64 bytes", () => {
			// Doc states: Total input length: 64 bytes (exactly)
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
		});

		it("should fail for invalid input length", () => {
			// Doc states: Invalid input length: input.len != 64
			const shortInput = new Uint8Array(63);
			const longInput = new Uint8Array(65);

			const resultShort = bls12MapFpToG1(shortInput, 10000n);
			const resultLong = bls12MapFpToG1(longInput, 10000n);

			expect(resultShort.success).toBe(false);
			expect(resultLong.success).toBe(false);
		});
	});

	describe("Output Format section", () => {
		it("should return 128 bytes (G1 point)", () => {
			// Doc states: Total output length: 128 bytes (G1 point: 64-byte x + 64-byte y)
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should have 64-byte x and y coordinates", () => {
			const input = new Uint8Array(64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			const x = result.output.slice(0, 64);
			const y = result.output.slice(64, 128);
			expect(x.length).toBe(64);
			expect(y.length).toBe(64);
		});
	});

	describe("Mapping Properties section", () => {
		it("should produce deterministic output", () => {
			// Same input should produce same output
			const input = new Uint8Array(64);
			input[63] = 42;

			const result1 = bls12MapFpToG1(input, 10000n);
			const result2 = bls12MapFpToG1(input, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect([...result1.output]).toEqual([...result2.output]);
		});

		it("should produce different outputs for different inputs", () => {
			const input1 = new Uint8Array(64);
			const input2 = new Uint8Array(64);
			input1[63] = 1;
			input2[63] = 2;

			const result1 = bls12MapFpToG1(input1, 10000n);
			const result2 = bls12MapFpToG1(input2, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			// Outputs should be different (assuming both inputs are valid)
			if (result1.success && result2.success) {
				expect([...result1.output]).not.toEqual([...result2.output]);
			}
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_MAP_FP_TO_G1", () => {
			const input = new Uint8Array(64);
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP_TO_G1,
				input,
				10000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(64);
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP_TO_G1,
				input,
				10000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			// NOTE: execute() does not enforce hardfork availability
			// Use isPrecompile() to check availability
			const { isPrecompile } = await import("../../../src/evm/precompiles/precompiles.js");
			expect(isPrecompile(PrecompileAddress.BLS12_MAP_FP_TO_G1, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(PrecompileAddress.BLS12_MAP_FP_TO_G1, Hardfork.CANCUN)).toBe(false);
		});
	});

	describe("Use Cases section", () => {
		it("should support hash-to-curve operations", () => {
			// Doc states: Used for hash-to-curve operations in BLS signatures
			// We test that the precompile is callable with arbitrary input
			const arbitraryInput = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				arbitraryInput[i] = i;
			}

			const result = bls12MapFpToG1(arbitraryInput, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});
});
