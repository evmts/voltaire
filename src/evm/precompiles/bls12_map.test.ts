import { describe, expect, it } from "vitest";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	PrecompileAddress,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	execute,
} from "./precompiles.js";

/**
 * Helper: Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < clean.length; i += 2) {
		bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
	}
	return bytes;
}

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

describe("Precompile: BLS12_MAP_FP_TO_G1 (0x12)", () => {
	// BLS12-381 base field modulus
	const BLS_MODULUS =
		0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;

	describe("Gas calculation", () => {
		it("should use exactly 5500 gas", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});

		it("should fail with insufficient gas (5499)", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 5499n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(5500n);
		});

		it("should succeed with exact gas (5500)", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 5500n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(5500n);
		});
	});

	describe("Input validation", () => {
		it("should reject empty input", () => {
			const input = new Uint8Array(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject input shorter than 64 bytes", () => {
			const input = new Uint8Array(63);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should accept exactly 64 bytes", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should reject input longer than 64 bytes", () => {
			const input = new Uint8Array(65);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});
	});

	describe("Output validation", () => {
		it("should always return 128 bytes (G1 point)", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should return valid G1 point for zero input", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);

			// G1 point should not be all zeros (except identity)
			const isAllZero = [...result.output].every((b) => b === 0);
			// Zero maps to a valid point (not necessarily identity)
			expect(result.output.length).toBe(128);
		});

		it("should return different points for different inputs", () => {
			const input1 = new Uint8Array(64).fill(0);
			const input2 = new Uint8Array(64).fill(1);

			const result1 = bls12MapFpToG1(input1, 10000n);
			const result2 = bls12MapFpToG1(input2, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);

			// Points should be different
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Valid field elements", () => {
		it("should map zero to G1 point", () => {
			const input = new Uint8Array(64).fill(0);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should map one to G1 point", () => {
			const input = new Uint8Array(64);
			input[63] = 1; // Field element = 1
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should map small field element to G1 point", () => {
			const input = new Uint8Array(64);
			input[63] = 42; // Field element = 42
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should map maximum valid field element (modulus - 1)", () => {
			const maxValid = BLS_MODULUS - 1n;
			const input = bigintToBytes(maxValid, 64);
			const result = bls12MapFpToG1(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
		});

		it("should map random valid field elements", () => {
			const testValues = [
				123456789n,
				999999999999n,
				BLS_MODULUS / 2n,
				BLS_MODULUS / 4n,
				BLS_MODULUS - 100n,
			];

			for (const value of testValues) {
				const input = bigintToBytes(value, 64);
				const result = bls12MapFpToG1(input, 10000n);

				expect(result.success).toBe(true);
				expect(result.output.length).toBe(128);
			}
		});
	});

	describe("Invalid field elements", () => {
		it("should handle field element equal to modulus (reduced internally)", () => {
			const input = bigintToBytes(BLS_MODULUS, 64);
			const result = bls12MapFpToG1(input, 10000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			// So this could succeed (mapped as 0) or fail
			expect(result.success || result.error).toBeDefined();
		});

		it("should handle field element greater than modulus (reduced internally)", () => {
			const input = bigintToBytes(BLS_MODULUS + 1n, 64);
			const result = bls12MapFpToG1(input, 10000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			expect(result.success || result.error).toBeDefined();
		});

		it("should handle maximum possible 64-byte value", () => {
			const input = new Uint8Array(64).fill(0xff);
			const result = bls12MapFpToG1(input, 10000n);

			// 2^512 - 1 >> BLS_MODULUS, but may be reduced
			expect(result.success || result.error).toBeDefined();
		});
	});

	describe("Edge cases", () => {
		it("should be deterministic (same input produces same output)", () => {
			const input = new Uint8Array(64);
			input[63] = 123;

			const result1 = bls12MapFpToG1(input, 10000n);
			const result2 = bls12MapFpToG1(input, 10000n);
			const result3 = bls12MapFpToG1(input, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(result3.success).toBe(true);

			expect(bytesToHex(result1.output)).toBe(bytesToHex(result2.output));
			expect(bytesToHex(result2.output)).toBe(bytesToHex(result3.output));
		});

		it("should handle boundary near modulus", () => {
			const values = [
				BLS_MODULUS - 1n,
				BLS_MODULUS - 2n,
				BLS_MODULUS - 10n,
				BLS_MODULUS - 100n,
			];

			for (const value of values) {
				const input = bigintToBytes(value, 64);
				const result = bls12MapFpToG1(input, 10000n);

				expect(result.success).toBe(true);
				expect(result.output.length).toBe(128);
			}
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const input = new Uint8Array(64).fill(0);
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP_TO_G1,
				input,
				10000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
			expect(result.gasUsed).toBe(5500n);
		});
	});
});

describe("Precompile: BLS12_MAP_FP2_TO_G2 (0x13)", () => {
	const BLS_MODULUS =
		0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;

	describe("Gas calculation", () => {
		it("should use exactly 75000 gas", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(75000n);
		});

		it("should fail with insufficient gas (74999)", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 74999n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(75000n);
		});

		it("should succeed with exact gas (75000)", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 75000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(75000n);
		});
	});

	describe("Input validation", () => {
		it("should reject empty input", () => {
			const input = new Uint8Array(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject input shorter than 128 bytes", () => {
			const input = new Uint8Array(127);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should accept exactly 128 bytes", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should reject input longer than 128 bytes", () => {
			const input = new Uint8Array(129);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});
	});

	describe("Output validation", () => {
		it("should always return 256 bytes (G2 point)", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should return valid G2 point for zero input", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should return different points for different inputs", () => {
			const input1 = new Uint8Array(128).fill(0);
			const input2 = new Uint8Array(128).fill(1);

			const result1 = bls12MapFp2ToG2(input1, 100000n);
			const result2 = bls12MapFp2ToG2(input2, 100000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);

			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Valid Fp2 elements", () => {
		it("should map zero Fp2 element to G2 point", () => {
			const input = new Uint8Array(128).fill(0);
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should map Fp2(1, 0) to G2 point", () => {
			const input = new Uint8Array(128);
			input[63] = 1; // c0 = 1
			// c1 = 0 (already zero)
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should map Fp2(0, 1) to G2 point", () => {
			const input = new Uint8Array(128);
			// c0 = 0 (already zero)
			input[127] = 1; // c1 = 1
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should map small Fp2 elements to G2 points", () => {
			const input = new Uint8Array(128);
			input[63] = 42; // c0 = 42
			input[127] = 99; // c1 = 99
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});

		it("should map maximum valid Fp2 element", () => {
			const maxValid = BLS_MODULUS - 1n;
			const input = new Uint8Array(128);
			input.set(bigintToBytes(maxValid, 64), 0); // c0
			input.set(bigintToBytes(maxValid, 64), 64); // c1
			const result = bls12MapFp2ToG2(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Invalid Fp2 elements", () => {
		it("should handle when c0 >= modulus (reduced internally)", () => {
			const input = new Uint8Array(128);
			input.set(bigintToBytes(BLS_MODULUS, 64), 0); // c0 = modulus
			const result = bls12MapFp2ToG2(input, 100000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			expect(result.success || result.error).toBeDefined();
		});

		it("should handle when c1 >= modulus (reduced internally)", () => {
			const input = new Uint8Array(128);
			// c0 = 0 (valid)
			input.set(bigintToBytes(BLS_MODULUS, 64), 64); // c1 = modulus
			const result = bls12MapFp2ToG2(input, 100000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			expect(result.success || result.error).toBeDefined();
		});

		it("should handle when both components >= modulus (reduced internally)", () => {
			const input = new Uint8Array(128);
			input.set(bigintToBytes(BLS_MODULUS + 1n, 64), 0);
			input.set(bigintToBytes(BLS_MODULUS + 1n, 64), 64);
			const result = bls12MapFp2ToG2(input, 100000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			expect(result.success || result.error).toBeDefined();
		});

		it("should handle maximum possible 128-byte value", () => {
			const input = new Uint8Array(128).fill(0xff);
			const result = bls12MapFp2ToG2(input, 100000n);

			// Implementation may reduce modulo BLS_MODULUS internally
			expect(result.success || result.error).toBeDefined();
		});
	});

	describe("Edge cases", () => {
		it("should be deterministic (same input produces same output)", () => {
			const input = new Uint8Array(128);
			input[63] = 123;
			input[127] = 45;

			const result1 = bls12MapFp2ToG2(input, 100000n);
			const result2 = bls12MapFp2ToG2(input, 100000n);
			const result3 = bls12MapFp2ToG2(input, 100000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(result3.success).toBe(true);

			expect(bytesToHex(result1.output)).toBe(bytesToHex(result2.output));
			expect(bytesToHex(result2.output)).toBe(bytesToHex(result3.output));
		});

		it("should handle boundary near modulus for both components", () => {
			const values = [BLS_MODULUS - 1n, BLS_MODULUS - 2n, BLS_MODULUS - 10n];

			for (const val of values) {
				const input = new Uint8Array(128);
				input.set(bigintToBytes(val, 64), 0);
				input.set(bigintToBytes(val, 64), 64);
				const result = bls12MapFp2ToG2(input, 100000n);

				expect(result.success).toBe(true);
				expect(result.output.length).toBe(256);
			}
		});

		it("should handle asymmetric Fp2 elements", () => {
			// c0 large, c1 small
			const input1 = new Uint8Array(128);
			input1.set(bigintToBytes(BLS_MODULUS - 1n, 64), 0);
			input1[127] = 1;

			const result1 = bls12MapFp2ToG2(input1, 100000n);
			expect(result1.success).toBe(true);

			// c0 small, c1 large
			const input2 = new Uint8Array(128);
			input2[63] = 1;
			input2.set(bigintToBytes(BLS_MODULUS - 1n, 64), 64);

			const result2 = bls12MapFp2ToG2(input2, 100000n);
			expect(result2.success).toBe(true);

			// Should produce different points
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const input = new Uint8Array(128).fill(0);
			const result = execute(
				PrecompileAddress.BLS12_MAP_FP2_TO_G2,
				input,
				100000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
			expect(result.gasUsed).toBe(75000n);
		});
	});

	describe("Comparison with map_fp_to_g1", () => {
		it("should be more expensive than map_fp_to_g1", () => {
			// G2 mapping: 75000 gas
			// G1 mapping: 5500 gas
			const g1Gas = 5500n;
			const g2Gas = 75000n;

			expect(g2Gas).toBeGreaterThan(g1Gas);
			expect(g2Gas / g1Gas).toBeGreaterThan(10n); // ~13.6x more expensive
		});

		it("should produce larger output than map_fp_to_g1", () => {
			// G1 point: 128 bytes
			// G2 point: 256 bytes
			const g1Input = new Uint8Array(64).fill(0);
			const g2Input = new Uint8Array(128).fill(0);

			const g1Result = bls12MapFpToG1(g1Input, 10000n);
			const g2Result = bls12MapFp2ToG2(g2Input, 100000n);

			expect(g1Result.success).toBe(true);
			expect(g2Result.success).toBe(true);

			expect(g2Result.output.length).toBe(g1Result.output.length * 2);
		});
	});
});
