import { describe, it } from "vitest";
import type { Uint128Type } from "./Uint128Type.js";

type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;

describe("Uint128Type", () => {
	it("satisfies bigint with brand", () => {
		type Test = Equals<Uint128Type, bigint>;
		const _: Test = true;
	});

	it("is branded distinct from plain bigint", () => {
		// @ts-expect-error - Uint128Type is not assignable to plain bigint
		const _: bigint = 0n as Uint128Type;
	});

	it("is not assignable to other branded uint types", () => {
		type Uint64Type = bigint & { readonly __tag: "Uint64" };

		// @ts-expect-error - Uint128Type is not Uint64Type
		const _: Uint64Type = 0n as Uint128Type;
	});
});
