import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { EMPTY_ROOT_HASH } from "./constants.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Put } from "./put.js";
import { RootHash } from "./rootHash.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const rootHash = RootHash({ keccak256, rlpEncode });

describe("rootHash", () => {
	it("returns EMPTY_ROOT_HASH for empty trie", () => {
		const trie = init();
		expect(rootHash(trie)).toEqual(EMPTY_ROOT_HASH);
	});

	it("returns 32-byte hash for non-empty trie", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const hash = rootHash(trie);
		expect(hash.length).toBe(32);
	});

	it("produces different hashes for different tries", () => {
		let t1 = init();
		t1 = put(t1, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		let t2 = init();
		t2 = put(t2, new Uint8Array([0x01]), new Uint8Array([0xbb]));
		expect(rootHash(t1)).not.toEqual(rootHash(t2));
	});

	it("produces same hash for same content", () => {
		let t1 = init();
		t1 = put(t1, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		let t2 = init();
		t2 = put(t2, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		expect(rootHash(t1)).toEqual(rootHash(t2));
	});

	it("is deterministic regardless of insertion order", () => {
		let t1 = init();
		t1 = put(t1, new Uint8Array([0x01]), new Uint8Array([1]));
		t1 = put(t1, new Uint8Array([0x02]), new Uint8Array([2]));

		let t2 = init();
		t2 = put(t2, new Uint8Array([0x02]), new Uint8Array([2]));
		t2 = put(t2, new Uint8Array([0x01]), new Uint8Array([1]));

		expect(rootHash(t1)).toEqual(rootHash(t2));
	});
});
