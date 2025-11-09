import { keccak_256 } from "@noble/hashes/sha3.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";

describe("Keccak256.hash", () => {
	describe("official test vectors", () => {
		// Test vectors from official Keccak/SHA-3 test suite
		it("should hash empty input", () => {
			const input = new Uint8Array(0);
			const result = hash(input);

			// Official Keccak-256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
			const expected = new Uint8Array([
				0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2,
				0xdc, 0xc7, 0x03, 0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
				0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash single byte", () => {
			const input = new Uint8Array([0x00]);
			const result = hash(input);

			// Official Keccak-256(0x00)
			const expected = new Uint8Array([
				0xbc, 0x36, 0x78, 0x9e, 0x7a, 0x1e, 0x28, 0x14, 0x36, 0x46, 0x42, 0x29,
				0x82, 0x8f, 0x81, 0x7d, 0x66, 0x12, 0xf7, 0xb4, 0x77, 0xd6, 0x65, 0x91,
				0xff, 0x96, 0xa9, 0xe0, 0x64, 0xbc, 0xc9, 0x8a,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 0xff byte", () => {
			const input = new Uint8Array([0xff]);
			const result = hash(input);

			// Official Keccak-256(0xff)
			const expected = new Uint8Array([
				0x8b, 0x1a, 0x94, 0x4c, 0xf1, 0x3a, 0x9a, 0x1c, 0x08, 0xfa, 0xcb, 0x2c,
				0x9e, 0x98, 0x62, 0x3e, 0xf3, 0x25, 0x4d, 0x2d, 0xdb, 0x48, 0x11, 0x38,
				0x85, 0xc3, 0xe8, 0xe9, 0x7f, 0xec, 0x8d, 0xb9,
			]);

			expect(result).toEqual(expected);
		});

		it('should hash "abc"', () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
			const result = hash(input);

			// Official Keccak-256("abc")
			const expected = new Uint8Array([
				0x4e, 0x03, 0x65, 0x7a, 0xea, 0x45, 0xa9, 0x4f, 0xc7, 0xd4, 0x7b, 0xa8,
				0x26, 0xc8, 0xd6, 0x67, 0xc0, 0xd1, 0xe6, 0xe3, 0x3a, 0x64, 0xa0, 0x36,
				0xec, 0x44, 0xf5, 0x8f, 0xa1, 0x2d, 0x6c, 0x45,
			]);

			expect(result).toEqual(expected);
		});

		it('should hash "The quick brown fox jumps over the lazy dog"', () => {
			const input = new TextEncoder().encode(
				"The quick brown fox jumps over the lazy dog",
			);
			const result = hash(input);

			// Official Keccak-256
			const expected = new Uint8Array([
				0x4d, 0x74, 0x1b, 0x6f, 0x1e, 0xb2, 0x9c, 0xb2, 0xa9, 0xb9, 0x91, 0x1c,
				0x82, 0xf5, 0x6f, 0xa8, 0xd7, 0x3b, 0x04, 0x95, 0x9d, 0x3d, 0x9d, 0x22,
				0x28, 0x95, 0xdf, 0x6c, 0x0b, 0x28, 0xaa, 0x15,
			]);

			expect(result).toEqual(expected);
		});
	});

	describe("output format", () => {
		it("should return 32-byte hash", () => {
			const input = new Uint8Array([1, 2, 3]);
			const result = hash(input);

			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should return BrandedHash type", () => {
			const input = new Uint8Array([1, 2, 3]);
			const result = hash(input);

			// Should be a BrandedHash (Uint8Array with 32 bytes)
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});
	});

	describe("determinism", () => {
		it("should produce same hash for same input", () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);

			const hash1 = hash(input);
			const hash2 = hash(input);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different inputs", () => {
			const input1 = new Uint8Array([1, 2, 3]);
			const input2 = new Uint8Array([1, 2, 4]);

			const hash1 = hash(input1);
			const hash2 = hash(input2);

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("various input lengths", () => {
		it("should hash 1-byte input", () => {
			const input = new Uint8Array([0x42]);
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash 32-byte input", () => {
			const input = new Uint8Array(32).fill(0x55);
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash 64-byte input", () => {
			const input = new Uint8Array(64).fill(0xaa);
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash 100-byte input", () => {
			const input = new Uint8Array(100);
			for (let i = 0; i < 100; i++) {
				input[i] = i % 256;
			}
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash 1000-byte input", () => {
			const input = new Uint8Array(1000);
			for (let i = 0; i < 1000; i++) {
				input[i] = (i * 7) % 256;
			}
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash large input (10000 bytes)", () => {
			const input = new Uint8Array(10000);
			for (let i = 0; i < 10000; i++) {
				input[i] = (i * 13) % 256;
			}
			const result = hash(input);
			expect(result.length).toBe(32);
		});
	});

	describe("edge cases", () => {
		it("should hash all-zero input", () => {
			const input = new Uint8Array(100);
			const result = hash(input);

			expect(result.length).toBe(32);
			// Should not be all zeros
			const isAllZeros = result.every((byte) => byte === 0);
			expect(isAllZeros).toBe(false);
		});

		it("should hash all-ones input", () => {
			const input = new Uint8Array(100).fill(0xff);
			const result = hash(input);

			expect(result.length).toBe(32);
			// Should not be all ones
			const isAllOnes = result.every((byte) => byte === 0xff);
			expect(isAllOnes).toBe(false);
		});

		it("should hash alternating pattern", () => {
			const input = new Uint8Array(100);
			for (let i = 0; i < 100; i++) {
				input[i] = i % 2 ? 0xff : 0x00;
			}
			const result = hash(input);
			expect(result.length).toBe(32);
		});

		it("should hash sequential bytes", () => {
			const input = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				input[i] = i;
			}
			const result = hash(input);
			expect(result.length).toBe(32);
		});
	});

	describe("cross-validation with @noble/hashes", () => {
		it("should produce same hash as @noble/hashes", () => {
			const testInputs = [
				new Uint8Array(0),
				new Uint8Array([0x42]),
				new Uint8Array([1, 2, 3, 4, 5]),
				new Uint8Array(100).fill(0xaa),
				new TextEncoder().encode("Ethereum"),
			];

			for (const input of testInputs) {
				const ourHash = hash(input);
				const nobleHash = keccak_256(input);

				expect(ourHash).toEqual(nobleHash);
			}
		});

		it("should match @noble for various lengths", () => {
			for (let length = 0; length <= 200; length += 10) {
				const input = new Uint8Array(length);
				for (let i = 0; i < length; i++) {
					input[i] = (i * 7) % 256;
				}

				const ourHash = hash(input);
				const nobleHash = keccak_256(input);

				expect(ourHash).toEqual(nobleHash);
			}
		});
	});

	describe("Ethereum-specific cases", () => {
		it("should hash Ethereum address derivation input", () => {
			// Public key (64 bytes)
			const publicKey = new Uint8Array(64).fill(0x12);
			const result = hash(publicKey);

			expect(result.length).toBe(32);
			// Last 20 bytes would be the address
			expect(result.slice(12).length).toBe(20);
		});

		it("should hash message for signing", () => {
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const result = hash(message);

			expect(result.length).toBe(32);
		});

		it("should hash for EIP-191 prefix", () => {
			const prefix = new TextEncoder().encode(
				"\x19Ethereum Signed Message:\n32",
			);
			const messageHash = hash(new TextEncoder().encode("test"));
			const combined = new Uint8Array(prefix.length + messageHash.length);
			combined.set(prefix);
			combined.set(messageHash, prefix.length);

			const result = hash(combined);
			expect(result.length).toBe(32);
		});
	});

	describe("avalanche effect", () => {
		it("should produce very different hashes for single-bit change", () => {
			const input1 = new Uint8Array([0x00]);
			const input2 = new Uint8Array([0x01]); // 1-bit difference

			const hash1 = hash(input1);
			const hash2 = hash(input2);

			// Count differing bits
			let differingBits = 0;
			for (let i = 0; i < 32; i++) {
				const byte1 = hash1[i];
				const byte2 = hash2[i];
				if (byte1 !== undefined && byte2 !== undefined) {
					let xor = byte1 ^ byte2;
					while (xor > 0) {
						differingBits += xor & 1;
						xor >>= 1;
					}
				}
			}

			// Avalanche effect: ~50% bits should differ (128 ± some variance)
			expect(differingBits).toBeGreaterThan(80);
			expect(differingBits).toBeLessThan(176);
		});

		it("should produce very different hashes for single byte change in middle", () => {
			const input1 = new Uint8Array(100).fill(0xaa);
			const input2 = new Uint8Array(100).fill(0xaa);
			input2[50] = 0xab; // 1-bit difference in middle

			const hash1 = hash(input1);
			const hash2 = hash(input2);

			// Should be significantly different
			expect(hash1).not.toEqual(hash2);

			let differingBits = 0;
			for (let i = 0; i < 32; i++) {
				const byte1 = hash1[i];
				const byte2 = hash2[i];
				if (byte1 !== undefined && byte2 !== undefined) {
					let xor = byte1 ^ byte2;
					while (xor > 0) {
						differingBits += xor & 1;
						xor >>= 1;
					}
				}
			}

			expect(differingBits).toBeGreaterThan(80);
		});
	});

	describe("collision resistance properties", () => {
		it("should produce unique hashes for sequential inputs", () => {
			const hashes = new Set();

			for (let i = 0; i < 100; i++) {
				const input = new Uint8Array([i]);
				const result = hash(input);
				const hexHash = Array.from(result)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				// No collisions in this small test set
				expect(hashes.has(hexHash)).toBe(false);
				hashes.add(hexHash);
			}

			expect(hashes.size).toBe(100);
		});

		it("should produce unique hashes for similar inputs", () => {
			const baseInput = new Uint8Array(32).fill(0xaa);
			const hashes = new Set();

			for (let i = 0; i < 32; i++) {
				const input = new Uint8Array(baseInput);
				const byte = input[i];
				if (byte !== undefined) {
					input[i] = byte ^ 0x01; // Flip one bit
				}

				const result = hash(input);
				const hexHash = Array.from(result)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				expect(hashes.has(hexHash)).toBe(false);
				hashes.add(hexHash);
			}

			expect(hashes.size).toBe(32);
		});
	});
});
