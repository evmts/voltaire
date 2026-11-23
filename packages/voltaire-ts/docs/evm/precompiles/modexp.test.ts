/**
 * Tests for modexp.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import {
	execute,
	modexp,
	PrecompileAddress,
} from "../../../src/evm/precompiles/precompiles.js";
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
 * Helper: Build modexp input
 */
function buildModExpInput(
	base: bigint,
	baseLen: number,
	exp: bigint,
	expLen: number,
	mod: bigint,
	modLen: number,
): Uint8Array {
	// Header: 96 bytes (3 x 32-byte lengths)
	const header = new Uint8Array(96);
	const headerView = new DataView(header.buffer);
	for (const [index, length] of [baseLen, expLen, modLen].entries()) {
		headerView.setUint32(index * 32 + 28, length);
	}

	// Data: base || exp || mod
	const input = new Uint8Array(96 + baseLen + expLen + modLen);
	input.set(header, 0);

	// Write base (big-endian)
	for (let i = 0; i < baseLen; i++) {
		input[96 + baseLen - 1 - i] = Number((base >> BigInt(i * 8)) & 0xffn);
	}
	// Write exp (big-endian)
	for (let i = 0; i < expLen; i++) {
		input[96 + baseLen + expLen - 1 - i] = Number(
			(exp >> BigInt(i * 8)) & 0xffn,
		);
	}
	// Write mod (big-endian)
	for (let i = 0; i < modLen; i++) {
		input[96 + baseLen + expLen + modLen - 1 - i] = Number(
			(mod >> BigInt(i * 8)) & 0xffn,
		);
	}

	return input;
}

describe("modexp.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should compute modular exponentiation: (base^exponent) mod modulus", () => {
			// Doc states: computes modular exponentiation: (base^exponent) mod modulus
			// 2^3 mod 5 = 8 mod 5 = 3
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(1);
			expect(result.output[0]).toBe(3);
		});
	});

	describe("Gas Cost section", () => {
		it("should charge 200 gas in Berlin and 500 gas in Osaka", () => {
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const berlin = modexp(input, 200n, Hardfork.BERLIN);
			const osaka = modexp(input, 500n, Hardfork.OSAKA);
			expect(berlin.success).toBe(true);
			expect(berlin.gasUsed).toBe(200n);
			expect(osaka.success).toBe(true);
			expect(osaka.gasUsed).toBe(500n);
		});

		it("should fail with insufficient gas", () => {
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const result = modexp(input, 499n, Hardfork.OSAKA);
			expect(result).toEqual({
				success: false,
				output: new Uint8Array(),
				gasUsed: 499n,
				error: "Out of gas",
			});
		});

		it("should price a long exponent and a 33-byte modulus under EIP-7883", () => {
			// Complexity is 2 * ceil(33 / 8)^2 = 50.
			// The leading 32 exponent bytes are zero, so the iteration count is 16.
			const input = buildModExpInput(2n, 1, 3n, 33, 5n, 33);
			const result = modexp(input, 1000n, Hardfork.OSAKA);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(800n);
			expect(result.output).toHaveLength(33);
			expect(result.output[32]).toBe(3);
		});
	});

	describe("Input Format section", () => {
		it("should right-pad a short length header", () => {
			const shortInput = new Uint8Array(95);
			const result = modexp(shortInput, 10000n, Hardfork.OSAKA);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(500n);
			expect(result.output).toHaveLength(0);
		});

		it("should accept 96 bytes header with zero lengths", () => {
			const input = new Uint8Array(96);
			const result = modexp(input, 10000n);
			// With zero modLen, should return empty output
			expect(result.success).toBe(true);
		});

		it("should cap each declared operand at 1024 bytes in Osaka", () => {
			const gasLimit = 1_000_000n;
			for (const operand of [0, 1, 2]) {
				const lengths: [number, number, number] = [1, 1, 1];
				lengths[operand] = 1024;
				const withinLimit = buildModExpInput(
					2n,
					lengths[0],
					3n,
					lengths[1],
					5n,
					lengths[2],
				);
				const accepted = modexp(withinLimit, gasLimit, Hardfork.OSAKA);
				expect(accepted.success).toBe(true);
				expect(accepted.output).toHaveLength(lengths[2]);
				expect(accepted.output[lengths[2] - 1]).toBe(3);

				lengths[operand] = 1025;
				const oversized = buildModExpInput(
					2n,
					lengths[0],
					3n,
					lengths[1],
					5n,
					lengths[2],
				);
				expect(modexp(oversized, gasLimit, Hardfork.PRAGUE).success).toBe(true);
				const rejected = modexp(oversized, gasLimit, Hardfork.OSAKA);
				expect(rejected.success).toBe(false);
				expect(rejected.error).toContain("Osaka limit");
				expect(rejected.gasUsed).toBe(gasLimit);
				expect(rejected.output).toHaveLength(0);
			}
		});
	});

	describe("Output Format section", () => {
		it("should return output with length equal to modulus_length", () => {
			// Doc states: Output length equals modulus_length specified in input
			const testCases = [
				{ modLen: 1, expected: 1 },
				{ modLen: 32, expected: 32 },
			];

			for (const { modLen, expected } of testCases) {
				const input = buildModExpInput(2n, 1, 3n, 1, 5n, modLen);
				const result = modexp(input, 100000n);
				expect(result.success).toBe(true);
				expect(result.output.length).toBe(expected);
			}
		});

		it("should return empty output if modulus_length = 0", () => {
			// Doc states: Returns empty output if modulus_length = 0
			const input = buildModExpInput(2n, 1, 3n, 1, 0n, 0);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(0);
		});
	});

	describe("Test Vectors from documentation", () => {
		it("should compute 2^3 mod 5 = 3", () => {
			// Doc Test 1: 2^3 mod 5 = 3
			const input = hexToBytes(
				"0x" +
					"0000000000000000000000000000000000000000000000000000000000000001" + // base_len = 1
					"0000000000000000000000000000000000000000000000000000000000000001" + // exp_len = 1
					"0000000000000000000000000000000000000000000000000000000000000001" + // mod_len = 1
					"02" + // base = 2
					"03" + // exp = 3
					"05", // mod = 5
			);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(3);
		});

		it("should compute 3^1 mod 5 = 3", () => {
			// Doc Test 2: 3^1 mod 5 = 3
			const input = hexToBytes(
				"0x" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"03" + // base = 3
					"01" + // exp = 1
					"05", // mod = 5
			);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(3);
		});

		it("should compute 5^0 mod 7 = 1 (zero exponent)", () => {
			// Doc Test 3: 5^0 mod 7 = 1 (zero exponent)
			// Doc states: Zero exponent: Returns 1 (any number to power 0 is 1)
			const input = hexToBytes(
				"0x" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"05" + // base = 5
					"00" + // exp = 0
					"07", // mod = 7
			);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(1);
		});

		it("should handle zero modulus", () => {
			// Doc Test 4: Zero modulus
			const input = hexToBytes(
				"0x" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"02" + // base = 2
					"03" + // exp = 3
					"00", // mod = 0
			);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(new Uint8Array(1));
		});
	});

	describe("Edge Cases from documentation", () => {
		it("should handle modulus = 1 returning 0", () => {
			// Doc states: Modulus = 1: Returns 0 (anything mod 1 is 0)
			const input = buildModExpInput(5n, 1, 3n, 1, 1n, 1);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(0);
		});

		it("should handle base > modulus", () => {
			// Doc states: Base > modulus: Automatically reduced mod modulus
			// 10^2 mod 3 = 100 mod 3 = 1
			const input = buildModExpInput(10n, 1, 2n, 1, 3n, 1);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(1);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.MODEXP", () => {
			const input = buildModExpInput(2n, 1, 10n, 1, 1000n, 2);
			const result = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			// 2^10 mod 1000 = 1024 mod 1000 = 24
			expect(result.output[0]).toBe(0);
			expect(result.output[1]).toBe(24);
		});

		it("should be available from BYZANTIUM hardfork", () => {
			// Doc states: Introduced: Byzantium (EIP-198)
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const result = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
		});
	});
});
