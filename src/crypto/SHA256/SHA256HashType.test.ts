import { describe, it, expectTypeOf } from "vitest";
import type { SHA256Hash } from "./SHA256HashType.js";
import { SIZE } from "./SHA256HashType.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("SHA256HashType", () => {
	describe("type structure", () => {
		it("SHA256Hash is Uint8Array with brand", () => {
			expectTypeOf<SHA256Hash>().toMatchTypeOf<Uint8Array>();
		});

		it("SHA256Hash has readonly brand property", () => {
			type HasBrand = SHA256Hash extends { readonly [key: symbol]: string }
				? true
				: false;
			const result: HasBrand = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("SHA256Hash is not plain Uint8Array", () => {
			type NotPlainArray = Equals<SHA256Hash, Uint8Array>;
			const result: NotPlainArray = false;
			expectTypeOf(result).toEqualTypeOf<false>();
		});
	});

	describe("SIZE constant", () => {
		it("SIZE is number literal type", () => {
			expectTypeOf<typeof SIZE>().toEqualTypeOf<32>();
		});

		it("SIZE equals 32", () => {
			type Test = typeof SIZE extends 32 ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("SIZE is literal type", () => {
			expectTypeOf(SIZE).toEqualTypeOf<32>();
		});
	});

	describe("branded type safety", () => {
		it("prevents direct assignment from Uint8Array", () => {
			const arr = new Uint8Array(32);
			// @ts-expect-error - Uint8Array cannot be assigned to SHA256Hash
			const hash: SHA256Hash = arr;
			expectTypeOf(hash).toMatchTypeOf<Uint8Array>();
		});

		it("requires explicit type assertion", () => {
			const arr = new Uint8Array(32);
			const hash = arr as SHA256Hash;
			expectTypeOf(hash).toEqualTypeOf<SHA256Hash>();
		});

		it("prevents assignment of differently branded types", () => {
			type OtherHash = Uint8Array & { readonly __tag: "OtherHash" };
			const otherHash = new Uint8Array(32) as OtherHash;
			// @ts-expect-error - OtherHash cannot be assigned to SHA256Hash
			const sha256Hash: SHA256Hash = otherHash;
			expectTypeOf(sha256Hash).toMatchTypeOf<Uint8Array>();
		});
	});

	describe("usage patterns", () => {
		it("SHA256Hash for function parameters", () => {
			function acceptsHash(_value: SHA256Hash): void {}
			expectTypeOf(acceptsHash).parameter(0).toMatchTypeOf<SHA256Hash>();
		});

		it("SHA256Hash for function returns", () => {
			function returnsHash(): SHA256Hash {
				return new Uint8Array(32) as SHA256Hash;
			}
			expectTypeOf(returnsHash).returns.toEqualTypeOf<SHA256Hash>();
		});

		it("SHA256Hash in arrays", () => {
			type HashArray = SHA256Hash[];
			expectTypeOf<HashArray>().toEqualTypeOf<SHA256Hash[]>();
		});

		it("SHA256Hash in objects", () => {
			type HashContainer = { hash: SHA256Hash };
			expectTypeOf<HashContainer>().toEqualTypeOf<{ hash: SHA256Hash }>();
		});

		it("SHA256Hash in tuples", () => {
			type HashTuple = [SHA256Hash, SHA256Hash];
			expectTypeOf<HashTuple>().toEqualTypeOf<[SHA256Hash, SHA256Hash]>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to SHA256Hash", () => {
			function isSHA256Hash(value: Uint8Array): value is SHA256Hash {
				return value.length === 32;
			}
			expectTypeOf(isSHA256Hash).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = SHA256Hash | Error;
			function isHash(value: Result): value is SHA256Hash {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isHash).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly behavior", () => {
		it("brand property is readonly", () => {
			type BrandIsReadonly = SHA256Hash extends {
				readonly [key: symbol]: string;
			}
				? true
				: false;
			const result: BrandIsReadonly = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("preserves Uint8Array mutability", () => {
			const hash = new Uint8Array(32) as SHA256Hash;
			expectTypeOf(hash[0]).toEqualTypeOf<number>();
		});
	});

	describe("compatibility", () => {
		it("accepts as Uint8Array parameter", () => {
			function acceptsUint8Array(_value: Uint8Array): void {}
			const hash = new Uint8Array(32) as SHA256Hash;
			expectTypeOf(hash).toMatchTypeOf<Parameters<typeof acceptsUint8Array>[0]>();
		});

		it("compatible with ArrayLike", () => {
			type IsArrayLike = SHA256Hash extends ArrayLike<number> ? true : false;
			const result: IsArrayLike = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("has length property", () => {
			const hash = new Uint8Array(32) as SHA256Hash;
			expectTypeOf(hash.length).toEqualTypeOf<number>();
		});
	});

	describe("invalid cases", () => {
		it("rejects plain object", () => {
			// @ts-expect-error - plain object is not SHA256Hash
			const test: SHA256Hash = {};
			expectTypeOf(test).not.toEqualTypeOf<object>();
		});

		it("rejects number array", () => {
			// @ts-expect-error - number[] is not SHA256Hash
			const test: SHA256Hash = [1, 2, 3];
			expectTypeOf(test).not.toEqualTypeOf<number[]>();
		});

		it("rejects string", () => {
			// @ts-expect-error - string is not SHA256Hash
			const test: SHA256Hash = "hash";
			expectTypeOf(test).not.toEqualTypeOf<string>();
		});

		it("rejects null", () => {
			// @ts-expect-error - null is not SHA256Hash
			const test: SHA256Hash = null;
			expectTypeOf(test).not.toEqualTypeOf<null>();
		});

		it("rejects undefined", () => {
			// @ts-expect-error - undefined is not SHA256Hash
			const test: SHA256Hash = undefined;
			expectTypeOf(test).not.toEqualTypeOf<undefined>();
		});
	});
});
