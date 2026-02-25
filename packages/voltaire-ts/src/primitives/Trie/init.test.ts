import { describe, expect, it } from "vitest";
import { init } from "./init.js";

describe("init", () => {
	it("creates empty trie with null root", () => {
		const trie = init();
		expect(trie.root).toBe(null);
		expect(trie.nodes.size).toBe(0);
	});

	it("returns distinct objects each call", () => {
		const a = init();
		const b = init();
		expect(a).not.toBe(b);
		expect(a.nodes).not.toBe(b.nodes);
	});
});
