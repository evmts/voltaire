import { describe, it } from "vitest";
import type { Secp256k1PublicKeyType } from "./Secp256k1PublicKeyType.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("Secp256k1PublicKeyType", () => {
	describe("type structure", () => {
		it("should be a Uint8Array", () => {
			const test: Equals<
				Secp256k1PublicKeyType extends Uint8Array ? true : false,
				true
			> = true;
			test;
		});

		it("should have length 64", () => {
			const test: Equals<Secp256k1PublicKeyType["length"], 64> = true;
			test;
		});

		it("should have brand property", () => {
			const test: Equals<
				keyof Secp256k1PublicKeyType extends keyof Uint8Array ? false : true,
				true
			> = true;
			test;
		});
	});

	describe("type compatibility", () => {
		it("should not be assignable from plain Uint8Array", () => {
			const plainArray: Uint8Array = new Uint8Array(64);

			// @ts-expect-error - plain Uint8Array is not branded
			const _publicKey: Secp256k1PublicKeyType = plainArray;
		});

		it("should not be assignable from wrong length Uint8Array", () => {
			const wrongLength = new Uint8Array(32);

			// @ts-expect-error - wrong length
			const _publicKey: Secp256k1PublicKeyType = wrongLength;
		});

		it("should be assignable to Uint8Array", () => {
			const publicKey = {} as Secp256k1PublicKeyType;
			const array: Uint8Array = publicKey;
			array;
		});
	});

	describe("type narrowing", () => {
		it("should narrow length to exactly 64", () => {
			const publicKey = {} as Secp256k1PublicKeyType;
			const test: Equals<typeof publicKey.length, 64> = true;
			test;
		});

		it("should not accept length 65", () => {
			type Test = {
				readonly length: 65;
			} & Uint8Array;

			// @ts-expect-error - length must be 64
			const _test: Secp256k1PublicKeyType = {} as Test;
		});

		it("should not accept length 33", () => {
			type Test = {
				readonly length: 33;
			} & Uint8Array;

			// @ts-expect-error - length must be 64
			const _test: Secp256k1PublicKeyType = {} as Test;
		});
	});

	describe("readonly properties", () => {
		it("should have readonly length", () => {
			const publicKey = {} as Secp256k1PublicKeyType;

			// @ts-expect-error - length is readonly
			publicKey.length = 100;
		});

		it("should have readonly brand", () => {
			const publicKey = {} as Secp256k1PublicKeyType;

			// @ts-expect-error - brand is readonly
			publicKey.__brand = "test";
		});
	});

	describe("array operations", () => {
		it("should support Uint8Array methods", () => {
			const publicKey = {} as Secp256k1PublicKeyType;
			const slice: Uint8Array = publicKey.slice(0, 32);
			const map: Uint8Array = publicKey.map((x) => x);
			slice;
			map;
		});

		it("should support indexing", () => {
			const publicKey = {} as Secp256k1PublicKeyType;
			const byte: number | undefined = publicKey[0];
			byte;
		});

		it("should support iteration", () => {
			const publicKey = {} as Secp256k1PublicKeyType;
			for (const _byte of publicKey) {
				const test: Equals<typeof _byte, number> = true;
				test;
			}
		});
	});

	describe("type guards", () => {
		it("should work with type predicates", () => {
			function isSecp256k1PublicKey(
				value: unknown,
			): value is Secp256k1PublicKeyType {
				return (
					value instanceof Uint8Array &&
					value.length === 64 &&
					"__brand" in value
				);
			}

			const func = isSecp256k1PublicKey;
			func;
		});
	});
});
