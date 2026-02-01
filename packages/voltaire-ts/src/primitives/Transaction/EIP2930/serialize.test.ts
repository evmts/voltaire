import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import { deserialize, serialize } from "./index.js";
import type { TransactionEIP2930Type } from "./TransactionEIP2930Type.js";

describe("TransactionEIP2930.serialize", () => {
	it("serializes basic EIP-2930 transaction", () => {
		const tx: TransactionEIP2930Type = {
			__tag: "TransactionEIP2930",
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

		const serialized = serialize(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
		expect(serialized[0]).toBe(Type.EIP2930);
		expect(serialized.length).toBeGreaterThan(1);
	});

	it("serializes transaction with access list", () => {
		const accessListAddress = Address(
			"0x0000000000000000000000000000000000000001",
		);
		const storageKey1 = Hash(new Uint8Array(32).fill(1));
		const storageKey2 = Hash(new Uint8Array(32).fill(2));

		const tx: TransactionEIP2930Type = {
			__tag: "TransactionEIP2930",
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
					address: accessListAddress,
					storageKeys: [storageKey1, storageKey2],
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP2930);

		// Verify access list is included by checking serialized bytes contain address
		const serializedHex = Buffer.from(serialized).toString("hex");
		const addressHex = Buffer.from(accessListAddress).toString("hex");
		expect(serializedHex).toContain(addressHex);

		// Verify storage keys are included
		const key1Hex = Buffer.from(storageKey1).toString("hex");
		const key2Hex = Buffer.from(storageKey2).toString("hex");
		expect(serializedHex).toContain(key1Hex);
		expect(serializedHex).toContain(key2Hex);
	});

	it("serialized output is larger with access list than without", () => {
		const baseTx = {
			__tag: "TransactionEIP2930" as const,
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const txWithoutAccessList: TransactionEIP2930Type = {
			...baseTx,
			accessList: [],
		};

		const txWithAccessList: TransactionEIP2930Type = {
			...baseTx,
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [Hash(new Uint8Array(32).fill(1))],
				},
			],
		};

		const serializedWithout = serialize(txWithoutAccessList);
		const serializedWith = serialize(txWithAccessList);

		// With access list should be larger (20 byte address + 32 byte key + RLP overhead)
		expect(serializedWith.length).toBeGreaterThan(serializedWithout.length);
		// Minimum increase: 20 (address) + 32 (key) + RLP overhead
		expect(serializedWith.length - serializedWithout.length).toBeGreaterThan(
			50,
		);
	});

	it("round-trips access list with multiple entries and storage keys", () => {
		const accessList = [
			{
				address: Address("0x1111111111111111111111111111111111111111"),
				storageKeys: [
					Hash(new Uint8Array(32).fill(0xaa)),
					Hash(new Uint8Array(32).fill(0xbb)),
					Hash(new Uint8Array(32).fill(0xcc)),
				],
			},
			{
				address: Address("0x2222222222222222222222222222222222222222"),
				storageKeys: [Hash(new Uint8Array(32).fill(0xdd))],
			},
			{
				address: Address("0x3333333333333333333333333333333333333333"),
				storageKeys: [], // Empty storage keys
			},
		];

		const tx: TransactionEIP2930Type = {
			__tag: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 42n,
			gasPrice: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
			accessList,
			yParity: 1,
			r: new Uint8Array(32).fill(0x11),
			s: new Uint8Array(32).fill(0x22),
		};

		const serialized = serialize(tx);
		const deserialized = deserialize(serialized);

		// Verify all access list entries are preserved
		expect(deserialized.accessList.length).toBe(3);

		// First entry: 3 storage keys
		expect(
			Buffer.from(deserialized.accessList[0]?.address ?? new Uint8Array()),
		).toEqual(Buffer.from(accessList[0]?.address ?? new Uint8Array()));
		expect(deserialized.accessList[0]?.storageKeys.length).toBe(3);
		expect(
			Buffer.from(deserialized.accessList[0]?.storageKeys[0] ?? []),
		).toEqual(Buffer.from(accessList[0]?.storageKeys[0] ?? []));
		expect(
			Buffer.from(deserialized.accessList[0]?.storageKeys[1] ?? []),
		).toEqual(Buffer.from(accessList[0]?.storageKeys[1] ?? []));
		expect(
			Buffer.from(deserialized.accessList[0]?.storageKeys[2] ?? []),
		).toEqual(Buffer.from(accessList[0]?.storageKeys[2] ?? []));

		// Second entry: 1 storage key
		expect(
			Buffer.from(deserialized.accessList[1]?.address ?? new Uint8Array()),
		).toEqual(Buffer.from(accessList[1]?.address ?? new Uint8Array()));
		expect(deserialized.accessList[1]?.storageKeys.length).toBe(1);

		// Third entry: 0 storage keys
		expect(
			Buffer.from(deserialized.accessList[2]?.address ?? new Uint8Array()),
		).toEqual(Buffer.from(accessList[2]?.address ?? new Uint8Array()));
		expect(deserialized.accessList[2]?.storageKeys.length).toBe(0);
	});

	it("serializes contract creation", () => {
		const tx: TransactionEIP2930Type = {
			__tag: "TransactionEIP2930",
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

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP2930);
	});
});
