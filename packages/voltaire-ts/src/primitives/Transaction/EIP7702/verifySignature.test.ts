import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionEIP7702 from "./index.js";
import type { TransactionEIP7702Type } from "./TransactionEIP7702Type.js";

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

describe("TransactionEIP7702.verifySignature", () => {
	it("returns true for valid signature (yParity 0)", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for valid signature (yParity 1)", () => {
		const privateKey = PrivateKey.from(
			"0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x1234567890123456789012345678901234567890"),
			value: 5000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			authorizationList: [],
			yParity: 1,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for contract creation signature", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("rejects high-s signature (EIP-2)", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);
		const sValue = bytesToBigInt(signature.s);
		const highSValue = SECP256K1_N - sValue;
		const recoveryBit = signature.v - 27;
		const highYParity = 1 - recoveryBit;

		const highSSignedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: highYParity,
			r: signature.r,
			s: bigIntToBytes32(highSValue),
		};

		expect(sValue <= SECP256K1_HALF_N).toBe(true);
		expect(TransactionEIP7702.verifySignature(highSSignedTx)).toBe(false);
	});

	it("returns true for signature with authorization list", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x1234567890123456789012345678901234567890"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for signature with access list", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x1234567890123456789012345678901234567890"),
					storageKeys: [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
				},
			],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for different chainId", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 137n,
			nonce: 10n,
			maxPriorityFeePerGas: 30000000000n,
			maxFeePerGas: 100000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP7702.verifySignature(signedTx)).toBe(true);
	});

	it("returns false for invalid signature", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		expect(TransactionEIP7702.verifySignature(tx)).toBe(false);
	});

	it("detects tampered nonce via sender mismatch", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};
		const expectedSender = TransactionEIP7702.getSender(signedTx);

		const tamperedTx: TransactionEIP7702Type = {
			...signedTx,
			nonce: 1n,
		};

		// Signature is still cryptographically valid
		expect(TransactionEIP7702.verifySignature(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionEIP7702.getSender(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});

	it("detects tampered value via sender mismatch", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};
		const expectedSender = TransactionEIP7702.getSender(signedTx);

		const tamperedTx: TransactionEIP7702Type = {
			...signedTx,
			value: 2000000000000000000n,
		};

		// Signature is still cryptographically valid
		expect(TransactionEIP7702.verifySignature(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionEIP7702.getSender(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});

	it("detects wrong chainId via sender mismatch", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};
		const expectedSender = TransactionEIP7702.getSender(signedTx);

		const tamperedTx: TransactionEIP7702Type = {
			...signedTx,
			chainId: 5n,
		};

		// Signature is still cryptographically valid
		expect(TransactionEIP7702.verifySignature(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionEIP7702.getSender(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});

	it("returns false for malformed r value", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32).fill(1),
		};

		expect(TransactionEIP7702.verifySignature(tx)).toBe(false);
	});

	it("returns false for malformed s value", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32),
		};

		expect(TransactionEIP7702.verifySignature(tx)).toBe(false);
	});

	it("detects tampered authorization list via sender mismatch", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP7702.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP7702Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};
		const expectedSender = TransactionEIP7702.getSender(signedTx);

		const tamperedTx: TransactionEIP7702Type = {
			...signedTx,
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x1234567890123456789012345678901234567890"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
			],
		};

		// Signature is still cryptographically valid
		expect(TransactionEIP7702.verifySignature(tamperedTx)).toBe(true);
		// But sender is different due to tampering
		const recoveredSender = TransactionEIP7702.getSender(tamperedTx);
		expect(Address.equals(recoveredSender, expectedSender)).toBe(false);
	});
});
