import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP7702 } from "./BrandedTransactionEIP7702.js";
import { serialize } from "./index.js";

describe("TransactionEIP7702.serialize", () => {
	it("serializes basic EIP-7702 transaction", () => {
		const tx: BrandedTransactionEIP7702 = {
			__tag: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized).toBeInstanceOf(Uint8Array);
		expect(serialized[0]).toBe(Type.EIP7702);
		expect(serialized.length).toBeGreaterThan(1);
	});

	it("serializes transaction with authorization list", () => {
		const tx: BrandedTransactionEIP7702 = {
			__tag: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x0000000000000000000000000000000000000001"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(4),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP7702);
	});

	it("serializes transaction with multiple authorizations", () => {
		const tx: BrandedTransactionEIP7702 = {
			__tag: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 200000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x0000000000000000000000000000000000000001"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
				{
					chainId: 1n,
					address: Address("0x0000000000000000000000000000000000000002"),
					nonce: 1n,
					yParity: 1,
					r: new Uint8Array(32).fill(3),
					s: new Uint8Array(32).fill(4),
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(5),
			s: new Uint8Array(32).fill(6),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP7702);
	});

	it("serializes contract call with authorization", () => {
		const tx: BrandedTransactionEIP7702 = {
			__tag: "TransactionEIP7702",
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: Address("0x0000000000000000000000000000000000000001"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(2),
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(4),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP7702);
	});
});
