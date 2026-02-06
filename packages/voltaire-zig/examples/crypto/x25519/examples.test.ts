import { describe, test } from "vitest";

describe("X25519 Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("secure-messaging example works", async () => {
		await import("./secure-messaging.js");
	});
});
