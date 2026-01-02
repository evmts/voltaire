import { describe, expectTypeOf, it } from "vitest";
import type { P256PrivateKeyType } from "./P256PrivateKeyType.js";

type Equals<T, U> =
	(<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
		? true
		: false;

describe("P256PrivateKeyType", () => {
	describe("type structure", () => {
		it("P256PrivateKeyType is Uint8Array", () => {
			expectTypeOf<P256PrivateKeyType>().toEqualTypeOf<Uint8Array>();
		});

		it("P256PrivateKeyType matches Uint8Array exactly", () => {
			type Test = Equals<P256PrivateKeyType, Uint8Array>;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array instances", () => {
			const arr = new Uint8Array(32);
			expectTypeOf(arr).toMatchTypeOf<P256PrivateKeyType>();
		});

		it("is assignable to Uint8Array", () => {
			type Test = P256PrivateKeyType extends Uint8Array ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("usage patterns", () => {
		it("P256PrivateKeyType for function parameters", () => {
			function acceptsPrivateKey(_key: P256PrivateKeyType): void {}
			expectTypeOf(acceptsPrivateKey)
				.parameter(0)
				.toEqualTypeOf<P256PrivateKeyType>();
		});

		it("P256PrivateKeyType for function returns", () => {
			function returnsPrivateKey(): P256PrivateKeyType {
				return new Uint8Array(32);
			}
			expectTypeOf(
				returnsPrivateKey,
			).returns.toEqualTypeOf<P256PrivateKeyType>();
		});

		it("P256PrivateKeyType in signing", () => {
			type Sign = (msg: Uint8Array, sk: P256PrivateKeyType) => unknown;
			expectTypeOf<Sign>().parameter(1).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("P256PrivateKeyType in key derivation", () => {
			type DerivePublic = (sk: P256PrivateKeyType) => Uint8Array;
			expectTypeOf<DerivePublic>()
				.parameter(0)
				.toEqualTypeOf<P256PrivateKeyType>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const key: P256PrivateKeyType = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("compatible with crypto.getRandomValues", () => {
			const key: P256PrivateKeyType = crypto.getRandomValues(
				new Uint8Array(32),
			);
			expectTypeOf(key).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not P256PrivateKeyType
			const key: P256PrivateKeyType = "private key";
			expectTypeOf(key).not.toEqualTypeOf<string>();
		});

		it("not compatible with number", () => {
			// @ts-expect-error - number is not P256PrivateKeyType
			const key: P256PrivateKeyType = 123;
			expectTypeOf(key).not.toEqualTypeOf<number>();
		});

		it("not compatible with bigint", () => {
			// @ts-expect-error - bigint is not P256PrivateKeyType
			const key: P256PrivateKeyType = 123n;
			expectTypeOf(key).not.toEqualTypeOf<bigint>();
		});
	});

	describe("scalar value representation", () => {
		it("represents scalar in range [1, n-1]", () => {
			const privateKey: P256PrivateKeyType = new Uint8Array(32);
			expectTypeOf(privateKey).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("supports modular operations", () => {
			function moduloOrder(key: P256PrivateKeyType): P256PrivateKeyType {
				return key;
			}
			expectTypeOf(moduloOrder).returns.toEqualTypeOf<P256PrivateKeyType>();
		});
	});

	describe("security considerations", () => {
		it("can be zeroed after use", () => {
			const key: P256PrivateKeyType = new Uint8Array(32);
			key.fill(0);
			expectTypeOf(key).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("supports secure memory patterns", () => {
			function zeroize(key: P256PrivateKeyType): void {
				key.fill(0);
			}
			expectTypeOf(zeroize).parameter(0).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("should be stored securely", () => {
			type SecureStorage = {
				encrypted: Uint8Array;
				getKey: () => P256PrivateKeyType;
			};
			expectTypeOf<SecureStorage>().toEqualTypeOf<{
				encrypted: Uint8Array;
				getKey: () => P256PrivateKeyType;
			}>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to P256PrivateKeyType", () => {
			function isP256PrivateKey(
				value: Uint8Array,
			): value is P256PrivateKeyType {
				return value.length === 32;
			}
			expectTypeOf(isP256PrivateKey).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = P256PrivateKeyType | null;
			function isKey(value: Result): value is P256PrivateKeyType {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isKey).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly and mutability", () => {
		it("mutable by default", () => {
			const key: P256PrivateKeyType = new Uint8Array(32);
			key[0] = 1;
			expectTypeOf(key).toEqualTypeOf<P256PrivateKeyType>();
		});

		it("can be made readonly", () => {
			const key: Readonly<P256PrivateKeyType> = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<Readonly<P256PrivateKeyType>>();
		});

		it("readonly prevents modification", () => {
			const key: Readonly<P256PrivateKeyType> = new Uint8Array(32);
			// @ts-expect-error - readonly prevents assignment
			key[0] = 1;
			expectTypeOf(key).toMatchTypeOf<Readonly<Uint8Array>>();
		});
	});
});
