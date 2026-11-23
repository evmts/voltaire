/**
 * Tests for index.mdx (precompiles overview) documentation examples
 * Validates that all precompiles are available and have correct addresses
 */
import { describe, expect, it } from "vitest";
import {
	blake2f,
	bls12G1Add,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	bn254Add,
	bn254Mul,
	bn254Pairing,
	ecrecover,
	execute,
	identity,
	isPrecompile,
	modexp,
	PrecompileAddress,
	pointEvaluation,
	ripemd160,
	sha256,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

describe("index.mdx (Precompiles Overview) documentation", () => {
	describe("Precompile Addresses section", () => {
		it("should have correct addresses for Frontier precompiles", () => {
			// Doc states addresses for 0x01-0x04
			// API: PrecompileAddress values are padded hex strings
			expect(PrecompileAddress.ECRECOVER.endsWith("01")).toBe(true);
			expect(PrecompileAddress.SHA256.endsWith("02")).toBe(true);
			expect(PrecompileAddress.RIPEMD160.endsWith("03")).toBe(true);
			expect(PrecompileAddress.IDENTITY.endsWith("04")).toBe(true);
		});

		it("should have correct addresses for Byzantium precompiles", () => {
			// Doc states addresses for 0x05-0x08
			expect(PrecompileAddress.MODEXP.endsWith("05")).toBe(true);
			expect(PrecompileAddress.BN254_ADD.endsWith("06")).toBe(true);
			expect(PrecompileAddress.BN254_MUL.endsWith("07")).toBe(true);
			expect(PrecompileAddress.BN254_PAIRING.endsWith("08")).toBe(true);
		});

		it("should have correct address for Istanbul precompile", () => {
			// Doc states address 0x09
			expect(PrecompileAddress.BLAKE2F.endsWith("09")).toBe(true);
		});

		it("should have correct address for Cancun precompile", () => {
			// Doc states address 0x0a
			expect(PrecompileAddress.POINT_EVALUATION.endsWith("0a")).toBe(true);
		});

		it("should have correct addresses for Prague precompiles", () => {
			// Doc states addresses for 0x0b–0x11
			expect(PrecompileAddress.BLS12_G1_ADD.endsWith("0b")).toBe(true);
			expect(PrecompileAddress.BLS12_G1_MSM.endsWith("0c")).toBe(true);
			expect(PrecompileAddress.BLS12_G2_ADD.endsWith("0d")).toBe(true);
			expect(PrecompileAddress.BLS12_G2_MSM.endsWith("0e")).toBe(true);
			expect(PrecompileAddress.BLS12_PAIRING.endsWith("0f")).toBe(true);
			expect(PrecompileAddress.BLS12_MAP_FP_TO_G1.endsWith("10")).toBe(true);
			expect(PrecompileAddress.BLS12_MAP_FP2_TO_G2.endsWith("11")).toBe(true);
		});
	});

	describe("Hardfork Availability section", () => {
		it("should have all Frontier precompiles available", () => {
			// Doc states: Frontier introduced ecrecover, sha256, ripemd160, identity
			const inputs = {
				ecrecover: new Uint8Array(128),
				sha256: new Uint8Array(0),
				ripemd160: new Uint8Array(0),
				identity: new Uint8Array(0),
			};

			expect(ecrecover(inputs.ecrecover, 10000n).gasUsed).toBeGreaterThan(0n);
			expect(sha256(inputs.sha256, 10000n).gasUsed).toBeGreaterThan(0n);
			expect(ripemd160(inputs.ripemd160, 10000n).gasUsed).toBeGreaterThan(0n);
			expect(identity(inputs.identity, 10000n).gasUsed).toBeGreaterThan(0n);
		});

		it("should have all Byzantium precompiles available", () => {
			// Doc states: Byzantium introduced modexp, bn254-add, bn254-mul, bn254-pairing
			const modexpInput = new Uint8Array(96);
			const bn254Input128 = new Uint8Array(128);
			const bn254Input96 = new Uint8Array(96);
			const bn254PairingInput = new Uint8Array(0);

			expect(
				execute(
					PrecompileAddress.MODEXP,
					modexpInput,
					10000n,
					Hardfork.BYZANTIUM,
				).success,
			).toBe(true);
			expect(bn254Add(bn254Input128, 10000n, Hardfork.BYZANTIUM).gasUsed).toBe(
				500n,
			);
			expect(bn254Mul(bn254Input96, 50000n, Hardfork.BYZANTIUM).gasUsed).toBe(
				40000n,
			);
			expect(
				bn254Pairing(bn254PairingInput, 110000n, Hardfork.BYZANTIUM).gasUsed,
			).toBe(100000n);
		});

		it("should have Istanbul precompile available", () => {
			// Doc states: Istanbul introduced blake2f
			const input = new Uint8Array(213);
			input[212] = 1; // Valid final flag
			expect(blake2f(input, 100n).gasUsed).toBe(0n); // 0 rounds = 0 gas
		});

		it("should have Cancun precompile available", () => {
			// Doc states: Cancun introduced point-evaluation
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN),
			).toBe(true);
			const result = execute(
				PrecompileAddress.POINT_EVALUATION,
				new Uint8Array(192),
				60000n,
				Hardfork.CANCUN,
			);
			expect(result).toEqual({
				success: false,
				gasUsed: 60000n,
				output: new Uint8Array(),
				error: "Versioned hash does not match commitment",
			});
		});

		it("should have Prague precompiles available", () => {
			// Doc states: Prague introduces BLS12-381 precompiles
			expect(bls12G1Add(new Uint8Array(256), 1000n).gasUsed).toBe(375n);
			expect(bls12G1Msm(new Uint8Array(160), 20000n).gasUsed).toBe(12000n);
			expect(bls12G2Add(new Uint8Array(512), 2000n).gasUsed).toBe(600n);
			expect(bls12G2Msm(new Uint8Array(288), 50000n).gasUsed).toBe(22500n);
			expect(bls12Pairing(new Uint8Array(384), 100000n).gasUsed).toBe(70300n);
			expect(bls12MapFpToG1(new Uint8Array(64), 10000n).gasUsed).toBe(5500n);
			expect(bls12MapFp2ToG2(new Uint8Array(128), 100000n).gasUsed).toBe(
				23800n,
			);
		});
	});

	describe("Execute Function section", () => {
		it("should execute precompiles via hardfork-aware execute function", () => {
			// Doc example shows using execute with hardfork parameter
			const result = execute(
				PrecompileAddress.SHA256,
				new Uint8Array(0),
				1000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should check hardfork availability via isPrecompile", async () => {
			const { isPrecompile } = await import(
				"../../../src/evm/precompiles/precompiles.js"
			);
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.SHANGHAI),
			).toBe(false);
		});
	});

	describe("Gas Costs Summary section", () => {
		it("should have documented fixed gas costs", () => {
			// Verify fixed gas costs match documentation
			expect(ecrecover(new Uint8Array(128), 10000n).gasUsed).toBe(3000n);
			expect(bn254Add(new Uint8Array(128), 10000n).gasUsed).toBe(150n);
			expect(bn254Mul(new Uint8Array(96), 10000n).gasUsed).toBe(6000n);
			expect(bls12G1Add(new Uint8Array(256), 10000n).gasUsed).toBe(375n);
			expect(bls12G2Add(new Uint8Array(512), 10000n).gasUsed).toBe(600n);
		});

		it("should have documented dynamic gas costs", () => {
			// Verify dynamic gas costs follow formulas
			// SHA256: 60 + 12 * ceil(len/32)
			expect(sha256(new Uint8Array(0), 1000n).gasUsed).toBe(60n);
			expect(sha256(new Uint8Array(32), 1000n).gasUsed).toBe(72n);

			// RIPEMD160: 600 + 120 * ceil(len/32)
			expect(ripemd160(new Uint8Array(0), 1000n).gasUsed).toBe(600n);
			expect(ripemd160(new Uint8Array(32), 1000n).gasUsed).toBe(720n);

			// Identity: 15 + 3 * ceil(len/32)
			expect(identity(new Uint8Array(0), 1000n).gasUsed).toBe(15n);
			expect(identity(new Uint8Array(32), 1000n).gasUsed).toBe(18n);
		});
	});

	describe("All Precompiles Export section", () => {
		it("should export all precompile functions", () => {
			// Verify all precompile functions are exported
			expect(typeof ecrecover).toBe("function");
			expect(typeof sha256).toBe("function");
			expect(typeof ripemd160).toBe("function");
			expect(typeof identity).toBe("function");
			expect(typeof modexp).toBe("function");
			expect(typeof bn254Add).toBe("function");
			expect(typeof bn254Mul).toBe("function");
			expect(typeof bn254Pairing).toBe("function");
			expect(typeof blake2f).toBe("function");
			expect(typeof pointEvaluation).toBe("function");
			expect(typeof bls12G1Add).toBe("function");
			expect(typeof bls12G1Msm).toBe("function");
			expect(typeof bls12G2Add).toBe("function");
			expect(typeof bls12G2Msm).toBe("function");
			expect(typeof bls12Pairing).toBe("function");
			expect(typeof bls12MapFpToG1).toBe("function");
			expect(typeof bls12MapFp2ToG2).toBe("function");
		});
	});
});
