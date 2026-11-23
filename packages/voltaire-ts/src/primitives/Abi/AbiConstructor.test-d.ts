import { describe, expectTypeOf, it } from "vitest";
import type { Abi } from "./Abi.js";
import type { AbiConstructor } from "./AbiConstructor.js";

describe("AbiConstructor declares every static on Abi", () => {
	it("parameter and collision statics", () => {
		expectTypeOf<AbiConstructor["decodeAbiParameters"]>().toEqualTypeOf<
			typeof Abi.decodeAbiParameters
		>();
		expectTypeOf<AbiConstructor["encodeParameters"]>().toEqualTypeOf<
			typeof Abi.encodeParameters
		>();
		expectTypeOf<AbiConstructor["decodeParameters"]>().toEqualTypeOf<
			typeof Abi.decodeParameters
		>();
		expectTypeOf<AbiConstructor["Parameters"]>().toEqualTypeOf<
			typeof Abi.Parameters
		>();
		expectTypeOf<AbiConstructor["DecodeParameters"]>().toEqualTypeOf<
			typeof Abi.DecodeParameters
		>();
		expectTypeOf<AbiConstructor["findSelectorCollisions"]>().toEqualTypeOf<
			typeof Abi.findSelectorCollisions
		>();
		expectTypeOf<AbiConstructor["hasSelectorCollisions"]>().toEqualTypeOf<
			typeof Abi.hasSelectorCollisions
		>();
		expectTypeOf<AbiConstructor["Item"]>().toEqualTypeOf<typeof Abi.Item>();
		expectTypeOf<AbiConstructor["Parameter"]>().toEqualTypeOf<
			typeof Abi.Parameter
		>();
	});
});
