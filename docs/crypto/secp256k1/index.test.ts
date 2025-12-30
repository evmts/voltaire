/**
 * Tests for docs/crypto/secp256k1/index.mdx
 *
 * Validates that all code examples in the Secp256k1 documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("Secp256k1 Documentation - index.mdx", () => {
	describe("Quick Start", () => {
		it("should sign a message hash", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const messageHash = Keccak256.hashString("Hello, Ethereum!");
			const privateKey = Hex.toBytes(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const signature = Secp256k1.sign(messageHash, privateKey);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
			expect(signature.v === 27 || signature.v === 28).toBe(true);
		});

		it("should verify signature", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const messageHash = Keccak256.hashString("Hello, Ethereum!");
			const privateKey = Hex.toBytes(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const signature = Secp256k1.sign(messageHash, privateKey);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const isValid = Secp256k1.verify(signature, messageHash, publicKey);

			expect(isValid).toBe(true);
		});

		it("should recover public key from signature", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const messageHash = Keccak256.hashString("Hello, Ethereum!");
			const privateKey = Hex.toBytes(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const signature = Secp256k1.sign(messageHash, privateKey);
			const recovered = Secp256k1.recoverPublicKey(signature, messageHash);

			const publicKey = Secp256k1.derivePublicKey(privateKey);
			expect(recovered).toEqual(publicKey);
		});
	});

	describe("Signing API", () => {
		it("sign returns v = 27 or 28", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const privateKey = new Uint8Array(32);
			privateKey[31] = 1; // Private key = 1

			const messageHash = Keccak256.hashString("test");
			const signature = Secp256k1.sign(messageHash, privateKey);

			expect(signature.v === 27 || signature.v === 28).toBe(true);
			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
		});
	});

	describe("Verification API", () => {
		it("verify returns boolean", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const messageHash = Keccak256.hashString("test");
			const signature = Secp256k1.sign(messageHash, privateKey);
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			const valid = Secp256k1.verify(signature, messageHash, publicKey);
			expect(typeof valid).toBe("boolean");
			expect(valid).toBe(true);
		});
	});

	describe("Key Management", () => {
		it("should generate random private key", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");

			const privateKey = Secp256k1.randomPrivateKey();

			expect(privateKey.length).toBe(32);
			expect(Secp256k1.isValidPrivateKey(privateKey)).toBe(true);
		});

		it("should create key pair", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");

			const { privateKey, publicKey } = Secp256k1.createKeyPair();

			expect(privateKey.length).toBe(32);
			expect(publicKey.length).toBe(64);

			// Public key matches derivation
			const derived = Secp256k1.derivePublicKey(privateKey);
			expect(derived).toEqual(publicKey);
		});

		it("should derive public key from private key", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");

			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const publicKey = Secp256k1.derivePublicKey(privateKey);

			expect(publicKey.length).toBe(64); // x || y, no 0x04 prefix
		});

		it("should validate private key", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");

			// Valid private key
			const validKey = new Uint8Array(32);
			validKey[31] = 1;
			expect(Secp256k1.isValidPrivateKey(validKey)).toBe(true);

			// Zero key is invalid
			const zeroKey = new Uint8Array(32);
			expect(Secp256k1.isValidPrivateKey(zeroKey)).toBe(false);
		});

		it("should validate public key", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");

			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			expect(Secp256k1.isValidPublicKey(publicKey)).toBe(true);
		});
	});

	describe("RFC 6979 Deterministic Signatures", () => {
		it("should produce identical signatures for same input", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Private key = 1
			const privateKey = Hex.toBytes(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);

			// Message hash
			const messageHash = Keccak256.hashString("hello world");

			// Sign twice - should produce identical signatures
			const sig1 = Secp256k1.sign(messageHash, privateKey);
			const sig2 = Secp256k1.sign(messageHash, privateKey);

			// Same message + key = same signature (deterministic)
			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig1.v).toBe(sig2.v);
		});
	});

	describe("Signature Recovery", () => {
		it("should recover public key correctly", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const privateKey = Hex.toBytes(
				"0x000000000000000000000000000000000000000000000000000000000000002a",
			);
			const messageHash = Keccak256.hashString("test recovery");

			const signature = Secp256k1.sign(messageHash, privateKey);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const recovered = Secp256k1.recoverPublicKey(signature, messageHash);

			// Recovered key matches original
			expect(recovered).toEqual(publicKey);
		});
	});

	describe("Edge Cases", () => {
		it("minimum valid private key (1)", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const minKey = Hex.toBytes(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const messageHash = Keccak256.hashString("test");
			const sig = Secp256k1.sign(messageHash, minKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});

		it("zero private key throws", async () => {
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const zeroKey = Hex.toBytes(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			const messageHash = Keccak256.hashString("test");

			expect(() => Secp256k1.sign(messageHash, zeroKey)).toThrow();
		});
	});

	describe("Address Derivation (Ethereum Integration)", () => {
		it("should derive address from public key", async () => {
			const { Address } = await import("../../../src/primitives/Address/index.js");
			const { Secp256k1 } = await import("../../../src/crypto/Secp256k1/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Known test vector from Foundry anvil
			const privateKey = Hex.toBytes(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);

			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const address = Address.fromPublicKey(publicKey);

			expect(Address.toChecksummed(address)).toBe(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);
		});
	});
});
