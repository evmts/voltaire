/**
 * Tests for identity.mdx documentation examples
 * Validates code examples work correctly with actual API
 */
import { describe, expect, it } from "vitest";
import { PrecompileAddress, execute, identity } from "../../../src/evm/precompiles/precompiles.js";
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

describe("identity.mdx documentation examples", () => {
	describe("Overview section", () => {
		it("should return input data unchanged", () => {
			// Doc states: it returns the input data unchanged
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const result = identity(input, 1000n);

			expect(result.success).toBe(true);
			expect([...result.output]).toEqual([...input]);
		});
	});

	describe("Gas Cost section", () => {
		it("should follow formula: 15 + 3 * ceil(input_length / 32)", () => {
			// Doc states: Base cost: 15 gas, Per-word cost: 3 gas per 32-byte word
			const testCases = [
				{ len: 0, expected: 15n },   // 0 bytes: 15 gas
				{ len: 32, expected: 18n },  // 32 bytes: 18 gas (15 + 3*1)
				{ len: 33, expected: 21n },  // 33 bytes: 21 gas (15 + 3*2)
				{ len: 64, expected: 21n },  // 64 bytes: 21 gas (15 + 3*2)
			];

			for (const { len, expected } of testCases) {
				const input = new Uint8Array(len);
				const result = identity(input, 1000n);
				expect(result.gasUsed).toBe(expected);
			}
		});

		it("should fail with insufficient gas", () => {
			const input = new Uint8Array(0);
			const result = identity(input, 14n); // Need 15
			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Input Format section", () => {
		it("should accept arbitrary-length byte array", () => {
			// Doc states: Accepts arbitrary-length byte array
			const testSizes = [0, 1, 31, 32, 33, 64, 128, 1000];

			for (const size of testSizes) {
				const input = new Uint8Array(size);
				const expectedGas = 15n + BigInt(Math.ceil(size / 32)) * 3n;
				const result = identity(input, expectedGas + 100n);
				expect(result.success).toBe(true);
			}
		});
	});

	describe("Output Format section", () => {
		it("should return identical output to input", () => {
			// Doc states: Identical to input - returns input bytes unchanged
			const testInputs = [
				new Uint8Array([]),
				new Uint8Array([1, 2, 3, 4, 5]),
				new Uint8Array(32).fill(0xff),
				new Uint8Array(100).fill(0xab),
			];

			for (const input of testInputs) {
				const result = identity(input, 10000n);
				expect(result.success).toBe(true);
				expect([...result.output]).toEqual([...input]);
			}
		});
	});

	describe("Test Vectors from documentation", () => {
		it("should handle empty input", () => {
			// Doc states: Test 1: Empty input, Expected: empty array (0 bytes), Gas: 15
			const input = new Uint8Array(0);
			const result = identity(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(0);
			expect(result.gasUsed).toBe(15n);
		});

		it("should handle 5 bytes input", () => {
			// Doc states: Test 2: 5 bytes, Expected: [1, 2, 3, 4, 5], Gas: 18
			const input = hexToBytes("0102030405");
			const result = identity(input, 1000n);

			expect(result.success).toBe(true);
			expect([...result.output]).toEqual([1, 2, 3, 4, 5]);
			expect(result.gasUsed).toBe(18n); // 15 + 3*1
		});

		it("should handle exact 32-byte boundary", () => {
			// Doc states: Test 3: Exact 32-byte boundary, Gas: 18
			const input = hexToBytes("ff".repeat(32));
			const result = identity(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect([...result.output].every((b) => b === 0xff)).toBe(true);
			expect(result.gasUsed).toBe(18n); // 15 + 3*1
		});

		it("should handle partial word (33 bytes)", () => {
			// Doc states: Test 4: Partial word (33 bytes), Gas: 21
			const input = hexToBytes("00".repeat(33));
			const result = identity(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(33);
			expect(result.gasUsed).toBe(21n); // 15 + 3*2
		});
	});

	describe("Usage Example from documentation", () => {
		it("should work with hex input", () => {
			// Doc example uses Hex input
			const input = hexToBytes("0102030405");

			// Calculate required gas as shown in doc
			const words = Math.ceil(input.length / 32);
			const gasNeeded = 15n + 3n * BigInt(words);

			const result = identity(input, gasNeeded);

			expect(result.success).toBe(true);
			// Output === input
			expect([...result.output]).toEqual([...input]);
		});
	});

	describe("Integration with execute function", () => {
		it("should work via execute with PrecompileAddress.IDENTITY", () => {
			const input = new TextEncoder().encode("test");
			const result = execute(
				PrecompileAddress.IDENTITY,
				input,
				1000n,
				Hardfork.CANCUN,
			);

			expect(result.success).toBe(true);
			expect([...result.output]).toEqual([...input]);
		});

		it("should be available in FRONTIER hardfork", () => {
			// Doc states: Introduced: Frontier
			const input = new Uint8Array(0);
			const result = execute(
				PrecompileAddress.IDENTITY,
				input,
				1000n,
				Hardfork.FRONTIER,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("Why Does Identity Exist section", () => {
		it("should be cheapest data copy operation", () => {
			// Doc states: Identity precompile is the cheapest way to copy data in the EVM
			// Base cost: 15 gas, Per-byte cost: ~0.09375 gas/byte
			const input = new Uint8Array(1024);
			const result = identity(input, 10000n);

			expect(result.success).toBe(true);
			// 15 + 3 * ceil(1024/32) = 15 + 3*32 = 111
			expect(result.gasUsed).toBe(15n + 32n * 3n);
		});
	});
});
