import { describe, expect, it } from "vitest";
import { AesGcm } from "./AesGcm/AesGcm.js";

describe("AesGcm", () => {
	describe("Key Generation", () => {
		it("generateKey should create 128-bit key", async () => {
			const key = await AesGcm.generateKey(128);
			expect(key).toBeDefined();
			expect(key.type).toBe("secret");

			const exported = await AesGcm.exportKey(key);
			expect(exported.length).toBe(16);
		});

		it("generateKey should create 256-bit key", async () => {
			const key = await AesGcm.generateKey(256);
			expect(key).toBeDefined();
			expect(key.type).toBe("secret");

			const exported = await AesGcm.exportKey(key);
			expect(exported.length).toBe(32);
		});
	});

	describe("Key Import/Export", () => {
		it("importKey should import 128-bit key", async () => {
			const keyBytes = new Uint8Array(16).fill(1);
			const key = await AesGcm.importKey(keyBytes);
			expect(key).toBeDefined();

			const exported = await AesGcm.exportKey(key);
			expect(exported).toEqual(keyBytes);
		});

		it("importKey should import 256-bit key", async () => {
			const keyBytes = new Uint8Array(32).fill(2);
			const key = await AesGcm.importKey(keyBytes);
			expect(key).toBeDefined();

			const exported = await AesGcm.exportKey(key);
			expect(exported).toEqual(keyBytes);
		});

		it("importKey should throw for invalid key length", async () => {
			const invalidKey = new Uint8Array(15);
			await expect(AesGcm.importKey(invalidKey)).rejects.toThrow();
		});
	});

	describe("Encryption/Decryption", () => {
		it("encrypt and decrypt should work with 128-bit key", async () => {
			const key = await AesGcm.generateKey(128);
			const plaintext = new TextEncoder().encode("Hello, AES-GCM!");
			const nonce = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			expect(ciphertext.length).toBe(plaintext.length + AesGcm.TAG_SIZE);

			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
			expect(decrypted).toEqual(plaintext);
		});

		it("encrypt and decrypt should work with 256-bit key", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("Secret message");
			const nonce = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
			expect(decrypted).toEqual(plaintext);
		});

		it("encrypt and decrypt should work with additional data", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("Data");
			const nonce = AesGcm.generateNonce();
			const additionalData = new TextEncoder().encode("metadata");

			const ciphertext = await AesGcm.encrypt(
				plaintext,
				key,
				nonce,
				additionalData,
			);
			const decrypted = await AesGcm.decrypt(
				ciphertext,
				key,
				nonce,
				additionalData,
			);
			expect(decrypted).toEqual(plaintext);
		});

		it("decrypt should fail with wrong key", async () => {
			const key1 = await AesGcm.generateKey(256);
			const key2 = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("test");
			const nonce = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key1, nonce);
			await expect(AesGcm.decrypt(ciphertext, key2, nonce)).rejects.toThrow();
		});

		it("decrypt should fail with wrong nonce", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("test");
			const nonce1 = AesGcm.generateNonce();
			const nonce2 = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce1);
			await expect(AesGcm.decrypt(ciphertext, key, nonce2)).rejects.toThrow();
		});

		it("decrypt should fail with wrong additional data", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("test");
			const nonce = AesGcm.generateNonce();
			const ad1 = new TextEncoder().encode("metadata1");
			const ad2 = new TextEncoder().encode("metadata2");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, ad1);
			await expect(
				AesGcm.decrypt(ciphertext, key, nonce, ad2),
			).rejects.toThrow();
		});

		it("decrypt should fail with corrupted ciphertext", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("test");
			const nonce = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			// Corrupt one byte
			if (ciphertext[0] !== undefined) {
				ciphertext[0] ^= 1;
			}

			await expect(AesGcm.decrypt(ciphertext, key, nonce)).rejects.toThrow();
		});

		it("encrypt should throw for invalid nonce length", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("test");
			const invalidNonce = new Uint8Array(16);

			await expect(
				AesGcm.encrypt(plaintext, key, invalidNonce),
			).rejects.toThrow();
		});

		it("should handle empty plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new Uint8Array(0);
			const nonce = AesGcm.generateNonce();

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			expect(ciphertext.length).toBe(AesGcm.TAG_SIZE);

			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("Nonce Generation", () => {
		it("generateNonce should create 12-byte nonce", () => {
			const nonce = AesGcm.generateNonce();
			expect(nonce.length).toBe(12);
		});

		it("generateNonce should create unique nonces", () => {
			const nonce1 = AesGcm.generateNonce();
			const nonce2 = AesGcm.generateNonce();
			expect(nonce1).not.toEqual(nonce2);
		});
	});

	describe("Key Derivation", () => {
		it("deriveKey should derive key from password", async () => {
			const password = "mypassword";
			const salt = crypto.getRandomValues(new Uint8Array(16));
			const key = await AesGcm.deriveKey(password, salt, 1000, 256);

			expect(key).toBeDefined();
			const exported = await AesGcm.exportKey(key);
			expect(exported.length).toBe(32);
		});

		it("deriveKey should be deterministic", async () => {
			const password = "test";
			const salt = new Uint8Array(16).fill(1);

			const key1 = await AesGcm.deriveKey(password, salt, 1000, 256);
			const key2 = await AesGcm.deriveKey(password, salt, 1000, 256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);
			expect(exported1).toEqual(exported2);
		});

		it("deriveKey should produce different keys for different passwords", async () => {
			const salt = new Uint8Array(16).fill(1);

			const key1 = await AesGcm.deriveKey("password1", salt, 1000, 256);
			const key2 = await AesGcm.deriveKey("password2", salt, 1000, 256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);
			expect(exported1).not.toEqual(exported2);
		});

		it("deriveKey should work with byte array password", async () => {
			const password = new Uint8Array([1, 2, 3, 4]);
			const salt = new Uint8Array(16).fill(1);
			const key = await AesGcm.deriveKey(password, salt, 1000, 128);

			expect(key).toBeDefined();
			const exported = await AesGcm.exportKey(key);
			expect(exported.length).toBe(16);
		});
	});

	describe("Constants", () => {
		it("should have correct constant values", () => {
			expect(AesGcm.AES128_KEY_SIZE).toBe(16);
			expect(AesGcm.AES256_KEY_SIZE).toBe(32);
			expect(AesGcm.NONCE_SIZE).toBe(12);
			expect(AesGcm.TAG_SIZE).toBe(16);
		});
	});
});
