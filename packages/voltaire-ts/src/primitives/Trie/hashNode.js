import { encodePath } from "./encodePath.js";

/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpEncode: (data: any) => Uint8Array }} HashNodeDeps
 */

/**
 * Factory: create a node hashing function with injected crypto deps.
 *
 * RLP-encodes a trie node, then keccak256 hashes it if >= 32 bytes.
 * Nodes < 32 bytes are stored inline (returned as-is RLP).
 *
 * @param {HashNodeDeps} deps
 * @returns {(node: import('./TrieType.js').TrieNode) => Uint8Array}
 */
export function HashNode(deps) {
	const { keccak256, rlpEncode } = deps;

	/**
	 * @param {import('./TrieType.js').TrieNode} node
	 * @returns {Uint8Array}
	 */
	return function hashNode(node) {
		const encoded = encodeNode(node, rlpEncode);
		if (encoded.length < 32) return encoded;
		return keccak256(encoded);
	};
}

/**
 * Wrap pre-encoded RLP items in a canonical RLP list header.
 *
 * @param {ReadonlyArray<Uint8Array>} encodedItems
 * @returns {Uint8Array}
 */
function wrapRlpList(encodedItems) {
	let payloadLen = 0;
	for (const item of encodedItems) {
		payloadLen += item.length;
	}
	/** @type {Uint8Array} */
	let header;
	if (payloadLen <= 55) {
		header = new Uint8Array([0xc0 + payloadLen]);
	} else {
		const lenBytes = [];
		let n = payloadLen;
		while (n > 0) {
			lenBytes.unshift(n & 0xff);
			n = Math.floor(n / 256);
		}
		header = new Uint8Array(1 + lenBytes.length);
		header[0] = 0xf7 + lenBytes.length;
		header.set(lenBytes, 1);
	}
	const out = new Uint8Array(header.length + payloadLen);
	out.set(header, 0);
	let offset = header.length;
	for (const item of encodedItems) {
		out.set(item, offset);
		offset += item.length;
	}
	return out;
}

/**
 * Encode a child node reference per Ethereum Yellow Paper Appendix D:
 * - Empty child: RLP empty byte string (0x80)
 * - Inline node (< 32 bytes, already an RLP list starting with >= 0xc0): embedded raw
 * - 32-byte keccak256 hash: RLP byte string
 *
 * @param {Uint8Array | null | undefined} ref
 * @param {(data: Uint8Array | Uint8Array[]) => Uint8Array} rlpEncode
 * @returns {Uint8Array}
 */
function encodeChildRef(ref, rlpEncode) {
	if (!ref || ref.length === 0) {
		return rlpEncode(new Uint8Array([]));
	}
	if (ref.length < 32 && /** @type {number} */ (ref[0]) >= 0xc0) {
		return ref;
	}
	return rlpEncode(ref);
}

/**
 * RLP-encode a trie node to its serialized form.
 *
 * @param {import('./TrieType.js').TrieNode} node
 * @param {(data: Uint8Array | Uint8Array[]) => Uint8Array} rlpEncode
 * @returns {Uint8Array}
 */
export function encodeNode(node, rlpEncode) {
	switch (node.type) {
		case "empty":
			return rlpEncode(new Uint8Array([]));
		case "leaf":
			return rlpEncode([encodePath(node.nibbles, true), node.value]);
		case "extension":
			return wrapRlpList([
				rlpEncode(encodePath(node.nibbles, false)),
				encodeChildRef(node.childHash, rlpEncode),
			]);
		case "branch": {
			/** @type {Uint8Array[]} */
			const encodedItems = [];
			for (let i = 0; i < 16; i++) {
				encodedItems.push(encodeChildRef(node.children[i], rlpEncode));
			}
			encodedItems.push(rlpEncode(node.value || new Uint8Array([])));
			return wrapRlpList(encodedItems);
		}
	}
}
