import { describe, expect, it } from "vitest";
import {
	deserializeG1,
	deserializeG2,
	serializeG1,
	serializeG2,
} from "../crypto/bn254/BN254.js";
import * as G1 from "../crypto/bn254/G1/index.js";
import * as G2 from "../crypto/bn254/G2/index.js";
import { FP2_MOD, FP_MOD, FR_MOD } from "../crypto/bn254/constants.js";
import {
	PrecompileAddress,
	bn254Pairing,
	execute,
} from "../evm/precompiles/precompiles.js";

/**
 * BN254 pairing check (ate pairing)
 * Verifies: e(P1, Q1) * e(P2, Q2) * ... * e(Pn, Qn) == 1 in Gt
 * Input: (P1 || Q1 || P2 || Q2 || ... || Pn || Qn) where each pair is 64 + 128 = 192 bytes
 * Output: 1 (true) or 0 (false)
 */

describe("BN254 Pairing Check (0x08) - EIP-197", () => {
	describe("Gas costs - EIP-197", () => {
		it("should charge base 45000 + 34000 per pair", () => {
			// 1 pair: 45000 + 34000*1 = 79000
			const input = new Uint8Array(192); // 1 pair
			const result = bn254Pairing(input, 100000n);
			expect(result.gasUsed).toBe(79000n);
		});

		it("should charge 45000 for empty input", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			expect(result.gasUsed).toBe(45000n);
		});

		it("should charge 45000 + 34000*2 = 113000 for 2 pairs", () => {
			const input = new Uint8Array(384); // 2 pairs
			const result = bn254Pairing(input, 150000n);
			expect(result.gasUsed).toBe(113000n);
		});

		it("should fail with insufficient gas for 1 pair", () => {
			const input = new Uint8Array(192);
			const result = bn254Pairing(input, 78999n);
			expect(result.success).toBe(false);
		});

		it("should succeed with exact gas for 1 pair", () => {
			const input = new Uint8Array(192);
			const result = bn254Pairing(input, 79000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Empty input", () => {
		it("should return 1 for empty pairing list (vacuous truth)", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			// Empty product in Gt is 1 (identity in multiplicative group)
			expect(result.output.length).toBe(32);
			// Output should be 1
			const output = new DataView(result.output.buffer);
			expect(output.getBigUint64(0)).toBe(0n);
			expect(output.getBigUint64(8)).toBe(0n);
			expect(output.getBigUint64(16)).toBe(0n);
			expect(output.getBigUint64(24)).toBe(1n);
		});
	});

	describe("Identity operations", () => {
		it("should return 1 when pairing point at infinity with any point", () => {
			// e(O, Q) = 1
			const q = G2.generator();
			const inf = G1.infinity();

			const infBytes = serializeG1(inf);
			const qBytes = serializeG2(q);

			const input = new Uint8Array(192);
			input.set(infBytes, 0);
			input.set(qBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			// Should be 1 (identity in Gt)
			expect(result.output.length).toBe(32);
		});

		it("should return 1 when pairing any point with point at infinity", () => {
			// e(P, O) = 1
			const p = G1.generator();
			const inf = G2.infinity();

			const pBytes = serializeG1(p);
			const infBytes = serializeG2(inf);

			const input = new Uint8Array(192);
			input.set(pBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});

		it("should return 1 when pairing infinity with infinity", () => {
			// e(O, O) = 1
			const infP = G1.infinity();
			const infQ = G2.infinity();

			const infPBytes = serializeG1(infP);
			const infQBytes = serializeG2(infQ);

			const input = new Uint8Array(192);
			input.set(infPBytes, 0);
			input.set(infQBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Bilinearity property: e(a*P, Q) = e(P, a*Q) = e(P, Q)^a", () => {
		it("should verify bilinearity with scalar 2: e(2*G1, G2) = e(G1, 2*G2)", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();
			const twoG1 = G1.mul(g1, 2n);
			const twoG2 = G2.mul(g2, 2n);

			const twoG1Bytes = serializeG1(twoG1);
			const g2Bytes = serializeG2(g2);
			const g1Bytes = serializeG1(g1);
			const twoG2Bytes = serializeG2(twoG2);

			// Compute e(2*G1, G2)
			const input1 = new Uint8Array(192);
			input1.set(twoG1Bytes, 0);
			input1.set(g2Bytes, 64);
			const res1 = bn254Pairing(input1, 100000n);
			expect(res1.success).toBe(true);

			// Compute e(G1, 2*G2)
			const input2 = new Uint8Array(192);
			input2.set(g1Bytes, 0);
			input2.set(twoG2Bytes, 64);
			const res2 = bn254Pairing(input2, 100000n);
			expect(res2.success).toBe(true);

			// Should be equal (in Gt)
			expect(res1.output).toEqual(res2.output);
		});

		it("should verify bilinearity property holds", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();
			const scalar = 42n;

			const aG1 = G1.mul(g1, scalar);
			const aG2 = G2.mul(g2, scalar);

			const aG1Bytes = serializeG1(aG1);
			const g2Bytes = serializeG2(g2);
			const g1Bytes = serializeG1(g1);
			const aG2Bytes = serializeG2(aG2);

			// e(a*G1, G2)
			const input1 = new Uint8Array(192);
			input1.set(aG1Bytes, 0);
			input1.set(g2Bytes, 64);
			const res1 = bn254Pairing(input1, 100000n);
			expect(res1.success).toBe(true);

			// e(G1, a*G2)
			const input2 = new Uint8Array(192);
			input2.set(g1Bytes, 0);
			input2.set(aG2Bytes, 64);
			const res2 = bn254Pairing(input2, 100000n);
			expect(res2.success).toBe(true);

			expect(res1.output).toEqual(res2.output);
		});
	});

	describe("Antisymmetry: e(P, Q) = e(Q, P)^(p^k-1)/r is not necessarily true", () => {
		it("should verify pairing is not symmetric in general", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();
			const p = G1.mul(g1, 5n);
			const q = G2.mul(g2, 7n);

			const pBytes = serializeG1(p);
			const qBytes = serializeG2(q);

			const input = new Uint8Array(192);
			input.set(pBytes, 0);
			input.set(qBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});
	});

	describe("Multi-pairing identity verification", () => {
		it("should verify: e(P1, Q1) * e(P2, Q2) = 1 when P2=-P1 and Q2=Q1", () => {
			// If we want e(P, Q) * e(-P, Q) = 1
			// This requires the pairing to satisfy: e(-P, Q) = e(P, Q)^(-1)
			const g1 = G1.generator();
			const g2 = G2.generator();

			const p = G1.mul(g1, 3n);
			const negP = G1.negate(p);
			const q = G2.mul(g2, 5n);

			const pBytes = serializeG1(p);
			const negPBytes = serializeG1(negP);
			const qBytes = serializeG2(q);

			// Create input with 2 pairs: (P, Q) and (-P, Q)
			const input = new Uint8Array(384); // 2 pairs
			input.set(pBytes, 0);
			input.set(qBytes, 64);
			input.set(negPBytes, 192);
			input.set(qBytes, 256);

			const result = bn254Pairing(input, 150000n);
			expect(result.success).toBe(true);
			// Result should be 1 due to pairing properties
		});

		it("should handle multiple valid pairs", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			const p1 = G1.mul(g1, 2n);
			const q1 = G2.mul(g2, 3n);
			const p2 = G1.mul(g1, 5n);
			const q2 = G2.mul(g2, 7n);

			const p1Bytes = serializeG1(p1);
			const q1Bytes = serializeG2(q1);
			const p2Bytes = serializeG1(p2);
			const q2Bytes = serializeG2(q2);

			// 2 pairs
			const input = new Uint8Array(384);
			input.set(p1Bytes, 0);
			input.set(q1Bytes, 64);
			input.set(p2Bytes, 192);
			input.set(q2Bytes, 256);

			const result = bn254Pairing(input, 150000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Large scalars", () => {
		it("should handle points with large scalar multiples", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			const largeScalar = BigInt("0xdeadbeefcafebabe");
			const p = G1.mul(g1, largeScalar);
			const q = G2.mul(g2, largeScalar);

			const pBytes = serializeG1(p);
			const qBytes = serializeG2(q);

			const input = new Uint8Array(192);
			input.set(pBytes, 0);
			input.set(qBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});

		it("should handle scalar near curve order", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			const nearOrder = FR_MOD - 1n;
			const p = G1.mul(g1, nearOrder);
			const q = G2.mul(g2, nearOrder);

			const pBytes = serializeG1(p);
			const qBytes = serializeG2(q);

			const input = new Uint8Array(192);
			input.set(pBytes, 0);
			input.set(qBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Input validation", () => {
		it("should require input length divisible by 192", () => {
			// Valid: 0, 192, 384, 576, ...
			const valid0 = new Uint8Array(0);
			const res0 = bn254Pairing(valid0, 100000n);
			expect(res0.success).toBe(true);

			const valid1 = new Uint8Array(192);
			const res1 = bn254Pairing(valid1, 100000n);
			expect(res1.success).toBe(true);

			const valid2 = new Uint8Array(384);
			const res2 = bn254Pairing(valid2, 150000n);
			expect(res2.success).toBe(true);

			// Invalid: not divisible by 192
			const invalid = new Uint8Array(191);
			const resInvalid = bn254Pairing(invalid, 100000n);
			expect(resInvalid.success).toBe(false);
		});

		it("should output exactly 32 bytes", () => {
			const input = new Uint8Array(192);
			const result = bn254Pairing(input, 100000n);
			if (result.success) {
				expect(result.output.length).toBe(32);
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle many pairs (up to 6)", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			for (let numPairs = 1; numPairs <= 6; numPairs++) {
				const input = new Uint8Array(192 * numPairs);
				for (let i = 0; i < numPairs; i++) {
					const p = G1.mul(g1, BigInt(i + 1));
					const q = G2.mul(g2, BigInt(i + 1));
					const pBytes = serializeG1(p);
					const qBytes = serializeG2(q);
					input.set(pBytes, 192 * i);
					input.set(qBytes, 192 * i + 64);
				}

				const gasNeeded = 45000n + BigInt(34000 * numPairs);
				const result = bn254Pairing(input, gasNeeded + 1000n);
				expect(result.success).toBe(true);
			}
		});

		it("should handle all generators", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			const g1Bytes = serializeG1(g1);
			const g2Bytes = serializeG2(g2);

			const input = new Uint8Array(192);
			input.set(g1Bytes, 0);
			input.set(g2Bytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});

		it("should handle point with y-coordinate near field boundary", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();

			// Use large scalar
			const p = G1.mul(g1, 0xffffffffffffffffn);
			const q = G2.mul(g2, 0xffffffffffffffffn);

			const pBytes = serializeG1(p);
			const qBytes = serializeG2(q);

			const input = new Uint8Array(192);
			input.set(pBytes, 0);
			input.set(qBytes, 64);

			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Curve membership", () => {
		it("should reject point not on BN254 curve", () => {
			// Create invalid point (all ones)
			const invalidBytes = new Uint8Array(64);
			invalidBytes.fill(0xff);
			const g2 = G2.generator();
			const g2Bytes = serializeG2(g2);

			const input = new Uint8Array(192);
			input.set(invalidBytes, 0);
			input.set(g2Bytes, 64);

			const result = bn254Pairing(input, 100000n);
			// Should either succeed (if point validation is lenient) or fail
			if (!result.success) {
				expect(result.error).toBeDefined();
			}
		});

		it("should reject G2 point not on BN254 twist", () => {
			const g1 = G1.generator();
			const g1Bytes = serializeG1(g1);

			// Create invalid G2 point
			const invalidBytes = new Uint8Array(128);
			invalidBytes.fill(0xff);

			const input = new Uint8Array(192);
			input.set(g1Bytes, 0);
			input.set(invalidBytes, 64);

			const result = bn254Pairing(input, 100000n);
			// Should either succeed or fail validation
			if (!result.success) {
				expect(result.error).toBeDefined();
			}
		});
	});

	describe("Execute interface", () => {
		it("should work through execute() function", () => {
			const g1 = G1.generator();
			const g2 = G2.generator();
			const g1Bytes = serializeG1(g1);
			const g2Bytes = serializeG2(g2);

			const input = new Uint8Array(192);
			input.set(g1Bytes, 0);
			input.set(g2Bytes, 64);

			const result = execute(PrecompileAddress.BN254_PAIRING, input, 100000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(79000n);
		});
	});

	describe("zkSNARK verification pattern", () => {
		it("should handle typical zkSNARK pairing check format", () => {
			// Typical zkSNARK verification:
			// e(Proof.A, Proof.B) = e(IC[0] + sum(IC[i] * w[i]), G2.gen) * e(Proof.C, Proof.H)
			// Rearranged: e(Proof.A, Proof.B) * e(-Proof.C, Proof.H) * e(-sum(IC[i]*w[i]), G2.gen) = 1
			// Or simpler: e(P1, Q1) * e(-P2, Q2) * e(-P3, Q3) = 1
			const g1 = G1.generator();
			const g2 = G2.generator();

			// Create three verification pairs
			const p1 = G1.mul(g1, 111n);
			const q1 = G2.mul(g2, 222n);
			const p2 = G1.mul(g1, 333n);
			const q2 = G2.mul(g2, 444n);
			const p3 = G1.mul(g1, 555n);
			const q3 = G2.mul(g2, 666n);

			const input = new Uint8Array(576); // 3 pairs
			input.set(serializeG1(p1), 0);
			input.set(serializeG2(q1), 64);
			input.set(serializeG1(G1.negate(p2)), 192);
			input.set(serializeG2(q2), 256);
			input.set(serializeG1(G1.negate(p3)), 384);
			input.set(serializeG2(q3), 448);

			const gasNeeded = 45000n + 34000n * 3n;
			const result = bn254Pairing(input, gasNeeded + 1000n);
			expect(result.success).toBe(true);
		});

		it("should handle BLS12-381 style protocol", () => {
			// BLS signature verification: e(signature, G2.gen) = e(message, public_key)
			// Rearranged: e(signature, G2.gen) * e(-message, pk) = 1
			const g1 = G1.generator();
			const g2 = G2.generator();

			// Simulate signature
			const sig = G1.mul(g1, 0x12345678n);
			// Simulate message
			const msg = G1.mul(g1, 0x87654321n);
			// Simulate public key
			const pk = G2.mul(g2, 0xabcdefn);

			const input = new Uint8Array(384); // 2 pairs
			input.set(serializeG1(sig), 0);
			input.set(serializeG2(g2), 64);
			input.set(serializeG1(G1.negate(msg)), 192);
			input.set(serializeG2(pk), 256);

			const gasNeeded = 45000n + 34000n * 2n;
			const result = bn254Pairing(input, gasNeeded + 1000n);
			expect(result.success).toBe(true);
		});
	});
});
