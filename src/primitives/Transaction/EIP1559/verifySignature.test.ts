import { describe, expect, it } from "vitest";
import { Type } from "../types.js";
import type { TransactionEIP1559Type } from "./TransactionEIP1559Type.js";
import * as TransactionEIP1559 from "./index.js";
import { Address } from "../../Address/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";

describe("TransactionEIP1559.verifySignature", () => {
	it("returns true for valid signature (yParity 0)", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for valid signature (yParity 1)", () => {
		const privateKey = PrivateKey.from(
			"0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x1234567890123456789012345678901234567890"),
			value: 5000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			yParity: 1,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for contract creation signature", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for signature with access list", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
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
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(true);
	});

	it("returns true for different chainId", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 137n,
			nonce: 10n,
			maxPriorityFeePerGas: 30000000000n,
			maxFeePerGas: 100000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(true);
	});

	it("returns false for invalid signature", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		expect(TransactionEIP1559.verifySignature(tx)).toBe(false);
	});

	it("returns false for tampered nonce", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			nonce: 1n,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(false);
	});

	it("returns false for tampered value", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			value: 2000000000000000000n,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(false);
	});

	it("returns false for wrong chainId", () => {
		const privateKey = PrivateKey.from(
			"0x0123456789012345678901234567890123456789012345678901234567890123",
		);

		const unsignedTx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
		const signature = Secp256k1.sign(signingHash, privateKey);

		const signedTx: TransactionEIP1559Type = {
			...unsignedTx,
			chainId: 5n,
			yParity: signature.v - 27,
			r: signature.r,
			s: signature.s,
		};

		expect(TransactionEIP1559.verifySignature(signedTx)).toBe(false);
	});

	it("returns false for malformed r value", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32).fill(1),
		};

		expect(TransactionEIP1559.verifySignature(tx)).toBe(false);
	});

	it("returns false for malformed s value", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32),
		};

		expect(TransactionEIP1559.verifySignature(tx)).toBe(false);
	});
});
