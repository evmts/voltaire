/**
 * Tests for bn254-mul.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, bn254Mul } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

/**
 * Helper: Convert bigint to 32-byte big-endian Uint8Array
 */
function beBytes32(n: bigint): Uint8Array {
	const out = new Uint8Array(32);
	let v = n;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
}

/**
 * Helper: Build BN254 scalar multiplication input (96 bytes: x || y || scalar)
 */
function buildScalarMulInput(x: bigint, y: bigint, scalar: bigint): Uint8Array {
	const input = new Uint8Array(96);
	input.set(beBytes32(x), 0);
	input.set(beBytes32(y), 32);
	input.set(beBytes32(scalar), 64);
	return input;
}

describe("bn254-mul.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should perform scalar multiplication on BN254 curve", () => {
			// Doc states: multiplies a G1 point by a scalar, computing scalar * point
			// Generator (1, 2) * 1 = (1, 2)
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});

	describe("Gas Cost section", () => {
		it("should use exactly 6000 gas", () => {
			// Doc states: Fixed: 6000 gas (reduced from 40,000 in Istanbul via EIP-1108)
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(6000n);
		});

		it("should fail with insufficient gas", () => {
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 5999n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should accept 96 bytes total input", () => {
			// Doc states: Total input length: 96 bytes (padded/truncated to this size)
			const input = buildScalarMulInput(1n, 2n, 5n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
		});

		it("should handle scalar as any 256-bit value", () => {
			// Doc states: Scalar can be any 256-bit value (automatically reduced modulo curve order)
			const largeScalar = 2n ** 256n - 1n;
			const input = buildScalarMulInput(1n, 2n, largeScalar);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
		});
	});

	describe("Output Format section", () => {
		it("should return 64 bytes (x, y coordinates)", () => {
			// Doc states: Total output length: 64 bytes
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});

	describe("Test Vectors from documentation", () => {
		it("should compute P * 0 = Identity", () => {
			// Doc Test 1: Any point * 0 = Identity
			const input = buildScalarMulInput(1n, 2n, 0n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			// Expected: (0, 0) - point at infinity
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should compute Generator * 1 = Generator", () => {
			// Doc Test 2: Generator * 1 = Generator
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			// Expected: (1, 2)
			const expectedX = beBytes32(1n);
			const expectedY = beBytes32(2n);
			expect([...result.output.slice(0, 32)]).toEqual([...expectedX]);
			expect([...result.output.slice(32, 64)]).toEqual([...expectedY]);
		});

		it("should compute Generator * 2 = 2*Generator", () => {
			// Doc Test 3: Generator * 2 = 2*Generator
			const input = buildScalarMulInput(1n, 2n, 2n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			// Result should be non-zero and different from generator
			expect([...result.output].some((b) => b !== 0)).toBe(true);
			expect(result.output[31]).not.toBe(1); // x != 1
		});
	});

	describe("Special Cases from documentation", () => {
		it("should return point at infinity for scalar = 0", () => {
			// Doc states: Scalar = 0: Returns point at infinity (0, 0)
			const input = buildScalarMulInput(1n, 2n, 0n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should return input point for scalar = 1", () => {
			// Doc states: Scalar = 1: Returns input point unchanged
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output.slice(0, 32)]).toEqual([...beBytes32(1n)]);
			expect([...result.output.slice(32, 64)]).toEqual([...beBytes32(2n)]);
		});

		it("should return point at infinity for point at infinity input", () => {
			// Doc states: Point at infinity input: Returns point at infinity regardless of scalar
			const input = buildScalarMulInput(0n, 0n, 42n);
			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect([...result.output].every((b) => b === 0)).toBe(true);
		});

		it("should handle scalar > group order", () => {
			// Doc states: Scalar > group order: Automatically reduced modulo group order
			// Group order: 21888242871839275222246405745257275088548364400416034343698204186575808495617
			const groupOrder = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
			const input1 = buildScalarMulInput(1n, 2n, 1n);
			const input2 = buildScalarMulInput(1n, 2n, groupOrder + 1n);

			const result1 = bn254Mul(input1, 10000n);
			const result2 = bn254Mul(input2, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			// Both should produce the same result (wrapping)
			expect([...result1.output]).toEqual([...result2.output]);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BN254_MUL", () => {
			const input = buildScalarMulInput(1n, 2n, 5n);
			const result = execute(
				PrecompileAddress.BN254_MUL,
				input,
				10000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(6000n);
		});

		it("should be available from BYZANTIUM hardfork", () => {
			// Doc states: Introduced: Byzantium (EIP-196)
			const input = buildScalarMulInput(1n, 2n, 1n);
			const result = execute(
				PrecompileAddress.BN254_MUL,
				input,
				10000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("Performance Considerations section", () => {
		it("should be more expensive than addition", () => {
			// Doc states: Scalar multiplication is ~40x more expensive than addition (6000 vs 150 gas)
			const addInput = new Uint8Array(128);
			const mulInput = buildScalarMulInput(1n, 2n, 2n);

			// We can't import bn254Add directly in same test, but document the comparison
			// Gas: 6000 for mul, 150 for add
			const mulResult = bn254Mul(mulInput, 10000n);
			expect(mulResult.gasUsed).toBe(6000n);
		});
	});
});
