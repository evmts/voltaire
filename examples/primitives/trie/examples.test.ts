import { describe, test } from "vitest";

describe("Trie Primitive Examples", () => {
	test("basic-operations example works", async () => {
		await import("./basic-operations.js");
	});

	test("path-compression example works", async () => {
		await import("./path-compression.js");
	});

	test("state-root example works", async () => {
		await import("./state-root.js");
	});

	test("storage-trie example works", async () => {
		await import("./storage-trie.js");
	});

	test("transaction-trie example works", async () => {
		await import("./transaction-trie.js");
	});
});
