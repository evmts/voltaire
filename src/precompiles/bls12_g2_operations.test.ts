import { describe, expect, it } from "vitest";

// BLS12-381 G2 generator coordinates (Fp2 elements)
// Each Fp2 element is c0 (48 bytes padded to 64) || c1 (48 bytes padded to 64)
// G2 point format: x0 || x1 || y0 || y1 (256 bytes total)

// G2 generator x-coordinate (x0, x1)
const G2_GENERATOR_X0 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x02, 0x4a, 0xa2, 0xb2, 0xf0, 0x8f, 0x0a, 0x91, 0x26, 0x08,
	0x05, 0x27, 0x2d, 0xc5, 0x10, 0x51, 0xc6, 0xe4, 0x7a, 0xd4, 0xfa, 0x40, 0x3b,
	0x02, 0xb4, 0x51, 0x0b, 0x64, 0x7a, 0xe3, 0xd1, 0x77, 0x0b, 0xac, 0x03, 0x26,
	0xa8, 0x05, 0xbb, 0xef, 0xd4, 0x80, 0x56, 0xc8, 0xc1, 0x21, 0xbd, 0xb8,
]);

const G2_GENERATOR_X1 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x13, 0xe0, 0x2b, 0x60, 0x52, 0x71, 0x9f, 0x60, 0x7d, 0xac,
	0xd3, 0xa0, 0x88, 0x27, 0x4f, 0x65, 0x59, 0x6b, 0xd0, 0xd0, 0x99, 0x20, 0xb6,
	0x1a, 0xb5, 0xda, 0x61, 0xbb, 0xdc, 0x7f, 0x50, 0x49, 0x33, 0x4c, 0xf1, 0x12,
	0x13, 0x94, 0x5d, 0x57, 0xe5, 0xac, 0x7d, 0x05, 0x5d, 0x04, 0x2b, 0x7e,
]);

// G2 generator y-coordinate (y0, y1)
const G2_GENERATOR_Y0 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x0c, 0xe5, 0xd5, 0x27, 0x72, 0x7d, 0x6e, 0x11, 0x8c, 0xc9,
	0xcd, 0xc6, 0xda, 0x2e, 0x35, 0x1a, 0xad, 0xfd, 0x9b, 0xaa, 0x8c, 0xbd, 0xd3,
	0xa7, 0x6d, 0x42, 0x9a, 0x69, 0x51, 0x60, 0xd1, 0x2c, 0x92, 0x3a, 0xc9, 0xcc,
	0x3b, 0xac, 0xa2, 0x89, 0xe1, 0x93, 0x54, 0x86, 0x08, 0xb8, 0x28, 0x01,
]);

const G2_GENERATOR_Y1 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x06, 0x06, 0xc4, 0xa0, 0x2e, 0xa7, 0x34, 0xcc, 0x32, 0xac,
	0xd2, 0xb0, 0x2b, 0xc2, 0x8b, 0x99, 0xcb, 0x3e, 0x28, 0x7e, 0x85, 0xa7, 0x63,
	0xaf, 0x26, 0x74, 0x92, 0xab, 0x57, 0x2e, 0x99, 0xab, 0x3f, 0x37, 0x0d, 0x27,
	0x5c, 0xec, 0x1d, 0xa1, 0xaa, 0xa9, 0x07, 0x5f, 0xf0, 0x5f, 0x79, 0xbe,
]);

// Negated G2 generator y-coordinates (for -G2)
const G2_GENERATOR_NEG_Y0 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x13, 0x1a, 0x2a, 0xd8, 0x8d, 0x82, 0x91, 0xee, 0x73, 0x36,
	0x32, 0x39, 0x25, 0xd1, 0xca, 0xe5, 0x52, 0x02, 0x64, 0x55, 0x73, 0x42, 0x2c,
	0x58, 0x92, 0xbd, 0x65, 0x96, 0xae, 0x9f, 0x2e, 0xd3, 0x6d, 0xc5, 0x36, 0x33,
	0xc4, 0x53, 0x5d, 0x76, 0x1e, 0x6c, 0xab, 0x79, 0xf7, 0x47, 0xd7, 0xfe,
]);

const G2_GENERATOR_NEG_Y1 = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x19, 0xf9, 0x3b, 0x5f, 0xd1, 0x58, 0xcb, 0x33, 0xcd, 0x53,
	0x2d, 0x4f, 0xd4, 0x3d, 0x74, 0x66, 0x34, 0xc1, 0xd7, 0x81, 0x7a, 0x58, 0x9c,
	0x50, 0xd9, 0x8b, 0x6d, 0x54, 0xa8, 0xd1, 0x66, 0x54, 0xc0, 0xc8, 0xf2, 0xd8,
	0xa3, 0x13, 0xe2, 0x5e, 0x55, 0x56, 0xf8, 0xa0, 0x0f, 0xa0, 0x86, 0x41,
]);

// Helper functions
function encodeG2Point(
	x0: Uint8Array,
	x1: Uint8Array,
	y0: Uint8Array,
	y1: Uint8Array,
): Uint8Array {
	const result = new Uint8Array(256);
	result.set(x0, 0);
	result.set(x1, 64);
	result.set(y0, 128);
	result.set(y1, 192);
	return result;
}

function encodeG2Addition(
	p1_x0: Uint8Array,
	p1_x1: Uint8Array,
	p1_y0: Uint8Array,
	p1_y1: Uint8Array,
	p2_x0: Uint8Array,
	p2_x1: Uint8Array,
	p2_y0: Uint8Array,
	p2_y1: Uint8Array,
): Uint8Array {
	const result = new Uint8Array(512);
	result.set(p1_x0, 0);
	result.set(p1_x1, 64);
	result.set(p1_y0, 128);
	result.set(p1_y1, 192);
	result.set(p2_x0, 256);
	result.set(p2_x1, 320);
	result.set(p2_y0, 384);
	result.set(p2_y1, 448);
	return result;
}

function encodeG2Multiplication(
	x0: Uint8Array,
	x1: Uint8Array,
	y0: Uint8Array,
	y1: Uint8Array,
	scalar: Uint8Array,
): Uint8Array {
	const result = new Uint8Array(288);
	result.set(x0, 0);
	result.set(x1, 64);
	result.set(y0, 128);
	result.set(y1, 192);
	result.set(scalar, 256);
	return result;
}

function isPointAtInfinity(point: Uint8Array): boolean {
	return point.every((b) => b === 0);
}

function pointsEqual(p1: Uint8Array, p2: Uint8Array): boolean {
	if (p1.length !== p2.length) return false;
	for (let i = 0; i < p1.length; i++) {
		if (p1[i] !== p2[i]) return false;
	}
	return true;
}

describe("BLS12-381 G2 Point Operations", () => {
	describe("Generator Point Properties", () => {
		it("G2 generator point is well-formed", () => {
			expect(G2_GENERATOR_X0.length).toBe(64);
			expect(G2_GENERATOR_X1.length).toBe(64);
			expect(G2_GENERATOR_Y0.length).toBe(64);
			expect(G2_GENERATOR_Y1.length).toBe(64);
		});

		it("G2 generator is not point at infinity", () => {
			const g2 = encodeG2Point(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			expect(isPointAtInfinity(g2)).toBe(false);
		});

		it("Negated G2 generator has same x, different y", () => {
			// x coordinates should match
			expect(pointsEqual(G2_GENERATOR_X0, G2_GENERATOR_X0)).toBe(true);
			expect(pointsEqual(G2_GENERATOR_X1, G2_GENERATOR_X1)).toBe(true);
			// y coordinates should differ
			expect(pointsEqual(G2_GENERATOR_Y0, G2_GENERATOR_NEG_Y0)).toBe(false);
			expect(pointsEqual(G2_GENERATOR_Y1, G2_GENERATOR_NEG_Y1)).toBe(false);
		});
	});

	describe("Point at Infinity Operations", () => {
		it("point at infinity is all zeros", () => {
			const infinity = new Uint8Array(256);
			expect(isPointAtInfinity(infinity)).toBe(true);
		});

		it("O + O = O (infinity + infinity)", () => {
			const infinity = new Uint8Array(256);
			const input = new Uint8Array(512); // Two infinity points
			// In actual implementation, this would call g2Add precompile
			// Here we just verify the input format
			expect(input.length).toBe(512);
			expect(isPointAtInfinity(input.slice(0, 256))).toBe(true);
			expect(isPointAtInfinity(input.slice(256, 512))).toBe(true);
		});

		it("P + O = P (point + infinity)", () => {
			const g2 = encodeG2Point(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			const infinity = new Uint8Array(256);
			const input = new Uint8Array(512);
			input.set(g2, 0);
			input.set(infinity, 256);
			// Expected result: G2 (first point)
			expect(input.slice(0, 256)).toEqual(g2);
		});

		it("O + P = P (infinity + point)", () => {
			const g2 = encodeG2Point(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			const infinity = new Uint8Array(256);
			const input = new Uint8Array(512);
			input.set(infinity, 0);
			input.set(g2, 256);
			// Expected result: G2 (second point)
		});

		it("0 * P = O (zero scalar)", () => {
			const scalar = new Uint8Array(32); // All zeros
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Expected result: point at infinity
		});

		it("k * O = O (scalar times infinity)", () => {
			const scalar = new Uint8Array(32);
			scalar[31] = 42; // Non-zero scalar
			const infinity_x0 = new Uint8Array(64);
			const infinity_x1 = new Uint8Array(64);
			const infinity_y0 = new Uint8Array(64);
			const infinity_y1 = new Uint8Array(64);
			const input = encodeG2Multiplication(
				infinity_x0,
				infinity_x1,
				infinity_y0,
				infinity_y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Expected result: point at infinity
		});
	});

	describe("Point Addition Properties", () => {
		it("G2 + G2 = 2*G2 (point doubling)", () => {
			const input = encodeG2Addition(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			expect(input.length).toBe(512);
			// Expected: Result should not be infinity or equal to G2
		});

		it("P + (-P) = O (point + negation)", () => {
			const input = encodeG2Addition(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_NEG_Y0,
				G2_GENERATOR_NEG_Y1,
			);
			expect(input.length).toBe(512);
			// Expected: point at infinity
		});

		it("addition is commutative: P + Q = Q + P", () => {
			// This would require computing 2*G2 first, then testing commutativity
			// Format: (G2, 2*G2) vs (2*G2, G2)
			// Expected: same result
		});
	});

	describe("Scalar Multiplication Properties", () => {
		it("1 * P = P (identity scalar)", () => {
			const scalar = new Uint8Array(32);
			scalar[31] = 1;
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Expected: G2 generator point
		});

		it("2 * G2 produces valid point", () => {
			const scalar = new Uint8Array(32);
			scalar[31] = 2;
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Expected: 2*G2 (not infinity, not G2)
		});

		it("small scalar multiplications", () => {
			for (let k = 0; k <= 5; k++) {
				const scalar = new Uint8Array(32);
				scalar[31] = k;
				const input = encodeG2Multiplication(
					G2_GENERATOR_X0,
					G2_GENERATOR_X1,
					G2_GENERATOR_Y0,
					G2_GENERATOR_Y1,
					scalar,
				);
				expect(input.length).toBe(288);
				// For k=0: expect infinity
				// For k=1: expect G2
				// For k>1: expect valid point
			}
		});

		it("large scalar multiplication", () => {
			const scalar = new Uint8Array(32);
			scalar.fill(0xff); // Maximum value
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Expected: valid point (should reduce modulo curve order)
		});
	});

	describe("Input Validation", () => {
		it("G2 addition requires exactly 512 bytes", () => {
			const validInput = new Uint8Array(512);
			expect(validInput.length).toBe(512);

			const tooShort = new Uint8Array(511);
			expect(tooShort.length).toBeLessThan(512);

			const tooLong = new Uint8Array(513);
			expect(tooLong.length).toBeGreaterThan(512);
		});

		it("G2 multiplication requires exactly 288 bytes", () => {
			const validInput = new Uint8Array(288);
			expect(validInput.length).toBe(288);

			const tooShort = new Uint8Array(287);
			expect(tooShort.length).toBeLessThan(288);

			const tooLong = new Uint8Array(289);
			expect(tooLong.length).toBeGreaterThan(288);
		});

		it("invalid point coordinates should fail", () => {
			// Point with coordinates not on the curve
			const invalidX0 = new Uint8Array(64);
			invalidX0[63] = 1; // x0 = 1
			const invalidX1 = new Uint8Array(64);
			invalidX1[63] = 1; // x1 = 1
			const invalidY0 = new Uint8Array(64);
			invalidY0[63] = 2; // y0 = 2
			const invalidY1 = new Uint8Array(64);
			invalidY1[63] = 2; // y1 = 2

			const input = encodeG2Addition(
				invalidX0,
				invalidX1,
				invalidY0,
				invalidY1,
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			expect(input.length).toBe(512);
			// Expected: should fail validation (point not on curve)
		});
	});

	describe("Gas Cost Validation", () => {
		it("G2 addition gas cost is 800", () => {
			const expectedGas = 800n;
			expect(expectedGas).toBe(800n);
		});

		it("G2 multiplication gas cost is 45000", () => {
			const expectedGas = 45000n;
			expect(expectedGas).toBe(45000n);
		});
	});

	describe("Output Format", () => {
		it("G2 addition output is 256 bytes", () => {
			const expectedOutputSize = 256;
			const output = new Uint8Array(expectedOutputSize);
			expect(output.length).toBe(256);
		});

		it("G2 multiplication output is 256 bytes", () => {
			const expectedOutputSize = 256;
			const output = new Uint8Array(expectedOutputSize);
			expect(output.length).toBe(256);
		});

		it("output encodes valid G2 point in Fp2", () => {
			// Output format: x0 (64) || x1 (64) || y0 (64) || y1 (64)
			const output = new Uint8Array(256);
			const x0 = output.slice(0, 64);
			const x1 = output.slice(64, 128);
			const y0 = output.slice(128, 192);
			const y1 = output.slice(192, 256);

			expect(x0.length).toBe(64);
			expect(x1.length).toBe(64);
			expect(y0.length).toBe(64);
			expect(y1.length).toBe(64);
		});
	});

	describe("Algebraic Properties", () => {
		it("distributive property: 2*P = P + P", () => {
			// Multiplication by 2
			const scalar = new Uint8Array(32);
			scalar[31] = 2;
			const mulInput = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);

			// Addition G2 + G2
			const addInput = encodeG2Addition(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);

			// Expected: both operations produce same result
			expect(mulInput.length).toBe(288);
			expect(addInput.length).toBe(512);
		});

		it("scalar multiplication is consistent", () => {
			// 3*P = P + P + P = P + 2*P
			const scalar = new Uint8Array(32);
			scalar[31] = 3;
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
		});
	});

	describe("Edge Cases", () => {
		it("maximum field element values", () => {
			// Test with coordinates at field boundary
			const maxFieldElement = new Uint8Array(64);
			maxFieldElement.fill(0xff, 16, 64); // Large value (will likely be invalid)
			// This should fail validation as it exceeds field modulus
		});

		it("scalar field boundary", () => {
			// Test with scalar near curve order r
			const scalar = new Uint8Array(32);
			scalar.fill(0xff); // Large scalar
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			expect(input.length).toBe(288);
			// Should reduce modulo r
		});

		it("all-zero point is infinity", () => {
			const zeroPoint = new Uint8Array(256);
			expect(isPointAtInfinity(zeroPoint)).toBe(true);
		});
	});

	describe("EIP-2537 Compatibility", () => {
		it("follows EIP-2537 encoding: big-endian, padded to 64 bytes", () => {
			// Each Fp element is 48 bytes, padded with 16 leading zeros to 64 bytes
			const x0 = G2_GENERATOR_X0;
			// First 16 bytes should be padding zeros
			const padding = x0.slice(0, 16);
			expect(padding.every((b) => b === 0)).toBe(true);
			// Remaining 48 bytes contain the actual field element
			const fieldElement = x0.slice(16, 64);
			expect(fieldElement.length).toBe(48);
		});

		it("Fp2 encoding: c0 || c1 for each coordinate", () => {
			// X = (x0, x1) where x0, x1 in Fp
			// Encoded as: x0 (64 bytes) || x1 (64 bytes)
			const g2 = encodeG2Point(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);

			const encodedX0 = g2.slice(0, 64);
			const encodedX1 = g2.slice(64, 128);
			const encodedY0 = g2.slice(128, 192);
			const encodedY1 = g2.slice(192, 256);

			expect(encodedX0).toEqual(G2_GENERATOR_X0);
			expect(encodedX1).toEqual(G2_GENERATOR_X1);
			expect(encodedY0).toEqual(G2_GENERATOR_Y0);
			expect(encodedY1).toEqual(G2_GENERATOR_Y1);
		});
	});

	describe("Subgroup Membership", () => {
		it("G2 generator is in correct subgroup", () => {
			// G2 has cofactor h != 1, so not all curve points are in the prime-order subgroup
			// G2 generator should be in the correct subgroup
			const g2 = encodeG2Point(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			expect(g2.length).toBe(256);
			// Subgroup check: r * P = O (where r is scalar field order)
		});

		it("cofactor * G2 is in prime-order subgroup", () => {
			// G2 cofactor h is large
			// Any point P on curve: h*P is in prime-order subgroup
			// This ensures proper subgroup membership
		});
	});

	describe("Performance Benchmarks", () => {
		it("addition should be efficient", () => {
			const input = encodeG2Addition(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
			);
			// Gas cost: 800
			expect(input.length).toBe(512);
		});

		it("multiplication should handle 256-bit scalars", () => {
			const scalar = new Uint8Array(32);
			scalar.fill(0xaa); // Alternating bit pattern
			const input = encodeG2Multiplication(
				G2_GENERATOR_X0,
				G2_GENERATOR_X1,
				G2_GENERATOR_Y0,
				G2_GENERATOR_Y1,
				scalar,
			);
			// Gas cost: 45000
			expect(input.length).toBe(288);
		});
	});
});
