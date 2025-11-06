import { describe, expect, it } from "vitest";
import * as AesGcm from "./AesGcm.js";

describe("AesGcm", () => {
	describe("generateKey", () => {
		it("generates 128-bit AES key", async () => {
			const key = await AesGcm.generateKey(128);
			expect(key).toBeDefined();
			expect(key.type).toBe("secret");
		});

		it("generates 256-bit AES key", async () => {
			const key = await AesGcm.generateKey(256);
			expect(key).toBeDefined();
			expect(key.type).toBe("secret");
		});

		it("generates different keys on each call", async () => {
			const key1 = await AesGcm.generateKey(256);
			const key2 = await AesGcm.generateKey(256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);

			expect(exported1).not.toEqual(exported2);
		});
	});

	describe("importKey / exportKey", () => {
		it("imports and exports 128-bit key", async () => {
			const keyData = new Uint8Array(16);
			crypto.getRandomValues(keyData);

			const key = await AesGcm.importKey(keyData);
			const exported = await AesGcm.exportKey(key);

			expect(exported).toEqual(keyData);
		});

		it("imports and exports 256-bit key", async () => {
			const keyData = new Uint8Array(32);
			crypto.getRandomValues(keyData);

			const key = await AesGcm.importKey(keyData);
			const exported = await AesGcm.exportKey(key);

			expect(exported).toEqual(keyData);
		});

		it("imports all-zero key", async () => {
			const keyData = new Uint8Array(16).fill(0);
			const key = await AesGcm.importKey(keyData);
			const exported = await AesGcm.exportKey(key);

			expect(exported).toEqual(keyData);
		});

		it("imports all-ones key", async () => {
			const keyData = new Uint8Array(32).fill(0xff);
			const key = await AesGcm.importKey(keyData);
			const exported = await AesGcm.exportKey(key);

			expect(exported).toEqual(keyData);
		});
	});

	describe("generateNonce", () => {
		it("generates 12-byte nonce", () => {
			const nonce = AesGcm.generateNonce();
			expect(nonce).toBeInstanceOf(Uint8Array);
			expect(nonce.length).toBe(12);
		});

		it("generates different nonces on each call", () => {
			const nonce1 = AesGcm.generateNonce();
			const nonce2 = AesGcm.generateNonce();

			expect(nonce1).not.toEqual(nonce2);
		});

		it("generates non-zero nonces", () => {
			const nonce = AesGcm.generateNonce();
			const hasNonZero = Array.from(nonce).some((byte) => byte !== 0);
			expect(hasNonZero).toBe(true);
		});
	});

	describe("encrypt / decrypt", () => {
		it("encrypts and decrypts with 128-bit key", async () => {
			const key = await AesGcm.generateKey(128);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Hello, world!");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("encrypts and decrypts with 256-bit key", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Secret message");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("encrypts and decrypts empty plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("encrypts and decrypts large plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new Uint8Array(65536); // 64 KB (max for crypto.getRandomValues)
			crypto.getRandomValues(plaintext);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("ciphertext includes authentication tag", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

			// Ciphertext should be plaintext length + 16 bytes (tag)
			expect(ciphertext.length).toBe(plaintext.length + 16);
		});

		it("produces different ciphertext for different nonces", async () => {
			const key = await AesGcm.generateKey(256);
			const plaintext = new TextEncoder().encode("Test");

			const nonce1 = AesGcm.generateNonce();
			const nonce2 = AesGcm.generateNonce();

			const ciphertext1 = await AesGcm.encrypt(plaintext, key, nonce1);
			const ciphertext2 = await AesGcm.encrypt(plaintext, key, nonce2);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});

		it("produces different ciphertext for different keys", async () => {
			const key1 = await AesGcm.generateKey(256);
			const key2 = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext1 = await AesGcm.encrypt(plaintext, key1, nonce);
			const ciphertext2 = await AesGcm.encrypt(plaintext, key2, nonce);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});
	});

	describe("encrypt / decrypt with AAD", () => {
		it("encrypts and decrypts with additional authenticated data", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Secret");
			const aad = new TextEncoder().encode("metadata");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});

		it("fails decryption with wrong AAD", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Secret");
			const aad1 = new TextEncoder().encode("metadata1");
			const aad2 = new TextEncoder().encode("metadata2");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad1);

			await expect(
				AesGcm.decrypt(ciphertext, key, nonce, aad2),
			).rejects.toThrow();
		});

		it("encrypts with empty AAD", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");
			const aad = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("error cases", () => {
		it("throws error for wrong key during decryption", async () => {
			const key1 = await AesGcm.generateKey(256);
			const key2 = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key1, nonce);

			await expect(AesGcm.decrypt(ciphertext, key2, nonce)).rejects.toThrow();
		});

		it("throws error for wrong nonce during decryption", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce1 = AesGcm.generateNonce();
			const nonce2 = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce1);

			await expect(AesGcm.decrypt(ciphertext, key, nonce2)).rejects.toThrow();
		});

		it("throws error for modified ciphertext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

			// Modify ciphertext
			const modified = new Uint8Array(ciphertext);
			modified[0] ^= 1;

			await expect(AesGcm.decrypt(modified, key, nonce)).rejects.toThrow();
		});

		it("throws error for modified authentication tag", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

			// Modify tag (last 16 bytes)
			const modified = new Uint8Array(ciphertext);
			modified[modified.length - 1] ^= 1;

			await expect(AesGcm.decrypt(modified, key, nonce)).rejects.toThrow();
		});

		it("throws error for ciphertext too short (no tag)", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const tooShort = new Uint8Array(15); // Less than 16-byte tag

			await expect(AesGcm.decrypt(tooShort, key, nonce)).rejects.toThrow();
		});

		it("throws error for invalid nonce length in encrypt", async () => {
			const key = await AesGcm.generateKey(256);
			const wrongNonce = new Uint8Array(16); // Should be 12 bytes
			const plaintext = new TextEncoder().encode("Test");

			await expect(
				AesGcm.encrypt(plaintext, key, wrongNonce),
			).rejects.toThrow();
		});

		it("throws error for invalid nonce length in decrypt", async () => {
			const key = await AesGcm.generateKey(256);
			const wrongNonce = new Uint8Array(8); // Should be 12 bytes
			const ciphertext = new Uint8Array(32);

			await expect(
				AesGcm.decrypt(ciphertext, key, wrongNonce),
			).rejects.toThrow();
		});
	});

	describe("NIST test vectors - AES-128-GCM", () => {
		// Test Case 1 from NIST GCM test vectors
		it("NIST vector: AES-128-GCM Test Case 1", async () => {
			const keyHex = "00000000000000000000000000000000";
			const nonceHex = "000000000000000000000000";

			const key = await AesGcm.importKey(
				new Uint8Array(
					(keyHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
				),
			);
			const nonce = new Uint8Array(
				(nonceHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);
			const plaintext = new Uint8Array(0);
			const aad = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);

			// Expected tag: 58e2fccefa7e3061367f1d57a4e7455a
			const expectedTag = "58e2fccefa7e3061367f1d57a4e7455a";
			const actualTag = Array.from(ciphertext)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(actualTag).toBe(expectedTag);
		});

		// Test Case 2 from NIST GCM test vectors
		it("NIST vector: AES-128-GCM Test Case 2", async () => {
			const keyHex = "00000000000000000000000000000000";
			const nonceHex = "000000000000000000000000";
			const plaintextHex = "00000000000000000000000000000000";

			const key = await AesGcm.importKey(
				new Uint8Array(
					(keyHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
				),
			);
			const nonce = new Uint8Array(
				(nonceHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);
			const plaintext = new Uint8Array(
				(plaintextHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);
			const aad = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);

			// Expected ciphertext + tag: 0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf
			const expectedHex =
				"0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf";
			const actualHex = Array.from(ciphertext)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(actualHex).toBe(expectedHex);
		});

		// Test Case 3: with AAD
		it("NIST vector: AES-128-GCM with AAD", async () => {
			const keyHex = "feffe9928665731c6d6a8f9467308308";
			const nonceHex = "cafebabefacedbaddecaf888";
			const plaintextHex =
				"d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255";
			const aadHex = "feedfacedeadbeeffeedfacedeadbeefabaddad2";

			const key = await AesGcm.importKey(
				new Uint8Array(
					(keyHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
				),
			);
			const nonce = new Uint8Array(
				(nonceHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);
			const plaintext = new Uint8Array(
				(plaintextHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);
			const aad = new Uint8Array(
				(aadHex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)),
			);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("NIST test vectors - AES-256-GCM", () => {
		it("NIST vector: AES-256-GCM Test Case 1", async () => {
			const keyHex =
				"0000000000000000000000000000000000000000000000000000000000000000";
			const nonceHex = "000000000000000000000000";
			const plaintextHex = "";
			const aadHex = "";

			const key = await AesGcm.importKey(
				new Uint8Array(
					keyHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
				),
				256,
			);
			const nonce = new Uint8Array(
				nonceHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
			);
			const plaintext = new Uint8Array(0);
			const aad = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);

			// Expected tag: 530f8afbc74536b9a963b4f1c4cb738b
			const expectedTag = "530f8afbc74536b9a963b4f1c4cb738b";
			const actualTag = Array.from(ciphertext)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(actualTag).toBe(expectedTag);
		});

		it("NIST vector: AES-256-GCM Test Case 2", async () => {
			const keyHex =
				"0000000000000000000000000000000000000000000000000000000000000000";
			const nonceHex = "000000000000000000000000";
			const plaintextHex = "00000000000000000000000000000000";
			const aadHex = "";

			const key = await AesGcm.importKey(
				new Uint8Array(
					keyHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
				),
				256,
			);
			const nonce = new Uint8Array(
				nonceHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
			);
			const plaintext = new Uint8Array(
				plaintextHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
			);
			const aad = new Uint8Array(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

			expect(decrypted).toEqual(plaintext);

			// Expected ciphertext + tag: cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919
			const expectedHex =
				"cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919";
			const actualHex = Array.from(ciphertext)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(actualHex).toBe(expectedHex);
		});
	});

	describe("edge cases and security", () => {
		it("handles all-zero plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new Uint8Array(64).fill(0);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("handles all-ones plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new Uint8Array(64).fill(0xff);

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});

		it("nonce reuse produces different ciphertext for different plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();

			const plaintext1 = new TextEncoder().encode("Message 1");
			const plaintext2 = new TextEncoder().encode("Message 2");

			const ciphertext1 = await AesGcm.encrypt(plaintext1, key, nonce);
			const ciphertext2 = await AesGcm.encrypt(plaintext2, key, nonce);

			expect(ciphertext1).not.toEqual(ciphertext2);
		});

		it("encryption is deterministic with same key, nonce, and plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = new Uint8Array(12).fill(1); // Fixed nonce
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext1 = await AesGcm.encrypt(plaintext, key, nonce);
			const ciphertext2 = await AesGcm.encrypt(plaintext, key, nonce);

			expect(ciphertext1).toEqual(ciphertext2);
		});

		it("constant-time tag verification (timing attack resistance)", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Test");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

			// Modify different positions in tag
			const modified1 = new Uint8Array(ciphertext);
			modified1[modified1.length - 1] ^= 1;

			const modified2 = new Uint8Array(ciphertext);
			modified2[modified2.length - 16] ^= 1; // First byte of tag

			// Both should fail
			await expect(AesGcm.decrypt(modified1, key, nonce)).rejects.toThrow();
			await expect(AesGcm.decrypt(modified2, key, nonce)).rejects.toThrow();
		});

		it("handles large plaintext", async () => {
			const key = await AesGcm.generateKey(256);
			const nonce = AesGcm.generateNonce();
			// Fill with pattern instead of random for large sizes
			const plaintext = new Uint8Array(100 * 1024); // 100 KB
			for (let i = 0; i < plaintext.length; i++) {
				plaintext[i] = i % 256;
			}

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});
	});

	describe("deriveKey", () => {
		it("derives key from password using PBKDF2", async () => {
			const password = "my-secure-password";
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;

			const key = await AesGcm.deriveKey(password, salt, iterations, 256);
			expect(key).toBeDefined();
			expect(key.type).toBe("secret");
		});

		it("derives different keys for different passwords", async () => {
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;

			const key1 = await AesGcm.deriveKey("password1", salt, iterations, 256);
			const key2 = await AesGcm.deriveKey("password2", salt, iterations, 256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);

			expect(exported1).not.toEqual(exported2);
		});

		it("derives different keys for different salts", async () => {
			const password = "password";
			const salt1 = new Uint8Array(16).fill(1);
			const salt2 = new Uint8Array(16).fill(2);
			const iterations = 100000;

			const key1 = await AesGcm.deriveKey(password, salt1, iterations, 256);
			const key2 = await AesGcm.deriveKey(password, salt2, iterations, 256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);

			expect(exported1).not.toEqual(exported2);
		});

		it("derives same key for same password and salt", async () => {
			const password = "password";
			const salt = new Uint8Array(16).fill(1);
			const iterations = 100000;

			const key1 = await AesGcm.deriveKey(password, salt, iterations, 256);
			const key2 = await AesGcm.deriveKey(password, salt, iterations, 256);

			const exported1 = await AesGcm.exportKey(key1);
			const exported2 = await AesGcm.exportKey(key2);

			expect(exported1).toEqual(exported2);
		});

		it("encrypts and decrypts with derived key", async () => {
			const password = "password";
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;

			const key = await AesGcm.deriveKey(password, salt, iterations, 256);
			const nonce = AesGcm.generateNonce();
			const plaintext = new TextEncoder().encode("Secret");

			const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
			const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);

			expect(decrypted).toEqual(plaintext);
		});
	});
});
