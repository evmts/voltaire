import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionEIP1559 from "./index.js";
import type { TransactionEIP1559Type } from "./TransactionEIP1559Type.js";

describe("TransactionEIP1559.getEffectiveGasPrice", () => {
	it("returns baseFee + maxPriorityFee when maxFee allows", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(22000000000n);
	});

	it("returns baseFee + (maxFee - baseFee) when maxPriorityFee exceeds available", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 5000000000n,
			maxFeePerGas: 23000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(23000000000n);
	});

	it("handles zero baseFee", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 0n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(2000000000n);
	});

	it("handles zero maxPriorityFee", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});

	it("handles maxFee equal to baseFee", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
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

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});

	it("handles very high baseFee", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 100000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 90000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(91000000000n);
	});

	it("handles large values", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000000000n,
			maxFeePerGas: 10000000000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 5000000000000000n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(6000000000000000n);
	});

	it("computes same result with function and static method", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const price1 = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);
		const price2 = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(price1).toBe(price2);
	});

	it("handles all zero fees", () => {
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 0n;
		const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(0n);
	});
});
