import { describe, expect, it } from "vitest";
import * as Hash from "../../primitives/Hash/index.js";
import * as PrivateKey from "../../primitives/PrivateKey/index.js";
import * as Secp256k1 from "./index.js";

/**
 * Integration tests for hash-level API
 *
 * These tests verify that the hash-level API (signHash, verifyHash, recoverPublicKeyFromHash)
 * works correctly and is compatible with libraries like OX that operate at the hash level.
 */

describe("Secp256k1 Hash-Level API Integration", () => {
	describe("API Consistency", () => {
		it("should produce identical results for hash-level and message-level APIs", () => {
			const message = "Hello, Ethereum!";
			const hash = Hash.keccak256String(message);
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Hash-level API
			const hashSig = Secp256k1.signHash(hash, privateKey);
			const hashValid = Secp256k1.verifyHash(hashSig, hash, publicKey);
			const hashRecovered = Secp256k1.recoverPublicKeyFromHash(hashSig, hash);

			// Message-level API
			const msgSig = Secp256k1.sign(hash, privateKey);
			const msgValid = Secp256k1.verify(msgSig, hash, publicKey);
			const msgRecovered = Secp256k1.recoverPublicKey(msgSig, hash);

			// All should produce identical results
			expect(hashSig).toEqual(msgSig);
			expect(hashValid).toBe(msgValid);
			expect(hashValid).toBe(true);
			expect(hashRecovered).toEqual(msgRecovered);
			expect(hashRecovered).toEqual(publicKey);
		});

		it("should demonstrate hash-level API use case: custom hashing", () => {
			// Use case: signing with a custom 32-byte hash (any source)
			// For this test, we'll use a different keccak256 hash to show it works with any 32-byte hash
			const message = "Custom hashing scheme";
			const customHash = Hash.keccak256String(message);
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Sign with hash-level API (can use any 32-byte hash)
			const signature = Secp256k1.signHash(customHash, privateKey);

			// Verify and recover work correctly
			expect(Secp256k1.verifyHash(signature, customHash, publicKey)).toBe(true);
			expect(Secp256k1.recoverPublicKeyFromHash(signature, customHash)).toEqual(
				publicKey,
			);
		});

		it("should demonstrate hash-level API use case: pre-computed hash", () => {
			// Use case: hash is already computed elsewhere
			const preComputedHash = Hash.from(
				"0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41",
			);
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Can sign directly without knowing the original message
			const signature = Secp256k1.signHash(preComputedHash, privateKey);

			expect(Secp256k1.verifyHash(signature, preComputedHash, publicKey)).toBe(
				true,
			);
			expect(
				Secp256k1.recoverPublicKeyFromHash(signature, preComputedHash),
			).toEqual(publicKey);
		});
	});

	describe("Cross-Validation", () => {
		it("should validate signature signed by hash-level API with message-level API", () => {
			const hash = Hash.keccak256String("Test");
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Sign with hash-level API
			const signature = Secp256k1.signHash(hash, privateKey);

			// Verify with message-level API
			const isValid = Secp256k1.verify(signature, hash, publicKey);
			expect(isValid).toBe(true);

			// Recover with message-level API
			const recovered = Secp256k1.recoverPublicKey(signature, hash);
			expect(recovered).toEqual(publicKey);
		});

		it("should validate signature signed by message-level API with hash-level API", () => {
			const hash = Hash.keccak256String("Test");
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Sign with message-level API
			const signature = Secp256k1.sign(hash, privateKey);

			// Verify with hash-level API
			const isValid = Secp256k1.verifyHash(signature, hash, publicKey);
			expect(isValid).toBe(true);

			// Recover with hash-level API
			const recovered = Secp256k1.recoverPublicKeyFromHash(signature, hash);
			expect(recovered).toEqual(publicKey);
		});
	});

	describe("Error Handling", () => {
		it("should throw on hash length mismatch in signHash", () => {
			const invalidHash = new Uint8Array(16); // Wrong length
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);

			expect(() => Secp256k1.signHash(invalidHash, privateKey)).toThrow(
				"Hash must be exactly 32 bytes",
			);
		});

		it("should throw on hash length mismatch in verifyHash", () => {
			const hash = Hash.keccak256String("Test");
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const signature = Secp256k1.signHash(hash, privateKey);

			const invalidHash = new Uint8Array(16);

			expect(() =>
				Secp256k1.verifyHash(signature, invalidHash, publicKey),
			).toThrow("Hash must be exactly 32 bytes");
		});

		it("should throw on hash length mismatch in recoverPublicKeyFromHash", () => {
			const hash = Hash.keccak256String("Test");
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const signature = Secp256k1.signHash(hash, privateKey);

			const invalidHash = new Uint8Array(64);

			expect(() =>
				Secp256k1.recoverPublicKeyFromHash(signature, invalidHash),
			).toThrow("Hash must be exactly 32 bytes");
		});
	});

	describe("Edge Cases", () => {
		it("should handle minimum hash value (all zeros)", () => {
			const hash = new Uint8Array(32); // All zeros
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			const signature = Secp256k1.signHash(hash, privateKey);
			expect(Secp256k1.verifyHash(signature, hash, publicKey)).toBe(true);
			expect(Secp256k1.recoverPublicKeyFromHash(signature, hash)).toEqual(
				publicKey,
			);
		});

		it("should handle maximum hash value (all ones)", () => {
			const hash = new Uint8Array(32).fill(0xff);
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			const signature = Secp256k1.signHash(hash, privateKey);
			expect(Secp256k1.verifyHash(signature, hash, publicKey)).toBe(true);
			expect(Secp256k1.recoverPublicKeyFromHash(signature, hash)).toEqual(
				publicKey,
			);
		});

		it("should handle various hash patterns", () => {
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			const patterns = [
				new Uint8Array(32).fill(0xaa), // Alternating bits
				new Uint8Array(32).fill(0x55), // Alternating bits (inverse)
				new Uint8Array(32).map((_, i) => i), // Sequential
				new Uint8Array(32).map((_, i) => 255 - i), // Reverse sequential
			];

			for (const hash of patterns) {
				const signature = Secp256k1.signHash(hash, privateKey);
				expect(Secp256k1.verifyHash(signature, hash, publicKey)).toBe(true);
				expect(Secp256k1.recoverPublicKeyFromHash(signature, hash)).toEqual(
					publicKey,
				);
			}
		});
	});

	describe("Real-World Scenarios", () => {
		it("should handle transaction signing workflow", () => {
			// Simulate signing a transaction hash
			const txHash = Hash.keccak256String(
				JSON.stringify({
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
					value: "1000000000000000000",
					nonce: 0,
				}),
			);

			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Sign transaction hash
			const signature = Secp256k1.signHash(txHash, privateKey);

			// Verify signature
			expect(Secp256k1.verifyHash(signature, txHash, publicKey)).toBe(true);

			// Recover signer
			const signer = Secp256k1.recoverPublicKeyFromHash(signature, txHash);
			expect(signer).toEqual(publicKey);
		});

		it("should handle message signing workflow with EIP-191 prefix", () => {
			const message = "Hello, Ethereum!";

			// Compute EIP-191 prefixed hash manually
			const prefix = "\x19Ethereum Signed Message:\n";
			const prefixedMessage = `${prefix}${message.length}${message}`;
			const hash = Hash.keccak256String(prefixedMessage);

			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Sign the prefixed hash
			const signature = Secp256k1.signHash(hash, privateKey);

			// Verify and recover
			expect(Secp256k1.verifyHash(signature, hash, publicKey)).toBe(true);
			expect(Secp256k1.recoverPublicKeyFromHash(signature, hash)).toEqual(
				publicKey,
			);
		});

		it("should demonstrate deterministic signatures (RFC 6979)", () => {
			const hash = Hash.keccak256String("Deterministic test");
			const privateKey = PrivateKey.from(
				"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
			);

			// Multiple signatures should be identical
			const sig1 = Secp256k1.signHash(hash, privateKey);
			const sig2 = Secp256k1.signHash(hash, privateKey);
			const sig3 = Secp256k1.signHash(hash, privateKey);

			expect(sig1).toEqual(sig2);
			expect(sig2).toEqual(sig3);
		});
	});
});
