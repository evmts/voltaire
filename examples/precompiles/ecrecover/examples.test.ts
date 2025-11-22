import { describe, test } from "vitest";

describe("ECRecover Precompile Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("signature-verification example works", async () => {
		await import("./signature-verification.js");
	});
});
