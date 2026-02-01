import { describe, expect, test } from "vitest";
import { Bls12381, Fp, Fp2, Fr, G1, G2, Pairing } from "./Bls12381.js";
import type { Fp2Type } from "./Fp2Type.js";
import type { G1PointType } from "./G1PointType.js";
import type { G2PointType } from "./G2PointType.js";

describe("BLS12-381 module exports", () => {
	test("Bls12381 object has all submodules", () => {
		expect(Bls12381).toBeDefined();
		expect(Bls12381.G1).toBeDefined();
		expect(Bls12381.G2).toBeDefined();
		expect(Bls12381.Fp).toBeDefined();
		expect(Bls12381.Fp2).toBeDefined();
		expect(Bls12381.Fr).toBeDefined();
		expect(Bls12381.Pairing).toBeDefined();
	});

	test("submodule exports are available", () => {
		expect(G1).toBeDefined();
		expect(G2).toBeDefined();
		expect(Fp).toBeDefined();
		expect(Fp2).toBeDefined();
		expect(Fr).toBeDefined();
		expect(Pairing).toBeDefined();
	});

	test("G1 module has expected functions", () => {
		expect(G1.generator).toBeDefined();
		expect(G1.infinity).toBeDefined();
		expect(G1.add).toBeDefined();
		expect(G1.double).toBeDefined();
		expect(G1.mul).toBeDefined();
		expect(G1.negate).toBeDefined();
		expect(G1.isZero).toBeDefined();
		expect(G1.isOnCurve).toBeDefined();
		expect(G1.equal).toBeDefined();
		expect(G1.toAffine).toBeDefined();
		expect(G1.fromAffine).toBeDefined();
	});

	test("G2 module has expected functions", () => {
		expect(G2.generator).toBeDefined();
		expect(G2.infinity).toBeDefined();
		expect(G2.add).toBeDefined();
		expect(G2.double).toBeDefined();
		expect(G2.mul).toBeDefined();
		expect(G2.negate).toBeDefined();
		expect(G2.isZero).toBeDefined();
		expect(G2.isOnCurve).toBeDefined();
		expect(G2.equal).toBeDefined();
		expect(G2.toAffine).toBeDefined();
		expect(G2.fromAffine).toBeDefined();
	});

	test("Fp module has expected functions", () => {
		expect(Fp.add).toBeDefined();
		expect(Fp.sub).toBeDefined();
		expect(Fp.mul).toBeDefined();
		expect(Fp.neg).toBeDefined();
		expect(Fp.inv).toBeDefined();
		expect(Fp.pow).toBeDefined();
		expect(Fp.mod).toBeDefined();
		expect(Fp.sqrt).toBeDefined();
	});

	test("Fp2 module has expected functions", () => {
		expect(Fp2.add).toBeDefined();
		expect(Fp2.sub).toBeDefined();
		expect(Fp2.mul).toBeDefined();
		expect(Fp2.neg).toBeDefined();
		expect(Fp2.inv).toBeDefined();
		expect(Fp2.square).toBeDefined();
		expect(Fp2.create).toBeDefined();
		expect(Fp2.isZero).toBeDefined();
		expect(Fp2.equal).toBeDefined();
		expect(Fp2.conjugate).toBeDefined();
	});

	test("Fr module has expected functions", () => {
		expect(Fr.mod).toBeDefined();
		expect(Fr.isValid).toBeDefined();
	});

	test("Pairing module has expected functions", () => {
		expect(Pairing.pairingCheck).toBeDefined();
		expect(Pairing.pair).toBeDefined();
		expect(Pairing.verifySignature).toBeDefined();
		expect(Pairing.verifyAggregateSignature).toBeDefined();
		expect(Pairing.batchVerify).toBeDefined();
	});

	test("type exports compile correctly", () => {
		const g1Point: G1PointType = G1.generator();
		const g2Point: G2PointType = G2.generator();
		const fp2Element: Fp2Type = { c0: 1n, c1: 2n };

		expect(g1Point).toBeDefined();
		expect(g2Point).toBeDefined();
		expect(fp2Element).toBeDefined();
	});

	describe("integration tests", () => {
		test("G1 scalar multiplication cycle", () => {
			const gen = Bls12381.G1.generator();
			const order =
				0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
			const result = Bls12381.G1.mul(gen, order);
			expect(Bls12381.G1.isZero(result)).toBe(true);
		});

		test("G2 scalar multiplication cycle", () => {
			const gen = Bls12381.G2.generator();
			const order =
				0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
			const result = Bls12381.G2.mul(gen, order);
			expect(Bls12381.G2.isZero(result)).toBe(true);
		});

		test("G1 add and negate cancel", () => {
			const p = Bls12381.G1.mul(Bls12381.G1.generator(), 42n);
			const negP = Bls12381.G1.negate(p);
			const sum = Bls12381.G1.add(p, negP);
			expect(Bls12381.G1.isZero(sum)).toBe(true);
		});

		test("G2 add and negate cancel", () => {
			const p = Bls12381.G2.mul(Bls12381.G2.generator(), 42n);
			const negP = Bls12381.G2.negate(p);
			const sum = Bls12381.G2.add(p, negP);
			expect(Bls12381.G2.isZero(sum)).toBe(true);
		});

		test("Fp field arithmetic consistency", () => {
			const a = 12345n;
			const b = 67890n;
			const sum = Bls12381.Fp.add(a, b);
			const diff = Bls12381.Fp.sub(sum, b);
			expect(diff).toBe(a);
		});

		test("Fp2 field arithmetic consistency", () => {
			const a = { c0: 12345n, c1: 67890n };
			const b = { c0: 11111n, c1: 22222n };
			const sum = Bls12381.Fp2.add(a, b);
			const diff = Bls12381.Fp2.sub(sum, b);
			expect(Bls12381.Fp2.equal(diff, a)).toBe(true);
		});
	});
});
