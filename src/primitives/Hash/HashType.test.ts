import { describe, expectTypeOf, it } from "vitest";
import type { HashLike, HashType } from "./HashType.js";
import { SIZE } from "./HashType.js";

type Equals<T, U> =
	(<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
		? true
		: false;

describe("HashType", () => {
	describe("type structure", () => {
		it("HashType is Uint8Array with brand", () => {
			expectTypeOf<HashType>().toMatchTypeOf<Uint8Array>();
		});

		it("HashType has readonly brand property", () => {
			type HasBrand = HashType extends { readonly [key: symbol]: string }
				? true
				: false;
			const result: HasBrand = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("HashType is not plain Uint8Array", () => {
			type NotPlainArray = Equals<HashType, Uint8Array>;
			const result: NotPlainArray = false;
			expectTypeOf(result).toEqualTypeOf<false>();
		});
	});

	describe("HashLike union", () => {
		it("accepts HashType", () => {
			type Test = HashType extends HashLike ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts bigint", () => {
			type Test = bigint extends HashLike ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts string", () => {
			type Test = string extends HashLike ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array", () => {
			type Test = Uint8Array extends HashLike ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("rejects number", () => {
			// @ts-expect-error - number is not HashLike
			const test: HashLike = 123;
			expectTypeOf(test).not.toEqualTypeOf<number>();
		});

		it("rejects boolean", () => {
			// @ts-expect-error - boolean is not HashLike
			const test: HashLike = true;
			expectTypeOf(test).not.toEqualTypeOf<boolean>();
		});

		it("rejects null", () => {
			// @ts-expect-error - null is not HashLike
			const test: HashLike = null;
			expectTypeOf(test).not.toEqualTypeOf<null>();
		});

		it("rejects undefined", () => {
			// @ts-expect-error - undefined is not HashLike
			const test: HashLike = undefined;
			expectTypeOf(test).not.toEqualTypeOf<undefined>();
		});

		it("rejects object", () => {
			// @ts-expect-error - object is not HashLike
			const test: HashLike = {};
			expectTypeOf(test).not.toEqualTypeOf<object>();
		});
	});

	describe("SIZE constant", () => {
		it("SIZE is number", () => {
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
			// @ts-expect-error - Uint8Array cannot be assigned to HashType
			const hash: HashType = arr;
			expectTypeOf(hash).toMatchTypeOf<Uint8Array>();
		});

		it("requires explicit type assertion", () => {
			const arr = new Uint8Array(32);
			const hash = arr as HashType;
			expectTypeOf(hash).toEqualTypeOf<HashType>();
		});
	});

	describe("usage patterns", () => {
		it("HashLike for function parameters", () => {
			function acceptsHashLike(_value: HashLike): void {}
			expectTypeOf(acceptsHashLike).parameter(0).toMatchTypeOf<HashLike>();
		});

		it("HashType for function returns", () => {
			function returnsHash(): HashType {
				return new Uint8Array(32) as HashType;
			}
			expectTypeOf(returnsHash).returns.toEqualTypeOf<HashType>();
		});

		it("HashType in arrays", () => {
			type HashArray = HashType[];
			expectTypeOf<HashArray>().toEqualTypeOf<HashType[]>();
		});

		it("HashType in objects", () => {
			type HashContainer = { hash: HashType };
			expectTypeOf<HashContainer>().toEqualTypeOf<{ hash: HashType }>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from HashLike to HashType", () => {
			function isHashType(value: HashLike): value is HashType {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isHashType).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = HashType | Error;
			function isHash(value: Result): value is HashType {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isHash).returns.toEqualTypeOf<boolean>();
		});
	});
});
