import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import type { TransactionEIP2930Type } from "./TransactionEIP2930Type.js";
import * as TransactionEIP2930 from "./index.js";

describe("TransactionEIP2930.hash", () => {
	it("computes transaction hash", () => {
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

		const hash = TransactionEIP2930.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionEIP2930.hash(tx);
		const hash2 = TransactionEIP2930.hash(tx);

		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different signatures", () => {
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
			r: new Uint8Array(32).fill(3),
		};

		const hash1 = TransactionEIP2930.hash(tx1);
		const hash2 = TransactionEIP2930.hash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP2930.hash(tx);
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP2930.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("hash differs from signing hash", () => {
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

		const txHash = TransactionEIP2930.hash(tx);
		const signingHash = TransactionEIP2930.getSigningHash(tx);

		expect(Hash.toHex(txHash)).not.toBe(Hash.toHex(signingHash));
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

		const hash = TransactionEIP2930.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("round-trips with serialize", () => {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP2930.serialize(tx);
		const deserialized = TransactionEIP2930.deserialize(serialized);
		const hash1 = TransactionEIP2930.hash(tx);
		const hash2 = TransactionEIP2930.hash(deserialized);

		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different access lists", () => {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
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

		const hash1 = TransactionEIP2930.hash(tx1);
		const hash2 = TransactionEIP2930.hash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});
});
