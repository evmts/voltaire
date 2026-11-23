import { expectTypeOf, test } from "vitest";
import { Precompile } from "../../primitives/GasConstants/index.js";
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
import { calculateGas, ModExp } from "./ModExp.js";

test("ModExp pricing exposes the optional branded fork on both public APIs", () => {
	for (const calculate of [
		calculateGas,
		ModExp.calculateGas,
		Precompile.calculateModExpCost,
	]) {
		expectTypeOf(calculate).parameters.toEqualTypeOf<
			[bigint, bigint, bigint, bigint, HardforkType?]
		>();
		expectTypeOf(calculate).returns.toEqualTypeOf<bigint>();
	}
});
