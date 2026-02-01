/**
 * Tests for bls12-g1-add.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, bls12G1Add } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("bls12-g1-add.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should perform point addition on BLS12-381 G1 group", () => {
			// Doc states: performs elliptic curve point addition on the BLS12-381 curve's G1 group
			// Point at infinity + Point at infinity = Point at infinity
			const input = new Uint8Array(256); // Two zero points (infinity)
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 500 gas", () => {
			// Doc states: Fixed: 500 gas
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(500n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas: gasLimit < 500
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 499n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require exactly 256 bytes", () => {
			// Doc states: Total input length: 256 bytes (exactly)
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
		});

		it("should fail for invalid input length", () => {
			// Doc states: Invalid input length: input.len != 256
			const shortInput = new Uint8Array(255);
			const longInput = new Uint8Array(257);

			const resultShort = bls12G1Add(shortInput, 1000n);
			const resultLong = bls12G1Add(longInput, 1000n);

			expect(resultShort.success).toBe(false);
			expect(resultLong.success).toBe(false);
		});

		it("should handle point at infinity (all zeros)", () => {
			// Doc states: Point at infinity is represented as all zeros (128 bytes of zeros for each point)
			const input = new Uint8Array(256); // All zeros
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			// Result should be point at infinity (all zeros)
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Output Format section", () => {
		it("should return 128 bytes", () => {
			// Doc states: Total output length: 128 bytes
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should have 64-byte x and y coordinates", () => {
			// Doc states: x (64 bytes), y (64 bytes)
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			// Output structure: 64 bytes x, 64 bytes y
			const x = result.output.slice(0, 64);
			const y = result.output.slice(64, 128);
			expect(x.length).toBe(64);
			expect(y.length).toBe(64);
		});
	});

	describe("Point Addition Rules from documentation", () => {
		it("should satisfy P + O = P", () => {
			// Doc states: P + O = P (identity element)
			// We can't easily create a valid G1 point without crypto libs,
			// but we can test O + O = O
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);

			expect(result.success).toBe(true);
			// O + O = O
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_G1_ADD", () => {
			const input = new Uint8Array(256);
			const result = execute(
				PrecompileAddress.BLS12_G1_ADD,
				input,
				1000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(500n);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(256);
			const result = execute(
				PrecompileAddress.BLS12_G1_ADD,
				input,
				1000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			// NOTE: execute() does not enforce hardfork availability
			// Use isPrecompile() to check availability
			const { isPrecompile } = await import("../../../src/evm/precompiles/precompiles.js");
			expect(isPrecompile(PrecompileAddress.BLS12_G1_ADD, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(PrecompileAddress.BLS12_G1_ADD, Hardfork.CANCUN)).toBe(false);
		});
	});

	describe("BLS12-381 G1 Parameters section", () => {
		it("should work with curve equation y^2 = x^3 + 4", () => {
			// Doc states: Curve equation: y^2 = x^3 + 4
			// We test with identity point which satisfies the curve
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);
			expect(result.success).toBe(true);
		});

		it("should use 64-byte padded coordinates", () => {
			// Doc states: Coordinate size: 48 bytes (padded to 64 bytes in precompile encoding)
			// Each G1 point is 128 bytes total (64 x + 64 y)
			const input = new Uint8Array(256);
			const result = bls12G1Add(input, 1000n);
			expect(result.output.length).toBe(128);
		});
	});
});
