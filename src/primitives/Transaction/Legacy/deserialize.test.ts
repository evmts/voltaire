import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import * as TransactionLegacy from "./index.js";
import { Type } from "../types.js";

describe("TransactionLegacy.deserialize", () => {
	it("round-trips serialize and deserialize", () => {
		const original = {
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

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.type).toBe(original.type);
		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.gasPrice).toBe(original.gasPrice);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		expect(new Uint8Array(deserialized.to!)).toEqual(
			new Uint8Array(original.to!),
		);
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.data).toEqual(original.data);
		expect(deserialized.v).toBe(original.v);
		expect(deserialized.r).toEqual(original.r);
		expect(deserialized.s).toEqual(original.s);
	});

	it("deserializes contract creation (to = null)", () => {
		const original = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.to).toBe(null);
		expect(deserialized.data).toEqual(original.data);
	});

	it("deserializes transaction with EIP-155 v value", () => {
		const original = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 37n, // chainId 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.v).toBe(37n);
	});

	it("deserializes transaction with empty data", () => {
		const original = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.data.length).toBe(0);
	});

	it("deserializes transaction with zero signature", () => {
		const original = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 0n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.v).toBe(0n);
		expect(deserialized.r).toEqual(new Uint8Array(32));
		expect(deserialized.s).toEqual(new Uint8Array(32));
	});

	it("throws for invalid RLP (not a list)", () => {
		const invalidRlp = new Uint8Array([0x80]); // Empty bytes, not a list
		expect(() => TransactionLegacy.deserialize(invalidRlp)).toThrow(
			"Invalid legacy transaction: expected list",
		);
	});

	it("throws for wrong field count (too few)", () => {
		const rlp = new Uint8Array([
			0xc8, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
		]); // 8 fields instead of 9
		expect(() => TransactionLegacy.deserialize(rlp)).toThrow(
			"Invalid legacy transaction: expected 9 fields",
		);
	});

	it("round-trips transaction with large data", () => {
		const largeData = new Uint8Array(5000);
		for (let i = 0; i < largeData.length; i++) {
			largeData[i] = i % 256;
		}

		const original = {
			__tag: "TransactionLegacy" as const,
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

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.data).toEqual(original.data);
	});

	it("round-trips transaction with max values", () => {
		const maxUint256 = 2n ** 256n - 1n;
		const original = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: maxUint256,
			gasPrice: maxUint256,
			gasLimit: maxUint256,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: maxUint256,
			data: new Uint8Array(),
			v: maxUint256,
			r: new Uint8Array(32).fill(0xff),
			s: new Uint8Array(32).fill(0xff),
		};

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.gasPrice).toBe(original.gasPrice);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.v).toBe(original.v);
	});

	it("round-trips transaction with large chain ID", () => {
		const largeChainId = 999999n;
		const v = largeChainId * 2n + 35n;
		const original = {
			__tag: "TransactionLegacy" as const,
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

		const serialized = TransactionLegacy.serialize.call(original as any);
		const deserialized = TransactionLegacy.deserialize(serialized);

		expect(deserialized.v).toBe(v);
	});
});
