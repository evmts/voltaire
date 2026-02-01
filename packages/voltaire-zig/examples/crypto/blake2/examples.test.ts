import { describe, test } from "vitest";

describe("Blake2 Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("evm-precompile example works", async () => {
		await import("./evm-precompile.js");
	});

	test("merkle-tree example works", async () => {
		await import("./merkle-tree.js");
	});
});
