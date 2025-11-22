import { describe, test } from "vitest";

describe("BN254 Precompile Examples", () => {
	test("basic-operations example works", async () => {
		await import("./basic-operations.js");
	});

	test("tornado-privacy example works", async () => {
		await import("./tornado-privacy.js");
	});

	test("zksnark-groth16 example works", async () => {
		await import("./zksnark-groth16.js");
	});
});
