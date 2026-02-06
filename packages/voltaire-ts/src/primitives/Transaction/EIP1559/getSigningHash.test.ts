import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import * as TransactionEIP1559 from "./index.js";
import type { TransactionEIP1559Type } from "./TransactionEIP1559Type.js";

describe("TransactionEIP1559.getSigningHash", () => {
	it("computes signing hash for basic transaction", () => {
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
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP1559.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces different hash for different nonce", () => {
		const tx1: TransactionEIP1559Type = {
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

		const tx2: TransactionEIP1559Type = {
			...tx1,
			nonce: 1n,
		};

		const hash1 = TransactionEIP1559.getSigningHash(tx1);
		const hash2 = TransactionEIP1559.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("produces different hash for different chainId", () => {
		const tx1: TransactionEIP1559Type = {
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

		const tx2: TransactionEIP1559Type = {
			...tx1,
			chainId: 5n,
		};

		const hash1 = TransactionEIP1559.getSigningHash(tx1);
		const hash2 = TransactionEIP1559.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("produces same hash for same transaction", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash1 = TransactionEIP1559.getSigningHash(tx);
		const hash2 = TransactionEIP1559.getSigningHash(tx);

		expect(hash1).toEqual(hash2);
	});

	it("computes hash for contract creation", () => {
		const tx: TransactionEIP1559Type = {
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

		const hash = TransactionEIP1559.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes hash with access list", () => {
		const tx: TransactionEIP1559Type = {
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

		const hash = TransactionEIP1559.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces different hash with different access list", () => {
		const tx1: TransactionEIP1559Type = {
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
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const tx2: TransactionEIP1559Type = {
			...tx1,
			accessList: [
				{
					address: Address("0x1234567890123456789012345678901234567890"),
					storageKeys: [new Uint8Array(32).fill(1)],
				},
			],
		};

		const hash1 = TransactionEIP1559.getSigningHash(tx1);
		const hash2 = TransactionEIP1559.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("ignores signature components in hash", () => {
		const tx1: TransactionEIP1559Type = {
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
			s: new Uint8Array(32).fill(2),
		};

		const tx2: TransactionEIP1559Type = {
			...tx1,
			yParity: 1,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(4),
		};

		const hash1 = TransactionEIP1559.getSigningHash(tx1);
		const hash2 = TransactionEIP1559.getSigningHash(tx2);

		expect(hash1).toEqual(hash2);
	});

	it("handles zero values", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 21000n,
			to: Address("0x0000000000000000000000000000000000000000"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP1559.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("handles large data", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 5000000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(10000).fill(0xff),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP1559.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});
