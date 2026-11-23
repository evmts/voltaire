import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, it } from "vitest";
import * as Gas from "../../primitives/GasConstants/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	bls12Pairing,
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
} from "./precompiles.js";

/**
 * Helper: Create big-endian bytes from bigint
 */
function bigintToBytes(n: bigint, size: number): Uint8Array {
	const bytes = new Uint8Array(size);
	let val = n;
	for (let i = size - 1; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val >>= 8n;
	}
	return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

type G1Point = ReturnType<typeof bls12_381.G1.Point.fromAffine>;
type G2Point = ReturnType<typeof bls12_381.G2.Point.fromAffine>;

function encodeG1(point: G1Point): Uint8Array {
	if (point.is0()) return new Uint8Array(128);
	const { x, y } = point.toAffine();
	return concat(bigintToBytes(x, 64), bigintToBytes(y, 64));
}

function encodeG2(point: G2Point): Uint8Array {
	if (point.is0()) return new Uint8Array(256);
	const { x, y } = point.toAffine();
	return concat(
		bigintToBytes(x.c0, 64),
		bigintToBytes(x.c1, 64),
		bigintToBytes(y.c0, 64),
		bigintToBytes(y.c1, 64),
	);
}

const G1 = bls12_381.G1.Point.BASE;
const G2 = bls12_381.G2.Point.BASE;
const TRUE = bigintToBytes(1n, 32);
const FALSE = new Uint8Array(32);
/** e(G1, G2) * e(-G1, G2) = 1 */
const validTwoPairs = concat(
	encodeG1(G1),
	encodeG2(G2),
	encodeG1(G1.negate()),
	encodeG2(G2),
);
const identityPairs = (k: number) => new Uint8Array(384 * k);
const gasFor = (k: number) => 37700n + 32600n * BigInt(k);

function expectHalt(result: PrecompileResult, gasLimit: bigint): void {
	expect(result.success).toBe(false);
	expect(result.error).toBeDefined();
	expect(result.gasUsed).toBe(gasLimit);
	expect(result.output).toEqual(new Uint8Array(0));
}

describe("Precompile: BLS12_PAIRING_CHECK (0x0f)", () => {
	describe("Gas calculation", () => {
		// EIP-2537: gas = 32600 * k + 37700
		it("should use 70300 gas for 1 pair (384 bytes)", () => {
			const result = bls12Pairing(identityPairs(1), 200000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(70300n);
		});

		it("should use 102900 gas for 2 pairs (768 bytes)", () => {
			const result = bls12Pairing(identityPairs(2), 200000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(102900n);
		});

		it("should verify gas formula: 37700 + k * 32600", () => {
			const testCases = [
				{ pairs: 1, expected: 70300n },
				{ pairs: 2, expected: 102900n },
				{ pairs: 3, expected: 135500n },
				{ pairs: 5, expected: 200700n },
				{ pairs: 10, expected: 363700n },
			];
			for (const { pairs, expected } of testCases) {
				const result = bls12Pairing(identityPairs(pairs), 1000000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(expected);
				expect(Gas.Precompile.calculateBls12PairingCost(BigInt(pairs))).toBe(
					expected,
				);
			}
		});
	});

	describe("Out of gas handling", () => {
		it("should fail with insufficient gas for 1 pair", () => {
			const result = bls12Pairing(identityPairs(1), 70299n);
			expect(result.error).toBe("Out of gas");
			expectHalt(result, 70299n);
		});

		it("should succeed with exact gas for 1 pair", () => {
			const result = bls12Pairing(identityPairs(1), 70300n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(70300n);
		});

		it("should fail with insufficient gas for 2 pairs", () => {
			const result = bls12Pairing(validTwoPairs, 102899n);
			expect(result.error).toBe("Out of gas");
			expectHalt(result, 102899n);
		});

		it("should never report more gas than was forwarded", () => {
			for (const gasLimit of [0n, 1n, 37700n, 70299n]) {
				expectHalt(bls12Pairing(identityPairs(1), gasLimit), gasLimit);
			}
		});
	});

	describe("Input validation", () => {
		it("should reject empty input (k must be positive)", () => {
			expectHalt(bls12Pairing(new Uint8Array(0), 200000n), 200000n);
		});

		it("should accept exactly 384 bytes (1 pair)", () => {
			expect(bls12Pairing(identityPairs(1), 200000n).success).toBe(true);
		});

		it("should accept exactly 768 bytes (2 pairs)", () => {
			expect(bls12Pairing(identityPairs(2), 300000n).success).toBe(true);
		});

		it("should reject input not multiple of 384", () => {
			for (const size of [1, 128, 383, 385, 767, 769, 1151]) {
				expectHalt(bls12Pairing(new Uint8Array(size), 500000n), 500000n);
			}
			for (const size of [384, 768, 1152]) {
				expect(bls12Pairing(new Uint8Array(size), 500000n).success).toBe(true);
			}
		});
	});

	describe("Output validation", () => {
		it("should always return 32 bytes", () => {
			for (const input of [
				identityPairs(1),
				identityPairs(3),
				validTwoPairs,
				concat(encodeG1(G1), encodeG2(G2)),
			]) {
				const result = bls12Pairing(input, 500000n);
				expect(result.success).toBe(true);
				expect(result.output.length).toBe(32);
			}
		});

		it("should return 1 (true) when the product is one", () => {
			expect(bls12Pairing(validTwoPairs, 500000n).output).toEqual(TRUE);
		});

		it("should return 0 (false) when the product is not one", () => {
			const input = concat(encodeG1(G1), encodeG2(G2));
			expect(bls12Pairing(input, 500000n).output).toEqual(FALSE);
		});

		it("should keep the first 31 output bytes zero", () => {
			for (const input of [validTwoPairs, concat(encodeG1(G1), encodeG2(G2))]) {
				const { output } = bls12Pairing(input, 500000n);
				expect(output.subarray(0, 31)).toEqual(new Uint8Array(31));
			}
		});
	});

	describe("Single pair", () => {
		it("should return true for identity points (all zeros)", () => {
			const result = bls12Pairing(identityPairs(1), 200000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(TRUE);
		});

		it("should return true when either point is the identity", () => {
			expect(
				bls12Pairing(concat(encodeG1(G1), new Uint8Array(256)), 200000n).output,
			).toEqual(TRUE);
			expect(
				bls12Pairing(concat(new Uint8Array(128), encodeG2(G2)), 200000n).output,
			).toEqual(TRUE);
		});

		it("should reject points that are not on the curve", () => {
			const input = new Uint8Array(384);
			input[127] = 1; // G1 = (0, 1)
			expectHalt(bls12Pairing(input, 200000n), 200000n);

			const g2Bad = new Uint8Array(384);
			g2Bad[383] = 1; // G2 y.c1 = 1
			expectHalt(bls12Pairing(g2Bad, 200000n), 200000n);
		});
	});

	describe("Multiple pairs", () => {
		it("should handle 2 pairs", () => {
			const result = bls12Pairing(identityPairs(2), 300000n);
			expect(result.gasUsed).toBe(102900n); // 37700 + 2 * 32600
			expect(result.output).toEqual(TRUE);
		});

		it("should handle 3 pairs", () => {
			const result = bls12Pairing(identityPairs(3), 300000n);
			expect(result.gasUsed).toBe(135500n); // 37700 + 3 * 32600
		});

		it("should handle 5 pairs", () => {
			const result = bls12Pairing(identityPairs(5), 400000n);
			expect(result.gasUsed).toBe(200700n); // 37700 + 5 * 32600
		});

		it("should verify pairing equation: e(G1[0], G2[0]) * ... = 1", () => {
			// e(2 G1, 3 G2) * e(-6 G1, G2) = 1
			const holds = concat(
				encodeG1(G1.multiply(2n)),
				encodeG2(G2.multiply(3n)),
				encodeG1(G1.multiply(6n).negate()),
				encodeG2(G2),
			);
			expect(bls12Pairing(holds, 300000n).output).toEqual(TRUE);

			// e(2 G1, 3 G2) * e(-5 G1, G2) != 1
			const fails = concat(
				encodeG1(G1.multiply(2n)),
				encodeG2(G2.multiply(3n)),
				encodeG1(G1.multiply(5n).negate()),
				encodeG2(G2),
			);
			const result = bls12Pairing(fails, 300000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(FALSE);
		});
	});

	describe("Invalid inputs", () => {
		it("should halt on invalid G1 points", () => {
			const input = new Uint8Array(384);
			input.fill(0xff, 0, 128);
			expectHalt(bls12Pairing(input, 200000n), 200000n);
		});

		it("should halt on invalid G2 points", () => {
			const input = new Uint8Array(384);
			input.fill(0xff, 128, 384);
			expectHalt(bls12Pairing(input, 200000n), 200000n);
		});

		it("should halt on all 0xff input", () => {
			expectHalt(
				bls12Pairing(new Uint8Array(384).fill(0xff), 200000n),
				200000n,
			);
		});

		it("should halt when a later pair is invalid", () => {
			const input = concat(validTwoPairs, new Uint8Array(384).fill(0xff));
			expectHalt(bls12Pairing(input, 500000n), 500000n);
		});

		it("should halt on a coordinate that is not below the field modulus", () => {
			const { x, y } = G1.toAffine();
			const p = bls12_381.fields.Fp.ORDER;
			const input = concat(
				bigintToBytes(x + p, 64),
				bigintToBytes(y, 64),
				encodeG2(G2),
			);
			expectHalt(bls12Pairing(input, 200000n), 200000n);
		});
	});

	describe("Edge cases", () => {
		it("should be deterministic (same input produces same output)", () => {
			const a = bls12Pairing(validTwoPairs, 300000n);
			const b = bls12Pairing(validTwoPairs, 300000n);
			expect(a).toEqual(b);
		});

		it("should not modify its input", () => {
			const input = new Uint8Array(validTwoPairs);
			bls12Pairing(input, 300000n);
			expect(input).toEqual(validTwoPairs);
		});

		it("should handle large number of pairs (gas scaling)", () => {
			const pairs = 20;
			const result = bls12Pairing(identityPairs(pairs), gasFor(pairs));
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(689700n);
			expectHalt(
				bls12Pairing(identityPairs(pairs), gasFor(pairs) - 1n),
				gasFor(pairs) - 1n,
			);
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const result = execute(
				PrecompileAddress.BLS12_PAIRING,
				validTwoPairs,
				300000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(102900n);
			expect(result.output).toEqual(TRUE);
		});

		it("should live at address 0x0f", () => {
			expect(PrecompileAddress.BLS12_PAIRING).toBe(
				"0x000000000000000000000000000000000000000f",
			);
		});

		it("should be available from Prague hardfork", () => {
			const address = PrecompileAddress.BLS12_PAIRING;
			expect(isPrecompile(address, Hardfork.CANCUN)).toBe(false);
			expect(isPrecompile(address, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(address, Hardfork.OSAKA)).toBe(true);

			const before = execute(address, validTwoPairs, 300000n, Hardfork.CANCUN);
			expect(before.success).toBe(false);
			expect(before.gasUsed).toBe(0n);
			expect(before.error).toContain("Unknown precompile");
		});

		it("should halt with gasLimit through execute on malformed input", () => {
			for (const size of [0, 383, 385]) {
				expectHalt(
					execute(
						PrecompileAddress.BLS12_PAIRING,
						new Uint8Array(size),
						300000n,
						Hardfork.PRAGUE,
					),
					300000n,
				);
			}
		});
	});

	describe("Gas cost comparison", () => {
		it("should scale linearly with number of pairs", () => {
			const gas1 = bls12Pairing(identityPairs(1), 1000000n).gasUsed;
			const gas2 = bls12Pairing(identityPairs(2), 1000000n).gasUsed;
			const gas3 = bls12Pairing(identityPairs(3), 1000000n).gasUsed;
			expect(gas2 - gas1).toBe(32600n);
			expect(gas3 - gas2).toBe(32600n);
		});

		it("should charge the same gas for valid pairs whatever the result", () => {
			const holds = bls12Pairing(validTwoPairs, 300000n);
			const fails = bls12Pairing(
				concat(encodeG1(G1), encodeG2(G2), encodeG1(G1), encodeG2(G2)),
				300000n,
			);
			expect(holds.output).toEqual(TRUE);
			expect(fails.output).toEqual(FALSE);
			expect(holds.gasUsed).toBe(fails.gasUsed);
		});
	});
});
