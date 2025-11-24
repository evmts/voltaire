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
			const bytes = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				bytes[i] = (i * 3) % 256;
			}

			const publicKey = PublicKey.from(bytes);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("from hex string", () => {
		it("should create public key from hex string with 0x prefix", () => {
			const hexStr = `0x${"a".repeat(64)}${"b".repeat(64)}`; // 128 hex chars = 64 bytes

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should create public key from hex string without 0x prefix", () => {
			const hexStr = "a".repeat(64) + "b".repeat(64);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});

		it("should parse valid hex characters", () => {
			const hexStr =
				"0123456789abcdef".repeat(4) + "fedcba9876543210".repeat(4);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
			expect(publicKey[0]).toBe(0x01);
			expect(publicKey[1]).toBe(0x23);
		});

		it("should handle uppercase hex characters", () => {
			const hexStr = "A".repeat(64) + "B".repeat(64);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
			expect(publicKey[0]).toBe(0xaa);
		});

		it("should handle mixed case hex characters", () => {
			const hexStr = "aB".repeat(32) + "Cd".repeat(32);

			const publicKey = PublicKey.from(hexStr);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("validation", () => {
		it("should throw on invalid hex string", () => {
			const invalidHex = `0x${"g".repeat(128)}`;

			expect(() => PublicKey.from(invalidHex)).toThrow(/Invalid hex string/);
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
				/Invalid public key: expected 64 bytes/,
			);
		});

		it("should handle all-ones bytes (invalid curve point)", () => {
			const onesBytes = new Uint8Array(64).fill(0xff);

			expect(() => PublicKey.from(onesBytes)).toThrow(
				/Invalid public key: expected 64 bytes/,
			);
		});

		it("should handle hex string at exact length boundary", () => {
			const exactHex = `0x${"a".repeat(128)}`; // Exactly 64 bytes

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
			const hexStr = `0x${"1234567890abcdef".repeat(8)}`;

			const pk1 = PublicKey.from(hexStr);
			const pk2 = PublicKey.from(hexStr);

			expect(pk1).toEqual(pk2);
		});

		it("should produce same result for same bytes", () => {
			const bytes = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				bytes[i] = (i * 7) % 256;
			}

			const pk1 = PublicKey.from(bytes);
			const pk2 = PublicKey.from(bytes);

			expect(pk1).toEqual(pk2);
		});
	});
});
