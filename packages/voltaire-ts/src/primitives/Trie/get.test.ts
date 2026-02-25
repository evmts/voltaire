import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { get } from "./get.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Put } from "./put.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });

describe("get", () => {
	it("returns null for empty trie", () => {
		const trie = init();
		expect(get(trie, new Uint8Array([0x01]))).toBe(null);
	});

	it("returns null for missing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		expect(get(trie, new Uint8Array([0x02]))).toBe(null);
	});

	it("finds existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		expect(get(trie, new Uint8Array([0x01]))).toEqual(new Uint8Array([0xaa]));
	});

	it("finds key after multiple inserts", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0x02]), new Uint8Array([2]));
		trie = put(trie, new Uint8Array([0x03]), new Uint8Array([3]));
		expect(get(trie, new Uint8Array([0x02]))).toEqual(new Uint8Array([2]));
	});

	it("returns null for prefix of existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01, 0x02]), new Uint8Array([0xaa]));
		expect(get(trie, new Uint8Array([0x01]))).toBe(null);
	});

	it("returns null for extension of existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		expect(get(trie, new Uint8Array([0x01, 0x02]))).toBe(null);
	});
});
