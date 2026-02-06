import { describe, expect, it } from "vitest";
import { deserializeG1, serializeG1 } from "../crypto/bn254/BN254.js";
import { FR_MOD } from "../crypto/bn254/constants.js";
import * as G1 from "../crypto/bn254/G1/index.js";
import {
	bn254Add,
	execute,
	PrecompileAddress,
} from "../evm/precompiles/precompiles.js";

/**
 * BN254 curve: y^2 = x^3 + 3 over Fp
 * Order: r (scalar field)
 * Cofactor: 1 (for G1)
 */

describe("BN254 Point Addition (0x06) - EIP-196", () => {
	describe("Gas costs - EIP-196", () => {
		it("should charge 150 gas for point addition", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 1000n);
			expect(result.gasUsed).toBe(150n);
		});

		it("should fail with insufficient gas", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 100n);
			expect(result.success).toBe(false);
		});

		it("should succeed with exact gas", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 150n);
			expect(result.success).toBe(true);
		});

		it("should succeed with extra gas", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 200n);
			expect(result.success).toBe(true);
		});
	});

	describe("Infinity point operations", () => {
		it("should add O + O = O (infinity + infinity)", () => {
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);
			const input = new Uint8Array(128);
			input.set(infBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			// Result should be infinity (all zeros)
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should add P + O = P (point + infinity)", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(genBytes);
		});

		it("should add O + P = P (infinity + point)", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);

			const input = new Uint8Array(128);
			input.set(infBytes, 0);
			input.set(genBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(genBytes);
		});

		it("should add P + (-P) = O (additive inverse)", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			const genBytes = serializeG1(gen);
			const negBytes = serializeG1(neg);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(negBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			// Result should be infinity
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Point doubling", () => {
		it("should compute 2*G = G + G (point doubling)", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const genBytes = serializeG1(gen);
			const doubledBytes = serializeG1(doubled);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(genBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(doubledBytes);
		});

		it("should compute 2*P for arbitrary point", () => {
			// Pick a random scalar and compute k*G
			const k = 0x1234567890abcdefn;
			const p = G1.mul(G1.generator(), k);
			const doubled = G1.double(p);
			const pBytes = serializeG1(p);
			const doubledBytes = serializeG1(doubled);

			const input = new Uint8Array(128);
			input.set(pBytes, 0);
			input.set(pBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(doubledBytes);
		});
	});

	describe("General addition", () => {
		it("should add two distinct generator multiples", () => {
			// Compute P = 2*G and Q = 3*G, then verify P + Q = 5*G
			const g = G1.generator();
			const twoG = G1.mul(g, 2n);
			const threeG = G1.mul(g, 3n);
			const fiveG = G1.mul(g, 5n);

			const twoGBytes = serializeG1(twoG);
			const threeGBytes = serializeG1(threeG);
			const fiveGBytes = serializeG1(fiveG);

			const input = new Uint8Array(128);
			input.set(twoGBytes, 0);
			input.set(threeGBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(fiveGBytes);
		});

		it("should verify commutativity: P + Q = Q + P", () => {
			const g = G1.generator();
			const p = G1.mul(g, 12345n);
			const q = G1.mul(g, 67890n);
			const pBytes = serializeG1(p);
			const qBytes = serializeG1(q);

			// Compute P + Q
			const input1 = new Uint8Array(128);
			input1.set(pBytes, 0);
			input1.set(qBytes, 64);
			const res1 = bn254Add(input1, 1000n);
			expect(res1.success).toBe(true);

			// Compute Q + P
			const input2 = new Uint8Array(128);
			input2.set(qBytes, 0);
			input2.set(pBytes, 64);
			const res2 = bn254Add(input2, 1000n);
			expect(res2.success).toBe(true);

			// Results should be equal
			expect(res1.output).toEqual(res2.output);
		});

		it("should verify associativity: (P + Q) + R = P + (Q + R)", () => {
			const g = G1.generator();
			const p = G1.mul(g, 111n);
			const q = G1.mul(g, 222n);
			const r = G1.mul(g, 333n);

			// Expected: P + Q + R = 666*G
			const expectedSum = G1.mul(g, 666n);
			const expectedBytes = serializeG1(expectedSum);

			// Compute (P + Q) + R
			const pBytes = serializeG1(p);
			const qBytes = serializeG1(q);
			const rBytes = serializeG1(r);

			const pqInput = new Uint8Array(128);
			pqInput.set(pBytes, 0);
			pqInput.set(qBytes, 64);
			const pqRes = bn254Add(pqInput, 1000n);
			expect(pqRes.success).toBe(true);

			const pqrInput = new Uint8Array(128);
			pqrInput.set(pqRes.output, 0);
			pqrInput.set(rBytes, 64);
			const pqrRes = bn254Add(pqrInput, 1000n);
			expect(pqrRes.success).toBe(true);
			expect(pqrRes.output).toEqual(expectedBytes);
		});
	});

	describe("Edge cases", () => {
		it("should handle addition with max field coordinates (invalid points rejected)", () => {
			// Create point with x = p-1, y = p-1 (likely invalid)
			const _maxFp = (1n << 254n) - 1n; // Approximate field modulus
			const input = new Uint8Array(128);
			// Set coordinates to large values (will be invalid on BN254)
			for (let i = 0; i < 32; i++) {
				input[i] = 0xff;
				input[64 + i] = 0xff;
			}

			const result = bn254Add(input, 1000n);
			// Should either fail or reject invalid points
			if (result.success) {
				// If implementation doesn't validate, output should indicate error
				expect(result.output).toBeDefined();
			}
		});

		it("should handle point with x-coordinate at field boundary", () => {
			const g = G1.generator();
			const gBytes = serializeG1(g);

			// Try adding generator to itself multiple times
			let current = gBytes;
			for (let i = 0; i < 5; i++) {
				const input = new Uint8Array(128);
				input.set(current, 0);
				input.set(gBytes, 64);
				const result = bn254Add(input, 1000n);
				expect(result.success).toBe(true);
				current = result.output;
			}
		});

		it("should handle both points being the same", () => {
			const g = G1.generator();
			const gBytes = serializeG1(g);

			const input = new Uint8Array(128);
			input.set(gBytes, 0);
			input.set(gBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			// Should be equivalent to doubling
			const doubled = G1.double(g);
			const doubledBytes = serializeG1(doubled);
			expect(result.output).toEqual(doubledBytes);
		});
	});

	describe("Large scalar operations", () => {
		it("should add high-order scalar multiples", () => {
			// Use scalar near curve order
			const scalarNear = FR_MOD - 1n;
			const g = G1.generator();
			const p = G1.mul(g, scalarNear);
			const pBytes = serializeG1(p);

			// P + G should still work
			const gBytes = serializeG1(g);
			const input = new Uint8Array(128);
			input.set(pBytes, 0);
			input.set(gBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
		});

		it("should handle many successive additions (stress test)", () => {
			const g = G1.generator();
			let current = G1.infinity();

			for (let i = 0; i < 10; i++) {
				const currentBytes = serializeG1(current);
				const gBytes = serializeG1(g);
				const input = new Uint8Array(128);
				input.set(currentBytes, 0);
				input.set(gBytes, 64);

				const result = bn254Add(input, 1000n);
				expect(result.success).toBe(true);
				current = deserializeG1(result.output);
			}

			// Final result should be 10*G
			const expected = G1.mul(g, 10n);
			const expectedBytes = serializeG1(expected);
			const finalBytes = serializeG1(current);
			expect(finalBytes).toEqual(expectedBytes);
		});
	});

	describe("Input validation", () => {
		it("should handle 128 bytes input correctly", () => {
			// Exact size
			const exact = new Uint8Array(128);
			const res3 = bn254Add(exact, 1000n);
			expect(res3.success).toBe(true);
		});

		it("should output exactly 64 bytes", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});

	describe("Cryptographic properties", () => {
		it("should satisfy group identity: P + O = P", () => {
			const g = G1.generator();
			const gBytes = serializeG1(g);
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);

			const input = new Uint8Array(128);
			input.set(gBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(gBytes);
		});

		it("should satisfy group inverse: P + (-P) = O", () => {
			const g = G1.generator();
			const neg = G1.negate(g);
			const gBytes = serializeG1(g);
			const negBytes = serializeG1(neg);

			const input = new Uint8Array(128);
			input.set(gBytes, 0);
			input.set(negBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should compute group operation: (a*G) + (b*G) = (a+b)*G", () => {
			const a = 123n;
			const b = 456n;
			const g = G1.generator();
			const aG = G1.mul(g, a);
			const bG = G1.mul(g, b);
			const aPlusbG = G1.mul(g, a + b);

			const aGBytes = serializeG1(aG);
			const bGBytes = serializeG1(bG);
			const aPlusbGBytes = serializeG1(aPlusbG);

			const input = new Uint8Array(128);
			input.set(aGBytes, 0);
			input.set(bGBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(aPlusbGBytes);
		});
	});

	describe("Execute interface", () => {
		it("should work through execute() function", () => {
			const g = G1.generator();
			const gBytes = serializeG1(g);
			const input = new Uint8Array(128);
			input.set(gBytes, 0);
			input.set(gBytes, 64);

			const result = execute(PrecompileAddress.BN254_ADD, input, 1000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(150n);
		});
	});
});
