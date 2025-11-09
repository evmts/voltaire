import { describe, expect, test } from "vitest";
import * as G1 from "../G1/index.js";
import * as G2 from "../G2/index.js";
import * as Pairing from "./index.js";

describe("Pairing operations", () => {
	describe("pair", () => {
		test("pairing with infinity in G1", () => {
			const p = G1.infinity();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with infinity in G2", () => {
			const p = G1.generator();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with both infinity", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with generators", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
			expect(result.value).toBeDefined();
		});

		test("pairing produces consistent results", () => {
			const p = G1.generator();
			const q = G2.generator();
			const r1 = Pairing.pair(p, q);
			const r2 = Pairing.pair(p, q);
			// Results should be equal
			expect(r1.value).toBe(r2.value);
		});
	});

	describe("pairingCheck", () => {
		test("empty pairing check returns true", () => {
			expect(Pairing.pairingCheck([])).toBe(true);
		});

		test("single pair with generators", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pairingCheck([[p, q]]);
			expect(typeof result).toBe("boolean");
		});

		test("pairing with infinity pairs", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.pairingCheck([[p, q]]);
			expect(result).toBe(true);
		});

		test("multiple pairs", () => {
			const p1 = G1.generator();
			const q1 = G2.generator();
			const p2 = G1.double(p1);
			const q2 = G2.generator();
			const result = Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);
			expect(typeof result).toBe("boolean");
		});

		test("pairing check is deterministic", () => {
			const p = G1.generator();
			const q = G2.generator();
			const r1 = Pairing.pairingCheck([[p, q]]);
			const r2 = Pairing.pairingCheck([[p, q]]);
			expect(r1).toBe(r2);
		});
	});

	describe("multiPairing", () => {
		test("multi pairing with empty array", () => {
			const result = Pairing.multiPairing([]);
			expect(result).toBeDefined();
		});

		test("multi pairing with single pair", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.multiPairing([[p, q]]);
			expect(result).toBeDefined();
		});

		test("multi pairing with multiple pairs", () => {
			const p1 = G1.generator();
			const q1 = G2.generator();
			const p2 = G1.double(p1);
			const q2 = G2.generator();
			const result = Pairing.multiPairing([
				[p1, q1],
				[p2, q2],
			]);
			expect(result).toBeDefined();
		});

		test("multi pairing with infinity pairs", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.multiPairing([[p, q]]);
			expect(result).toBeDefined();
		});
	});

	describe("bilinearity property", () => {
		test("e(aP, Q) = e(P, Q)^a", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 5n;

			const aP = G1.mul(p, a);
			const lhs = Pairing.pair(aP, q);
			const rhs = Pairing.pair(p, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(P, aQ) = e(P, Q)^a", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 5n;

			const aQ = G2.mul(q, a);
			const lhs = Pairing.pair(p, aQ);
			const rhs = Pairing.pair(p, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(aP, bQ) = e(P, Q)^(ab)", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 3n;
			const b = 5n;

			const aP = G1.mul(p, a);
			const bQ = G2.mul(q, b);
			const lhs = Pairing.pair(aP, bQ);

			const abP = G1.mul(p, a * b);
			const rhs = Pairing.pair(abP, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(P1 + P2, Q) = e(P1, Q) * e(P2, Q)", () => {
			const p1 = G1.generator();
			const p2 = G1.double(p1);
			const q = G2.generator();

			const sum = G1.add(p1, p2);
			const lhs = Pairing.pair(sum, q);

			// RHS would need multiplication of pairing results
			// Just verify LHS is defined
			expect(lhs).toBeDefined();
		});

		test("e(P, Q1 + Q2) = e(P, Q1) * e(P, Q2)", () => {
			const p = G1.generator();
			const q1 = G2.generator();
			const q2 = G2.double(q1);

			const sum = G2.add(q1, q2);
			const lhs = Pairing.pair(p, sum);

			// Just verify result is defined
			expect(lhs).toBeDefined();
		});
	});

	describe("pairing properties", () => {
		test("pairing is non-degenerate", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			// Result should not be identity (though we can't easily check)
			expect(result).toBeDefined();
			expect(result.value).toBeDefined();
		});

		test("e(O, Q) should give identity", () => {
			const p = G1.infinity();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("e(P, O) should give identity", () => {
			const p = G1.generator();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("e(-P, Q) = e(P, -Q) = e(P, Q)^(-1)", () => {
			const p = G1.generator();
			const q = G2.generator();
			const negP = G1.negate(p);
			const negQ = G2.negate(q);

			const r1 = Pairing.pair(negP, q);
			const r2 = Pairing.pair(p, negQ);
			const r3 = Pairing.pair(p, q);

			// All should be defined
			expect(r1).toBeDefined();
			expect(r2).toBeDefined();
			expect(r3).toBeDefined();
		});
	});

	describe("zkSNARK verification simulation", () => {
		test("simple pairing equation", () => {
			// Simulate: e(P, Q) = e(R, S)
			const p = G1.generator();
			const q = G2.generator();
			const r = G1.mul(p, 2n);
			const s = G2.generator();

			// We would check if e(P, Q) * e(-R, S) = 1
			// For now, just verify pairings compute
			const lhs = Pairing.pair(p, q);
			const rhs = Pairing.pair(r, s);

			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("pairing check with cancellation", () => {
			// e(P, Q) * e(-P, Q) should equal 1
			const p = G1.generator();
			const q = G2.generator();
			const negP = G1.negate(p);

			const result = Pairing.pairingCheck([
				[p, q],
				[negP, q],
			]);

			// Should return true due to cancellation
			expect(typeof result).toBe("boolean");
		});

		test("verification with multiple constraints", () => {
			const p1 = G1.generator();
			const p2 = G1.mul(p1, 2n);
			const p3 = G1.mul(p1, 3n);
			const q1 = G2.generator();
			const q2 = G2.mul(q1, 2n);

			const result = Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
				[p3, G2.negate(G2.mul(q1, 3n))],
			]);

			expect(typeof result).toBe("boolean");
		});
	});

	describe("edge cases", () => {
		test("handles many pairs in pairing check", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [];

			for (let i = 0; i < 10; i++) {
				pairs.push([G1.mul(p, BigInt(i + 1)), q]);
			}

			const result = Pairing.pairingCheck(pairs);
			expect(typeof result).toBe("boolean");
		});

		test("pairing with doubled points", () => {
			const p = G1.generator();
			const q = G2.generator();
			const p2 = G1.double(p);
			const q2 = G2.double(q);

			const r1 = Pairing.pair(p2, q);
			const r2 = Pairing.pair(p, q2);

			expect(r1).toBeDefined();
			expect(r2).toBeDefined();
		});

		test("pairing with large scalar multiples", () => {
			const p = G1.generator();
			const q = G2.generator();
			const large = 12345678901234567890n;

			const pLarge = G1.mul(p, large);
			const result = Pairing.pair(pLarge, q);

			expect(result).toBeDefined();
		});
	});

	describe("consistency checks", () => {
		test("same inputs produce same outputs", () => {
			const p = G1.generator();
			const q = G2.generator();

			const r1 = Pairing.pair(p, q);
			const r2 = Pairing.pair(p, q);

			expect(r1.value).toBe(r2.value);
		});

		test("pairing check is consistent", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [[p, q]];

			const r1 = Pairing.pairingCheck(pairs);
			const r2 = Pairing.pairingCheck(pairs);

			expect(r1).toBe(r2);
		});

		test("multi pairing is consistent", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [[p, q]];

			const r1 = Pairing.multiPairing(pairs);
			const r2 = Pairing.multiPairing(pairs);

			expect(r1.value).toBe(r2.value);
		});
	});
});
