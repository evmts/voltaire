import { describe, test } from "vitest";

describe("P256 Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("ecdh-key-exchange example works", async () => {
		await import("./ecdh-key-exchange.js");
	});

	test("webauthn-signatures example works", async () => {
		await import("./webauthn-signatures.js");
	});
});
