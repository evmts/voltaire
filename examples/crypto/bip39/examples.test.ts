import { describe, test } from "vitest";

describe("Bip39 Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("wallet-generation example works", async () => {
		await import("./wallet-generation.js");
	});
});
