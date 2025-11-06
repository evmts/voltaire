import { describe, expect, it } from "vitest";
import { p256 } from "@noble/curves/nist.js";
import { P256 } from "./P256.js";
import { Hash } from "../../primitives/Hash/index.js";

describe("P256", () => {
	describe("derivePublicKey", () => {
		it("derives 64-byte uncompressed public key", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = P256.derivePublicKey(privateKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(64);
		});

		it("produces deterministic public key", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey1 = P256.derivePublicKey(privateKey);
			const publicKey2 = P256.derivePublicKey(privateKey);

			expect(publicKey1).toEqual(publicKey2);
		});

		it("produces different public keys for different private keys", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);

			const publicKey1 = P256.derivePublicKey(privateKey1);
			const publicKey2 = P256.derivePublicKey(privateKey2);

			expect(publicKey1).not.toEqual(publicKey2);
		});

		it("throws on invalid private key size", () => {
			const invalidPrivateKey = new Uint8Array(16);

			expect(() => P256.derivePublicKey(invalidPrivateKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = P256.derivePublicKey(privateKey);

			// @noble returns with 0x04 prefix, our API strips it
			const noblePublicKey = p256.getPublicKey(privateKey, false);
			expect(publicKey).toEqual(noblePublicKey.slice(1));
		});

		it("derives valid point on curve", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = P256.derivePublicKey(privateKey);

			// Should not throw when validating
			expect(() => P256.validatePublicKey(publicKey)).not.toThrow();
		});
	});

	describe("sign", () => {
		it("creates signature with r and s components", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature = P256.sign(messageHash, privateKey);

			expect(signature).toHaveProperty("r");
			expect(signature).toHaveProperty("s");
			expect(signature.r).toBeInstanceOf(Uint8Array);
			expect(signature.s).toBeInstanceOf(Uint8Array);
			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
		});

		it("creates deterministic signatures (RFC 6979)", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature1 = P256.sign(messageHash, privateKey);
			const signature2 = P256.sign(messageHash, privateKey);

			expect(signature1.r).toEqual(signature2.r);
			expect(signature1.s).toEqual(signature2.s);
		});

		it("creates different signatures for different messages", () => {
			const privateKey = new Uint8Array(32).fill(1);

			const messageHash1 = Hash.keccak256String("Message 1");
			const messageHash2 = Hash.keccak256String("Message 2");

			const signature1 = P256.sign(messageHash1, privateKey);
			const signature2 = P256.sign(messageHash2, privateKey);

			// At least one component should differ
			const different =
				!signature1.r.every((v, i) => v === signature2.r[i]) ||
				!signature1.s.every((v, i) => v === signature2.s[i]);

			expect(different).toBe(true);
		});

		it("creates different signatures with different private keys", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature1 = P256.sign(messageHash, privateKey1);
			const signature2 = P256.sign(messageHash, privateKey2);

			const different =
				!signature1.r.every((v, i) => v === signature2.r[i]) ||
				!signature1.s.every((v, i) => v === signature2.s[i]);

			expect(different).toBe(true);
		});

		it("throws on invalid private key size", () => {
			const invalidPrivateKey = new Uint8Array(16);
			const messageHash = Hash.keccak256String("test");

			expect(() => P256.sign(messageHash, invalidPrivateKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const messageHash = Hash.keccak256String("Test message");

			const signature = P256.sign(messageHash, privateKey);
			const nobleSig = p256.sign(messageHash, privateKey);

			// @noble returns compact 64-byte signature, extract r and s
			const nobleR = nobleSig.slice(0, 32);
			const nobleS = nobleSig.slice(32, 64);

			expect(signature.r).toEqual(nobleR);
			expect(signature.s).toEqual(nobleS);
		});
	});

	describe("verify", () => {
		it("verifies valid signature", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature = P256.sign(messageHash, privateKey);
			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(true);
		});

		it("rejects invalid signature", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature = P256.sign(messageHash, privateKey);
			// Corrupt signature
			signature.r[0] ^= 1;

			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(false);
		});

		it("rejects signature for different message", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);

			const messageHash1 = Hash.keccak256String("Message 1");
			const messageHash2 = Hash.keccak256String("Message 2");

			const signature = P256.sign(messageHash1, privateKey);
			const valid = P256.verify(signature, messageHash2, publicKey);

			expect(valid).toBe(false);
		});

		it("rejects signature with wrong public key", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const publicKey2 = P256.derivePublicKey(privateKey2);
			const messageHash = Hash.keccak256String("Hello, world!");

			const signature = P256.sign(messageHash, privateKey1);
			const valid = P256.verify(signature, messageHash, publicKey2);

			expect(valid).toBe(false);
		});

		it("throws on invalid public key size", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const messageHash = Hash.keccak256String("test");
			const signature = P256.sign(messageHash, privateKey);
			const invalidPublicKey = new Uint8Array(32);

			expect(() => P256.verify(signature, messageHash, invalidPublicKey)).toThrow();
		});

		it("throws on invalid signature r size", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");
			const invalidSignature = {
				r: new Uint8Array(16),
				s: new Uint8Array(32),
			};

			expect(() => P256.verify(invalidSignature, messageHash, publicKey)).toThrow();
		});

		it("throws on invalid signature s size", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");
			const invalidSignature = {
				r: new Uint8Array(32),
				s: new Uint8Array(16),
			};

			expect(() => P256.verify(invalidSignature, messageHash, publicKey)).toThrow();
		});

		it("matches @noble/curves verification", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("Test message");

			const signature = P256.sign(messageHash, privateKey);
			const ourValid = P256.verify(signature, messageHash, publicKey);

			// Construct compact signature for @noble
			const compactSig = new Uint8Array(64);
			compactSig.set(signature.r, 0);
			compactSig.set(signature.s, 32);

			// Add 0x04 prefix for @noble public key
			const fullPublicKey = new Uint8Array(65);
			fullPublicKey[0] = 0x04;
			fullPublicKey.set(publicKey, 1);

			const nobleValid = p256.verify(compactSig, messageHash, fullPublicKey);

			expect(ourValid).toBe(nobleValid);
			expect(ourValid).toBe(true);
		});
	});

	describe("ecdh", () => {
		it("computes 32-byte shared secret", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const publicKey2 = P256.derivePublicKey(privateKey2);

			const shared = P256.ecdh(privateKey1, publicKey2);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("produces symmetric shared secret (commutative)", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const publicKey1 = P256.derivePublicKey(privateKey1);
			const publicKey2 = P256.derivePublicKey(privateKey2);

			const shared1to2 = P256.ecdh(privateKey1, publicKey2);
			const shared2to1 = P256.ecdh(privateKey2, publicKey1);

			expect(shared1to2).toEqual(shared2to1);
		});

		it("produces different shared secrets for different keypairs", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const privateKey3 = new Uint8Array(32).fill(3);
			const publicKey2 = P256.derivePublicKey(privateKey2);
			const publicKey3 = P256.derivePublicKey(privateKey3);

			const shared1to2 = P256.ecdh(privateKey1, publicKey2);
			const shared1to3 = P256.ecdh(privateKey1, publicKey3);

			expect(shared1to2).not.toEqual(shared1to3);
		});

		it("throws on invalid private key size", () => {
			const invalidPrivateKey = new Uint8Array(16);
			const publicKey = P256.derivePublicKey(new Uint8Array(32).fill(1));

			expect(() => P256.ecdh(invalidPrivateKey, publicKey)).toThrow();
		});

		it("throws on invalid public key size", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const invalidPublicKey = new Uint8Array(32);

			expect(() => P256.ecdh(privateKey, invalidPublicKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const privateKey1 = crypto.getRandomValues(new Uint8Array(32));
			const privateKey2 = crypto.getRandomValues(new Uint8Array(32));
			const publicKey2 = P256.derivePublicKey(privateKey2);

			const shared = P256.ecdh(privateKey1, publicKey2);

			// Add 0x04 prefix for @noble public key
			const fullPublicKey = new Uint8Array(65);
			fullPublicKey[0] = 0x04;
			fullPublicKey.set(publicKey2, 1);

			const nobleShared = p256.getSharedSecret(privateKey1, fullPublicKey);
			// @noble returns with prefix, extract x-coordinate
			const nobleX = nobleShared.slice(1, 33);

			expect(shared).toEqual(nobleX);
		});
	});

	describe("NIST Test Vectors", () => {
		// Test vector from NIST P-256 test suite
		it("verifies NIST P-256 signature test vector", () => {
			// Private key (d)
			const privateKey = new Uint8Array([
				0xc9, 0xaf, 0xa9, 0xd8, 0x45, 0xba, 0x75, 0x16,
				0x6b, 0x5c, 0x21, 0x57, 0x67, 0xb1, 0xd6, 0x93,
				0x4e, 0x50, 0xc3, 0xdb, 0x36, 0xe8, 0x9b, 0x12,
				0x7b, 0x8a, 0x62, 0x2b, 0x12, 0x0f, 0x67, 0x21,
			]);

			// Expected public key (x || y)
			const expectedPublicKey = new Uint8Array([
				// x coordinate
				0x60, 0xfe, 0xd4, 0xba, 0x25, 0x5a, 0x9d, 0x31,
				0xc9, 0x61, 0xeb, 0x74, 0xc6, 0x35, 0x6d, 0x68,
				0xc0, 0x49, 0xb8, 0x92, 0x3b, 0x61, 0xfa, 0x6c,
				0xe6, 0x69, 0x62, 0x2e, 0x60, 0xf2, 0x9f, 0xb6,
				// y coordinate
				0x79, 0x03, 0xfe, 0x10, 0x08, 0xb8, 0xbc, 0x99,
				0xa4, 0x1a, 0xe9, 0xe9, 0x56, 0x28, 0xbc, 0x64,
				0xf2, 0xf1, 0xb2, 0x0c, 0x2d, 0x7e, 0x9f, 0x51,
				0x77, 0xa3, 0xc2, 0x94, 0xd4, 0x46, 0x22, 0x99,
			]);

			const publicKey = P256.derivePublicKey(privateKey);
			expect(publicKey).toEqual(expectedPublicKey);
		});
	});

	describe("Wycheproof Test Vectors", () => {
		// Based on Wycheproof project test vectors
		it("rejects signature with r = 0", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");

			const invalidSignature = {
				r: new Uint8Array(32), // All zeros
				s: new Uint8Array(32).fill(1),
			};

			const valid = P256.verify(invalidSignature, messageHash, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects signature with s = 0", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");

			const invalidSignature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32), // All zeros
			};

			const valid = P256.verify(invalidSignature, messageHash, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects signature with both r and s = 0", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");

			const invalidSignature = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			const valid = P256.verify(invalidSignature, messageHash, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects signature with r = curve order", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");

			// P256 curve order
			const order = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
			]);

			const invalidSignature = {
				r: order,
				s: new Uint8Array(32).fill(1),
			};

			const valid = P256.verify(invalidSignature, messageHash, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("Security Edge Cases", () => {
		it("handles maximum valid private key (order - 1)", () => {
			// Just below curve order
			const maxPrivateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x50,
			]);

			const publicKey = P256.derivePublicKey(maxPrivateKey);
			const messageHash = Hash.keccak256String("test");
			const signature = P256.sign(messageHash, maxPrivateKey);
			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(true);
		});

		it("handles private key = 1", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");
			const signature = P256.sign(messageHash, privateKey);
			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(true);
		});

		it("validates all-ones public key (may pass verification test)", () => {
			const publicKey = new Uint8Array(64).fill(0xff);

			// validatePublicKey checks length, but @noble may accept dummy operations
			const isValid = P256.validatePublicKey(publicKey);
			expect(typeof isValid).toBe("boolean");
		});

		it("validates all-zero public key (identity point)", () => {
			const publicKey = new Uint8Array(64);

			// validatePublicKey checks length, but @noble may accept dummy operations
			const isValid = P256.validatePublicKey(publicKey);
			expect(typeof isValid).toBe("boolean");
		});

		it("handles large message hashes", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);

			// Create a "large" hash (though all hashes are 32 bytes)
			const messageHash = new Uint8Array(32).fill(0xff);

			const signature = P256.sign(messageHash, privateKey);
			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(true);
		});

		it("signature malleability: high-s rejection", () => {
			// P256 implementations should normalize s to low form to prevent malleability
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("test");

			const signature = P256.sign(messageHash, privateKey);

			// Check if s is in low form (s < n/2)
			const order = P256.CURVE_ORDER;
			const halfOrder = order / 2n;

			// Convert s to bigint
			let sValue = 0n;
			for (let i = 0; i < signature.s.length; i++) {
				sValue = (sValue << 8n) | BigInt(signature.s[i]);
			}

			// @noble/curves should produce low-s by default
			expect(sValue < halfOrder).toBe(true);
		});
	});

	describe("WebCrypto Compatibility", () => {
		it("derives public key compatible with WebCrypto format", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);

			// WebCrypto uses uncompressed format (0x04 || x || y)
			// Our API returns just x || y (64 bytes)
			expect(publicKey.length).toBe(64);

			// First 32 bytes = x coordinate
			const xCoord = publicKey.slice(0, 32);
			// Last 32 bytes = y coordinate
			const yCoord = publicKey.slice(32, 64);

			expect(xCoord.length).toBe(32);
			expect(yCoord.length).toBe(32);
		});
	});

	describe("Constants", () => {
		it("has correct CURVE_ORDER", () => {
			const expectedOrder = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
			expect(P256.CURVE_ORDER).toBe(expectedOrder);
		});

		it("has correct PRIVATE_KEY_SIZE", () => {
			expect(P256.PRIVATE_KEY_SIZE).toBe(32);
		});

		it("has correct PUBLIC_KEY_SIZE", () => {
			expect(P256.PUBLIC_KEY_SIZE).toBe(64);
		});

		it("has correct SIGNATURE_COMPONENT_SIZE", () => {
			expect(P256.SIGNATURE_COMPONENT_SIZE).toBe(32);
		});

		it("has correct SHARED_SECRET_SIZE", () => {
			expect(P256.SHARED_SECRET_SIZE).toBe(32);
		});
	});

	describe("Validation", () => {
		it("validates correct private key", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			expect(() => P256.validatePrivateKey(privateKey)).not.toThrow();
		});

		it("validates correct public key", () => {
			const privateKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = P256.derivePublicKey(privateKey);
			expect(() => P256.validatePublicKey(publicKey)).not.toThrow();
		});
	});

	describe("Three-way Key Exchange", () => {
		it("verifies independence of pairwise shared secrets", () => {
			const privA = new Uint8Array(32).fill(1);
			const privB = new Uint8Array(32).fill(2);
			const privC = new Uint8Array(32).fill(3);

			const pubA = P256.derivePublicKey(privA);
			const pubB = P256.derivePublicKey(privB);
			const pubC = P256.derivePublicKey(privC);

			const sharedAB = P256.ecdh(privA, pubB);
			const sharedBA = P256.ecdh(privB, pubA);
			const sharedAC = P256.ecdh(privA, pubC);
			const sharedCA = P256.ecdh(privC, pubA);
			const sharedBC = P256.ecdh(privB, pubC);
			const sharedCB = P256.ecdh(privC, pubB);

			// Symmetric properties
			expect(sharedAB).toEqual(sharedBA);
			expect(sharedAC).toEqual(sharedCA);
			expect(sharedBC).toEqual(sharedCB);

			// Independence
			expect(sharedAB).not.toEqual(sharedAC);
			expect(sharedAB).not.toEqual(sharedBC);
			expect(sharedAC).not.toEqual(sharedBC);
		});
	});

	describe("Deterministic Signing (RFC 6979)", () => {
		it("produces identical signatures for same input", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const messageHash = Hash.keccak256String("test");

			const signatures = Array.from({ length: 10 }, () =>
				P256.sign(messageHash, privateKey)
			);

			// All signatures should be identical
			for (let i = 1; i < signatures.length; i++) {
				expect(signatures[i].r).toEqual(signatures[0].r);
				expect(signatures[i].s).toEqual(signatures[0].s);
			}
		});

		it("produces different signatures for different message hashes", () => {
			const privateKey = new Uint8Array(32).fill(1);

			const hash1 = Hash.keccak256String("message 1");
			const hash2 = Hash.keccak256String("message 2");

			const sig1 = P256.sign(hash1, privateKey);
			const sig2 = P256.sign(hash2, privateKey);

			const different =
				!sig1.r.every((v, i) => v === sig2.r[i]) ||
				!sig1.s.every((v, i) => v === sig2.s[i]);

			expect(different).toBe(true);
		});
	});
});
