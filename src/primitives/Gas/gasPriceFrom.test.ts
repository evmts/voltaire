import { describe, expect, it } from "vitest";
import { gasPriceFrom } from "./gasPriceFrom.js";
import { gasPriceFromGwei } from "./gasPriceFromGwei.js";
import { gasPriceToGwei } from "./gasPriceToGwei.js";

describe("gasPriceFrom", () => {
	it("creates gas price from number", () => {
		const price = gasPriceFrom(20_000_000_000);
		expect(typeof price).toBe("bigint");
		expect(price).toBe(20_000_000_000n);
	});

	it("creates gas price from bigint", () => {
		const price = gasPriceFrom(20_000_000_000n);
		expect(typeof price).toBe("bigint");
		expect(price).toBe(20_000_000_000n);
	});

	it("creates from gwei", () => {
		const price = gasPriceFromGwei(20);
		expect(gasPriceToGwei.call(price)).toBe(20n);
	});

	it("roundtrips through gwei", () => {
		const original = gasPriceFromGwei(50);
		const gwei = gasPriceToGwei.call(original);
		const reconstructed = gasPriceFromGwei(Number(gwei));
		expect(gasPriceToGwei.call(reconstructed)).toBe(50n);
	});
});
