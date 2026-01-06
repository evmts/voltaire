import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { verify } from "./verify.js";
import { from } from "./from.js";
import { sign } from "../../crypto/Secp256k1/sign.js";
import { derivePublicKey } from "../../crypto/Secp256k1/derivePublicKey.js";
import { Hash } from "../Hash/index.js";
import { PrivateKey } from "../PrivateKey/index.js";
import { InvalidAlgorithmError } from "./errors.js";

describe("Signature.verify", () => {
	describe("secp256k1 verification", () => {
		it("should verify a valid secp256k1 signature", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const messageHash = Hash.fromBytes(
				sha256(new TextEncoder().encode("test message")),
			);

			// Sign the message
			const sigResult = sign(messageHash, privateKey);

			// Create Signature type from components
			const signature = from({
				r: sigResult.r,
				s: sigResult.s,
				v: sigResult.v,
				algorithm: "secp256k1" as const,
			});

			// Derive public key
			const publicKey = derivePublicKey(privateKey);

			// Verify
			const isValid = verify(signature, messageHash, publicKey);
			expect(isValid).toBe(true);
		});

		it("should reject invalid secp256k1 signature", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const messageHash = Hash.fromBytes(
				sha256(new TextEncoder().encode("test message")),
			);
			const wrongMessageHash = Hash.fromBytes(
				sha256(new TextEncoder().encode("different message")),
			);

			// Sign the original message
			const sigResult = sign(messageHash, privateKey);

			// Create Signature type from components
			const signature = from({
				r: sigResult.r,
				s: sigResult.s,
				v: sigResult.v,
				algorithm: "secp256k1" as const,
			});

			// Derive public key
			const publicKey = derivePublicKey(privateKey);

			// Verify against wrong message
			const isValid = verify(signature, wrongMessageHash, publicKey);
			expect(isValid).toBe(false);
		});

		it("should reject signature with wrong public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const wrongPrivateKeyBytes = new Uint8Array(32);
			wrongPrivateKeyBytes[31] = 99;
			const wrongPrivateKey = PrivateKey.fromBytes(wrongPrivateKeyBytes);
			const messageHash = Hash.fromBytes(
				sha256(new TextEncoder().encode("test message")),
			);

			// Sign with correct key
			const sigResult = sign(messageHash, privateKey);

			// Create Signature type
			const signature = from({
				r: sigResult.r,
				s: sigResult.s,
				v: sigResult.v,
				algorithm: "secp256k1" as const,
			});

			// Use wrong public key
			const wrongPublicKey = derivePublicKey(wrongPrivateKey);

			const isValid = verify(signature, messageHash, wrongPublicKey);
			expect(isValid).toBe(false);
		});
	});

	describe("algorithm support", () => {
		it("should throw for ed25519 (not yet implemented)", () => {
			const signature = from({
				signature: new Uint8Array(64),
				algorithm: "ed25519" as const,
			});
			const messageHash = new Uint8Array(32);
			const publicKey = new Uint8Array(32);

			expect(() => verify(signature, messageHash, publicKey)).toThrow(
				InvalidAlgorithmError,
			);
		});
	});
});
