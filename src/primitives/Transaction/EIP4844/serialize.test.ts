import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import * as TransactionEIP4844 from "./index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";

describe("TransactionEIP4844.serialize", () => {
	it("serializes basic EIP-4844 transaction", () => {
		const tx: BrandedTransactionEIP4844 = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
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

		const serialized = TransactionEIP4844.serialize(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
		expect(serialized[0]).toBe(Type.EIP4844);
		expect(serialized.length).toBeGreaterThan(1);
	});

	it("serializes transaction with multiple blob hashes", () => {
		const tx: BrandedTransactionEIP4844 = {
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

		const serialized = TransactionEIP4844.serialize(tx);
		expect(serialized[0]).toBe(Type.EIP4844);
	});

	it("serializes transaction with access list", () => {
		const tx: BrandedTransactionEIP4844 = {
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

		const serialized = TransactionEIP4844.serialize(tx);
		expect(serialized[0]).toBe(Type.EIP4844);
	});

	it("serializes transaction with max blob fee", () => {
		const maxUint256 = 2n ** 256n - 1n;
		const tx: BrandedTransactionEIP4844 = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: maxUint256,
			blobVersionedHashes: [
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000001",
				),
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP4844.serialize(tx);
		expect(serialized[0]).toBe(Type.EIP4844);
	});

	it("serializes transaction with 6 blobs (max per block)", () => {
		const blobHashes = Array.from({ length: 6 }, (_, i) =>
			Hash.from(
				`0x010000000000000000000000000000000000000000000000000000000000000${i}`,
			),
		);

		const tx: BrandedTransactionEIP4844 = {
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

		const serialized = TransactionEIP4844.serialize(tx);
		expect(serialized[0]).toBe(Type.EIP4844);
	});
});
