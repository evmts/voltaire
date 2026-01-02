import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { DecodingError } from "../../errors/index.js";
import { Type } from "../types.js";
import { deserialize, serialize, TransactionEIP2930 } from "./index.js";

describe("TransactionEIP2930.deserialize", () => {
	it("round-trips serialize and deserialize", () => {
		const original = TransactionEIP2930({
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 5n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		});

		const serialized = serialize(original);
		const deserialized = deserialize(serialized);

		expect(deserialized.type).toBe(original.type);
		expect(deserialized.chainId).toBe(original.chainId);
		expect(deserialized.nonce).toBe(original.nonce);
		expect(deserialized.gasPrice).toBe(original.gasPrice);
		expect(deserialized.gasLimit).toBe(original.gasLimit);
		// biome-ignore lint/style/noNonNullAssertion: test asserts to exists
		expect(new Uint8Array(deserialized.to!)).toEqual(
			// biome-ignore lint/style/noNonNullAssertion: test asserts to exists
			new Uint8Array(original.to!),
		);
		expect(deserialized.value).toBe(original.value);
		expect(deserialized.data).toEqual(original.data);
		expect(deserialized.yParity).toBe(original.yParity);
		expect(deserialized.r).toEqual(original.r);
		expect(deserialized.s).toEqual(original.s);
	});

	it("round-trips transaction with access list", () => {
		const original = TransactionEIP2930({
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [
				{
					address: Address("0x0000000000000000000000000000000000000001"),
					storageKeys: [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
				},
			],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		});

		const serialized = serialize(original);
		const deserialized = deserialize(serialized);

		expect(deserialized.accessList.length).toBe(1);
		expect(
			new Uint8Array(deserialized.accessList[0]?.address ?? new Uint8Array()),
		).toEqual(
			new Uint8Array(original.accessList[0]?.address ?? new Uint8Array()),
		);
		expect(deserialized.accessList[0]?.storageKeys.length).toBe(2);
	});

	it("round-trips contract creation", () => {
		const original = TransactionEIP2930({
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
		});

		const serialized = serialize(original);
		const deserialized = deserialize(serialized);

		expect(deserialized.to).toBe(null);
	});

	it("throws for invalid type prefix", () => {
		const invalidData = new Uint8Array([0x02, 0xc0]); // Wrong type
		expect(() => deserialize(invalidData)).toThrow();
	});

	it("throws DecodingError with correct name for invalid type prefix", () => {
		const invalidData = new Uint8Array([0x02, 0xc0]); // Wrong type
		try {
			deserialize(invalidData);
			expect.fail("Expected to throw");
		} catch (e) {
			expect(e).toBeInstanceOf(DecodingError);
			expect((e as DecodingError).name).toBe("DecodingError");
		}
	});

	it("throws DecodingError with correct name for empty data", () => {
		const emptyData = new Uint8Array([]);
		try {
			deserialize(emptyData);
			expect.fail("Expected to throw");
		} catch (e) {
			expect(e).toBeInstanceOf(DecodingError);
			expect((e as DecodingError).name).toBe("DecodingError");
		}
	});

	it("throws DecodingError for invalid yParity value", () => {
		// Create a valid transaction, serialize it, then modify yParity to invalid value
		const original = TransactionEIP2930({
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		});

		const serialized = serialize(original);
		// Find and modify yParity byte in the serialized data
		// yParity is encoded as single byte 0x00 or 0x01, need to find and change to 0x02
		// The structure is: type byte + RLP list containing fields
		// yParity is field 8 (0-indexed), encoded as a single byte
		// We search for the pattern where yParity is located and modify it
		const modified = new Uint8Array(serialized);
		// In RLP, single byte 0x00 is encoded as 0x80 (empty string), single byte 0x01 is 0x01
		// For yParity = 0, it's encoded as 0x80, we need to change to 0x02 (invalid)
		// Find the position - yParity comes after accessList encoding and before r,s
		// The r value is 32 bytes of 0x01, so we look for that pattern
		const rStart = modified.findIndex((_, i) => {
			if (i + 32 > modified.length) return false;
			for (let j = 0; j < 32; j++) {
				if (modified[i + j] !== 0x01) return false;
			}
			return true;
		});
		// yParity is encoded just before the length prefix of r
		// r is 32 bytes, so it's prefixed with 0xa0 (0x80 + 32)
		// yParity is the byte before that
		if (rStart > 1) {
			modified[rStart - 2] = 0x02; // Change yParity to invalid value 2
		}

		expect(() => deserialize(modified)).toThrow(DecodingError);
		try {
			deserialize(modified);
		} catch (e) {
			expect((e as DecodingError).message).toContain("yParity must be 0 or 1");
		}
	});
});
