import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import * as TransactionEIP4844 from "./index.js";
import { Type } from "../types.js";

describe("TransactionEIP4844.deserialize", () => {
	it("round-trips serialize and deserialize", () => {
		const original = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: [
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000001",
				),
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP4844.serialize(original);
		const deserialized = TransactionEIP4844.deserialize(serialized);

		expect(deserialized.type).toBe(original.type);
		expect(deserialized.chainId).toBe(original.chainId);
		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.maxPriorityFeePerGas).toBe(
			original.maxPriorityFeePerGas,
		);
		expect(deserialized.maxFeePerGas).toBe(original.maxFeePerGas);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		expect(new Uint8Array(deserialized.to!)).toEqual(
			new Uint8Array(original.to!),
		);
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.data).toEqual(original.data);
		expect(deserialized.maxFeePerBlobGas).toBe(original.maxFeePerBlobGas);
		expect(deserialized.blobVersionedHashes.length).toBe(1);
		expect(deserialized.yParity).toBe(original.yParity);
		expect(deserialized.r).toEqual(original.r);
		expect(deserialized.s).toEqual(original.s);
	});

	it("round-trips transaction with multiple blob hashes", () => {
		const original = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 200000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: [
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000002",
				),
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000003",
				),
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP4844.serialize(original);
		const deserialized = TransactionEIP4844.deserialize(serialized);

		expect(deserialized.blobVersionedHashes.length).toBe(3);
		for (let i = 0; i < 3; i++) {
			expect(new Uint8Array(deserialized.blobVersionedHashes[i]!)).toEqual(
				new Uint8Array(original.blobVersionedHashes[i]!),
			);
		}
	});

	it("round-trips transaction with access list", () => {
		const original = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [new Uint8Array(32).fill(1)],
				},
			],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: [
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000001",
				),
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP4844.serialize(original);
		const deserialized = TransactionEIP4844.deserialize(serialized);

		expect(deserialized.accessList.length).toBe(1);
		expect(new Uint8Array(deserialized.accessList[0]!.address)).toEqual(
			new Uint8Array(original.accessList[0]!.address),
		);
	});

	it("round-trips transaction with 6 blobs", () => {
		const blobHashes = Array.from({ length: 6 }, (_, i) =>
			Hash.from(
				`0x010000000000000000000000000000000000000000000000000000000000000${i}`,
			),
		);

		const original = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 500000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: blobHashes,
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP4844.serialize(original);
		const deserialized = TransactionEIP4844.deserialize(serialized);

		expect(deserialized.blobVersionedHashes.length).toBe(6);
	});

	it("throws for invalid type prefix", () => {
		const invalidData = new Uint8Array([0x02, 0xc0]); // Wrong type
		expect(() => TransactionEIP4844.deserialize(invalidData)).toThrow();
	});
});
