import { expectTypeOf, it } from "vitest";
import { GasConstants } from "../index.js";

it("preserves the literal bigint transaction cap type", () => {
	expectTypeOf(GasConstants.TxGasLimitOsaka).toEqualTypeOf<16777216n>();
});
