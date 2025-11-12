import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";
import { serialize } from "./index.js";

describe("TransactionEIP1559.serialize", () => {
	it("serializes basic EIP-1559 transaction", () => {
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
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
		expect(serialized[0]).toBe(Type.EIP1559);
		expect(serialized.length).toBeGreaterThan(1);
	});

	it("serializes contract creation (to = null)", () => {
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
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
		expect(serialized[0]).toBe(Type.EIP1559);
	});

	it("serializes transaction with access list", () => {
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [Hash(new Uint8Array(32).fill(1))],
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP1559);
	});

	it("serializes transaction with yParity = 1", () => {
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 1,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP1559);
	});

	it("serializes transaction with large fees", () => {
		const maxUint256 = 2n ** 256n - 1n;
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: maxUint256,
			maxFeePerGas: maxUint256,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP1559);
	});

	it("serializes transaction with large chain ID", () => {
		const tx: BrandedTransactionEIP1559 = {
			__tag: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 999999n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP1559);
	});
});
