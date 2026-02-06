import { describe, test } from "vitest";

describe("Ripemd160 Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("bitcoin-addresses example works", async () => {
		await import("./bitcoin-addresses.js");
	});

	test("legacy-comparison example works", async () => {
		await import("./legacy-comparison.js");
	});
});
