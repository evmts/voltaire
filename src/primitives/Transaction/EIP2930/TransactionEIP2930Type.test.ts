import { describe, it } from "vitest";
import type { TransactionEIP2930Type } from "./TransactionEIP2930Type.js";
import type { AddressType } from "../../Address/AddressType.js";
import { Type } from "../types.js";
import type { AccessList } from "../types.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("TransactionEIP2930Type", () => {
	it("type structure is correct", () => {
		type _ = Equals<
			TransactionEIP2930Type,
			{
				readonly __brand: "TransactionEIP2930";
				type: Type.EIP2930;
				chainId: bigint;
				nonce: bigint;
				gasPrice: bigint;
				gasLimit: bigint;
				to: AddressType | null;
				value: bigint;
				data: Uint8Array;
				accessList: AccessList;
				yParity: number;
				r: Uint8Array;
				s: Uint8Array;
			}
		>;
	});

	it("has branded __brand field", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.__brand;
		};
		type _ = Equals<ReturnType<typeof check>, "TransactionEIP2930">;
	});

	it("type field is Type.EIP2930", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.type;
		};
		type _ = Equals<ReturnType<typeof check>, Type.EIP2930>;
	});

	it("chainId is bigint", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.chainId;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("gasPrice is bigint", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.gasPrice;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("accessList is AccessList", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.accessList;
		};
		type _ = Equals<ReturnType<typeof check>, AccessList>;
	});

	it("yParity is number", () => {
		const check = (tx: TransactionEIP2930Type) => {
			return tx.yParity;
		};
		type _ = Equals<ReturnType<typeof check>, number>;
	});

	it("rejects missing fields", () => {
		// @ts-expect-error - missing nonce
		const tx1: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.EIP2930,
			chainId: 1n,
			gasPrice: 0n,
			gasLimit: 0n,
			to: null,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});

	it("rejects wrong type value", () => {
		// @ts-expect-error - wrong type value
		const tx: TransactionEIP2930Type = {
			__brand: "TransactionEIP2930",
			type: Type.Legacy,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 0n,
			gasLimit: 0n,
			to: null,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});
});
