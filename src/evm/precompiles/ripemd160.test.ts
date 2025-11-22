import { describe, expect, it } from "vitest";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import { PrecompileAddress, execute, ripemd160 } from "./precompiles.js";

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
 * Helper: Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

describe("Precompile: RIPEMD160 (0x03)", () => {
	describe("Gas calculation", () => {
		it("should use 600 gas for empty input", () => {
			const input = new Uint8Array(0);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(600n); // 600 + 0 words * 120
		});

		it("should use 720 gas for 1 byte input (1 word)", () => {
			const input = new Uint8Array(1);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(720n); // 600 + 1 word * 120
		});

		it("should use 720 gas for 31 bytes input (1 word)", () => {
			const input = new Uint8Array(31);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(720n);
		});

		it("should use 720 gas for 32 bytes input (1 word)", () => {
			const input = new Uint8Array(32);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(720n);
		});

		it("should use 840 gas for 33 bytes input (2 words)", () => {
			const input = new Uint8Array(33);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(840n); // 600 + 2 words * 120
		});

		it("should use 840 gas for 64 bytes input (2 words)", () => {
			const input = new Uint8Array(64);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(840n);
		});

		it("should calculate gas correctly for large input", () => {
			const input = new Uint8Array(1024); // 32 words
			const result = ripemd160(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(600n + 32n * 120n); // 4440 gas
		});

		it("should verify gas formula: 600 + ceil(len/32) * 120", () => {
			const testCases = [
				{ len: 0, expected: 600n },
				{ len: 1, expected: 720n },
				{ len: 32, expected: 720n },
				{ len: 33, expected: 840n },
				{ len: 64, expected: 840n },
				{ len: 65, expected: 960n },
				{ len: 128, expected: 1080n },
				{ len: 256, expected: 1560n },
			];

			for (const { len, expected } of testCases) {
				const input = new Uint8Array(len);
				const result = ripemd160(input, 100000n);
				expect(result.gasUsed).toBe(expected);
			}
		});
	});

	describe("Out of gas handling", () => {
		it("should fail with insufficient gas (599)", () => {
			const input = new Uint8Array(0);
			const result = ripemd160(input, 599n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(600n);
		});

		it("should succeed with exact gas (600)", () => {
			const input = new Uint8Array(0);
			const result = ripemd160(input, 600n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(600n);
		});

		it("should fail with insufficient gas for 32-byte input", () => {
			const input = new Uint8Array(32);
			const result = ripemd160(input, 719n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
			expect(result.gasUsed).toBe(720n);
		});

		it("should succeed with exact gas for 32-byte input", () => {
			const input = new Uint8Array(32);
			const result = ripemd160(input, 720n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(720n);
		});

		it("should handle gas limit edge case for large input", () => {
			const input = new Uint8Array(10000); // 313 words
			const expectedGas = 600n + 313n * 120n; // 38160
			const result = ripemd160(input, expectedGas - 1n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});
	});

	describe("Output validation", () => {
		it("should always return 32 bytes (left-padded)", () => {
			const testCases = [0, 1, 31, 32, 33, 64, 128, 1000];

			for (const len of testCases) {
				const input = new Uint8Array(len);
				const result = ripemd160(input, 100000n);

				expect(result.success).toBe(true);
				expect(result.output.length).toBe(32);
			}
		});

		it("should left-pad output with 12 zero bytes", () => {
			const input = new TextEncoder().encode("test");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);

			// First 12 bytes should be zero
			for (let i = 0; i < 12; i++) {
				expect(result.output[i]).toBe(0);
			}

			// Last 20 bytes should contain the RIPEMD160 hash
			const hash20 = result.output.slice(12);
			expect(hash20.length).toBe(20);

			// At least one non-zero byte in the hash
			const hasNonZero = hash20.some((b) => b !== 0);
			expect(hasNonZero).toBe(true);
		});

		it("should return correct hash for empty input", () => {
			const input = new Uint8Array(0);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);

			// RIPEMD160("") = 9c1185a5c5e9fc54612808977ee8f548b2258d31
			const expected =
				"0000000000000000000000009c1185a5c5e9fc54612808977ee8f548b2258d31";
			expect(bytesToHex(result.output)).toBe(expected);
		});

		it("should return correct hash for 'a'", () => {
			const input = new TextEncoder().encode("a");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160("a") = 0bdc9d2d256b3ee9daae347be6f4dc835a467ffe
			const expected =
				"0000000000000000000000000bdc9d2d256b3ee9daae347be6f4dc835a467ffe";
			expect(bytesToHex(result.output)).toBe(expected);
		});

		it("should return correct hash for 'abc'", () => {
			const input = new TextEncoder().encode("abc");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160("abc") = 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
			const expected =
				"0000000000000000000000008eb208f7e05d987a9b044a8e98c6b087f15a0bfc";
			expect(bytesToHex(result.output)).toBe(expected);
		});
	});

	describe("Left-padding validation", () => {
		it("should verify first 12 bytes are always zero", () => {
			const inputs = [
				new Uint8Array(0),
				new TextEncoder().encode("test"),
				new Uint8Array(100).fill(0xff),
				new TextEncoder().encode("The quick brown fox jumps over the lazy dog"),
			];

			for (const input of inputs) {
				const result = ripemd160(input, 100000n);

				expect(result.success).toBe(true);
				expect(result.output.length).toBe(32);

				// Check first 12 bytes are zero
				const padding = result.output.slice(0, 12);
				expect([...padding].every((b) => b === 0)).toBe(true);

				// Check last 20 bytes form the hash
				const hash = result.output.slice(12);
				expect(hash.length).toBe(20);
			}
		});

		it("should ensure hash portion is in last 20 bytes", () => {
			const input = new TextEncoder().encode("hello");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);

			// Extract 20-byte hash
			const hash = result.output.slice(12, 32);
			expect(hash.length).toBe(20);

			// Hash should not be all zeros (for non-trivial input)
			const isAllZero = [...hash].every((b) => b === 0);
			expect(isAllZero).toBe(false);
		});
	});

	describe("EVM test vectors", () => {
		it("should compute hash from Ethereum test vectors (empty)", () => {
			const input = hexToBytes("");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(bytesToHex(result.output)).toBe(
				"0000000000000000000000009c1185a5c5e9fc54612808977ee8f548b2258d31",
			);
		});

		it("should compute hash from Ethereum test vectors (single byte 0x00)", () => {
			const input = hexToBytes("00");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160(0x00) = c81b94933420221a7ac004a90242d8b1d3e5070d
			expect(bytesToHex(result.output)).toBe(
				"000000000000000000000000c81b94933420221a7ac004a90242d8b1d3e5070d",
			);
		});

		it("should compute hash from Ethereum test vectors (0xff repeated)", () => {
			const input = new Uint8Array(32).fill(0xff);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// Verify proper padding
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		});
	});

	describe("Input size variations", () => {
		it("should handle empty input", () => {
			const input = new Uint8Array(0);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(result.gasUsed).toBe(600n);
		});

		it("should handle 1 byte input", () => {
			const input = new Uint8Array(1);
			input[0] = 0x42;
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should handle 31 bytes input", () => {
			const input = new Uint8Array(31).fill(0xaa);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should handle 32 bytes input (1 word boundary)", () => {
			const input = new Uint8Array(32).fill(0xbb);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(result.gasUsed).toBe(720n);
		});

		it("should handle 64 bytes input (2 word boundary)", () => {
			const input = new Uint8Array(64).fill(0xcc);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(result.gasUsed).toBe(840n);
		});

		it("should handle large input (10KB)", () => {
			const input = new Uint8Array(10240);
			for (let i = 0; i < input.length; i++) {
				input[i] = i % 256;
			}
			const result = ripemd160(input, 1000000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});
	});

	describe("Edge cases", () => {
		it("should handle all zeros input", () => {
			const input = new Uint8Array(100).fill(0x00);
			const result = ripemd160(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		});

		it("should handle all ones input", () => {
			const input = new Uint8Array(100).fill(0xff);
			const result = ripemd160(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect([...result.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		});

		it("should handle gas limit at exact boundary", () => {
			const input = new Uint8Array(32);
			const exactGas = 720n;
			const result = ripemd160(input, exactGas);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(exactGas);
		});

		it("should fail at gas limit minus one", () => {
			const input = new Uint8Array(32);
			const result = ripemd160(input, 719n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should handle maximum reasonable input size", () => {
			const input = new Uint8Array(100000);
			const expectedGas = 600n + BigInt(Math.ceil(input.length / 32)) * 120n;
			const result = ripemd160(input, expectedGas + 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});
	});

	describe("Determinism verification", () => {
		it("should produce same hash for same input (repeated calls)", () => {
			const input = new TextEncoder().encode("test determinism");

			const result1 = ripemd160(input, 10000n);
			const result2 = ripemd160(input, 10000n);
			const result3 = ripemd160(input, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(result3.success).toBe(true);

			expect(bytesToHex(result1.output)).toBe(bytesToHex(result2.output));
			expect(bytesToHex(result2.output)).toBe(bytesToHex(result3.output));
		});

		it("should produce different hashes for different inputs", () => {
			const input1 = new TextEncoder().encode("test1");
			const input2 = new TextEncoder().encode("test2");

			const result1 = ripemd160(input1, 10000n);
			const result2 = ripemd160(input2, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});

		it("should be sensitive to single bit change", () => {
			const input1 = new Uint8Array(32).fill(0x00);
			const input2 = new Uint8Array(32).fill(0x00);
			input2[0] = 0x01;

			const result1 = ripemd160(input1, 10000n);
			const result2 = ripemd160(input2, 10000n);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(bytesToHex(result1.output)).not.toBe(bytesToHex(result2.output));
		});
	});

	describe("Integration", () => {
		it("should work via execute function", () => {
			const input = new TextEncoder().encode("integration test");
			const result = execute(
				PrecompileAddress.RIPEMD160,
				input,
				10000n,
				Hardfork.FRONTIER,
			);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(result.gasUsed).toBeGreaterThanOrEqual(600n);
		});

		it("should be available from all hardforks", () => {
			const input = new TextEncoder().encode("test");

			const hardforks = [
				Hardfork.FRONTIER,
				Hardfork.HOMESTEAD,
				Hardfork.BYZANTIUM,
				Hardfork.CONSTANTINOPLE,
				Hardfork.ISTANBUL,
				Hardfork.BERLIN,
				Hardfork.LONDON,
				Hardfork.PARIS,
				Hardfork.SHANGHAI,
				Hardfork.CANCUN,
				Hardfork.PRAGUE,
			];

			for (const hf of hardforks) {
				const result = execute(PrecompileAddress.RIPEMD160, input, 10000n, hf);
				expect(result.success).toBe(true);
				expect(result.output.length).toBe(32);
			}
		});
	});

	describe("Standard test vectors", () => {
		it("should match test vector: abc", () => {
			const input = new TextEncoder().encode("abc");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			expect(bytesToHex(result.output)).toBe(
				"0000000000000000000000008eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
			);
		});

		it("should match test vector: message digest", () => {
			const input = new TextEncoder().encode("message digest");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160("message digest") = 5d0689ef49d2fae572b881b123a85ffa21595f36
			expect(bytesToHex(result.output)).toBe(
				"0000000000000000000000005d0689ef49d2fae572b881b123a85ffa21595f36",
			);
		});

		it("should match test vector: abcdefghijklmnopqrstuvwxyz", () => {
			const input = new TextEncoder().encode("abcdefghijklmnopqrstuvwxyz");
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160("abcdefghijklmnopqrstuvwxyz") = f71c27109c692c1b56bbdceb5b9d2865b3708dbc
			expect(bytesToHex(result.output)).toBe(
				"000000000000000000000000f71c27109c692c1b56bbdceb5b9d2865b3708dbc",
			);
		});

		it("should match test vector: The quick brown fox", () => {
			const input = new TextEncoder().encode(
				"The quick brown fox jumps over the lazy dog",
			);
			const result = ripemd160(input, 10000n);

			expect(result.success).toBe(true);
			// RIPEMD160 = 37f332f68db77bd9d7edd4969571ad671cf9dd3b
			expect(bytesToHex(result.output)).toBe(
				"00000000000000000000000037f332f68db77bd9d7edd4969571ad671cf9dd3b",
			);
		});
	});
});
