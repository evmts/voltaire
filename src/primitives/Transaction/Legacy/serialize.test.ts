import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import * as TransactionLegacy from "./index.js";

describe("TransactionLegacy.serialize", () => {
	it("serializes basic legacy transaction", () => {
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
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

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
		expect(serialized.length).toBeGreaterThan(0);
	});

	it("serializes contract creation (to = null)", () => {
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
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

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});

	it("serializes transaction with EIP-155 v value", () => {
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 25000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 100n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 37n, // chainId 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});

	it("serializes transaction with large data", () => {
		const largeData = new Uint8Array(10000);
		largeData.fill(0xff);

		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 5000000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: largeData,
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized.length).toBeGreaterThan(10000);
	});

	it("serializes transaction with zero values", () => {
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 0n,
			gasLimit: 21000n,
			to: Address("0x0000000000000000000000000000000000000000"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});

	it("serializes transaction with max uint64 gas values", () => {
		const maxUint64 = 2n ** 64n - 1n;
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: maxUint64,
			gasLimit: maxUint64,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});

	it("serializes transaction with large nonce", () => {
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 999999999n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});

	it("serializes transaction with large chain ID", () => {
		const largeChainId = 1000000n;
		const v = largeChainId * 2n + 35n;
		const tx: BrandedTransactionLegacy = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
	});
});
