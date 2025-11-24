import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import type { TransactionEIP2930Type } from "./TransactionEIP2930Type.js";
import * as TransactionEIP2930 from "./index.js";

describe("TransactionEIP2930.getSigningHash", () => {
	it("computes signing hash for basic transaction", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces different hash for different nonce", () => {
		const tx1: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const tx2: TransactionEIP2930Type = {
			...tx1,
			nonce: 1n,
		};

		const hash1 = TransactionEIP2930.getSigningHash(tx1);
		const hash2 = TransactionEIP2930.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("produces different hash for different chainId", () => {
		const tx1: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const tx2: TransactionEIP2930Type = {
			...tx1,
			chainId: 5n,
		};

		const hash1 = TransactionEIP2930.getSigningHash(tx1);
		const hash2 = TransactionEIP2930.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("produces same hash for same transaction", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 5n,
			gasPrice: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash1 = TransactionEIP2930.getSigningHash(tx);
		const hash2 = TransactionEIP2930.getSigningHash(tx);

		expect(hash1).toEqual(hash2);
	});

	it("computes hash for contract creation", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes hash with access list", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
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

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces different hash with different access list", () => {
		const tx1: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const tx2: TransactionEIP2930Type = {
			...tx1,
			accessList: [
				{
					address: Address("0x1234567890123456789012345678901234567890"),
					storageKeys: [new Uint8Array(32).fill(1)],
				},
			],
		};

		const hash1 = TransactionEIP2930.getSigningHash(tx1);
		const hash2 = TransactionEIP2930.getSigningHash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("ignores signature components in hash", () => {
		const tx1: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx2: TransactionEIP2930Type = {
			...tx1,
			yParity: 1,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(4),
		};

		const hash1 = TransactionEIP2930.getSigningHash(tx1);
		const hash2 = TransactionEIP2930.getSigningHash(tx2);

		expect(hash1).toEqual(hash2);
	});

	it("handles zero values", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 0n,
			gasLimit: 21000n,
			to: Address("0x0000000000000000000000000000000000000000"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("handles large data", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 5000000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(10000).fill(0xff),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("handles multiple access list entries", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 200000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x1234567890123456789012345678901234567890"),
					storageKeys: [new Uint8Array(32).fill(1)],
				},
				{
					address: Address("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
					storageKeys: [new Uint8Array(32).fill(2), new Uint8Array(32).fill(3)],
				},
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("handles empty storage keys in access list", () => {
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x1234567890123456789012345678901234567890"),
					storageKeys: [],
				},
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP2930.getSigningHash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});
