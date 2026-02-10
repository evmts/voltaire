import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { EMPTY_ROOT_HASH } from "./constants.js";
import { clear } from "./clear.js";
import { get } from "./get.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Put } from "./put.js";
import { RootHash } from "./rootHash.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const rootHash = RootHash({ keccak256, rlpEncode });

describe("clear", () => {
	it("returns empty trie", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const cleared = clear(trie);
		expect(cleared.root).toBe(null);
		expect(cleared.nodes.size).toBe(0);
	});

	it("cleared trie has EMPTY_ROOT_HASH", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const cleared = clear(trie);
		expect(rootHash(cleared)).toEqual(EMPTY_ROOT_HASH);
	});

	it("values are gone after clear", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const cleared = clear(trie);
		expect(get(cleared, new Uint8Array([0x01]))).toBe(null);
	});
});
