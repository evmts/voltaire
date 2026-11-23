/**
 * Tests for BLS12-381 G2 scalar multiplication with one MSM pair
 * Validates code examples work correctly with actual API
 */
import { Buffer } from "node:buffer";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, it } from "vitest";
import {
	bls12G1Msm,
	bls12G2Msm,
	execute,
	PrecompileAddress,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

function encodePoint(point: typeof bls12_381.G2.Point.BASE): Uint8Array {
	const { x, y } = point.toAffine();
	const hex = [x.c0, x.c1, y.c0, y.c1]
		.map((coordinate) => coordinate.toString(16).padStart(128, "0"))
		.join("");
	return Uint8Array.from(Buffer.from(hex, "hex"));
}

const generator = bls12_381.G2.Point.BASE;

describe("BLS12-381 G2 scalar multiplication with one MSM pair", () => {
	describe("Overview section", () => {
		it("should double the G2 generator with one MSM pair", () => {
			const input = new Uint8Array(288);
			input.set(encodePoint(generator));
			input[287] = 2;

			const result = bls12G2Msm(input, 22500n);

			expect(result.success).toBe(true);
			expect(result.output).toEqual(encodePoint(generator.double()));
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 22500 gas", () => {
			// EIP-2537 single-pair cost: 22500 gas
			const input = new Uint8Array(288);
			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(22500n);
		});

		it("should fail with insufficient gas", () => {
			// Doc states: Out of gas: gasLimit < 22500
			const input = new Uint8Array(288);
			const result = bls12G2Msm(input, 22499n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(22499n);
			expect(result.output).toHaveLength(0);
		});
	});

	describe("Input Format section", () => {
		it("should accept one 288-byte point-scalar pair", () => {
			// Doc states: Total input length: 288 bytes (256-byte G2 point + 32-byte scalar)
			const input = new Uint8Array(288);
			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
		});

		it("should reject a truncated pair or a trailing byte", () => {
			const shortInput = new Uint8Array(287);
			const longInput = new Uint8Array(289);

			const resultShort = bls12G2Msm(shortInput, 50000n);
			const resultLong = bls12G2Msm(longInput, 50000n);

			expect(resultShort.success).toBe(false);
			expect(resultLong.success).toBe(false);
		});

		it("should decode a 256-byte point followed by a 32-byte scalar", () => {
			const point = encodePoint(generator);
			const input = new Uint8Array(288);
			input.set(point);
			input[287] = 1;

			const result = bls12G2Msm(input, 22500n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(point);
		});
	});

	describe("Output Format section", () => {
		it("should return 256 bytes", () => {
			// Doc states: Total output length: 256 bytes
			const input = new Uint8Array(288);
			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Scalar Multiplication Properties from documentation", () => {
		it("should return infinity for P * 0", () => {
			// Doc states: P * 0 = O (multiplication by zero gives point at infinity)
			const input = new Uint8Array(288);
			input.set(encodePoint(generator));
			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
			// Result should be point at infinity
			expect(result.output).toEqual(new Uint8Array(256));
		});

		it("should return infinity for O * 42", () => {
			// Doc states: O * 42 = O (infinity times any scalar is infinity)
			const input = new Uint8Array(288);
			input[287] = 42; // Set scalar to 42
			// Point is still zeros (infinity)

			const result = bls12G2Msm(input, 50000n);

			expect(result.success).toBe(true);
			// O * 42 = O
			expect(result.output).toEqual(new Uint8Array(256));
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLS12_G2_MSM", () => {
			const input = new Uint8Array(288);
			const result = execute(
				PrecompileAddress.BLS12_G2_MSM,
				input,
				50000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(22500n);
		});

		it("should be available from PRAGUE hardfork", () => {
			// Doc states: Introduced: Prague (EIP-2537)
			const input = new Uint8Array(288);
			const result = execute(
				PrecompileAddress.BLS12_G2_MSM,
				input,
				50000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
		});

		it("hardfork availability via isPrecompile function", async () => {
			const { isPrecompile } = await import(
				"../../../src/evm/precompiles/precompiles.js"
			);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G2_MSM, Hardfork.PRAGUE),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.BLS12_G2_MSM, Hardfork.CANCUN),
			).toBe(false);
		});
	});

	describe("Gas Comparison section", () => {
		it("should charge 22500 gas for G2 versus 12000 for one G1 pair", () => {
			const result = bls12G2Msm(new Uint8Array(288), 22500n);
			const comparison = bls12G1Msm(new Uint8Array(160), 12000n);
			expect(result.gasUsed).toBe(22500n);
			expect(comparison.gasUsed).toBe(12000n);
		});
	});
});
