import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { encodeNode, HashNode } from "./hashNode.js";
import type { TrieNode } from "./TrieType.js";

const hashNode = HashNode({ keccak256, rlpEncode });

describe("encodeNode", () => {
	it("encodes empty node as RLP empty string", () => {
		const node: TrieNode = { type: "empty" };
		const encoded = encodeNode(node, rlpEncode);
		// RLP of empty bytes is 0x80
		expect(encoded).toEqual(new Uint8Array([0x80]));
	});

	it("encodes leaf node", () => {
		const node: TrieNode = {
			type: "leaf",
			nibbles: new Uint8Array([1, 2, 3]),
			value: new Uint8Array([0xaa, 0xbb]),
		};
		const encoded = encodeNode(node, rlpEncode);
		expect(encoded.length).toBeGreaterThan(0);
		expect(encoded instanceof Uint8Array).toBe(true);
	});

	it("encodes branch node with 17 items", () => {
		const children: (Uint8Array | null)[] = new Array(16).fill(null);
		const node: TrieNode = {
			type: "branch",
			children,
			value: new Uint8Array([0xff]),
		};
		const encoded = encodeNode(node, rlpEncode);
		expect(encoded.length).toBeGreaterThan(0);
	});
});

describe("HashNode", () => {
	it("returns RLP directly for small nodes", () => {
		const node: TrieNode = { type: "empty" };
		const result = hashNode(node);
		// RLP of empty = 0x80, which is < 32 bytes, so returned as-is
		expect(result).toEqual(new Uint8Array([0x80]));
	});

	it("returns keccak256 hash for large nodes", () => {
		const children: (Uint8Array | null)[] = new Array(16).fill(null);
		children[0] = new Uint8Array(32).fill(0xaa);
		children[1] = new Uint8Array(32).fill(0xbb);
		const node: TrieNode = {
			type: "branch",
			children,
			value: new Uint8Array(32).fill(0xcc),
		};
		const result = hashNode(node);
		expect(result.length).toBe(32);
	});

	it("produces deterministic output", () => {
		const node: TrieNode = {
			type: "leaf",
			nibbles: new Uint8Array([1, 2, 3, 4, 5, 6]),
			value: new Uint8Array(40).fill(0xdd),
		};
		const a = hashNode(node);
		const b = hashNode(node);
		expect(a).toEqual(b);
	});
});
