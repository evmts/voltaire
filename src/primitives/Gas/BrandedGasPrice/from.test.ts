import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { fromGwei } from "./fromGwei.js";
import { toGwei } from "./toGwei.js";

describe("BrandedGasPrice.from", () => {
	it("creates gas price from number", () => {
		const price = from(20_000_000_000);
		expect(typeof price).toBe("bigint");
		expect(price).toBe(20_000_000_000n);
	});

	it("creates gas price from bigint", () => {
		const price = from(20_000_000_000n);
		expect(typeof price).toBe("bigint");
		expect(price).toBe(20_000_000_000n);
	});

	it("creates from gwei", () => {
		const price = fromGwei(20);
		expect(toGwei.call(price)).toBe(20n);
	});

	it("roundtrips through gwei", () => {
		const original = fromGwei(50);
		const gwei = toGwei.call(original);
		const reconstructed = fromGwei(Number(gwei));
		expect(toGwei.call(reconstructed)).toBe(50n);
	});
});
