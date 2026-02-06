import { describe, test } from "vitest";

describe("Point Evaluation Precompile Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("blob-verification example works", async () => {
		await import("./blob-verification.js");
	});
});
