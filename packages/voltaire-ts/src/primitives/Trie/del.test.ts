import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { Del } from "./del.js";
import { get } from "./get.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Put } from "./put.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const del = Del({ hashNode });

describe("del", () => {
	it("deleting from empty trie returns empty trie", () => {
		const trie = init();
		const t2 = del(trie, new Uint8Array([0x01]));
		expect(t2.root).toBe(null);
	});

	it("deleting non-existent key is a no-op", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const t2 = del(trie, new Uint8Array([0x02]));
		expect(get(t2, new Uint8Array([0x01]))).toEqual(new Uint8Array([0xaa]));
	});

	it("deletes sole key, trie becomes empty", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const t2 = del(trie, new Uint8Array([0x01]));
		expect(t2.root).toBe(null);
	});

	it("deletes one of two keys", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0x02]), new Uint8Array([2]));
		const t2 = del(trie, new Uint8Array([0x01]));
		expect(get(t2, new Uint8Array([0x01]))).toBe(null);
		expect(get(t2, new Uint8Array([0x02]))).toEqual(new Uint8Array([2]));
	});

	it("does not mutate original trie", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const t2 = del(trie, new Uint8Array([0x01]));
		expect(get(trie, new Uint8Array([0x01]))).toEqual(new Uint8Array([0xaa]));
		expect(get(t2, new Uint8Array([0x01]))).toBe(null);
	});

	it("deletes from branch with value", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0x01, 0x02]), new Uint8Array([2]));
		const t2 = del(trie, new Uint8Array([0x01]));
		expect(get(t2, new Uint8Array([0x01]))).toBe(null);
		expect(get(t2, new Uint8Array([0x01, 0x02]))).toEqual(new Uint8Array([2]));
	});
});
