import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { SIMPLE_TRANSFER } from "./constants.js";

describe("BrandedGasLimit.from", () => {
	it("creates gas limit from number", () => {
		const limit = from(21000);
		expect(typeof limit).toBe("bigint");
		expect(limit).toBe(21000n);
	});

	it("creates gas limit from bigint", () => {
		const limit = from(21000n);
		expect(typeof limit).toBe("bigint");
		expect(limit).toBe(21000n);
	});

	it("creates gas limit from hex", () => {
		const limit = from("0x5208");
		expect(typeof limit).toBe("bigint");
		expect(limit).toBe(21000n);
	});

	it("uses predefined constants", () => {
		expect(typeof SIMPLE_TRANSFER).toBe("bigint");
		expect(SIMPLE_TRANSFER).toBe(21000n);
	});
});
