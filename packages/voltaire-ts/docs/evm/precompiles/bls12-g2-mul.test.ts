/**
 * Tests for bls12-g2-mul.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, bls12G2Mul } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("bls12-g2-mul.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should perform scalar multiplication on BLS12-381 G2 group", () => {
			// Doc states: performs elliptic curve scalar multiplication on the BLS12-381 curve's G2 group
			// Infinity * k = Infinity
			const input = new Uint8Array(288); // 256-byte point + 32-byte scalar
			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 45000 gas", () => {
			// Doc states: Fixed: 45000 gas
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(45000n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas: gasLimit < 45000
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 44999n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require exactly 288 bytes", () => {
			// Doc states: Total input length: 288 bytes (256-byte G2 point + 32-byte scalar)
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
		});

		it("should fail for invalid input length", () => {
			// Doc states: Invalid input length: input.len != 288
			const shortInput = new Uint8Array(287);
			const longInput = new Uint8Array(289);

			const resultShort = bls12G2Mul(shortInput, 50000n);
			const resultLong = bls12G2Mul(longInput, 50000n);

			expect(resultShort.success).toBe(false);
			expect(resultLong.success).toBe(false);
		});

		it("should have 256-byte point + 32-byte scalar structure", () => {
			// Point: bytes 0-255, Scalar: bytes 256-287
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 50000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Output Format section", () => {
		it("should return 256 bytes", () => {
			// Doc states: Total output length: 256 bytes
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Scalar Multiplication Properties from documentation", () => {
		it("should return infinity for P * 0", () => {
			// Doc states: P * 0 = O (multiplication by zero gives point at infinity)
			const input = new Uint8Array(288);
			// Point can be anything, scalar = 0 (already zeros)
			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
			// Result should be point at infinity
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return infinity for O * k", () => {
			// Doc states: O * k = O (infinity times any scalar is infinity)
			const input = new Uint8Array(288);
			input[287] = 42; // Set scalar to 42
			// Point is still zeros (infinity)

			const result = bls12G2Mul(input, 50000n);

			expect(result.success).toBe(true);
			// O * 42 = O
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_G2_MUL", () => {
			const input = new Uint8Array(288);
			const result = execute(
				PrecompileAddress.BLS12_G2_MUL,
				input,
				50000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(45000n);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(288);
			const result = execute(
				PrecompileAddress.BLS12_G2_MUL,
				input,
				50000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			// NOTE: execute() does not enforce hardfork availability
			// Use isPrecompile() to check availability
			const { isPrecompile } = await import("../../../src/evm/precompiles/precompiles.js");
			expect(isPrecompile(PrecompileAddress.BLS12_G2_MUL, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(PrecompileAddress.BLS12_G2_MUL, Hardfork.CANCUN)).toBe(false);
		});
	});

	describe("Gas Comparison section", () => {
		it("should use 45000 gas compared to G1 Mul's 12000", () => {
			// Doc states: G1 Multiplication: 12,000 gas, G2 Multiplication: 45,000 gas
			// Ratio: 3.75x
			const input = new Uint8Array(288);
			const result = bls12G2Mul(input, 50000n);
			expect(result.gasUsed).toBe(45000n);
		});
	});
});
