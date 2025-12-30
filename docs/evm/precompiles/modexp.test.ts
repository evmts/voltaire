/**
 * Tests for modexp.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, modexp } from "../../../src/evm/precompiles/precompiles.js";
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
	// base_length
	const baseLenBytes = new Uint8Array(32);
	baseLenBytes[31] = baseLen;
	header.set(baseLenBytes, 0);
	// exp_length
	const expLenBytes = new Uint8Array(32);
	expLenBytes[31] = expLen;
	header.set(expLenBytes, 32);
	// mod_length
	const modLenBytes = new Uint8Array(32);
	modLenBytes[31] = modLen;
	header.set(modLenBytes, 64);

	// Data: base || exp || mod
	const input = new Uint8Array(96 + baseLen + expLen + modLen);
	input.set(header, 0);

	// Write base (big-endian)
	for (let i = 0; i < baseLen; i++) {
		input[96 + baseLen - 1 - i] = Number((base >> BigInt(i * 8)) & 0xffn);
	}
	// Write exp (big-endian)
	for (let i = 0; i < expLen; i++) {
		input[96 + baseLen + expLen - 1 - i] = Number((exp >> BigInt(i * 8)) & 0xffn);
	}
	// Write mod (big-endian)
	for (let i = 0; i < modLen; i++) {
		input[96 + baseLen + expLen + modLen - 1 - i] = Number((mod >> BigInt(i * 8)) & 0xffn);
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
		it("should have minimum gas of 200", () => {
			// Doc states: Minimum gas: 200
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const result = modexp(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThanOrEqual(200n);
		});

		it("should fail with insufficient gas", () => {
			const input = buildModExpInput(2n, 1, 3n, 1, 5n, 1);
			const result = modexp(input, 10n); // Likely need at least 200
			expect(result.success).toBe(false);
		});
	});

	describe("Input Format section", () => {
		it("should require minimum 96 bytes input", () => {
			// Doc states: Minimum input length: 96 bytes (length headers only)
			const shortInput = new Uint8Array(95);
			const result = modexp(shortInput, 10000n);
			expect(result.success).toBe(false);
		});

		it("should accept 96 bytes header with zero lengths", () => {
			const input = new Uint8Array(96);
			const result = modexp(input, 10000n);
			// With zero modLen, should return empty output
			expect(result.success).toBe(true);
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
				"05"   // mod = 5
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
				"05"   // mod = 5
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
				"07"   // mod = 7
			);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(1);
		});

		// NOTE: The documentation says zero modulus returns error, but the implementation
		// returns empty output. This is documented as an API discrepancy.
		it("should handle zero modulus", () => {
			// Doc Test 4: Zero modulus
			// API DISCREPANCY: Doc says "Expected: Error (division by zero)"
			// Actual implementation returns empty output (not error)
			const input = hexToBytes(
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000001" +
				"0000000000000000000000000000000000000000000000000000000000000001" +
				"0000000000000000000000000000000000000000000000000000000000000001" +
				"02" + // base = 2
				"03" + // exp = 3
				"00"   // mod = 0
			);

			const result = modexp(input, 100000n);
			// API DISCREPANCY: Implementation returns success with empty output
			// Documentation says it should return error
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(0);
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
