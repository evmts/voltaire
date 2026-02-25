import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { HashNode } from "./hashNode.js";
import { init } from "./init.js";
import { Prove } from "./prove.js";
import { Put } from "./put.js";

const hashNode = HashNode({ keccak256, rlpEncode });
const put = Put({ hashNode });
const prove = Prove({ rlpEncode });

describe("prove", () => {
	it("returns empty proof for empty trie", () => {
		const trie = init();
		const p = prove(trie, new Uint8Array([0x01]));
		expect(p.proof.length).toBe(0);
		expect(p.value).toBe(null);
	});

	it("returns proof with value for existing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const p = prove(trie, new Uint8Array([0x01]));
		expect(p.proof.length).toBeGreaterThan(0);
		expect(p.value).toEqual(new Uint8Array([0xaa]));
	});

	it("returns proof with null value for missing key", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const p = prove(trie, new Uint8Array([0x02]));
		expect(p.proof.length).toBeGreaterThan(0);
		expect(p.value).toBe(null);
	});

	it("proof contains RLP-encoded nodes", () => {
		let trie = init();
		trie = put(trie, new Uint8Array([0x01]), new Uint8Array([0xaa]));
		trie = put(trie, new Uint8Array([0x02]), new Uint8Array([0xbb]));
		const p = prove(trie, new Uint8Array([0x01]));
		for (const node of p.proof) {
			expect(node instanceof Uint8Array).toBe(true);
			expect(node.length).toBeGreaterThan(0);
		}
	});
});
