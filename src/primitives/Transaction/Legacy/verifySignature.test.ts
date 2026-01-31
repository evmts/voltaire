import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionLegacy from "./index.js";
import type { TransactionLegacyType } from "./TransactionLegacyType.js";

const SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_HALF_N = SECP256K1_N / 2n;

function bytesToBigInt(bytes: Uint8Array): bigint {
	return BigInt(
		`0x${Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`,
	);
}

function bigIntToBytes32(value: bigint): Uint8Array {
	const hex = value.toString(16).padStart(64, "0");
	const out = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

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

	it("rejects high-s signature (EIP-2)", () => {
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
		const sValue = bytesToBigInt(signature.s);
		const highSValue = SECP256K1_N - sValue;
		const recoveryBit = signature.v - 27;
		const highSRecoveryBit = 1 - recoveryBit;

		const highSSignedTx: TransactionLegacyType = {
			...unsignedTx,
			v: BigInt(27 + highSRecoveryBit),
			r: signature.r,
			s: bigIntToBytes32(highSValue),
		};

		expect(sValue <= SECP256K1_HALF_N).toBe(true);
		expect(TransactionLegacy.verifySignature.call(highSSignedTx)).toBe(false);
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

	it("detects tampered nonce via sender mismatch", () => {
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
		const expectedSender = TransactionLegacy.getSender.call(signedTx);

		const tamperedTx: TransactionLegacyType = {
			...signedTx,
			nonce: 1n,
		};

		// Signature is still cryptographically valid
		expect(TransactionLegacy.verifySignature.call(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionLegacy.getSender.call(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});

	it("detects tampered value via sender mismatch", () => {
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
		const expectedSender = TransactionLegacy.getSender.call(signedTx);

		const tamperedTx: TransactionLegacyType = {
			...signedTx,
			value: 2000000000000000000n,
		};

		// Signature is still cryptographically valid
		expect(TransactionLegacy.verifySignature.call(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionLegacy.getSender.call(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});

	it("detects wrong chainId via sender mismatch", () => {
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
			v: BigInt(signature.v),
			r: signature.r,
			s: signature.s,
		};
		const expectedSender = TransactionLegacy.getSender.call(signedTx);

		const tamperedTx: TransactionLegacyType = {
			...signedTx,
			v: 5n * 2n + 35n + BigInt(signature.v - 27), // Wrong chainId (5 instead of 1)
		};

		// Signature is still cryptographically valid
		expect(TransactionLegacy.verifySignature.call(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionLegacy.getSender.call(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
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
