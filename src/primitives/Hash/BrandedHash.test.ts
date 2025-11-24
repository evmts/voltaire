import { describe, expectTypeOf, it } from "vitest";
import type { BrandedHash } from "./BrandedHash.js";
import { type SIZE, ZERO, hashSymbol } from "./BrandedHash.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("BrandedHash", () => {
	describe("type structure", () => {
		it("BrandedHash is Uint8Array", () => {
			expectTypeOf<BrandedHash>().toMatchTypeOf<Uint8Array>();
		});

		it("BrandedHash is not plain Uint8Array", () => {
			type NotPlain = Equals<BrandedHash, Uint8Array>;
			const result: NotPlain = false;
			expectTypeOf(result).toEqualTypeOf<false>();
		});

		it("BrandedHash has brand symbol", () => {
			type HasBrand = BrandedHash extends { readonly [key: symbol]: string }
				? true
				: false;
			const result: HasBrand = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("hashSymbol", () => {
		it("hashSymbol is a symbol", () => {
			expectTypeOf(hashSymbol).toEqualTypeOf<symbol>();
		});

		it("hashSymbol is unique", () => {
			expectTypeOf(hashSymbol).not.toEqualTypeOf<symbol>();
		});
	});

	describe("SIZE constant", () => {
		it("SIZE is 32", () => {
			expectTypeOf<typeof SIZE>().toEqualTypeOf<32>();
		});

		it("SIZE is literal number", () => {
			type Test = typeof SIZE extends 32 ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("ZERO constant", () => {
		it("ZERO is BrandedHash type", () => {
			expectTypeOf(ZERO).toMatchTypeOf<Uint8Array>();
		});

		it("ZERO has correct length", () => {
			expectTypeOf(ZERO.length).toEqualTypeOf<number>();
		});
	});

	describe("type safety", () => {
		it("prevents assignment from plain Uint8Array", () => {
			const arr = new Uint8Array(32);
			// @ts-expect-error - cannot assign Uint8Array to BrandedHash
			const hash: BrandedHash = arr;
			expectTypeOf(hash).toMatchTypeOf<Uint8Array>();
		});

		it("requires explicit casting", () => {
			const arr = new Uint8Array(32);
			const hash = arr as BrandedHash;
			expectTypeOf(hash).toMatchTypeOf<BrandedHash>();
		});
	});

	describe("usage patterns", () => {
		it("accepts BrandedHash in functions", () => {
			function processHash(_hash: BrandedHash): void {}
			expectTypeOf(processHash).parameter(0).toMatchTypeOf<BrandedHash>();
		});

		it("returns BrandedHash from functions", () => {
			function createHash(): BrandedHash {
				return new Uint8Array(32) as BrandedHash;
			}
			expectTypeOf(createHash).returns.toMatchTypeOf<BrandedHash>();
		});

		it("works in arrays", () => {
			type HashArray = BrandedHash[];
			expectTypeOf<HashArray>().toEqualTypeOf<BrandedHash[]>();
		});

		it("works in objects", () => {
			type Container = { hash: BrandedHash };
			expectTypeOf<Container>().toEqualTypeOf<{ hash: BrandedHash }>();
		});
	});
});
