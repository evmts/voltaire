import { describe, expectTypeOf, it } from "vitest";
import type { BrandedHash } from "./BrandedHash.js";
import type { HashConstructor } from "./HashConstructor.js";

describe("HashConstructor", () => {
	describe("constructor signature", () => {
		it("accepts string", () => {
			type Test = HashConstructor extends (
				value: string | Uint8Array,
			) => BrandedHash
				? true
				: false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array", () => {
			type Test = HashConstructor extends (
				value: string | Uint8Array,
			) => BrandedHash
				? true
				: false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("returns BrandedHash", () => {
			// biome-ignore lint/suspicious/noExplicitAny: required for type extraction helper
			type ExtractReturn<T> = T extends (...args: any[]) => infer R ? R : never;
			type Return = ExtractReturn<HashConstructor>;
			expectTypeOf<Return>().toMatchTypeOf<BrandedHash>();
		});

		it("rejects number", () => {
			// biome-ignore lint/suspicious/noExplicitAny: required for type extraction helper
			type ExtractParam<T> = T extends (value: infer P) => any ? P : never;
			type Param = ExtractParam<HashConstructor>;
			// @ts-expect-error - number not accepted
			const test: Param = 123;
			expectTypeOf(test).not.toEqualTypeOf<number>();
		});
	});

	describe("static properties", () => {
		it("has ZERO constant", () => {
			type Test = HashConstructor["ZERO"];
			expectTypeOf<Test>().toMatchTypeOf<BrandedHash>();
		});

		it("has SIZE constant", () => {
			type Test = HashConstructor["SIZE"];
			expectTypeOf<Test>().toEqualTypeOf<number>();
		});

		it("has prototype", () => {
			type Test = HashConstructor["prototype"];
			expectTypeOf<Test>().toMatchTypeOf<BrandedHash>();
		});
	});

	describe("static methods", () => {
		it("has from method", () => {
			type Test = HashConstructor["from"];
			expectTypeOf<Test>().toMatchTypeOf<
				(value: string | Uint8Array) => BrandedHash
			>();
		});

		it("has fromBytes method", () => {
			type Test = HashConstructor["fromBytes"];
			expectTypeOf<Test>().toMatchTypeOf<(value: Uint8Array) => BrandedHash>();
		});

		it("has fromHex method", () => {
			type Test = HashConstructor["fromHex"];
			expectTypeOf<Test>().toMatchTypeOf<(value: string) => BrandedHash>();
		});

		it("has isHash method", () => {
			type Test = HashConstructor["isHash"];
			expectTypeOf<Test>().toMatchTypeOf<(value: unknown) => boolean>();
		});

		it("has isValidHex method", () => {
			type Test = HashConstructor["isValidHex"];
			expectTypeOf<Test>().toMatchTypeOf<(value: string) => boolean>();
		});

		it("has assert method", () => {
			type Test = HashConstructor["assert"];
			expectTypeOf<Test>().toMatchTypeOf<(value: unknown) => void>();
		});

		it("has random method", () => {
			type Test = HashConstructor["random"];
			expectTypeOf<Test>().toMatchTypeOf<() => BrandedHash>();
		});

		it("has keccak256 method", () => {
			type Test = HashConstructor["keccak256"];
			expectTypeOf<Test>().toMatchTypeOf<(data: Uint8Array) => BrandedHash>();
		});

		it("has keccak256String method", () => {
			type Test = HashConstructor["keccak256String"];
			expectTypeOf<Test>().toMatchTypeOf<(str: string) => BrandedHash>();
		});

		it("has keccak256Hex method", () => {
			type Test = HashConstructor["keccak256Hex"];
			expectTypeOf<Test>().toMatchTypeOf<(hex: string) => BrandedHash>();
		});
	});

	describe("conversion methods", () => {
		it("has toBytes method", () => {
			type Test = HashConstructor["toBytes"];
			expectTypeOf<Test>().toMatchTypeOf<(hash: BrandedHash) => Uint8Array>();
		});

		it("has toHex method", () => {
			type Test = HashConstructor["toHex"];
			expectTypeOf<Test>().toMatchTypeOf<(hash: BrandedHash) => string>();
		});

		it("has toString method", () => {
			type Test = HashConstructor["toString"];
			expectTypeOf<Test>().toMatchTypeOf<(hash: BrandedHash) => string>();
		});
	});

	describe("utility methods", () => {
		it("has equals method", () => {
			type Test = HashConstructor["equals"];
			expectTypeOf<Test>().toMatchTypeOf<
				(a: BrandedHash, b: BrandedHash) => boolean
			>();
		});

		it("has isZero method", () => {
			type Test = HashConstructor["isZero"];
			expectTypeOf<Test>().toMatchTypeOf<(hash: BrandedHash) => boolean>();
		});

		it("has clone method", () => {
			type Test = HashConstructor["clone"];
			expectTypeOf<Test>().toMatchTypeOf<(hash: BrandedHash) => BrandedHash>();
		});

		it("has slice method", () => {
			type Test = HashConstructor["slice"];
			expectTypeOf<Test>().toMatchTypeOf<
				(hash: BrandedHash, start?: number, end?: number) => Uint8Array
			>();
		});

		it("has format method", () => {
			type Test = HashConstructor["format"];
			expectTypeOf<Test>().toMatchTypeOf<
				(
					hash: BrandedHash,
					prefixLength?: number,
					suffixLength?: number,
				) => string
			>();
		});
	});

	describe("prototype methods", () => {
		it("prototype has toBytes", () => {
			type Test = HashConstructor["prototype"]["toBytes"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has toHex", () => {
			type Test = HashConstructor["prototype"]["toHex"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has toString", () => {
			type Test = HashConstructor["prototype"]["toString"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has equals", () => {
			type Test = HashConstructor["prototype"]["equals"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has isZero", () => {
			type Test = HashConstructor["prototype"]["isZero"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has clone", () => {
			type Test = HashConstructor["prototype"]["clone"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has slice", () => {
			type Test = HashConstructor["prototype"]["slice"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});

		it("prototype has format", () => {
			type Test = HashConstructor["prototype"]["format"];
			expectTypeOf<Test>().not.toEqualTypeOf<never>();
		});
	});

	describe("type completeness", () => {
		it("has all required members", () => {
			type RequiredKeys = keyof HashConstructor;
			type HasFrom = "from" extends RequiredKeys ? true : false;
			type HasFromBytes = "fromBytes" extends RequiredKeys ? true : false;
			type HasFromHex = "fromHex" extends RequiredKeys ? true : false;
			type HasIsHash = "isHash" extends RequiredKeys ? true : false;
			type HasRandom = "random" extends RequiredKeys ? true : false;

			const from: HasFrom = true;
			const fromBytes: HasFromBytes = true;
			const fromHex: HasFromHex = true;
			const isHash: HasIsHash = true;
			const random: HasRandom = true;

			expectTypeOf(from).toEqualTypeOf<true>();
			expectTypeOf(fromBytes).toEqualTypeOf<true>();
			expectTypeOf(fromHex).toEqualTypeOf<true>();
			expectTypeOf(isHash).toEqualTypeOf<true>();
			expectTypeOf(random).toEqualTypeOf<true>();
		});
	});
});
