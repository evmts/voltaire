import { describe, expect, it } from "vitest";
import * as Hash from "../../primitives/Hash/index.js";
import * as PrivateKey from "../../primitives/PrivateKey/index.js";
import * as Secp256k1 from "./index.js";

describe("Secp256k1.verifyHash", () => {
	it("should verify a valid signature", () => {
		const hash = Hash.keccak256String("Hello, Ethereum!");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);

		expect(isValid).toBe(true);
	});

	it("should reject signature with wrong hash", () => {
		const hash1 = Hash.keccak256String("Message 1");
		const hash2 = Hash.keccak256String("Message 2");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash1, privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash2, publicKey);

		expect(isValid).toBe(false);
	});

	it("should reject signature with wrong public key", () => {
		const hash = Hash.keccak256String("Test message");
		const privateKey1 = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const privateKey2 = PrivateKey.from(
			"0x5c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362319",
		);
		const publicKey2 = Secp256k1.derivePublicKey(privateKey2);

		const signature = Secp256k1.signHash(hash, privateKey1);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey2);

		expect(isValid).toBe(false);
	});

	it("should produce same result as verify() for same hash", () => {
		const hash = Hash.keccak256String("Test message");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);

		const valid1 = Secp256k1.verifyHash(signature, hash, publicKey);
		const valid2 = Secp256k1.verify(signature, hash, publicKey);

		expect(valid1).toBe(valid2);
		expect(valid1).toBe(true);
	});

	it("should throw on invalid hash length", () => {
		const invalidHash = new Uint8Array(31);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const hash = Hash.keccak256String("Test");
		const signature = Secp256k1.signHash(hash, privateKey);

		expect(() =>
			Secp256k1.verifyHash(signature, invalidHash, publicKey),
		).toThrow("Hash must be exactly 32 bytes");
	});

	it("should reject signature with invalid v", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const invalidSignature = { ...signature, v: 30 }; // Invalid v

		const isValid = Secp256k1.verifyHash(invalidSignature, hash, publicKey);
		expect(isValid).toBe(false);
	});

	it("should handle corrupted signature r", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const corruptedR = new Uint8Array(32).fill(0xff);
		const corruptedSignature = { ...signature, r: Hash.from(corruptedR) };

		const isValid = Secp256k1.verifyHash(corruptedSignature, hash, publicKey);
		expect(isValid).toBe(false);
	});

	it("should handle corrupted signature s", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const corruptedS = new Uint8Array(32).fill(0xff);
		const corruptedSignature = { ...signature, s: Hash.from(corruptedS) };

		const isValid = Secp256k1.verifyHash(corruptedSignature, hash, publicKey);
		expect(isValid).toBe(false);
	});

	it("should verify all-zero hash", () => {
		const hash = new Uint8Array(32);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);

		expect(isValid).toBe(true);
	});

	it("should verify all-ones hash", () => {
		const hash = new Uint8Array(32).fill(0xff);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);

		expect(isValid).toBe(true);
	});

	it("should handle multiple signatures for same hash", () => {
		const hash = Hash.keccak256String("Test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const sig1 = Secp256k1.signHash(hash, privateKey);
		const sig2 = Secp256k1.signHash(hash, privateKey);

		// Both signatures should be valid (deterministic signing)
		expect(Secp256k1.verifyHash(sig1, hash, publicKey)).toBe(true);
		expect(Secp256k1.verifyHash(sig2, hash, publicKey)).toBe(true);

		// And they should be identical
		expect(sig1.r).toEqual(sig2.r);
		expect(sig1.s).toEqual(sig2.s);
	});

	it("should work with known test vector", () => {
		// Test with a known hash and signature
		const hash = Hash.from(
			"0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41",
		);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const signature = Secp256k1.signHash(hash, privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);

		expect(isValid).toBe(true);
	});
});
