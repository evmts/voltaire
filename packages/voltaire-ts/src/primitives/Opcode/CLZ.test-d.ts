import { expectTypeOf, test } from "vitest";
import { CLZ } from "./index.js";
import type { OpcodeType } from "./OpcodeType.js";

test("CLZ retains the public branded opcode type", () => {
	expectTypeOf(CLZ).toEqualTypeOf<OpcodeType>();
});
