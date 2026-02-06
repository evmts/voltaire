import { describe, expect, it } from "vitest";
import * as Hash from "../../primitives/Hash/index.js";
import * as PrivateKey from "../../primitives/PrivateKey/index.js";
import * as Secp256k1 from "./index.js";

describe("Secp256k1.signHash", () => {
	it("should sign a 32-byte hash", () => {
		const hash = Hash.keccak256String("Hello, Ethereum!");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		expect(signature).toHaveProperty("r");
		expect(signature).toHaveProperty("s");
		expect(signature).toHaveProperty("v");
		expect(signature.r).toHaveLength(32);
		expect(signature.s).toHaveLength(32);
		expect([27, 28]).toContain(signature.v);
	});

	it("should produce same signature as sign() for same hash", () => {
		const hash = Hash.keccak256String("Test message");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const sig1 = Secp256k1.signHash(hash, privateKey);
		const sig2 = Secp256k1.sign(hash, privateKey);

		// Both should produce identical signatures for the same hash
		expect(sig1.r).toEqual(sig2.r);
		expect(sig1.s).toEqual(sig2.s);
		expect(sig1.v).toEqual(sig2.v);
	});

	it("should throw on invalid hash length", () => {
		const invalidHash = new Uint8Array(31); // Wrong length
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		expect(() => Secp256k1.signHash(invalidHash, privateKey)).toThrow(
			"Hash must be exactly 32 bytes",
		);
	});

	it("should throw on zero private key", () => {
		const hash = Hash.keccak256String("Test");
		const zeroKey = new Uint8Array(32); // All zeros

		expect(() => Secp256k1.signHash(hash, zeroKey)).toThrow(
			"Private key cannot be zero",
		);
	});

	it("should work with known test vector", () => {
		// Test vector from Ethereum
		const hash = Hash.from(
			"0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41",
		);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		// Should produce valid signature
		expect(signature.r).toHaveLength(32);
		expect(signature.s).toHaveLength(32);
		expect([27, 28]).toContain(signature.v);

		// Should be verifiable
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);
		expect(isValid).toBe(true);
	});

	it("should produce deterministic signatures (RFC 6979)", () => {
		const hash = Hash.keccak256String("Deterministic test");
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const sig1 = Secp256k1.signHash(hash, privateKey);
		const sig2 = Secp256k1.signHash(hash, privateKey);

		// Same inputs should produce identical signatures
		expect(sig1.r).toEqual(sig2.r);
		expect(sig1.s).toEqual(sig2.s);
		expect(sig1.v).toEqual(sig2.v);
	});

	it("should allow recovery of public key", () => {
		const hash = Hash.keccak256String("Recovery test");
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

	it("should handle different hashes with same key", () => {
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const hash1 = Hash.keccak256String("Message 1");
		const hash2 = Hash.keccak256String("Message 2");

		const sig1 = Secp256k1.signHash(hash1, privateKey);
		const sig2 = Secp256k1.signHash(hash2, privateKey);

		// Different hashes should produce different signatures
		expect(sig1.r).not.toEqual(sig2.r);
		expect(sig1.s).not.toEqual(sig2.s);
	});

	it("should handle all-zero hash", () => {
		const hash = new Uint8Array(32); // All zeros
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		// Should still produce valid signature
		expect(signature.r).toHaveLength(32);
		expect(signature.s).toHaveLength(32);
		expect([27, 28]).toContain(signature.v);

		// Should be verifiable
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);
		expect(isValid).toBe(true);
	});

	it("should handle all-ones hash", () => {
		const hash = new Uint8Array(32).fill(0xff);
		const privateKey = PrivateKey.from(
			"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		);

		const signature = Secp256k1.signHash(hash, privateKey);

		// Should still produce valid signature
		expect(signature.r).toHaveLength(32);
		expect(signature.s).toHaveLength(32);
		expect([27, 28]).toContain(signature.v);

		// Should be verifiable
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const isValid = Secp256k1.verifyHash(signature, hash, publicKey);
		expect(isValid).toBe(true);
	});
});
