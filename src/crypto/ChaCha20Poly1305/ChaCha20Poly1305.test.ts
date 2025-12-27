import { describe, expect, it } from "vitest";
import * as ChaCha20Poly1305 from "./ChaCha20Poly1305.js";

describe("ChaCha20Poly1305", () => {
	describe("generateKey", () => {
		it("generates 32-byte key", () => {
			const key = ChaCha20Poly1305.generateKey();
			expect(key).toBeInstanceOf(Uint8Array);
			expect(key.length).toBe(32);
		});

		it("generates different keys on each call", () => {
			const key1 = ChaCha20Poly1305.generateKey();
			const key2 = ChaCha20Poly1305.generateKey();
			expect(key1).not.toEqual(key2);
		});

		it("generates non-zero keys", () => {
			const key = ChaCha20Poly1305.generateKey();
			const hasNonZero = Array.from(key).some((byte) => byte !== 0);
			expect(hasNonZero).toBe(true);
		});
	});

	describe("generateNonce", () => {
		it("generates 12-byte nonce", () => {
			const nonce = ChaCha20Poly1305.generateNonce();
			expect(nonce).toBeInstanceOf(Uint8Array);
			expect(nonce.length).toBe(12);
		});

		it("generates different nonces on each call", () => {
			const nonce1 = ChaCha20Poly1305.generateNonce();
			const nonce2 = ChaCha20Poly1305.generateNonce();
			expect(nonce1).not.toEqual(nonce2);
		});

		it("generates non-zero nonces", () => {
			const nonce = ChaCha20Poly1305.generateNonce();
			const hasNonZero = Array.from(nonce).some((byte) => byte !== 0);
			expect(hasNonZero).toBe(true);
		});

		it("uniqueness test: 1000 nonces have no collisions", () => {
			const nonces = new Set<string>();
			const count = 1000;

			for (let i = 0; i < count; i++) {
				const nonce = ChaCha20Poly1305.generateNonce();
				const key = Array.from(nonce).join(",");
				nonces.add(key);
			}

			expect(nonces.size).toBe(count);
		});
	});

	describe("encrypt / decrypt", () => {
		it("encrypts and decrypts basic message", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Hello, world!");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("encrypts and decrypts empty plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array(0);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("encrypts and decrypts large plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array(65536); // 64 KB
			crypto.getRandomValues(plaintext);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("ciphertext includes authentication tag", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			// Ciphertext should be plaintext length + 16 bytes (tag)
			expect(ciphertext.length).toBe(plaintext.length + 16);
		});

		it("produces different ciphertext for different nonces", () => {
			const key = ChaCha20Poly1305.generateKey();
			const plaintext = new TextEncoder().encode("Test");

			const nonce1 = ChaCha20Poly1305.generateNonce();
			const nonce2 = ChaCha20Poly1305.generateNonce();

			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext, key, nonce1);
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext, key, nonce2);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});

		it("produces different ciphertext for different keys", () => {
			const key1 = ChaCha20Poly1305.generateKey();
			const key2 = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext, key1, nonce);
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext, key2, nonce);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});
	});

	describe("encrypt / decrypt with AAD", () => {
		it("encrypts and decrypts with additional authenticated data", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Secret");
			const aad = new TextEncoder().encode("metadata");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});

		it("fails decryption with wrong AAD", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Secret");
			const aad1 = new TextEncoder().encode("metadata1");
			const aad2 = new TextEncoder().encode("metadata2");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad1);

			expect(() =>
				ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad2),
			).toThrow();
		});

		it("encrypts with empty AAD", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");
			const aad = new Uint8Array(0);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});

		it("handles very long AAD (1MB)", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");
			const aad = new Uint8Array(1024 * 1024);
			for (let i = 0; i < aad.length; i++) {
				aad[i] = i % 256;
			}

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("error cases", () => {
		it("throws error for wrong key during decryption", () => {
			const key1 = ChaCha20Poly1305.generateKey();
			const key2 = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key1, nonce);

			expect(() => ChaCha20Poly1305.decrypt(ciphertext, key2, nonce)).toThrow();
		});

		it("throws error for wrong nonce during decryption", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce1 = ChaCha20Poly1305.generateNonce();
			const nonce2 = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce1);

			expect(() => ChaCha20Poly1305.decrypt(ciphertext, key, nonce2)).toThrow();
		});

		it("throws error for modified ciphertext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			// Modify ciphertext
			const modified = new Uint8Array(ciphertext);
			if (modified[0] !== undefined) {
				modified[0] ^= 1;
			}

			expect(() => ChaCha20Poly1305.decrypt(modified, key, nonce)).toThrow();
		});

		it("throws error for modified authentication tag", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			// Modify tag (last 16 bytes)
			const modified = new Uint8Array(ciphertext);
			const lastIdx = modified.length - 1;
			if (modified[lastIdx] !== undefined) {
				modified[lastIdx] ^= 1;
			}

			expect(() => ChaCha20Poly1305.decrypt(modified, key, nonce)).toThrow();
		});

		it("throws error for ciphertext too short (no tag)", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const tooShort = new Uint8Array(15); // Less than 16-byte tag

			expect(() => ChaCha20Poly1305.decrypt(tooShort, key, nonce)).toThrow();
		});

		it("throws error for invalid nonce length in encrypt", () => {
			const key = ChaCha20Poly1305.generateKey();
			const wrongNonce = new Uint8Array(16); // Should be 12 bytes
			const plaintext = new TextEncoder().encode("Test");

			expect(() =>
				ChaCha20Poly1305.encrypt(plaintext, key, wrongNonce),
			).toThrow();
		});

		it("throws error for invalid nonce length in decrypt", () => {
			const key = ChaCha20Poly1305.generateKey();
			const wrongNonce = new Uint8Array(8); // Should be 12 bytes
			const ciphertext = new Uint8Array(32);

			expect(() =>
				ChaCha20Poly1305.decrypt(ciphertext, key, wrongNonce),
			).toThrow();
		});

		it("throws error for invalid key size on encrypt (16 bytes)", () => {
			const invalidKey = new Uint8Array(16);
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			expect(() =>
				ChaCha20Poly1305.encrypt(plaintext, invalidKey, nonce),
			).toThrow();
		});

		it("throws error for invalid key size on encrypt (empty)", () => {
			const invalidKey = new Uint8Array(0);
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			expect(() =>
				ChaCha20Poly1305.encrypt(plaintext, invalidKey, nonce),
			).toThrow();
		});

		it("throws error for invalid key size on decrypt", () => {
			const invalidKey = new Uint8Array(24);
			const nonce = ChaCha20Poly1305.generateNonce();
			const ciphertext = new Uint8Array(32);

			expect(() =>
				ChaCha20Poly1305.decrypt(ciphertext, invalidKey, nonce),
			).toThrow();
		});
	});

	describe("RFC 8439 test vectors", () => {
		// RFC 8439 Section 2.8.2 - Test Vector for AEAD_CHACHA20_POLY1305
		it("RFC 8439 Section 2.8.2 test vector", () => {
			const key = new Uint8Array([
				0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b,
				0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
				0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
			]);

			const nonce = new Uint8Array([
				0x07, 0x00, 0x00, 0x00, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47,
			]);

			const aad = new Uint8Array([
				0x50, 0x51, 0x52, 0x53, 0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
			]);

			const plaintext = new TextEncoder().encode(
				"Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
			);

			// Expected ciphertext + tag from RFC 8439
			const expectedHex =
				"d31a8d34648e60db7b86afbc53ef7ec2a4aded51296e08fea9e2b5a736ee62d63dbea45e8ca9671282fafb69da92728b1a71de0a9e060b2905d6a5b67ecd3b3692ddbd7f2d778b8c9803aee328091b58fab324e4fad675945585808b4831d7bc3ff4def08e4b7a9de576d26586cec64b61161ae10b594f09e26a7e902ecbd0600691";

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
			const actualHex = Array.from(ciphertext)
				.map((b: number) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(actualHex).toBe(expectedHex);

			// Verify decryption works
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);
			expect(decrypted).toEqual(plaintext);
		});

		// Test vector without AAD
		it("encryption without AAD", () => {
			const key = new Uint8Array([
				0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b,
				0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
				0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
			]);

			const nonce = new Uint8Array([
				0x07, 0x00, 0x00, 0x00, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47,
			]);

			const plaintext = new TextEncoder().encode(
				"Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
			);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("edge cases and security", () => {
		it("handles all-zero plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array(64).fill(0);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("handles all-ones plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array(64).fill(0xff);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("nonce reuse produces different ciphertext for different plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();

			const plaintext1 = new TextEncoder().encode("Message 1");
			const plaintext2 = new TextEncoder().encode("Message 2");

			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext1, key, nonce);
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext2, key, nonce);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});

		it("encryption is deterministic with same key, nonce, and plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = new Uint8Array(12).fill(1); // Fixed nonce
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			expect(ciphertext1).toEqual(ciphertext2);
		});

		it("handles large plaintext (100KB)", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			// Fill with pattern instead of random for large sizes
			const plaintext = new Uint8Array(100 * 1024); // 100 KB
			for (let i = 0; i < plaintext.length; i++) {
				plaintext[i] = i % 256;
			}

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("nonce reuse with same plaintext is deterministic", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = new Uint8Array(12).fill(42);
			const plaintext = new TextEncoder().encode("Same message");

			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			expect(ciphertext1).toEqual(ciphertext2);
		});

		it("authentication tag is 16 bytes", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

			expect(ciphertext.length).toBe(plaintext.length + 16);
		});

		it("handles exact block size plaintext (64 bytes)", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array(64);
			crypto.getRandomValues(plaintext);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("handles small plaintext (< 64 bytes)", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Hi");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("handles single byte plaintext", () => {
			const key = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new Uint8Array([0x42]);

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("constants", () => {
		it("KEY_SIZE is 32", () => {
			expect(ChaCha20Poly1305.KEY_SIZE).toBe(32);
		});

		it("NONCE_SIZE is 12", () => {
			expect(ChaCha20Poly1305.NONCE_SIZE).toBe(12);
		});

		it("TAG_SIZE is 16", () => {
			expect(ChaCha20Poly1305.TAG_SIZE).toBe(16);
		});
	});

	describe("integration tests", () => {
		it("full encryption workflow: generate key -> encrypt -> decrypt", () => {
			const key = ChaCha20Poly1305.generateKey();
			const plaintext = new TextEncoder().encode("Integration test message");
			const nonce = ChaCha20Poly1305.generateNonce();

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
			const message = new TextDecoder().decode(decrypted);

			expect(message).toBe("Integration test message");
		});

		it("authenticated encryption with AAD workflow", () => {
			const key = ChaCha20Poly1305.generateKey();
			const plaintext = new TextEncoder().encode("Secret data");
			const aad = new TextEncoder().encode(
				JSON.stringify({ userId: 123, timestamp: Date.now() }),
			);
			const nonce = ChaCha20Poly1305.generateNonce();

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
			const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});

		it("key rotation: encrypt with key1, cannot decrypt with key2", () => {
			const key1 = ChaCha20Poly1305.generateKey();
			const key2 = ChaCha20Poly1305.generateKey();
			const nonce = ChaCha20Poly1305.generateNonce();
			const plaintext = new TextEncoder().encode("Message");

			const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key1, nonce);

			expect(() => ChaCha20Poly1305.decrypt(ciphertext, key2, nonce)).toThrow();
		});

		it("concurrent encryption operations", () => {
			const key = ChaCha20Poly1305.generateKey();

			const operations = [
				(() => {
					const nonce = ChaCha20Poly1305.generateNonce();
					const plaintext = new TextEncoder().encode("Message 1");
					const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
					return ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
				})(),
				(() => {
					const nonce = ChaCha20Poly1305.generateNonce();
					const plaintext = new TextEncoder().encode("Message 2");
					const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
					return ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
				})(),
				(() => {
					const nonce = ChaCha20Poly1305.generateNonce();
					const plaintext = new TextEncoder().encode("Message 3");
					const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
					return ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
				})(),
			];

			expect(new TextDecoder().decode(operations[0])).toBe("Message 1");
			expect(new TextDecoder().decode(operations[1])).toBe("Message 2");
			expect(new TextDecoder().decode(operations[2])).toBe("Message 3");
		});

		it("replay attack prevention via unique nonce", () => {
			const key = ChaCha20Poly1305.generateKey();
			const plaintext = new TextEncoder().encode("Important message");

			const nonce1 = ChaCha20Poly1305.generateNonce();
			const ciphertext1 = ChaCha20Poly1305.encrypt(plaintext, key, nonce1);

			const nonce2 = ChaCha20Poly1305.generateNonce();
			const ciphertext2 = ChaCha20Poly1305.encrypt(plaintext, key, nonce2);

			expect(ciphertext1).not.toEqual(ciphertext2);

			expect(() =>
				ChaCha20Poly1305.decrypt(ciphertext1, key, nonce2),
			).toThrow();
		});
	});
});
