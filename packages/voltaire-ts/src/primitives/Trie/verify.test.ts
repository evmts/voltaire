import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { decode as rlpDecode } from "../Rlp/decode.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Prove } from "./prove.js";
import { Put } from "./put.js";
import { RootHash } from "./rootHash.js";
import { Verify } from "./verify.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const prove = Prove({ rlpEncode });
const rootHash = RootHash({ keccak256, rlpEncode });
const verify = Verify({ keccak256, rlpDecode });

describe("verify", () => {
	it("returns invalid for empty proof", () => {
		const result = verify(new Uint8Array(32), new Uint8Array([0x01]), []);
		expect(result.valid).toBe(false);
	});

	it("verifies a valid proof for existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const root = rootHash(trie);
		const p = prove(trie, new Uint8Array([0x01]));
		const result = verify(root, new Uint8Array([0x01]), p.proof);
		expect(result.valid).toBe(true);
		expect(result.value).toEqual(new Uint8Array([0xaa]));
	});

	it("verifies proof for missing key (exclusion proof)", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		trie = put(trie, new Uint8Array([0x02]), new Uint8Array([0xbb]));
		const root = rootHash(trie);
		const p = prove(trie, new Uint8Array([0x03]));
		const result = verify(root, new Uint8Array([0x03]), p.proof);
		expect(result.valid).toBe(true);
		expect(result.value).toBe(null);
	});

	it("rejects proof against wrong root hash", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const wrongRoot = new Uint8Array(32).fill(0xff);
		const p = prove(trie, new Uint8Array([0x01]));
		const result = verify(wrongRoot, new Uint8Array([0x01]), p.proof);
		expect(result.valid).toBe(false);
	});

	it("verifies proof with multiple keys in trie", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x10]), new Uint8Array([1]));
		trie = put(trie, new Uint8Array([0x20]), new Uint8Array([2]));
		trie = put(trie, new Uint8Array([0x30]), new Uint8Array([3]));
		const root = rootHash(trie);

		for (const [key, val] of [
			[new Uint8Array([0x10]), new Uint8Array([1])],
			[new Uint8Array([0x20]), new Uint8Array([2])],
			[new Uint8Array([0x30]), new Uint8Array([3])],
		]) {
			const p = prove(trie, key);
			const result = verify(root, key, p.proof);
			expect(result.valid).toBe(true);
			expect(result.value).toEqual(val);
		}
	});
});
