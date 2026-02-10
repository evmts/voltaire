import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { get } from "./get.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Put } from "./put.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });

describe("put", () => {
	it("inserts a single key-value pair", () => {
		const trie = init();
		const key = new Uint8Array([0x01, 0x02, 0x03]);
		const value = new Uint8Array([0xaa, 0xbb]);
		const t2 = put(trie, key, value);
		expect(t2.root).not.toBe(null);
		expect(t2.nodes.size).toBeGreaterThan(0);
	});

	it("does not mutate original trie", () => {
		const trie = init();
		const t2 = put(trie, new Uint8Array([1]), new Uint8Array([2]));
		expect(trie.root).toBe(null);
		expect(trie.nodes.size).toBe(0);
		expect(t2.root).not.toBe(null);
	});

	it("inserts two keys with different first nibbles", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x10]), new Uint8Array([0xaa]));
		trie = put(trie, new Uint8Array([0x20]), new Uint8Array([0xbb]));
		expect(get(trie, new Uint8Array([0x10]))).toEqual(
			new Uint8Array([0xaa]),
		);
		expect(get(trie, new Uint8Array([0x20]))).toEqual(
			new Uint8Array([0xbb]),
		);
	});

	it("inserts two keys sharing a prefix", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0xab, 0xcd]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0xab, 0xef]), new Uint8Array([2]));
		expect(get(trie, new Uint8Array([0xab, 0xcd]))).toEqual(
			new Uint8Array([1]),
		);
		expect(get(trie, new Uint8Array([0xab, 0xef]))).toEqual(
			new Uint8Array([2]),
		);
	});

	it("overwrites existing key", () => {
		let trie = init();
		const key = new Uint8Array([0x01]);
		trie = put(trie, key, new Uint8Array([0xaa]));
		trie = put(trie, key, new Uint8Array([0xbb]));
		expect(get(trie, key)).toEqual(new Uint8Array([0xbb]));
	});

	it("handles many insertions", () => {
		let trie = init();
		for (let i = 0; i < 50; i++) {
			trie = put(trie, new Uint8Array([i]), new Uint8Array([i * 2]));
		}
		for (let i = 0; i < 50; i++) {
			expect(get(trie, new Uint8Array([i]))).toEqual(
				new Uint8Array([i * 2]),
			);
		}
	});

	it("handles keys of different lengths", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([1]));
		trie = put(
			trie,
			new Uint8Array([0x01, 0x02]),
			new Uint8Array([2]),
		);
		trie = put(
			trie,
			new Uint8Array([0x01, 0x02, 0x03]),
			new Uint8Array([3]),
		);
		expect(get(trie, new Uint8Array([0x01]))).toEqual(new Uint8Array([1]));
		expect(get(trie, new Uint8Array([0x01, 0x02]))).toEqual(
			new Uint8Array([2]),
		);
		expect(get(trie, new Uint8Array([0x01, 0x02, 0x03]))).toEqual(
			new Uint8Array([3]),
		);
	});
});
