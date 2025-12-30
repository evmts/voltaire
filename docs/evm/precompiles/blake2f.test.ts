/**
 * Tests for blake2f.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, blake2f } from "../../../src/evm/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

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
 * Helper: Build Blake2f input (213 bytes)
 */
function buildBlake2fInput(
	rounds: number,
	h: Uint8Array,
	m: Uint8Array,
	t0: bigint,
	t1: bigint,
	f: number,
): Uint8Array {
	const input = new Uint8Array(213);

	// rounds (4 bytes, big-endian)
	input[0] = (rounds >> 24) & 0xff;
	input[1] = (rounds >> 16) & 0xff;
	input[2] = (rounds >> 8) & 0xff;
	input[3] = rounds & 0xff;

	// h (64 bytes)
	input.set(h.slice(0, 64), 4);

	// m (128 bytes)
	input.set(m.slice(0, 128), 68);

	// t (16 bytes: two little-endian u64)
	for (let i = 0; i < 8; i++) {
		input[196 + i] = Number((t0 >> BigInt(i * 8)) & 0xffn);
		input[204 + i] = Number((t1 >> BigInt(i * 8)) & 0xffn);
	}

	// f (1 byte)
	input[212] = f;

	return input;
}

describe("blake2f.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should implement Blake2b compression function F", () => {
			// Doc states: implements the Blake2b compression function F
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 0n, 0n, 1);

			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});

	describe("Gas Cost section", () => {
		it("should use rounds as gas cost (1 gas per round)", () => {
			// Doc states: Formula: rounds (1 gas per round)
			const testCases = [
				{ rounds: 0, expectedGas: 0n },
				{ rounds: 1, expectedGas: 1n },
				{ rounds: 12, expectedGas: 12n },
				{ rounds: 1000, expectedGas: 1000n },
			];

			for (const { rounds, expectedGas } of testCases) {
				const h = new Uint8Array(64);
				const m = new Uint8Array(128);
				const input = buildBlake2fInput(rounds, h, m, 0n, 0n, 1);

				const result = blake2f(input, 10000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(expectedGas);
			}
		});

		it("should fail with insufficient gas", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 0n, 0n, 1);

			const result = blake2f(input, 11n); // Need 12 for 12 rounds
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should require exactly 213 bytes", () => {
			// Doc states: Exactly 213 bytes required
			const shortInput = new Uint8Array(212);
			const longInput = new Uint8Array(214);

			const resultShort = blake2f(shortInput, 100n);
			const resultLong = blake2f(longInput, 100n);

			expect(resultShort.success).toBe(false);
			expect(resultShort.error).toBe("Invalid input length");
			expect(resultLong.success).toBe(false);
			expect(resultLong.error).toBe("Invalid input length");
		});

		it("should validate final flag is 0 or 1", () => {
			// Doc states: f (final block flag, 0x00 or 0x01)
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);

			// Valid final flags
			const input0 = buildBlake2fInput(12, h, m, 0n, 0n, 0);
			const input1 = buildBlake2fInput(12, h, m, 0n, 0n, 1);

			expect(blake2f(input0, 100n).success).toBe(true);
			expect(blake2f(input1, 100n).success).toBe(true);

			// Invalid final flag (2)
			const inputInvalid = buildBlake2fInput(12, h, m, 0n, 0n, 2);
			inputInvalid[212] = 2; // Force invalid flag

			const resultInvalid = blake2f(inputInvalid, 100n);
			expect(resultInvalid.success).toBe(false);
			expect(resultInvalid.error).toBe("Invalid final flag");
		});
	});

	describe("Output Format section", () => {
		it("should return 64 bytes (new state vector)", () => {
			// Doc states: Total output length: 64 bytes
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 128n, 0n, 1);

			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});

	describe("Test Vectors from documentation", () => {
		it("should handle 1 round (gas = 1)", () => {
			// Doc Vector 3: Variable rounds (1 round only), should cost 1 gas
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(1, h, m, 0n, 0n, 1);

			const result = blake2f(input, 10n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(1n);
		});

		it("should handle 10000 rounds", () => {
			// Doc Vector 4: Maximum rounds, rounds = 10000
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(10000, h, m, 0n, 0n, 1);

			const result = blake2f(input, 15000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(10000n);
		});

		it("should handle 0 rounds (gas = 0)", () => {
			// Doc states: 0 rounds: 0 gas
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(0, h, m, 0n, 0n, 1);

			const result = blake2f(input, 10n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(0n);
		});
	});

	describe("Error Conditions section", () => {
		it("should fail for input length != 213 bytes", () => {
			// Doc states: Input length != 213 bytes (exact length required)
			const wrongSizes = [0, 1, 100, 212, 214, 500];

			for (const size of wrongSizes) {
				const input = new Uint8Array(size);
				const result = blake2f(input, 1000n);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Invalid input length");
			}
		});

		it("should fail with invalid final flag (not 0x00 or 0x01)", () => {
			// Doc states: Invalid final flag (not 0x00 or 0x01)
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 0n, 0n, 0);
			input[212] = 0x02; // Invalid flag

			const result = blake2f(input, 100n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid final flag");
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.BLAKE2F", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 0n, 0n, 1);

			const result = execute(
				PrecompileAddress.BLAKE2F,
				input,
				100n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			expect(result.gasUsed).toBe(12n);
		});

		it("should be available from ISTANBUL hardfork", () => {
			// Doc states: Introduced: Istanbul (EIP-152)
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 0n, 0n, 1);

			const result = execute(
				PrecompileAddress.BLAKE2F,
				input,
				100n,
				Hardfork.ISTANBUL,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("Gas Cost Efficiency section", () => {
		it("should be extremely gas-efficient for Blake2b hashing", () => {
			// Doc states: 12 rounds = 12 gas, Processes 128 bytes per compression
			// ~0.09 gas/byte (cheaper than all other hash functions)
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const input = buildBlake2fInput(12, h, m, 128n, 0n, 1);

			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(12n);
			// 12 gas for 128 bytes = 0.09375 gas/byte
		});
	});
});
