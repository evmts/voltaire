import { describe, test } from "vitest";

describe("Denomination Primitive Examples", () => {
	test("arithmetic-operations example works", async () => {
		await import("./arithmetic-operations.js");
	});

	test("balance-formatting example works", async () => {
		await import("./balance-formatting.js");
	});

	test("basic-conversions example works", async () => {
		await import("./basic-conversions.js");
	});

	test("eip1559-fees example works", async () => {
		await import("./eip1559-fees.js");
	});

	test("gas-cost-calculator example works", async () => {
		await import("./gas-cost-calculator.js");
	});

	test("usd-conversion example works", async () => {
		await import("./usd-conversion.js");
	});
});
