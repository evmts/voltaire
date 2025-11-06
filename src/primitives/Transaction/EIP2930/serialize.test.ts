import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Hash } from "../../Hash/index.js";
import { serialize } from "./index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";

describe("TransactionEIP2930.serialize", () => {
	it("serializes basic EIP-2930 transaction", () => {
		const tx: BrandedTransactionEIP2930 = {
			__tag: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
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
		const tx: BrandedTransactionEIP2930 = {
			__tag: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [Hash.from(new Uint8Array(32).fill(1)), Hash.from(new Uint8Array(32).fill(2))],
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const serialized = serialize(tx);
		expect(serialized[0]).toBe(Type.EIP2930);
	});

	it("serializes contract creation", () => {
		const tx: BrandedTransactionEIP2930 = {
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
