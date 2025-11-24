import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import type { TransactionEIP7702Type } from "./TransactionEIP7702Type.js";
import * as TransactionEIP7702 from "./index.js";

describe("TransactionEIP7702.hash", () => {
	it("computes transaction hash", () => {
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
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP7702.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces same hash for same transaction", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionEIP7702.hash(tx);
		const hash2 = TransactionEIP7702.hash(tx);

		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different signatures", () => {
		const tx1: TransactionEIP7702Type = {
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
			s: new Uint8Array(32).fill(2),
		};

		const tx2: TransactionEIP7702Type = {
			...tx1,
			r: new Uint8Array(32).fill(3),
		};

		const hash1 = TransactionEIP7702.hash(tx1);
		const hash2 = TransactionEIP7702.hash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});

	it("computes hash for contract creation", () => {
		const tx: TransactionEIP7702Type = {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP7702.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes hash with authorization list", () => {
		const tx: TransactionEIP7702Type = {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP7702.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("computes hash with access list", () => {
		const tx: TransactionEIP7702Type = {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash = TransactionEIP7702.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("hash differs from signing hash", () => {
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
			s: new Uint8Array(32).fill(2),
		};

		const txHash = TransactionEIP7702.hash(tx);
		const signingHash = TransactionEIP7702.getSigningHash(tx);

		expect(Hash.toHex(txHash)).not.toBe(Hash.toHex(signingHash));
	});

	it("handles zero values", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 21000n,
			to: Address("0x0000000000000000000000000000000000000000"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const hash = TransactionEIP7702.hash(tx);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("round-trips with serialize", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP7702.serialize(tx);
		const deserialized = TransactionEIP7702.deserialize(serialized);
		const hash1 = TransactionEIP7702.hash(tx);
		const hash2 = TransactionEIP7702.hash(deserialized);

		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different authorization lists", () => {
		const tx1: TransactionEIP7702Type = {
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
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx2: TransactionEIP7702Type = {
			...tx1,
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

		const hash1 = TransactionEIP7702.hash(tx1);
		const hash2 = TransactionEIP7702.hash(tx2);

		expect(Hash.toHex(hash1)).not.toBe(Hash.toHex(hash2));
	});
});
