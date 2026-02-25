import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Trie from "./index.js";

describe("Trie Effect wrappers", () => {
	it("init returns empty trie", async () => {
		const trie = await Effect.runPromise(Trie.init());
		expect(trie.root).toBe(null);
		expect(trie.nodes.size).toBe(0);
	});

	it("put-get round trip", async () => {
		const program = Effect.gen(function* () {
			const trie = yield* Trie.init();
			const key = new Uint8Array([0x01, 0x02]);
			const value = new Uint8Array([0xaa, 0xbb]);
			const updated = yield* Trie.put(trie, key, value);
			return yield* Trie.get(updated, key);
		});
		const result = await Effect.runPromise(program);
		expect(result).toEqual(new Uint8Array([0xaa, 0xbb]));
	});

	it("del removes key", async () => {
		const program = Effect.gen(function* () {
			let trie = yield* Trie.init();
			const key = new Uint8Array([0x01]);
			trie = yield* Trie.put(trie, key, new Uint8Array([0xaa]));
			trie = yield* Trie.del(trie, key);
			return yield* Trie.get(trie, key);
		});
		const result = await Effect.runPromise(program);
		expect(result).toBe(null);
	});

	it("rootHash returns 32 bytes", async () => {
		const program = Effect.gen(function* () {
			let trie = yield* Trie.init();
			trie = yield* Trie.put(trie, new Uint8Array([1]), new Uint8Array([2]));
			return Trie.rootHash(trie);
		});
		const hash = await Effect.runPromise(program);
		expect(hash.length).toBe(32);
	});

	it("clear resets trie", async () => {
		const program = Effect.gen(function* () {
			let trie = yield* Trie.init();
			trie = yield* Trie.put(trie, new Uint8Array([1]), new Uint8Array([2]));
			trie = yield* Trie.clear(trie);
			return yield* Trie.get(trie, new Uint8Array([1]));
		});
		const result = await Effect.runPromise(program);
		expect(result).toBe(null);
	});

	it("prove-verify round trip", async () => {
		const program = Effect.gen(function* () {
			let trie = yield* Trie.init();
			trie = yield* Trie.put(trie, new Uint8Array([0x10]), new Uint8Array([1]));
			trie = yield* Trie.put(trie, new Uint8Array([0x20]), new Uint8Array([2]));
			const root = Trie.rootHash(trie);
			const proof = yield* Trie.prove(trie, new Uint8Array([0x10]));
			return yield* Trie.verify(root, new Uint8Array([0x10]), proof.proof);
		});
		const result = await Effect.runPromise(program);
		expect(result.valid).toBe(true);
		expect(result.value).toEqual(new Uint8Array([1]));
	});
});
