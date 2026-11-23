import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * POINT_EVALUATION (0x0a) consensus rules, with the KZG backend replaced by a
 * stub so the versioned-hash check and the halt semantics run without the
 * native KZG library. `precompiles.kzg.test.ts` covers real proofs.
 */
const kzg = vi.hoisted(() => ({
	isInitialized: vi.fn(() => true),
	loadTrustedSetup: vi.fn(),
	verifyKzgProof: vi.fn(
		(
			_commitment: Uint8Array,
			_z: Uint8Array,
			_y: Uint8Array,
			_proof: Uint8Array,
		): boolean => true,
	),
}));

vi.mock("../../crypto/KZG/index.js", () => kzg);

import { Keccak256 } from "../../crypto/Keccak256/index.js";
import { SHA256 } from "../../crypto/SHA256/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
	pointEvaluation,
} from "./precompiles.js";

const fromHex = (hex: string) => Uint8Array.from(Buffer.from(hex, "hex"));
const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

/** Compressed G1 point at infinity: the commitment of the all-zero blob. */
const INFINITY_COMMITMENT = fromHex(`c0${"00".repeat(47)}`);
/** Its versioned hash, as published for the empty blob. */
const INFINITY_VERSIONED_HASH = fromHex(
	"010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014",
);
/** FIELD_ELEMENTS_PER_BLOB (4096) || BLS_MODULUS, two big-endian words. */
const SUCCESS_OUTPUT =
	"0000000000000000000000000000000000000000000000000000000000001000" +
	"73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001";

function versionedHash(commitment: Uint8Array): Uint8Array {
	const hash = new Uint8Array(SHA256.hash(commitment));
	hash[0] = 0x01;
	return hash;
}

function buildInput(
	commitment: Uint8Array,
	hash: Uint8Array = versionedHash(commitment),
): Uint8Array {
	const input = new Uint8Array(192);
	input.set(hash, 0);
	input.set(new Uint8Array(32).fill(0x02), 32); // z
	input.set(new Uint8Array(32).fill(0x03), 64); // y
	input.set(commitment, 96);
	input.set(new Uint8Array(48).fill(0x04), 144); // proof
	return input;
}

function expectHalt(result: PrecompileResult, gasLimit: bigint): void {
	expect(result.success).toBe(false);
	expect(result.error).toBeDefined();
	expect(result.gasUsed).toBe(gasLimit);
	expect(result.output).toEqual(new Uint8Array(0));
}

const commitment = new Uint8Array(48).fill(0xab);

describe("Precompile: POINT_EVALUATION (0x0a) consensus rules", () => {
	beforeEach(() => {
		kzg.isInitialized.mockReset().mockReturnValue(true);
		kzg.loadTrustedSetup.mockReset();
		kzg.verifyKzgProof.mockReset().mockReturnValue(true);
	});

	describe("valid proof", () => {
		it("returns FIELD_ELEMENTS_PER_BLOB || BLS_MODULUS and charges 50000", () => {
			const result = pointEvaluation(buildInput(commitment), 50000n);
			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
			expect(result.gasUsed).toBe(50000n);
			expect(toHex(result.output)).toBe(SUCCESS_OUTPUT);
		});

		it("passes commitment, z, y and proof to the verifier in that order", () => {
			pointEvaluation(buildInput(commitment), 50000n);
			expect(kzg.verifyKzgProof).toHaveBeenCalledTimes(1);
			const [c, z, y, proof] = kzg.verifyKzgProof.mock.calls[0] ?? [];
			expect(c).toEqual(commitment);
			expect(z).toEqual(new Uint8Array(32).fill(0x02));
			expect(y).toEqual(new Uint8Array(32).fill(0x03));
			expect(proof).toEqual(new Uint8Array(48).fill(0x04));
		});

		it("accepts the published versioned hash of the infinity commitment", () => {
			const input = buildInput(INFINITY_COMMITMENT, INFINITY_VERSIONED_HASH);
			const result = pointEvaluation(input, 50000n);
			expect(result.success).toBe(true);
			expect(toHex(result.output)).toBe(SUCCESS_OUTPUT);
		});

		it("loads the trusted setup when it is not initialized", () => {
			kzg.isInitialized.mockReturnValue(false);
			const result = pointEvaluation(buildInput(commitment), 50000n);
			expect(kzg.loadTrustedSetup).toHaveBeenCalledTimes(1);
			expect(result.success).toBe(true);
		});
	});

	describe("versioned hash", () => {
		it("halts when any byte of the versioned hash differs", () => {
			for (let i = 0; i < 32; i++) {
				const input = buildInput(commitment);
				input[i] = (input[i] ?? 0) ^ 0x01;
				expectHalt(pointEvaluation(input, 60000n), 60000n);
			}
			expect(kzg.verifyKzgProof).not.toHaveBeenCalled();
		});

		it("halts for the raw sha256 digest without the 0x01 version byte", () => {
			// Pick a commitment whose digest does not already start with 0x01.
			let c = commitment;
			for (let fill = 0; SHA256.hash(c)[0] === 0x01; fill++) {
				c = new Uint8Array(48).fill(fill);
			}
			const raw = new Uint8Array(SHA256.hash(c));
			expectHalt(pointEvaluation(buildInput(c, raw), 60000n), 60000n);
		});

		it("halts for other version bytes", () => {
			for (const version of [0x00, 0x02, 0xff]) {
				const hash = versionedHash(commitment);
				hash[0] = version;
				expectHalt(
					pointEvaluation(buildInput(commitment, hash), 60000n),
					60000n,
				);
			}
		});

		it("halts for a keccak256-derived hash", () => {
			const hash = new Uint8Array(Keccak256.hash(commitment));
			hash[0] = 0x01;
			expectHalt(pointEvaluation(buildInput(commitment, hash), 60000n), 60000n);

			const prefixed = new Uint8Array(49);
			prefixed[0] = 0x01;
			prefixed.set(commitment, 1);
			const legacy = new Uint8Array(Keccak256.hash(prefixed));
			legacy[0] = 0x01;
			expectHalt(
				pointEvaluation(buildInput(commitment, legacy), 60000n),
				60000n,
			);
		});

		it("halts for the hash of a different commitment", () => {
			const other = new Uint8Array(48).fill(0xcd);
			expectHalt(
				pointEvaluation(buildInput(commitment, versionedHash(other)), 60000n),
				60000n,
			);
			expect(kzg.verifyKzgProof).not.toHaveBeenCalled();
		});

		it("halts for an all-zero input", () => {
			expectHalt(pointEvaluation(new Uint8Array(192), 60000n), 60000n);
		});
	});

	describe("invalid proof", () => {
		it("halts instead of returning 64 zero bytes when verification is false", () => {
			kzg.verifyKzgProof.mockReturnValue(false);
			const result = pointEvaluation(buildInput(commitment), 60000n);
			expect(kzg.verifyKzgProof).toHaveBeenCalledTimes(1);
			expectHalt(result, 60000n);
			expect(result.error).toBe("Invalid KZG proof");
		});

		it("halts when the verifier rejects the encoding", () => {
			kzg.verifyKzgProof.mockImplementation(() => {
				throw new Error("bad encoding");
			});
			const result = pointEvaluation(buildInput(commitment), 60000n);
			expectHalt(result, 60000n);
			expect(result.error).toContain("bad encoding");
		});

		it("halts when the trusted setup cannot be loaded", () => {
			kzg.isInitialized.mockReturnValue(false);
			kzg.loadTrustedSetup.mockImplementation(() => {
				throw new Error("no trusted setup");
			});
			expectHalt(pointEvaluation(buildInput(commitment), 60000n), 60000n);
		});
	});

	describe("input length and gas", () => {
		it("halts for any length other than 192", () => {
			for (const length of [0, 1, 191, 193, 384]) {
				const input = new Uint8Array(length);
				input.set(buildInput(commitment).subarray(0, Math.min(192, length)));
				expectHalt(pointEvaluation(input, 60000n), 60000n);
			}
			expect(kzg.verifyKzgProof).not.toHaveBeenCalled();
		});

		it("halts with all forwarded gas when out of gas", () => {
			for (const gasLimit of [0n, 1n, 49999n]) {
				const result = pointEvaluation(buildInput(commitment), gasLimit);
				expect(result.error).toBe("Out of gas");
				expectHalt(result, gasLimit);
			}
			expect(kzg.verifyKzgProof).not.toHaveBeenCalled();
		});

		it("succeeds with exactly 50000 gas", () => {
			const result = pointEvaluation(buildInput(commitment), 50000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(50000n);
		});
	});

	describe("execute", () => {
		it("runs from Cancun", () => {
			for (const fork of [Hardfork.CANCUN, Hardfork.PRAGUE, Hardfork.OSAKA]) {
				expect(isPrecompile(PrecompileAddress.POINT_EVALUATION, fork)).toBe(
					true,
				);
				const result = execute(
					PrecompileAddress.POINT_EVALUATION,
					buildInput(commitment),
					60000n,
					fork,
				);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(50000n);
				expect(toHex(result.output)).toBe(SUCCESS_OUTPUT);
			}
		});

		it("halts through execute on a mismatched versioned hash or invalid proof", () => {
			const badHash = buildInput(commitment);
			badHash[31] = (badHash[31] ?? 0) ^ 0xff;
			expectHalt(
				execute(
					PrecompileAddress.POINT_EVALUATION,
					badHash,
					60000n,
					Hardfork.CANCUN,
				),
				60000n,
			);

			kzg.verifyKzgProof.mockReturnValue(false);
			expectHalt(
				execute(
					PrecompileAddress.POINT_EVALUATION,
					buildInput(commitment),
					60000n,
					Hardfork.CANCUN,
				),
				60000n,
			);
		});

		it("is not a precompile before Cancun", () => {
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.SHANGHAI),
			).toBe(false);
			const result = execute(
				PrecompileAddress.POINT_EVALUATION,
				buildInput(commitment),
				60000n,
				Hardfork.SHANGHAI,
			);
			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(0n);
			expect(result.error).toContain("Unknown precompile");
			expect(kzg.verifyKzgProof).not.toHaveBeenCalled();
		});
	});
});
