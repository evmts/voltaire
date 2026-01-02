import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionEIP4844 from "./index.js";
import type { TransactionEIP4844Type } from "./TransactionEIP4844Type.js";

describe("TransactionEIP4844.getBlobGasCost", () => {
	it("computes blob gas cost for single blob", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [new Uint8Array(32).fill(1)],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const blobBaseFee = 1000n;
		const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);

		expect(cost).toBe(131072n * 1000n);
	});

	it("computes blob gas cost for multiple blobs", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [
				new Uint8Array(32).fill(1),
				new Uint8Array(32).fill(2),
				new Uint8Array(32).fill(3),
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const blobBaseFee = 1000n;
		const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);

		expect(cost).toBe(3n * 131072n * 1000n);
	});

	it("handles zero blob base fee", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [new Uint8Array(32).fill(1)],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const blobBaseFee = 0n;
		const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);

		expect(cost).toBe(0n);
	});

	it("handles high blob base fee", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [new Uint8Array(32).fill(1)],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const blobBaseFee = 1000000000000n;
		const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);

		expect(cost).toBe(131072n * 1000000000000n);
	});

	it("handles maximum blobs (6)", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [
				new Uint8Array(32).fill(1),
				new Uint8Array(32).fill(2),
				new Uint8Array(32).fill(3),
				new Uint8Array(32).fill(4),
				new Uint8Array(32).fill(5),
				new Uint8Array(32).fill(6),
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		const blobBaseFee = 1000n;
		const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);

		expect(cost).toBe(6n * 131072n * 1000n);
	});
});
