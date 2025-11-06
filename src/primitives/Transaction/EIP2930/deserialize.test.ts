import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import * as TransactionEIP2930 from "./index.js";
import { Type } from "../types.js";

describe("TransactionEIP2930.deserialize", () => {
	it("round-trips serialize and deserialize", () => {
		const original = {
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 5n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP2930.serialize(original);
		const deserialized = TransactionEIP2930.deserialize(serialized);

		expect(deserialized.type).toBe(original.type);
		expect(deserialized.chainId).toBe(original.chainId);
		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.gasPrice).toBe(original.gasPrice);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		expect(new Uint8Array(deserialized.to!)).toEqual(
			new Uint8Array(original.to!),
		);
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.data).toEqual(original.data);
		expect(deserialized.yParity).toBe(original.yParity);
		expect(deserialized.r).toEqual(original.r);
		expect(deserialized.s).toEqual(original.s);
	});

	it("round-trips transaction with access list", () => {
		const original = {
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP2930.serialize(original);
		const deserialized = TransactionEIP2930.deserialize(serialized);

		expect(deserialized.accessList.length).toBe(1);
		expect(new Uint8Array(deserialized.accessList[0]!.address)).toEqual(
			new Uint8Array(original.accessList[0]!.address),
		);
		expect(deserialized.accessList[0]!.storageKeys.length).toBe(2);
	});

	it("round-trips contract creation", () => {
		const original = {
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP2930.serialize(original);
		const deserialized = TransactionEIP2930.deserialize(serialized);

		expect(deserialized.to).toBe(null);
	});

	it("throws for invalid type prefix", () => {
		const invalidData = new Uint8Array([0x02, 0xc0]); // Wrong type
		expect(() => TransactionEIP2930.deserialize(invalidData)).toThrow();
	});
});
