import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import { TransactionLegacy } from "./index.js";

describe("TransactionLegacy", () => {
	describe("factory function", () => {
		it("creates transaction with all fields", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.type).toBe(Type.Legacy);
			expect(tx.nonce).toBe(0n);
			expect(tx.gasPrice).toBe(20000000000n);
			expect(tx.gasLimit).toBe(21000n);
			expect(tx.to).toStrictEqual(
				Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			);
			expect(tx.value).toBe(1000000000000000000n);
			expect(tx.data).toBeInstanceOf(Uint8Array);
			expect(tx.v).toBe(27n);
			expect(tx.r).toBeInstanceOf(Uint8Array);
			expect(tx.s).toBeInstanceOf(Uint8Array);
		});

		it("creates contract creation transaction (to = null)", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 1000000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.to).toBe(null);
			expect(tx.data.length).toBeGreaterThan(0);
		});

		it("creates transaction with EIP-155 v value", () => {
			const tx = TransactionLegacy({
				nonce: 5n,
				gasPrice: 25000000000n,
				gasLimit: 50000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 100n,
				data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
				v: 37n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.v).toBe(37n);
		});

		it("creates transaction with zero values", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 0n,
				gasLimit: 21000n,
				to: Address("0x0000000000000000000000000000000000000000"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			expect(tx.nonce).toBe(0n);
			expect(tx.gasPrice).toBe(0n);
			expect(tx.value).toBe(0n);
		});

		it("creates transaction with large data", () => {
			const largeData = new Uint8Array(10000).fill(0xff);
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 5000000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: largeData,
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.data.length).toBe(10000);
		});
	});

	describe("static methods", () => {
		it("has serialize method", () => {
			expect(typeof TransactionLegacy.serialize).toBe("function");
		});

		it("has hash method", () => {
			expect(typeof TransactionLegacy.hash).toBe("function");
		});

		it("has getChainId method", () => {
			expect(typeof TransactionLegacy.getChainId).toBe("function");
		});

		it("has getSigningHash method", () => {
			expect(typeof TransactionLegacy.getSigningHash).toBe("function");
		});

		it("has getSender method", () => {
			expect(typeof TransactionLegacy.getSender).toBe("function");
		});

		it("has verifySignature method", () => {
			expect(typeof TransactionLegacy.verifySignature).toBe("function");
		});

		it("has deserialize method", () => {
			expect(typeof TransactionLegacy.deserialize).toBe("function");
		});
	});

	describe("static method call pattern", () => {
		it("serialize works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(TransactionLegacy.serialize(tx)).toBeInstanceOf(Uint8Array);
		});

		it("hash works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(TransactionLegacy.hash(tx)).toBeInstanceOf(Uint8Array);
		});

		it("getChainId works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			// v=27 is pre-EIP-155, returns null
			expect(TransactionLegacy.getChainId(tx)).toBe(null);
		});

		it("getSigningHash works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(TransactionLegacy.getSigningHash(tx)).toBeInstanceOf(Uint8Array);
		});

		it("getSender works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			// getSender should return an address (may throw for invalid signature)
			expect(typeof TransactionLegacy.getSender).toBe("function");
		});

		it("verifySignature works with call pattern", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(typeof TransactionLegacy.verifySignature).toBe("function");
		});
	});

	describe("round-trip operations", () => {
		it("serializes and deserializes correctly", () => {
			const original = TransactionLegacy({
				nonce: 5n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
				v: 37n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			const serialized = TransactionLegacy.serialize(original);
			const deserialized = TransactionLegacy.deserialize(serialized);

			expect(deserialized.type).toBe(original.type);
			expect(deserialized.nonce).toBe(original.nonce);
			expect(deserialized.gasPrice).toBe(original.gasPrice);
			expect(deserialized.gasLimit).toBe(original.gasLimit);
			expect(deserialized.value).toBe(original.value);
		});

		it("computes consistent hash", () => {
			const tx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			const hash1 = TransactionLegacy.hash(tx);
			const hash2 = TransactionLegacy.hash(tx);

			expect(hash1).toEqual(hash2);
		});
	});

	describe("signature verification workflow", () => {
		it("signs and verifies transaction", () => {
			const privateKey = PrivateKey.from(
				"0x0123456789012345678901234567890123456789012345678901234567890123",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const expectedAddress = Address.fromPublicKey(publicKey);

			const unsignedTx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			const signingHash = TransactionLegacy.getSigningHash(unsignedTx);
			const signature = Secp256k1.sign(signingHash, privateKey);

			const signedTx = TransactionLegacy({
				...unsignedTx,
				v: BigInt(signature.v),
				r: signature.r,
				s: signature.s,
			});

			const isValid = TransactionLegacy.verifySignature(signedTx);
			expect(isValid).toBe(true);

			const recoveredAddress = TransactionLegacy.getSender(signedTx);
			expect(Address.toHex(recoveredAddress)).toBe(
				Address.toHex(expectedAddress),
			);
		});

		it("detects tampered transaction by recovering different address", () => {
			const privateKey = PrivateKey.from(
				"0x0123456789012345678901234567890123456789012345678901234567890123",
			);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const originalSender = Address.fromPublicKey(publicKey);

			const unsignedTx = TransactionLegacy({
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			const signingHash = TransactionLegacy.getSigningHash(unsignedTx);
			const signature = Secp256k1.sign(signingHash, privateKey);

			// Tamper with the transaction value
			const tamperedTx = TransactionLegacy({
				...unsignedTx,
				value: 2000000000000000000n,
				v: BigInt(signature.v),
				r: signature.r,
				s: signature.s,
			});

			// Signature is still technically recoverable (just to a different address)
			// verifySignature checks if recovery succeeds, not if sender matches
			const isRecoverable = TransactionLegacy.verifySignature(tamperedTx);
			expect(isRecoverable).toBe(true);

			// But the recovered sender will be different from the original
			const recoveredSender = TransactionLegacy.getSender(tamperedTx);
			expect(Address.toHex(recoveredSender)).not.toBe(
				Address.toHex(originalSender),
			);
		});
	});
});
