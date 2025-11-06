import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import * as TransactionEIP7702 from "./index.js";
import { Type } from "../types.js";

describe("TransactionEIP7702.deserialize", () => {
	it("round-trips serialize and deserialize", () => {
		const original = {
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 5n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			authorizationList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = TransactionEIP7702.serialize(original);
		const deserialized = TransactionEIP7702.deserialize(serialized);

		expect(deserialized.type).toBe(original.type);
		expect(deserialized.chainId).toBe(original.chainId);
		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.maxPriorityFeePerGas).toBe(original.maxPriorityFeePerGas);
		expect(deserialized.maxFeePerGas).toBe(original.maxFeePerGas);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		expect(new Uint8Array(deserialized.to!)).toEqual(new Uint8Array(original.to!));
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.data).toEqual(original.data);
		expect(deserialized.authorizationList.length).toBe(0);
		expect(deserialized.yParity).toBe(original.yParity);
		expect(deserialized.r).toEqual(original.r);
		expect(deserialized.s).toEqual(original.s);
	});

	it("round-trips transaction with authorization list", () => {
		const original = {
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
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

		const serialized = TransactionEIP7702.serialize(original);
		const deserialized = TransactionEIP7702.deserialize(serialized);

		expect(deserialized.authorizationList.length).toBe(1);
		expect(deserialized.authorizationList[0]!.chainId).toBe(1n);
		expect(new Uint8Array(deserialized.authorizationList[0]!.address)).toEqual(
			new Uint8Array(original.authorizationList[0]!.address),
		);
		expect(deserialized.authorizationList[0]!.nonce).toBe(0n);
		expect(deserialized.authorizationList[0]!.yParity).toBe(0);
	});

	it("round-trips transaction with multiple authorizations", () => {
		const original = {
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 200000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
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

		const serialized = TransactionEIP7702.serialize(original);
		const deserialized = TransactionEIP7702.deserialize(serialized);

		expect(deserialized.authorizationList.length).toBe(2);
		expect(deserialized.authorizationList[1]!.nonce).toBe(1n);
		expect(deserialized.authorizationList[1]!.yParity).toBe(1);
	});

	it("throws for invalid type prefix", () => {
		const invalidData = new Uint8Array([0x03, 0xc0]); // Wrong type
		expect(() => TransactionEIP7702.deserialize(invalidData)).toThrow();
	});
});
