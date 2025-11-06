import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import * as TransactionLegacy from "./index.js";
import { Type } from "../types.js";

describe("TransactionLegacy.hash", () => {
	it("computes transaction hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const txHash = TransactionLegacy.hash.call(tx as any);
		expect(txHash).toBeInstanceOf(Uint8Array);
		expect(txHash.length).toBe(32);
	});

	it("produces deterministic hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 25000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 100n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionLegacy.hash.call(tx as any);
		const hash2 = TransactionLegacy.hash.call(tx as any);
		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different transactions", () => {
		const tx1 = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx2 = {
			...tx1,
			nonce: 1n,
		} as const;

		const hash1 = TransactionLegacy.hash.call(tx1 as any);
		const hash2 = TransactionLegacy.hash.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("hash changes with different signature", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
		};

		const tx1 = {
			...base,
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		} as const;
		const tx2 = {
			...base,
			v: 27n,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(2),
		} as const;

		const hash1 = TransactionLegacy.hash.call(tx1 as any);
		const hash2 = TransactionLegacy.hash.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("hash changes with EIP-155 v value", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx1 = { ...base, v: 27n } as const; // pre-EIP-155
		const tx2 = { ...base, v: 37n } as const; // EIP-155 chainId 1

		const hash1 = TransactionLegacy.hash.call(tx1 as any);
		const hash2 = TransactionLegacy.hash.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("computes hash for contract creation", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const txHash = TransactionLegacy.hash.call(tx as any);
		expect(txHash).toBeInstanceOf(Uint8Array);
		expect(txHash.length).toBe(32);
	});

	it("round-trip: serialize -> deserialize -> hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionLegacy.hash.call(tx as any);
		const serialized = TransactionLegacy.serialize.call(tx as any);
		const deserialized = TransactionLegacy.deserialize(serialized);
		const hash2 = TransactionLegacy.hash.call(deserialized);

		expect(hash1).toEqual(hash2);
	});
});
