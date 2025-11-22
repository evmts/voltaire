import { describe, test } from "vitest";

describe("Hashing Examples", () => {
	test("keccak256-string example works", async () => {
		await import("./keccak256-string");
	});

	test("sha256-hash example works", async () => {
		await import("./sha256-hash");
	});
});
