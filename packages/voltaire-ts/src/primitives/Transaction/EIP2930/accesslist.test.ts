import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Hex } from "../../Hex/index.js";
import { Type } from "../types.js";
import { deserialize, serialize, TransactionEIP2930 } from "./index.js";

describe("TransactionEIP2930 access list serialization", () => {
	it("serializes access list correctly and round-trips", () => {
		// Create signed EIP-2930 transaction with access list
		const tx = TransactionEIP2930({
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [
						Hash(new Uint8Array(32).fill(1)),
						Hash(new Uint8Array(32).fill(2)),
					],
				},
			],
			yParity: 1,
			r: new Uint8Array(32).fill(0xaa),
			s: new Uint8Array(32).fill(0xbb),
		});

		const serialized = serialize(tx);
		const hex = Hex.from(serialized);

		// Verify access list is in the serialized output
		expect(hex).toContain("0000000000000000000000000000000000000001"); // address
		expect(hex).toContain("01010101010101010101010101010101"); // storage key 1
		expect(hex).toContain("02020202020202020202020202020202"); // storage key 2

		// Round-trip verification
		const deserialized = deserialize(serialized);
		expect(deserialized.accessList.length).toBe(1);
		expect(deserialized.accessList[0]?.storageKeys.length).toBe(2);
		expect(
			Array.from(deserialized.accessList[0]?.storageKeys[0] ?? []),
		).toEqual(new Array(32).fill(1));
		expect(
			Array.from(deserialized.accessList[0]?.storageKeys[1] ?? []),
		).toEqual(new Array(32).fill(2));
	});

	it("serializes multiple access list entries", () => {
		const tx = TransactionEIP2930({
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 10n,
			gasPrice: 1000000000n,
			gasLimit: 100000n,
			to: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
			value: 0n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [
						Hash(
							new Uint8Array([
								0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
								0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
								0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
								0x00, 0x01,
							]),
						),
					],
				},
				{
					address: Address("0x0000000000000000000000000000000000000002"),
					storageKeys: [],
				},
			],
			yParity: 1,
			r: new Uint8Array(32).fill(0xaa),
			s: new Uint8Array(32).fill(0xbb),
		});

		const serialized = serialize(tx);

		// Verify round-trip
		const deserialized = deserialize(serialized);
		expect(deserialized.accessList.length).toBe(2);

		// First entry
		expect(deserialized.accessList[0]?.storageKeys.length).toBe(1);

		// Second entry (no storage keys)
		expect(deserialized.accessList[1]?.storageKeys.length).toBe(0);
	});

	it("serializes empty access list correctly", () => {
		const tx = TransactionEIP2930({
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
			r: new Uint8Array(0),
			s: new Uint8Array(0),
		});

		const serialized = serialize(tx);
		const deserialized = deserialize(serialized);

		expect(deserialized.accessList.length).toBe(0);
	});

	it("serializes access list with multiple storage keys per address", () => {
		const tx = TransactionEIP2930({
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
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [
						Hash(new Uint8Array(32).fill(0)),
						Hash(new Uint8Array(32).fill(1)),
						Hash(new Uint8Array(32).fill(2)),
						Hash(new Uint8Array(32).fill(3)),
						Hash(new Uint8Array(32).fill(4)),
					],
				},
			],
			yParity: 0,
			r: new Uint8Array(0),
			s: new Uint8Array(0),
		});

		const serialized = serialize(tx);
		const deserialized = deserialize(serialized);

		expect(deserialized.accessList.length).toBe(1);
		expect(deserialized.accessList[0]?.storageKeys.length).toBe(5);

		// Verify storage key values round-trip correctly
		for (let i = 0; i < 5; i++) {
			const key = deserialized.accessList[0]?.storageKeys[i];
			expect(key).toBeDefined();
			expect(Array.from(key ?? [])).toEqual(new Array(32).fill(i));
		}
	});
});
