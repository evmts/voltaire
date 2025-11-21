import { describe, it, expectTypeOf } from "vitest";
import type { PublicKey } from "./PublicKey.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("Ed25519 PublicKey Type", () => {
	describe("type structure", () => {
		it("PublicKey is Uint8Array", () => {
			expectTypeOf<PublicKey>().toEqualTypeOf<Uint8Array>();
		});

		it("PublicKey matches Uint8Array exactly", () => {
			type Test = Equals<PublicKey, Uint8Array>;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array instances", () => {
			const arr = new Uint8Array(32);
			expectTypeOf(arr).toMatchTypeOf<PublicKey>();
		});

		it("is assignable to Uint8Array", () => {
			type Test = PublicKey extends Uint8Array ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("Uint8Array is assignable to PublicKey", () => {
			type Test = Uint8Array extends PublicKey ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("usage patterns", () => {
		it("PublicKey for function parameters", () => {
			function acceptsPublicKey(_key: PublicKey): void {}
			expectTypeOf(acceptsPublicKey).parameter(0).toEqualTypeOf<PublicKey>();
		});

		it("PublicKey for function returns", () => {
			function returnsPublicKey(): PublicKey {
				return new Uint8Array(32);
			}
			expectTypeOf(returnsPublicKey).returns.toEqualTypeOf<PublicKey>();
		});

		it("PublicKey in arrays", () => {
			type KeyArray = PublicKey[];
			expectTypeOf<KeyArray>().toEqualTypeOf<PublicKey[]>();
		});

		it("PublicKey in objects", () => {
			type KeyContainer = { publicKey: PublicKey };
			expectTypeOf<KeyContainer>().toEqualTypeOf<{
				publicKey: PublicKey;
			}>();
		});

		it("PublicKey in tuples", () => {
			type KeyPair = [PublicKey, PublicKey];
			expectTypeOf<KeyPair>().toEqualTypeOf<[PublicKey, PublicKey]>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const key: PublicKey = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<PublicKey>();
		});

		it("compatible with ArrayBuffer views", () => {
			const buffer = new ArrayBuffer(32);
			const key: PublicKey = new Uint8Array(buffer);
			expectTypeOf(key).toEqualTypeOf<PublicKey>();
		});

		it("not compatible with other typed arrays", () => {
			const u16 = new Uint16Array(16);
			// @ts-expect-error - Uint16Array is not PublicKey
			const key: PublicKey = u16;
			expectTypeOf(key).not.toEqualTypeOf<Uint16Array>();
		});

		it("not compatible with number array", () => {
			const arr = [1, 2, 3];
			// @ts-expect-error - number[] is not PublicKey
			const key: PublicKey = arr;
			expectTypeOf(key).not.toEqualTypeOf<number[]>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not PublicKey
			const key: PublicKey = "0x123";
			expectTypeOf(key).not.toEqualTypeOf<string>();
		});

		it("not compatible with bigint", () => {
			// @ts-expect-error - bigint is not PublicKey
			const key: PublicKey = 123n;
			expectTypeOf(key).not.toEqualTypeOf<bigint>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to PublicKey", () => {
			function isPublicKey(value: Uint8Array): value is PublicKey {
				return value.length === 32;
			}
			expectTypeOf(isPublicKey).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = PublicKey | Error;
			function isKey(value: Result): value is PublicKey {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isKey).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly and mutability", () => {
		it("mutable by default", () => {
			const key: PublicKey = new Uint8Array(32);
			key[0] = 1;
			expectTypeOf(key).toEqualTypeOf<PublicKey>();
		});

		it("can be made readonly", () => {
			const key: Readonly<PublicKey> = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<Readonly<PublicKey>>();
		});

		it("readonly prevents modification at compile time", () => {
			const key: Readonly<PublicKey> = new Uint8Array(32);
			// @ts-expect-error - readonly prevents assignment
			key[0] = 1;
			expectTypeOf(key).toMatchTypeOf<Readonly<Uint8Array>>();
		});
	});
});
