import { describe, it } from "vitest";
import type { TransactionEIP1559Type } from "./TransactionEIP1559Type.js";
import type { AddressType } from "../../Address/AddressType.js";
import { Type } from "../types.js";
import type { AccessList } from "../types.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("TransactionEIP1559Type", () => {
	it("type structure is correct", () => {
		type _ = Equals<
			TransactionEIP1559Type,
			{
				readonly __brand: "TransactionEIP1559";
				type: Type.EIP1559;
				chainId: bigint;
				nonce: bigint;
				maxPriorityFeePerGas: bigint;
				maxFeePerGas: bigint;
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
		const check = (tx: TransactionEIP1559Type) => {
			return tx.__brand;
		};
		type _ = Equals<ReturnType<typeof check>, "TransactionEIP1559">;
	});

	it("type field is Type.EIP1559", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.type;
		};
		type _ = Equals<ReturnType<typeof check>, Type.EIP1559>;
	});

	it("chainId is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.chainId;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("nonce is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.nonce;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("maxPriorityFeePerGas is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.maxPriorityFeePerGas;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("maxFeePerGas is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.maxFeePerGas;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("gasLimit is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.gasLimit;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("to is AddressType or null", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.to;
		};
		type _ = Equals<ReturnType<typeof check>, AddressType | null>;
	});

	it("value is bigint", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.value;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("data is Uint8Array", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.data;
		};
		type _ = Equals<ReturnType<typeof check>, Uint8Array>;
	});

	it("accessList is AccessList", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.accessList;
		};
		type _ = Equals<ReturnType<typeof check>, AccessList>;
	});

	it("yParity is number", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.yParity;
		};
		type _ = Equals<ReturnType<typeof check>, number>;
	});

	it("r is Uint8Array", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.r;
		};
		type _ = Equals<ReturnType<typeof check>, Uint8Array>;
	});

	it("s is Uint8Array", () => {
		const check = (tx: TransactionEIP1559Type) => {
			return tx.s;
		};
		type _ = Equals<ReturnType<typeof check>, Uint8Array>;
	});

	it("rejects missing fields", () => {
		// @ts-expect-error - missing nonce
		const tx1: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
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
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.Legacy,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
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

	it("rejects wrong brand tag", () => {
		// @ts-expect-error - wrong brand tag
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionLegacy",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
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

	it("rejects wrong yParity type", () => {
		// @ts-expect-error - yParity must be number
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 0n,
			to: null,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0n,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});

	it("rejects wrong chainId type", () => {
		// @ts-expect-error - chainId must be bigint
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
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

	it("rejects wrong to type", () => {
		// @ts-expect-error - to must be AddressType or null
		const tx: TransactionEIP1559Type = {
			__brand: "TransactionEIP1559",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 0n,
			to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});
});
