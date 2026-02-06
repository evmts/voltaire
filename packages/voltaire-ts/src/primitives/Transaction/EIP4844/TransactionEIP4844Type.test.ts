import { describe, it } from "vitest";
import type { AddressType } from "../../Address/AddressType.js";
import type { AccessList, VersionedHash } from "../types.js";
import { Type } from "../types.js";
import type { TransactionEIP4844Type } from "./TransactionEIP4844Type.js";

type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;

describe("TransactionEIP4844Type", () => {
	it("type structure is correct", () => {
		type _ = Equals<
			TransactionEIP4844Type,
			{
				readonly __brand: "TransactionEIP4844";
				type: Type.EIP4844;
				chainId: bigint;
				nonce: bigint;
				maxPriorityFeePerGas: bigint;
				maxFeePerGas: bigint;
				gasLimit: bigint;
				to: AddressType;
				value: bigint;
				data: Uint8Array;
				accessList: AccessList;
				maxFeePerBlobGas: bigint;
				blobVersionedHashes: readonly VersionedHash[];
				yParity: number;
				r: Uint8Array;
				s: Uint8Array;
			}
		>;
	});

	it("has branded __brand field", () => {
		const check = (tx: TransactionEIP4844Type) => {
			return tx.__brand;
		};
		type _ = Equals<ReturnType<typeof check>, "TransactionEIP4844">;
	});

	it("type field is Type.EIP4844", () => {
		const check = (tx: TransactionEIP4844Type) => {
			return tx.type;
		};
		type _ = Equals<ReturnType<typeof check>, Type.EIP4844>;
	});

	it("to is AddressType (not nullable for EIP4844)", () => {
		const check = (tx: TransactionEIP4844Type) => {
			return tx.to;
		};
		type _ = Equals<ReturnType<typeof check>, AddressType>;
	});

	it("maxFeePerBlobGas is bigint", () => {
		const check = (tx: TransactionEIP4844Type) => {
			return tx.maxFeePerBlobGas;
		};
		type _ = Equals<ReturnType<typeof check>, bigint>;
	});

	it("blobVersionedHashes is readonly array", () => {
		const check = (tx: TransactionEIP4844Type) => {
			return tx.blobVersionedHashes;
		};
		type _ = Equals<ReturnType<typeof check>, readonly VersionedHash[]>;
	});

	it("rejects missing fields", () => {
		// @ts-expect-error - missing maxFeePerBlobGas
		const _tx1: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 0n,
			to: {} as AddressType,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			blobVersionedHashes: [],
			yParity: 0,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});

	it("rejects wrong type value", () => {
		// @ts-expect-error - wrong type value
		const _tx: TransactionEIP4844Type = {
			__brand: "TransactionEIP4844",
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: 0n,
			to: {} as AddressType,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 0n,
			blobVersionedHashes: [],
			yParity: 0,
			r: new Uint8Array(),
			s: new Uint8Array(),
		};
	});
});
