import { describe, expect, it } from "vitest";
import { PrivateKey } from "../../../primitives/PrivateKey/index.js";
import { derivePublicKey } from "../derivePublicKey.js";
import * as PublicKey from "./index.js";

describe("Secp256k1.PublicKey.from", () => {
	describe("from bytes", () => {
		it("should create public key from valid 64-byte Uint8Array", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const publicKeyBytes = derivePublicKey(privateKey);

			const publicKey = PublicKey.from(publicKeyBytes);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(64);
		});

		it("should accept Uint8Array directly", () => {
			// Must use a valid curve point - derive from private key
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 2;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const bytes = derivePublicKey(privateKey);

			const publicKey = PublicKey.from(bytes);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("from hex string", () => {
		// Helper to get a valid public key hex
		const getValidPubKeyHex = (seed = 1) => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = seed;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const pubKeyBytes = derivePublicKey(privateKey);
			return Array.from(pubKeyBytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		};

		it("should create public key from hex string with 0x prefix", () => {
			const hexStr = `0x${getValidPubKeyHex(1)}`;

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should create public key from hex string without 0x prefix", () => {
			const hexStr = getValidPubKeyHex(2);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should parse valid hex characters", () => {
			const hexStr = getValidPubKeyHex(3);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should handle uppercase hex characters", () => {
			const hexStr = getValidPubKeyHex(4).toUpperCase();

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should handle mixed case hex characters", () => {
			const hex = getValidPubKeyHex(5);
			// Mix case: alternate upper/lower
			const mixedHex = hex
				.split("")
				.map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
				.join("");

			const publicKey = PublicKey.from(mixedHex);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("validation", () => {
		it("should throw on invalid hex string", () => {
			const invalidHex = `0x${"g".repeat(128)}`;

			expect(() => PublicKey.from(invalidHex)).toThrow(/Invalid hex string/);
		});

		it("should throw InvalidPublicKeyError with correct name for invalid hex", () => {
			const invalidHex = `0x${"g".repeat(128)}`;

			try {
				PublicKey.from(invalidHex);
				expect.fail("Should have thrown");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidPublicKeyError");
			}
		});

		it("should throw on hex string with invalid characters", () => {
			const invalidHex = `xyz123${"a".repeat(122)}`;

			expect(() => PublicKey.from(invalidHex)).toThrow(/Invalid hex string/);
		});

		it("should throw on hex string with wrong length", () => {
			const shortHex = `0x${"a".repeat(126)}`; // 63 bytes

			expect(() => PublicKey.from(shortHex)).toThrow(
				/Invalid public key hex length/,
			);
		});

		it("should throw on too short hex string", () => {
			const shortHex = "a".repeat(64); // 32 bytes

			expect(() => PublicKey.from(shortHex)).toThrow(
				/Invalid public key hex length/,
			);
		});

		it("should throw on too long hex string", () => {
			const longHex = "a".repeat(130); // 65 bytes

			expect(() => PublicKey.from(longHex)).toThrow(
				/Invalid public key hex length/,
			);
		});

		it("should throw on invalid public key bytes (wrong length)", () => {
			const shortBytes = new Uint8Array(63);

			expect(() => PublicKey.from(shortBytes)).toThrow(
				/Invalid public key: expected 64 bytes/,
			);
		});

		it("should throw on too long public key bytes", () => {
			const longBytes = new Uint8Array(65);

			expect(() => PublicKey.from(longBytes)).toThrow(
				/Invalid public key: expected 64 bytes/,
			);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero bytes (invalid curve point)", () => {
			const zeroBytes = new Uint8Array(64);

			expect(() => PublicKey.from(zeroBytes)).toThrow(
				/not a valid point on the secp256k1 curve/,
			);
		});

		it("should handle all-ones bytes (invalid curve point)", () => {
			const onesBytes = new Uint8Array(64).fill(0xff);

			expect(() => PublicKey.from(onesBytes)).toThrow(
				/not a valid point on the secp256k1 curve/,
			);
		});

		it("should handle hex string at exact length boundary", () => {
			// Must use a valid public key
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 10;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const pubKeyBytes = derivePublicKey(privateKey);
			const exactHex = `0x${Array.from(pubKeyBytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			const publicKey = PublicKey.from(exactHex);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("roundtrip conversions", () => {
		it("should roundtrip through hex string", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const original = derivePublicKey(privateKey);

			// Convert to hex
			const hex = `0x${Array.from(original)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			// Convert back
			const publicKey = PublicKey.from(hex);

			expect(publicKey).toEqual(original);
		});

		it("should handle bytes directly without conversion", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 7;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const bytes = derivePublicKey(privateKey);

			const publicKey = PublicKey.from(bytes);

			expect(publicKey).toEqual(bytes);
		});
	});

	describe("determinism", () => {
		it("should produce same result for same hex string", () => {
			// Use valid public key derived from private key
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 20;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const pubKeyBytes = derivePublicKey(privateKey);
			const hexStr = `0x${Array.from(pubKeyBytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			const pk1 = PublicKey.from(hexStr);
			const pk2 = PublicKey.from(hexStr);

			expect(pk1).toEqual(pk2);
		});

		it("should produce same result for same bytes", () => {
			// Use valid public key derived from private key
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 21;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const bytes = derivePublicKey(privateKey);

			const pk1 = PublicKey.from(bytes);
			const pk2 = PublicKey.from(bytes);

			expect(pk1).toEqual(pk2);
		});
	});
});
