/**
 * Tests for BLS12-381 G1 scalar multiplication with one MSM pair
 * Validates code examples work correctly with actual API
 */
import { Buffer } from "node:buffer";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, it } from "vitest";
import {
	bls12G1Msm,
	bn254Mul,
	execute,
	PrecompileAddress,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

function encodePoint(point: typeof bls12_381.G1.Point.BASE): Uint8Array {
	const { x, y } = point.toAffine();
	const hex = [x, y]
		.map((coordinate) => coordinate.toString(16).padStart(128, "0"))
		.join("");
	return Uint8Array.from(Buffer.from(hex, "hex"));
}

const generator = bls12_381.G1.Point.BASE;

describe("BLS12-381 G1 scalar multiplication with one MSM pair", () => {
	describe("Overview section", () => {
		it("should double the G1 generator with one MSM pair", () => {
			const input = new Uint8Array(160);
			input.set(encodePoint(generator));
			input[159] = 2;

			const result = bls12G1Msm(input, 12000n);

			expect(result.success).toBe(true);
			expect(result.output).toEqual(encodePoint(generator.double()));
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 12000 gas", () => {
			// EIP-2537 single-pair cost: 12000 gas
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(12000n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas: gasLimit < 12000
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 11999n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(11999n);
			expect(result.output).toHaveLength(0);
		});
	});

	describe("Input Format section", () => {
		it("should accept one 160-byte point-scalar pair", () => {
			// Doc states: Total input length: 160 bytes (exactly)
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
		});

		it("should reject a truncated pair or a trailing byte", () => {
			const shortInput = new Uint8Array(159);
			const longInput = new Uint8Array(161);

			const resultShort = bls12G1Msm(shortInput, 20000n);
			const resultLong = bls12G1Msm(longInput, 20000n);

			expect(resultShort.success).toBe(false);
			expect(resultLong.success).toBe(false);
		});

		it("should decode a 128-byte point followed by a 32-byte scalar", () => {
			const point = encodePoint(generator);
			const input = new Uint8Array(160);
			input.set(point);
			input[159] = 1;

			const result = bls12G1Msm(input, 12000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(point);
		});
	});

	describe("Output Format section", () => {
		it("should return 128 bytes", () => {
			// Doc states: Total output length: 128 bytes
			const input = new Uint8Array(160);
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});
	});

	describe("Scalar Multiplication Properties from documentation", () => {
		it("should return infinity for P * 0", () => {
			// Doc states: P * 0 = O (multiplication by zero gives point at infinity)
			const input = new Uint8Array(160);
			input.set(encodePoint(generator));
			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			// Result should be point at infinity
			expect(result.output).toEqual(new Uint8Array(128));
		});

		it("should return infinity for O * 42", () => {
			// Doc states: O * 42 = O (infinity times any scalar is infinity)
			const input = new Uint8Array(160);
			input[159] = 42; // Set scalar to 42
			// Point is still zeros (infinity)

			const result = bls12G1Msm(input, 20000n);

			expect(result.success).toBe(true);
			// O * 42 = O
			expect(result.output).toEqual(new Uint8Array(128));
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
			const { isPrecompile } = await import(
				"../../../src/evm/precompiles/precompiles.js"
			);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G1_MSM, Hardfork.PRAGUE),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G1_MSM, Hardfork.CANCUN),
			).toBe(false);
		});
	});

	describe("Comparison with BN254 Mul section", () => {
		it("should charge 12000 gas for G1 versus 6000 for BN254 multiplication", () => {
			const result = bls12G1Msm(new Uint8Array(160), 12000n);
			const comparison = bn254Mul(new Uint8Array(96), 6000n);
			expect(result.gasUsed).toBe(12000n);
			expect(comparison.gasUsed).toBe(6000n);
		});
	});
});
