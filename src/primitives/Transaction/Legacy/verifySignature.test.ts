import { describe, expect, it } from "vitest";
import { Type } from "../types.js";
import type { TransactionLegacyType } from "./TransactionLegacyType.js";
import * as TransactionLegacy from "./index.js";
import { Address } from "../../Address/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";

describe("TransactionLegacy.verifySignature", () => {
	it("returns true for valid pre-EIP-155 signature", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: BigInt(signature.v),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(true);
	});

	it("returns true for valid EIP-155 signature (chainId 1)", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 37n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: 1n * 2n + 35n + BigInt(signature.v - 27),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(true);
	});

	it("returns true for valid EIP-155 signature (chainId 5)", () => {
		const privateKey = PrivateKey.from(
			"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 10n,
			gasPrice: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x1234567890123456789012345678901234567890"),
			value: 5000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 45n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: 5n * 2n + 35n + BigInt(signature.v - 27),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(true);
	});

	it("returns true for valid signature on contract creation", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: BigInt(signature.v),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(true);
	});

	it("returns true for valid signature with large chainId", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);
		const chainId = 137n;

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: chainId * 2n + 35n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: chainId * 2n + 35n + BigInt(signature.v - 27),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(true);
	});

	it("returns false for invalid signature", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		expect(TransactionLegacy.verifySignature.call(tx)).toBe(false);
	});

	it("returns false for tampered transaction data", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			nonce: 1n, // Tampered nonce
			v: BigInt(signature.v),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(false);
	});

	it("returns false for tampered value", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			value: 2000000000000000000n, // Tampered value
			v: BigInt(signature.v),
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(false);
	});

	it("returns false for signature from wrong chainId", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 37n, // chainId 1
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionLegacyType = {
			...unsignedTx,
			v: 5n * 2n + 35n + BigInt(signature.v - 27), // Wrong chainId (5 instead of 1)
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionLegacy.verifySignature.call(signedTx)).toBe(false);
	});

	it("returns false for malformed r value", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32).fill(1),
		};

		expect(TransactionLegacy.verifySignature.call(tx)).toBe(false);
	});

	it("returns false for malformed s value", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32),
		};

		expect(TransactionLegacy.verifySignature.call(tx)).toBe(false);
	});
});
