import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import type { TransactionEIP4844Type } from "./TransactionEIP4844Type.js";
import * as TransactionEIP4844 from "./index.js";

describe("TransactionEIP4844.getEffectiveGasPrice", () => {
	it("returns baseFee + maxPriorityFee when maxFee allows", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
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

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP4844.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(22000000000n);
	});

	it("returns baseFee + (maxFee - baseFee) when maxPriorityFee exceeds available", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 5000000000n,
			maxFeePerGas: 23000000000n,
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

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP4844.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(23000000000n);
	});

	it("handles zero baseFee", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
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

		const baseFee = 0n;
		const effectivePrice = TransactionEIP4844.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(2000000000n);
	});

	it("handles zero maxPriorityFee", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 30000000000n,
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

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP4844.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});

	it("handles maxFee equal to baseFee", () => {
		const tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
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

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP4844.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});
});
