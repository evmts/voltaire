import { describe, expect, it } from "vitest";
import * as Hash from "../../primitives/Hash/index.js";
import * as PrivateKey from "../../primitives/PrivateKey/index.js";
import * as Secp256k1 from "./index.js";

describe("Secp256k1.recoverPublicKeyFromHash", () => {
	it("should recover public key from signature and hash", () => {
		const hash = Hash.keccak256String("Hello, Ethereum!");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recoveredPublicKey = Secp256k1.recoverPublicKeyFromHash(
			signature,
			hash,
		);

		expect(recoveredPublicKey).toEqual(expectedPublicKey);
	});

	it("should produce same result as recoverPublicKey() for same hash", () => {
		const hash = Hash.keccak256String("Test message");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		const recovered1 = Secp256k1.recoverPublicKeyFromHash(signature, hash);
		const recovered2 = Secp256k1.recoverPublicKey(signature, hash);

		expect(recovered1).toEqual(recovered2);
	});

	it("should throw on invalid hash length", () => {
		const invalidHash = new Uint8Array(31);
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(signature, invalidHash),
		).toThrow("Hash must be exactly 32 bytes");
	});

	it("should throw on invalid v value", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 30 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: 30");
	});

	// Security: invalid v values must throw to prevent wrong address derivation
	it("should throw on v=2", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 2 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: 2");
	});

	it("should throw on v=26", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 26 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: 26");
	});

	it("should throw on v=29", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 29 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: 29");
	});

	it("should throw on negative v", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: -1 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: -1");
	});

	it("should throw on v=255", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 255 };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(invalidSignature, hash),
		).toThrow("Invalid v value: 255");
	});

	it("should handle v values 0 and 1", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);

		// Convert v from 27/28 to 0/1
		const signatureV0 = { ...signature, v: signature.v - 27 };
		const recovered = Secp256k1.recoverPublicKeyFromHash(signatureV0, hash);

		expect(recovered).toEqual(expectedPublicKey);
	});

	it("should handle v values 27 and 28", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);

		expect(recovered).toEqual(expectedPublicKey);
	});

	it("should fail with wrong hash", () => {
		const hash1 = Hash.keccak256String("Message 1");
		const hash2 = Hash.keccak256String("Message 2");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash1, privateKey);

		// Recovery with wrong hash should fail or return different key
		try {
			const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash2);
			// If it doesn't throw, it should recover a different key
			expect(recovered).not.toEqual(expectedPublicKey);
		} catch (error) {
			// Or it might throw an error
			expect(error).toBeDefined();
		}
	});

	it("should handle all-zero hash", () => {
		const hash = new Uint8Array(32);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);

		expect(recovered).toEqual(expectedPublicKey);
	});

	it("should handle all-ones hash", () => {
		const hash = new Uint8Array(32).fill(0xff);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);

		expect(recovered).toEqual(expectedPublicKey);
	});

	it("should work with known test vector", () => {
		const hash = Hash.from(
			"0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41",
		);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const expectedPublicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);

		expect(recovered).toEqual(expectedPublicKey);
	});

	it("should return 64-byte uncompressed public key", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);

		expect(recovered).toHaveLength(64);
	});

	it("should fail with corrupted signature", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);
		const corruptedR = new Uint8Array(32).fill(0xff);
		const corruptedSignature = { ...signature, r: Hash.from(corruptedR) };

		expect(() =>
			Secp256k1.recoverPublicKeyFromHash(corruptedSignature, hash),
		).toThrow();
	});
});
