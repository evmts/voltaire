import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, it } from "vitest";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
} from "./precompiles.js";

/**
 * Helper: Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

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

const toBigInt = (bytes: Uint8Array) => BigInt(`0x${bytesToHex(bytes)}`);

// BLS12-381 base field modulus
const BLS_MODULUS =
	0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;

/** An exceptional halt consumes all forwarded gas and returns no output. */
function expectHalt(result: PrecompileResult, gasLimit: bigint): void {
	expect(result.success).toBe(false);
	expect(result.error).toBeDefined();
	expect(result.gasUsed).toBe(gasLimit);
	expect(result.output).toEqual(new Uint8Array(0));
}

function decodeG1(output: Uint8Array) {
	return bls12_381.G1.Point.fromAffine({
		x: toBigInt(output.subarray(0, 64)),
		y: toBigInt(output.subarray(64, 128)),
	});
}

function decodeG2(output: Uint8Array) {
	const Fp2 = bls12_381.fields.Fp2;
	return bls12_381.G2.Point.fromAffine({
		x: Fp2.create({
			c0: toBigInt(output.subarray(0, 64)),
			c1: toBigInt(output.subarray(64, 128)),
		}),
		y: Fp2.create({
			c0: toBigInt(output.subarray(128, 192)),
			c1: toBigInt(output.subarray(192, 256)),
		}),
	});
}

describe("Precompile: BLS12_MAP_FP_TO_G1 (0x10)", () => {
	const fp = (value: bigint) => bigintToBytes(value, 64);

	it("should live at address 0x10", () => {
		expect(PrecompileAddress.BLS12_MAP_FP_TO_G1).toBe(
			"0x0000000000000000000000000000000000000010",
		);
	});

	describe("Gas calculation", () => {
		it("should use exactly 5500 gas", () => {
			const result = bls12MapFpToG1(fp(0n), 10000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});

		it("should fail with insufficient gas (5499)", () => {
			const result = bls12MapFpToG1(fp(0n), 5499n);
			expect(result.error).toBe("Out of gas");
			expectHalt(result, 5499n);
		});

		it("should succeed with exact gas (5500)", () => {
			const result = bls12MapFpToG1(fp(0n), 5500n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});
	});

	describe("Input validation", () => {
		it("should reject empty input", () => {
			expectHalt(bls12MapFpToG1(new Uint8Array(0), 10000n), 10000n);
		});

		it("should reject input shorter than 64 bytes", () => {
			expectHalt(bls12MapFpToG1(new Uint8Array(63), 10000n), 10000n);
			expectHalt(bls12MapFpToG1(new Uint8Array(48), 10000n), 10000n);
		});

		it("should accept exactly 64 bytes", () => {
			expect(bls12MapFpToG1(new Uint8Array(64), 10000n).success).toBe(true);
		});

		it("should reject input longer than 64 bytes", () => {
			expectHalt(bls12MapFpToG1(new Uint8Array(65), 10000n), 10000n);
			expectHalt(bls12MapFpToG1(new Uint8Array(128), 10000n), 10000n);
		});
	});

	describe("Output validation", () => {
		it("should always return 128 bytes (G1 point)", () => {
			for (const u of [0n, 1n, 2n ** 200n, BLS_MODULUS - 1n]) {
				expect(bls12MapFpToG1(fp(u), 10000n).output.length).toBe(128);
			}
		});

		it("should return a point in the G1 subgroup for zero input", () => {
			const result = bls12MapFpToG1(fp(0n), 10000n);
			expect(result.success).toBe(true);
			const point = decodeG1(result.output);
			point.assertValidity();
			expect(point.is0()).toBe(false);
		});

		it("should return different points for different inputs", () => {
			const result1 = bls12MapFpToG1(fp(1n), 10000n);
			const result2 = bls12MapFpToG1(fp(2n), 10000n);
			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Valid field elements", () => {
		it("should map valid field elements to subgroup points", () => {
			const elements = [
				0n,
				1n,
				42n,
				0xdeadbeefn,
				BLS_MODULUS / 2n,
				BLS_MODULUS - 2n,
				BLS_MODULUS - 1n,
			];
			for (const u of elements) {
				const result = bls12MapFpToG1(fp(u), 10000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(5500n);
				decodeG1(result.output).assertValidity();
			}
		});

		it("should equal the direct field-to-curve map with one cofactor clearing", () => {
			const map = bls12_381.G1.mapToCurve as unknown as (
				u: bigint,
			) => ReturnType<typeof decodeG1>;
			for (const u of [0n, 7n, BLS_MODULUS - 1n]) {
				const expected = map(u).toAffine();
				const result = bls12MapFpToG1(fp(u), 10000n);
				expect(bytesToHex(result.output)).toBe(
					bytesToHex(bigintToBytes(expected.x, 64)) +
						bytesToHex(bigintToBytes(expected.y, 64)),
				);
			}
		});

		it("should not hash the input (hashToCurve gives a different point)", () => {
			for (const u of [0n, 7n, BLS_MODULUS - 1n]) {
				const input = fp(u);
				const hashed = bls12_381.G1.hashToCurve(input).toAffine();
				const result = bls12MapFpToG1(input, 10000n);
				expect(toBigInt(result.output.subarray(0, 64))).not.toBe(hashed.x);
			}
		});
	});

	describe("Invalid field elements", () => {
		it("should reject a field element equal to the modulus", () => {
			expectHalt(bls12MapFpToG1(fp(BLS_MODULUS), 10000n), 10000n);
		});

		it("should reject a field element greater than the modulus", () => {
			expectHalt(bls12MapFpToG1(fp(BLS_MODULUS + 1n), 10000n), 10000n);
			expectHalt(bls12MapFpToG1(fp(2n ** 383n), 10000n), 10000n);
		});

		it("should reject the maximum possible 64-byte value", () => {
			expectHalt(bls12MapFpToG1(new Uint8Array(64).fill(0xff), 10000n), 10000n);
		});

		it("should reject non-zero top 16 bytes even when the low 48 bytes are valid", () => {
			for (let i = 0; i < 16; i++) {
				const input = fp(1n);
				input[i] = 0x80;
				expectHalt(bls12MapFpToG1(input, 10000n), 10000n);
			}
			expectHalt(bls12MapFpToG1(new Uint8Array(64).fill(1), 10000n), 10000n);
		});
	});

	describe("Edge cases", () => {
		it("should be deterministic (same input produces same output)", () => {
			const a = bls12MapFpToG1(fp(12345n), 10000n);
			const b = bls12MapFpToG1(fp(12345n), 10000n);
			expect(a).toEqual(b);
		});

		it("should accept modulus - 1 and reject modulus", () => {
			expect(bls12MapFpToG1(fp(BLS_MODULUS - 1n), 10000n).success).toBe(true);
			expectHalt(bls12MapFpToG1(fp(BLS_MODULUS), 10000n), 10000n);
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP_TO_G1,
				fp(9n),
				10000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
			expect(result.gasUsed).toBe(5500n);
			expect(result.output).toEqual(bls12MapFpToG1(fp(9n), 10000n).output);
		});

		it("should halt with gasLimit through execute on a non-canonical element", () => {
			expectHalt(
				execute(
					PrecompileAddress.BLS12_MAP_FP_TO_G1,
					fp(BLS_MODULUS),
					10000n,
					Hardfork.PRAGUE,
				),
				10000n,
			);
		});
	});
});

describe("Precompile: BLS12_MAP_FP2_TO_G2 (0x11)", () => {
	const fp2 = (c0: bigint, c1: bigint) => {
		const input = new Uint8Array(128);
		input.set(bigintToBytes(c0, 64), 0);
		input.set(bigintToBytes(c1, 64), 64);
		return input;
	};

	it("should live at address 0x11", () => {
		expect(PrecompileAddress.BLS12_MAP_FP2_TO_G2).toBe(
			"0x0000000000000000000000000000000000000011",
		);
	});

	describe("Gas calculation", () => {
		it("should use exactly 23800 gas", () => {
			const result = bls12MapFp2ToG2(fp2(0n, 0n), 100000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(23800n);
		});

		it("should fail with insufficient gas (23799)", () => {
			const result = bls12MapFp2ToG2(fp2(0n, 0n), 23799n);
			expect(result.error).toBe("Out of gas");
			expectHalt(result, 23799n);
		});

		it("should succeed with exact gas (23800)", () => {
			const result = bls12MapFp2ToG2(fp2(0n, 0n), 23800n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(23800n);
		});
	});

	describe("Input validation", () => {
		it("should reject empty input", () => {
			expectHalt(bls12MapFp2ToG2(new Uint8Array(0), 100000n), 100000n);
		});

		it("should reject input shorter than 128 bytes", () => {
			expectHalt(bls12MapFp2ToG2(new Uint8Array(127), 100000n), 100000n);
			expectHalt(bls12MapFp2ToG2(new Uint8Array(64), 100000n), 100000n);
		});

		it("should accept exactly 128 bytes", () => {
			expect(bls12MapFp2ToG2(new Uint8Array(128), 100000n).success).toBe(true);
		});

		it("should reject input longer than 128 bytes", () => {
			expectHalt(bls12MapFp2ToG2(new Uint8Array(129), 100000n), 100000n);
			expectHalt(bls12MapFp2ToG2(new Uint8Array(256), 100000n), 100000n);
		});
	});

	describe("Output validation", () => {
		it("should always return 256 bytes (G2 point)", () => {
			for (const [c0, c1] of [
				[0n, 0n],
				[1n, 2n],
				[BLS_MODULUS - 1n, BLS_MODULUS - 1n],
			] as Array<[bigint, bigint]>) {
				expect(bls12MapFp2ToG2(fp2(c0, c1), 100000n).output.length).toBe(256);
			}
		});

		it("should return a point in the G2 subgroup for zero input", () => {
			const result = bls12MapFp2ToG2(fp2(0n, 0n), 100000n);
			expect(result.success).toBe(true);
			const point = decodeG2(result.output);
			point.assertValidity();
			expect(point.is0()).toBe(false);
		});

		it("should return different points for different inputs", () => {
			const result1 = bls12MapFp2ToG2(fp2(1n, 1n), 100000n);
			const result2 = bls12MapFp2ToG2(fp2(2n, 2n), 100000n);
			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Valid Fp2 elements", () => {
		it("should map valid Fp2 elements to subgroup points", () => {
			const elements: Array<[bigint, bigint]> = [
				[0n, 0n],
				[1n, 0n],
				[0n, 1n],
				[5n, 9n],
				[BLS_MODULUS - 1n, 0n],
				[0n, BLS_MODULUS - 1n],
				[BLS_MODULUS - 1n, BLS_MODULUS - 1n],
			];
			for (const [c0, c1] of elements) {
				const result = bls12MapFp2ToG2(fp2(c0, c1), 100000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(23800n);
				decodeG2(result.output).assertValidity();
			}
		});

		it("should treat c0 and c1 as distinct coefficients", () => {
			expect(bytesToHex(bls12MapFp2ToG2(fp2(1n, 0n), 100000n).output)).not.toBe(
				bytesToHex(bls12MapFp2ToG2(fp2(0n, 1n), 100000n).output),
			);
		});

		it("should equal the direct field-to-curve map with one cofactor clearing", () => {
			const map = bls12_381.G2.mapToCurve as unknown as (
				u: [bigint, bigint],
			) => ReturnType<typeof decodeG2>;
			for (const [c0, c1] of [
				[0n, 0n],
				[7n, 11n],
			] as Array<[bigint, bigint]>) {
				const expected = map([c0, c1]);
				const result = bls12MapFp2ToG2(fp2(c0, c1), 100000n);
				expect(decodeG2(result.output).equals(expected)).toBe(true);
			}
		});

		it("should not hash the input (hashToCurve gives a different point)", () => {
			const input = fp2(7n, 11n);
			const hashed = bls12_381.G2.hashToCurve(input);
			const result = bls12MapFp2ToG2(input, 100000n);
			expect(decodeG2(result.output).equals(hashed)).toBe(false);
		});
	});

	describe("Invalid Fp2 elements", () => {
		it("should reject c0 >= modulus", () => {
			expectHalt(bls12MapFp2ToG2(fp2(BLS_MODULUS, 0n), 100000n), 100000n);
			expectHalt(bls12MapFp2ToG2(fp2(BLS_MODULUS + 1n, 1n), 100000n), 100000n);
		});

		it("should reject c1 >= modulus", () => {
			expectHalt(bls12MapFp2ToG2(fp2(0n, BLS_MODULUS), 100000n), 100000n);
			expectHalt(bls12MapFp2ToG2(fp2(1n, BLS_MODULUS + 1n), 100000n), 100000n);
		});

		it("should reject both components >= modulus", () => {
			expectHalt(
				bls12MapFp2ToG2(fp2(BLS_MODULUS, BLS_MODULUS), 100000n),
				100000n,
			);
		});

		it("should reject the maximum possible 128-byte value", () => {
			expectHalt(
				bls12MapFp2ToG2(new Uint8Array(128).fill(0xff), 100000n),
				100000n,
			);
		});

		it("should reject non-zero top 16 bytes in either component", () => {
			for (const base of [0, 64]) {
				for (let i = 0; i < 16; i++) {
					const input = fp2(1n, 1n);
					input[base + i] = 0x80;
					expectHalt(bls12MapFp2ToG2(input, 100000n), 100000n);
				}
			}
			expectHalt(
				bls12MapFp2ToG2(new Uint8Array(128).fill(1), 100000n),
				100000n,
			);
		});
	});

	describe("Edge cases", () => {
		it("should be deterministic (same input produces same output)", () => {
			const a = bls12MapFp2ToG2(fp2(123n, 456n), 100000n);
			const b = bls12MapFp2ToG2(fp2(123n, 456n), 100000n);
			expect(a).toEqual(b);
		});

		it("should handle asymmetric Fp2 elements", () => {
			const a = bls12MapFp2ToG2(fp2(1n, BLS_MODULUS - 1n), 100000n);
			const b = bls12MapFp2ToG2(fp2(BLS_MODULUS - 1n, 1n), 100000n);
			expect(a.success).toBe(true);
			expect(b.success).toBe(true);
			expect(bytesToHex(a.output)).not.toBe(bytesToHex(b.output));
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP2_TO_G2,
				fp2(3n, 4n),
				100000n,
				Hardfork.PRAGUE,
			);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
			expect(result.gasUsed).toBe(23800n);
		});
	});

	describe("Comparison with map_fp_to_g1", () => {
		it("should be more expensive than map_fp_to_g1", () => {
			const g1 = bls12MapFpToG1(new Uint8Array(64), 100000n);
			const g2 = bls12MapFp2ToG2(new Uint8Array(128), 100000n);
			expect(g2.gasUsed - g1.gasUsed).toBe(18300n);
		});

		it("should produce larger output than map_fp_to_g1", () => {
			const g1 = bls12MapFpToG1(new Uint8Array(64), 100000n);
			const g2 = bls12MapFp2ToG2(new Uint8Array(128), 100000n);
			expect(g1.output.length).toBe(128);
			expect(g2.output.length).toBe(256);
		});
	});
});

describe("BLS12 Map Hardfork Activation", () => {
	const cases: Array<[string, string, number, bigint]> = [
		[
			"BLS12_MAP_FP_TO_G1 (0x10)",
			PrecompileAddress.BLS12_MAP_FP_TO_G1,
			64,
			5500n,
		],
		[
			"BLS12_MAP_FP2_TO_G2 (0x11)",
			PrecompileAddress.BLS12_MAP_FP2_TO_G2,
			128,
			23800n,
		],
	];

	for (const [name, address, length, gas] of cases) {
		describe(name, () => {
			it("should NOT be available before Prague (Cancun)", () => {
				expect(isPrecompile(address, Hardfork.CANCUN)).toBe(false);
				const result = execute(
					address,
					new Uint8Array(length),
					100000n,
					Hardfork.CANCUN,
				);
				expect(result.success).toBe(false);
				expect(result.gasUsed).toBe(0n);
				expect(result.error).toContain("Unknown precompile");
			});

			it("should NOT be available before Prague (Shanghai)", () => {
				expect(isPrecompile(address, Hardfork.SHANGHAI)).toBe(false);
			});

			it("should be available from Prague hardfork", () => {
				for (const fork of [
					Hardfork.PRAGUE,
					Hardfork.OSAKA,
					Hardfork.AMSTERDAM,
				]) {
					expect(isPrecompile(address, fork)).toBe(true);
					const result = execute(
						address,
						new Uint8Array(length),
						100000n,
						fork,
					);
					expect(result.success).toBe(true);
					expect(result.gasUsed).toBe(gas);
				}
			});
		});
	}

	it("the pre-final map addresses 0x12 and 0x13 are not precompiles", () => {
		for (const address of [
			"0x0000000000000000000000000000000000000012",
			"0x0000000000000000000000000000000000000013",
		]) {
			expect(isPrecompile(address, Hardfork.PRAGUE)).toBe(false);
			expect(isPrecompile(address, Hardfork.OSAKA)).toBe(false);
		}
	});
});
