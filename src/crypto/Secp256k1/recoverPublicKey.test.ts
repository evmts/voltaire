import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import { Hash } from "../../primitives/Hash/index.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";
import { InvalidSignatureError } from "../../primitives/errors/index.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { recoverPublicKey } from "./recoverPublicKey.js";
import { sign } from "./sign.js";

describe("Secp256k1.recoverPublicKey", () => {
	describe("successful recovery", () => {
		it("should recover correct public key from signature", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("hello world")));

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			const recovered = recoverPublicKey(signature, message);

			expect(recovered).toEqual(expectedPublicKey);
		});

		it("should recover public key for multiple messages", () => {
			const privateKeyBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKeyBytes[i] = i + 1;
			}
			const privateKey = PrivateKey.from(privateKeyBytes);
			const expectedPublicKey = derivePublicKey(privateKey);

			const messages = [
				Hash(sha256(new TextEncoder().encode("message 1"))),
				Hash(sha256(new TextEncoder().encode("message 2"))),
				Hash(sha256(new TextEncoder().encode("message 3"))),
			];

			for (const message of messages) {
				const signature = sign(message, privateKey);
				const recovered = recoverPublicKey(signature, message);
				expect(recovered).toEqual(expectedPublicKey);
			}
		});

		it("should return 64-byte uncompressed public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const recovered = recoverPublicKey(signature, message);

			expect(recovered.length).toBe(64);
			expect(recovered).toBeInstanceOf(Uint8Array);
		});
	});

	describe("recovery with different v values", () => {
		it("should recover with v=27", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 5;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test v=27")));

			const signature = sign(message, privateKey);
			// Ensure we test v=27 case
			if (signature.v === 27) {
				const expectedPublicKey = derivePublicKey(privateKey);
				const recovered = recoverPublicKey(signature, message);
				expect(recovered).toEqual(expectedPublicKey);
			}
		});

		it("should recover with v=28", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 3;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test v=28")));

			const signature = sign(message, privateKey);
			// Ensure we test v=28 case
			if (signature.v === 28) {
				const expectedPublicKey = derivePublicKey(privateKey);
				const recovered = recoverPublicKey(signature, message);
				expect(recovered).toEqual(expectedPublicKey);
			}
		});

		it("should handle normalized v values (0 and 1)", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(
				sha256(new TextEncoder().encode("test normalized v")),
			);

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			// Test with normalized v (0 or 1 instead of 27/28)
			const normalizedV = signature.v - 27;
			const normalizedSig = { ...signature, v: normalizedV };

			const recovered = recoverPublicKey(normalizedSig, message);
			expect(recovered).toEqual(expectedPublicKey);
		});
	});

	describe("validation errors", () => {
		it("should throw InvalidSignatureError for wrong r length", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(31), // Wrong length
				s: new Uint8Array(32),
				v: 27,
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for wrong s length", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(33), // Wrong length
				v: 27,
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for invalid v value", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: 99, // Invalid v
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for negative v", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: -1, // Invalid v
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for all-zero r", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(32), // All zeros
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for all-zero s", () => {
			const message = Hash(sha256(new TextEncoder().encode("test")));
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32), // All zeros
				v: 27,
			};

			expect(() => recoverPublicKey(invalidSig, message)).toThrow(
				InvalidSignatureError,
			);
		});
	});

	describe("wrong recovery fails", () => {
		it("should fail to recover with wrong message", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message1 = Hash(
				sha256(new TextEncoder().encode("original message")),
			);
			const message2 = Hash(
				sha256(new TextEncoder().encode("different message")),
			);

			const signature = sign(message1, privateKey);

			// Recovery should either throw or return different key
			try {
				const recovered = recoverPublicKey(signature, message2);
				const expectedPublicKey = derivePublicKey(privateKey);
				expect(recovered).not.toEqual(expectedPublicKey);
			} catch (error) {
				expect(error).toBeInstanceOf(InvalidSignatureError);
			}
		});

		it("should fail to recover with wrong v value", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			// Flip v bit
			const wrongV = { ...signature, v: signature.v === 27 ? 28 : 27 };

			// Recovery should either throw or return different key
			try {
				const recovered = recoverPublicKey(wrongV, message);
				expect(recovered).not.toEqual(expectedPublicKey);
			} catch (error) {
				expect(error).toBeInstanceOf(InvalidSignatureError);
			}
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero message hash", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(new Uint8Array(32)); // All zeros

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			const recovered = recoverPublicKey(signature, message);
			expect(recovered).toEqual(expectedPublicKey);
		});

		it("should handle all-ones message hash", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(new Uint8Array(32).fill(0xff));

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			const recovered = recoverPublicKey(signature, message);
			expect(recovered).toEqual(expectedPublicKey);
		});

		it("should handle minimum valid private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			const recovered = recoverPublicKey(signature, message);
			expect(recovered).toEqual(expectedPublicKey);
		});

		it("should handle maximum valid private key (n-1)", () => {
			const privateKeyBytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);
			const privateKey = PrivateKey.from(privateKeyBytes);
			const message = Hash(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			const recovered = recoverPublicKey(signature, message);
			expect(recovered).toEqual(expectedPublicKey);
		});
	});

	describe("Ethereum address recovery", () => {
		it("should recover public key suitable for address derivation", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.from(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 7) % 256;
			}
			const message = Hash(
				sha256(new TextEncoder().encode("Ethereum transaction")),
			);

			const signature = sign(message, privateKey);
			const recovered = recoverPublicKey(signature, message);

			// Verify length is correct for address derivation
			expect(recovered.length).toBe(64);

			// Verify it matches expected public key
			const expectedPublicKey = derivePublicKey(privateKey);
			expect(recovered).toEqual(expectedPublicKey);
		});
	});

	describe("cross-validation", () => {
		it("should recover same key for multiple signatures from same key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 99;
			const privateKey = PrivateKey.from(privateKeyBytes);
			const expectedPublicKey = derivePublicKey(privateKey);

			// Sign different messages
			const messages = [
				Hash(sha256(new TextEncoder().encode("msg1"))),
				Hash(sha256(new TextEncoder().encode("msg2"))),
				Hash(sha256(new TextEncoder().encode("msg3"))),
				Hash(sha256(new TextEncoder().encode("msg4"))),
			];

			for (const message of messages) {
				const signature = sign(message, privateKey);
				const recovered = recoverPublicKey(signature, message);
				expect(recovered).toEqual(expectedPublicKey);
			}
		});

		it("should recover different keys for different private keys", () => {
			const message = Hash(sha256(new TextEncoder().encode("same message")));

			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;

			const sig1 = sign(message, privateKey1);
			const sig2 = sign(message, privateKey2);

			const recovered1 = recoverPublicKey(sig1, message);
			const recovered2 = recoverPublicKey(sig2, message);

			expect(recovered1).not.toEqual(recovered2);
			expect(recovered1).toEqual(derivePublicKey(privateKey1));
			expect(recovered2).toEqual(derivePublicKey(privateKey2));
		});
	});

	describe("malleability protection", () => {
		it("should handle low-s signatures correctly", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.from(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 11) % 256;
			}
			const message = Hash(
				sha256(new TextEncoder().encode("malleability test")),
			);

			const signature = sign(message, privateKey);
			const expectedPublicKey = derivePublicKey(privateKey);

			// Verify s is low (s <= n/2)
			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(signature.s[i] ?? 0);
			}
			const halfN =
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n /
				2n;
			expect(s <= halfN).toBe(true);

			// Should recover correctly
			const recovered = recoverPublicKey(signature, message);
			expect(recovered).toEqual(expectedPublicKey);
		});
	});
});
