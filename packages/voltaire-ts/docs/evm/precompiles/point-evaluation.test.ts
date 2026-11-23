/**
 * Tests for point-evaluation.mdx documentation examples.
 */
import { Buffer } from "node:buffer";
import { beforeAll, describe, expect, it } from "vitest";
import * as KZG from "../../../src/crypto/KZG/index.js";
import {
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
	pointEvaluation,
} from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

const GAS_LIMIT = 60000n;
const SUCCESS_OUTPUT = Uint8Array.from(
	Buffer.from(
		"0000000000000000000000000000000000000000000000000000000000001000" +
			"73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001",
		"hex",
	),
);

function zeroBlobEvaluation(): Uint8Array {
	// The zero polynomial has zero evaluation and infinity commitment and proof.
	// The versioned hash is 0x01 followed by the last 31 bytes of SHA-256(commitment).
	const input = new Uint8Array(192);
	input.set(
		Buffer.from(
			"010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014",
			"hex",
		),
	);
	input[96] = 0xc0;
	input[144] = 0xc0;
	return input;
}

function expectHalt(result: PrecompileResult, gasLimit: bigint, error: string) {
	expect(result.success).toBe(false);
	expect(result.output).toHaveLength(0);
	expect(result.gasUsed).toBe(gasLimit);
	expect(result.error).toContain(error);
}

describe("point-evaluation.mdx documentation examples", () => {
	beforeAll(() => {
		KZG.loadTrustedSetup();
	}, 60000);

	it("should be available at address 0x0a", () => {
		expect(PrecompileAddress.POINT_EVALUATION).toBe(
			"0x000000000000000000000000000000000000000a",
		);
	});

	describe("Gas Cost section", () => {
		it("should charge 50000 gas for a valid proof", () => {
			const result = pointEvaluation(zeroBlobEvaluation(), GAS_LIMIT);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(50000n);
		});

		it("should fail with insufficient gas", () => {
			const result = pointEvaluation(zeroBlobEvaluation(), 49999n);
			expectHalt(result, 49999n, "Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require exactly 192 bytes", () => {
			const valid = zeroBlobEvaluation();
			for (const length of [0, 100, 191, 193, 256]) {
				const input = new Uint8Array(length);
				input.set(valid.subarray(0, length));
				expectHalt(
					pointEvaluation(input, GAS_LIMIT),
					GAS_LIMIT,
					"Invalid input length",
				);
			}
		});

		it("should accept a valid 192-byte input", () => {
			expect(pointEvaluation(zeroBlobEvaluation(), GAS_LIMIT).success).toBe(
				true,
			);
		});
	});

	describe("Output Format section", () => {
		it("should return the two 32-byte consensus constants on success", () => {
			const result = pointEvaluation(zeroBlobEvaluation(), GAS_LIMIT);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(SUCCESS_OUTPUT);
		});
	});

	describe("Error Conditions section", () => {
		it("should halt for an invalid proof with a matching versioned hash", () => {
			const input = zeroBlobEvaluation();
			input[95] = 1; // The zero polynomial cannot evaluate to one.
			expectHalt(
				pointEvaluation(input, GAS_LIMIT),
				GAS_LIMIT,
				"Invalid KZG proof",
			);
		});

		it("should halt for a versioned hash that does not match the commitment", () => {
			const input = zeroBlobEvaluation();
			input[31] = 0xff; // Keep the version byte and alter the digest.
			expectHalt(
				pointEvaluation(input, GAS_LIMIT),
				GAS_LIMIT,
				"Versioned hash does not match commitment",
			);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.POINT_EVALUATION", () => {
			const result = execute(
				PrecompileAddress.POINT_EVALUATION,
				zeroBlobEvaluation(),
				GAS_LIMIT,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(50000n);
			expect(result.output).toEqual(SUCCESS_OUTPUT);
		});

		it("should be available from CANCUN hardfork", () => {
			const result = execute(
				PrecompileAddress.POINT_EVALUATION,
				zeroBlobEvaluation(),
				GAS_LIMIT,
				Hardfork.SHANGHAI,
			);
			expect(result.success).toBe(false);
			expect(result.error).toContain("Unknown precompile");
		});

		it("should report hardfork availability via isPrecompile", () => {
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN),
			).toBe(true);
			expect(
				isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.SHANGHAI),
			).toBe(false);
		});
	});

	it("should require the EIP-4844 version byte 0x01", () => {
		const input = zeroBlobEvaluation();
		input[0] = 0x02;
		expectHalt(
			pointEvaluation(input, GAS_LIMIT),
			GAS_LIMIT,
			"Versioned hash does not match commitment",
		);
	});

	it("should encode 4096 field elements per blob in the first output word", () => {
		const result = pointEvaluation(zeroBlobEvaluation(), GAS_LIMIT);
		expect(result.success).toBe(true);
		const fieldElementsPerBlob = new Uint8Array(32);
		fieldElementsPerBlob[30] = 0x10;
		expect(result.output.subarray(0, 32)).toEqual(fieldElementsPerBlob);
	});

	it("should accept the exact 50000 gas budget", () => {
		const result = pointEvaluation(zeroBlobEvaluation(), 50000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(50000n);
	});
});
