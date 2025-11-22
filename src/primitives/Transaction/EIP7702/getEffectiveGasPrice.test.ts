import { describe, expect, it } from "vitest";
import { Type } from "../types.js";
import type { TransactionEIP7702Type } from "./TransactionEIP7702Type.js";
import * as TransactionEIP7702 from "./index.js";
import { Address } from "../../Address/index.js";

describe("TransactionEIP7702.getEffectiveGasPrice", () => {
	it("returns baseFee + maxPriorityFee when maxFee allows", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(22000000000n);
	});

	it("returns baseFee + (maxFee - baseFee) when maxPriorityFee exceeds available", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 5000000000n,
			maxFeePerGas: 23000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(23000000000n);
	});

	it("handles zero baseFee", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 0n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(2000000000n);
	});

	it("handles zero maxPriorityFee", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});

	it("handles maxFee equal to baseFee", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(20000000000n);
	});

	it("handles very high baseFee", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 100000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 90000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(91000000000n);
	});

	it("handles large values", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000000000n,
			maxFeePerGas: 10000000000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 5000000000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(6000000000000000n);
	});

	it("handles all zero fees", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 0n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(0n);
	});

	it("handles transaction with authorization list", () => {
		const tx: TransactionEIP7702Type = {
			__brand: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x1234567890123456789012345678901234567890"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const baseFee = 20000000000n;
		const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);

		expect(effectivePrice).toBe(22000000000n);
	});
});
