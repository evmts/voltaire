import { expect, it } from "vitest";
import { GasConstants } from "../index.js";

it("exports the Osaka transaction cap through the public primitive barrel", () => {
	expect(GasConstants.TxGasLimitOsaka).toBe(16777216n);
});
