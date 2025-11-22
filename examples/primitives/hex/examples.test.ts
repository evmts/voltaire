import { describe, test } from "vitest";

describe("Hex Primitive Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("ethereum-use-cases example works", async () => {
		await import("./ethereum-use-cases.js");
	});

	test("hex-manipulation example works", async () => {
		await import("./hex-manipulation.js");
	});

	test("random-and-utilities example works", async () => {
		await import("./random-and-utilities.js");
	});

	test("string-encoding example works", async () => {
		await import("./string-encoding.js");
	});

	test("type-safety example works", async () => {
		await import("./type-safety.js");
	});
});
