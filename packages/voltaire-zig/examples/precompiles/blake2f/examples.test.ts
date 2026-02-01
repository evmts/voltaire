import { describe, test } from "vitest";

describe("Blake2f Precompile Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("zcash-bridge example works", async () => {
		await import("./zcash-bridge.js");
	});
});
