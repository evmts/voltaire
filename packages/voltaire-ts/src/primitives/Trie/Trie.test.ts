import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { decode as rlpDecode } from "../Rlp/decode.js";
import { EMPTY_ROOT_HASH } from "./constants.js";
import { clear } from "./clear.js";
import { Del } from "./del.js";
import { get } from "./get.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Prove } from "./prove.js";
import { Put } from "./put.js";
import { RootHash } from "./rootHash.js";
import { Verify } from "./verify.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const del = Del({ hashNode });
const rootHash = RootHash({ keccak256, rlpEncode });
const prove = Prove({ rlpEncode });
const verify = Verify({ keccak256, rlpDecode });

describe("Trie integration", () => {
	it("empty trie has known root hash", () => {
		const trie = init();
		const hash = rootHash(trie);
		expect(hash).toEqual(EMPTY_ROOT_HASH);
		// keccak256(RLP("")) = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
		const hex = Array.from(hash)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		expect(hex).toBe(
			"56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		);
	});

	it("put-get round trip", () => {
		let trie = init();
		const key = new Uint8Array([0xca, 0xfe]);
		const value = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
		trie = put(trie, key, value);
		expect(get(trie, key)).toEqual(value);
	});

	it("put-del round trip returns to empty root hash", () => {
		let trie = init();
		const key = new Uint8Array([0x01]);
		trie = put(trie, key, new Uint8Array([0xaa]));
		trie = del(trie, key);
		expect(rootHash(trie)).toEqual(EMPTY_ROOT_HASH);
	});

	it("deterministic root hash regardless of insertion order", () => {
		const entries = [
			[new Uint8Array([0x01, 0x00]), new Uint8Array([10])],
			[new Uint8Array([0x02, 0x00]), new Uint8Array([20])],
			[new Uint8Array([0x03, 0x00]), new Uint8Array([30])],
			[new Uint8Array([0x04, 0x00]), new Uint8Array([40])],
		] as const;

		// Insert in order
		let t1 = init();
		for (const [k, v] of entries) {
			t1 = put(t1, k, v);
		}

		// Insert in reverse order
		let t2 = init();
		for (let i = entries.length - 1; i >= 0; i--) {
			t2 = put(t2, entries[i][0], entries[i][1]);
		}

		expect(rootHash(t1)).toEqual(rootHash(t2));
	});

	it("clear resets to empty", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0x02]), new Uint8Array([2]));
		const cleared = clear(trie);
		expect(rootHash(cleared)).toEqual(EMPTY_ROOT_HASH);
		expect(get(cleared, new Uint8Array([0x01]))).toBe(null);
	});

	it("prove-verify round trip for existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0xab]), new Uint8Array([0xff]));
		trie = put(trie, new Uint8Array([0xcd]), new Uint8Array([0xee]));
		const root = rootHash(trie);
		const p = prove(trie, new Uint8Array([0xab]));
		const result = verify(root, new Uint8Array([0xab]), p.proof);
		expect(result.valid).toBe(true);
		expect(result.value).toEqual(new Uint8Array([0xff]));
	});

	it("handles 100 key-value pairs", () => {
		let trie = init();
		for (let i = 0; i < 100; i++) {
			trie = put(
				trie,
				new Uint8Array([i >> 4, i & 0x0f]),
				new Uint8Array([i]),
			);
		}
		for (let i = 0; i < 100; i++) {
			expect(get(trie, new Uint8Array([i >> 4, i & 0x0f]))).toEqual(
				new Uint8Array([i]),
			);
		}
		// Root hash should be 32 bytes
		expect(rootHash(trie).length).toBe(32);
	});

	it("overwrite updates root hash", () => {
		let trie = init();
		const key = new Uint8Array([0x01]);
		trie = put(trie, key, new Uint8Array([0xaa]));
		const hash1 = rootHash(trie);
		trie = put(trie, key, new Uint8Array([0xbb]));
		const hash2 = rootHash(trie);
		expect(hash1).not.toEqual(hash2);
	});

	it("keys sharing long prefixes work correctly", () => {
		let trie = init();
		trie = put(
			trie,
			new Uint8Array([0xaa, 0xbb, 0xcc, 0x01]),
			new Uint8Array([1]),
		);
		trie = put(
			trie,
			new Uint8Array([0xaa, 0xbb, 0xcc, 0x02]),
			new Uint8Array([2]),
		);
		trie = put(
			trie,
			new Uint8Array([0xaa, 0xbb, 0xdd, 0x01]),
			new Uint8Array([3]),
		);
		expect(
			get(trie, new Uint8Array([0xaa, 0xbb, 0xcc, 0x01])),
		).toEqual(new Uint8Array([1]));
		expect(
			get(trie, new Uint8Array([0xaa, 0xbb, 0xcc, 0x02])),
		).toEqual(new Uint8Array([2]));
		expect(
			get(trie, new Uint8Array([0xaa, 0xbb, 0xdd, 0x01])),
		).toEqual(new Uint8Array([3]));
	});
});
