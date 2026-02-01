import { describe, test } from "vitest";

describe("Signing Examples", () => {
	test("personal-sign example works", async () => {
		await import("./personal-sign.js");
	});
});
