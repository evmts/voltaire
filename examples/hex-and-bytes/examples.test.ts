import { describe, test } from "vitest";

describe("Hex and Bytes Examples", () => {
	test("hex-concatenate example works", async () => {
		await import("./hex-concatenate.js");
	});

	test("hex-encode-decode example works", async () => {
		await import("./hex-encode-decode.js");
	});
});
