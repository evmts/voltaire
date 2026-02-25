import { decodePath } from "./encodePath.js";
import { commonPrefixLength, keyToNibbles } from "./nibbles.js";

/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpDecode: (bytes: Uint8Array, stream?: boolean) => any }} VerifyDeps
 */

/**
 * Factory: create a verify function with injected crypto.
 *
 * @param {VerifyDeps} deps
 * @returns {(rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => { value: Uint8Array | null; valid: boolean }}
 */
export function Verify(deps) {
	const { keccak256 } = deps;

	/**
	 * Verify a Merkle proof against a root hash.
	 *
	 * @param {Uint8Array} rootHash - Expected 32-byte root hash
	 * @param {Uint8Array} key - Key to verify
	 * @param {ReadonlyArray<Uint8Array>} proof - Array of RLP-encoded nodes
	 * @returns {{ value: Uint8Array | null; valid: boolean }}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: inherently complex algorithm
	return function verify(rootHash, key, proof) {
		if (proof.length === 0) {
			return { value: null, valid: false };
		}

		const nibbles = keyToNibbles(key);
		let nibbleIdx = 0;

		// rootHash() always returns 32-byte keccak, even for inline nodes,
		// so we always hash the first proof node for comparison.
		const firstNode = /** @type {Uint8Array} */ (proof[0]);
		const firstNodeHash = keccak256(firstNode);
		if (!bytesEqual(firstNodeHash, rootHash)) {
			return { value: null, valid: false };
		}

		/** @type {Uint8Array} */
		let expectedHash = rootHash;

		for (let i = 0; i < proof.length; i++) {
			const nodeRlp = /** @type {Uint8Array} */ (proof[i]);

			if (i > 0) {
				if (expectedHash.length === 32 && nodeRlp.length >= 32) {
					const nodeHash = keccak256(nodeRlp);
					if (!bytesEqual(nodeHash, expectedHash)) {
						return { value: null, valid: false };
					}
				} else if (expectedHash.length < 32) {
					if (!bytesEqual(nodeRlp, expectedHash)) {
						return { value: null, valid: false };
					}
				}
			}

			const items = decodeRlpList(nodeRlp);
			if (!items) return { value: null, valid: false };

			if (items.length === 17) {
				if (nibbleIdx >= nibbles.length) {
					const val = /** @type {Uint8Array} */ (items[16]);
					const hasValue = val.length > 0;
					return { value: hasValue ? val : null, valid: true };
				}
				const nibbleVal = /** @type {number} */ (nibbles[nibbleIdx]);
				const childRef = /** @type {Uint8Array} */ (items[nibbleVal]);
				nibbleIdx++;

				if (childRef.length === 0) {
					return { value: null, valid: true };
				}

				expectedHash = childRef;
			} else if (items.length === 2) {
				const path = /** @type {Uint8Array} */ (items[0]);
				const { nibbles: pathNibbles, isLeaf } = decodePath(path);

				if (isLeaf) {
					const remaining = nibbles.subarray(nibbleIdx);
					if (
						pathNibbles.length === remaining.length &&
						commonPrefixLength(pathNibbles, remaining) === remaining.length
					) {
						return { value: /** @type {Uint8Array} */ (items[1]), valid: true };
					}
					return { value: null, valid: true };
				}

				const remaining = nibbles.subarray(nibbleIdx);
				const prefixLen = commonPrefixLength(pathNibbles, remaining);
				if (prefixLen !== pathNibbles.length) {
					return { value: null, valid: true };
				}
				nibbleIdx += pathNibbles.length;
				expectedHash = /** @type {Uint8Array} */ (items[1]);
			} else {
				return { value: null, valid: false };
			}
		}

		return { value: null, valid: false };
	};
}

/**
 * Simple RLP list decoder — returns array of Uint8Array items.
 * Only handles flat lists (branch = 17 items, leaf/ext = 2 items).
 *
 * @param {Uint8Array} data
 * @returns {Uint8Array[] | null}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: inherently complex algorithm
function decodeRlpList(data) {
	if (data.length === 0) return null;
	const prefix = /** @type {number} */ (data[0]);

	if (prefix < 0xc0) return null;

	/** @type {number} */
	let listLen;
	/** @type {number} */
	let offset;

	if (prefix <= 0xf7) {
		listLen = prefix - 0xc0;
		offset = 1;
	} else {
		const lenOfLen = prefix - 0xf7;
		listLen = 0;
		for (let i = 0; i < lenOfLen; i++) {
			listLen = (listLen << 8) | /** @type {number} */ (data[1 + i]);
		}
		offset = 1 + lenOfLen;
	}

	/** @type {Uint8Array[]} */
	const items = [];
	let pos = offset;
	const end = offset + listLen;

	while (pos < end) {
		const b = /** @type {number} */ (data[pos]);
		if (b < 0x80) {
			items.push(data.subarray(pos, pos + 1));
			pos++;
		} else if (b <= 0xb7) {
			const len = b - 0x80;
			items.push(data.subarray(pos + 1, pos + 1 + len));
			pos += 1 + len;
		} else if (b <= 0xbf) {
			const lenOfLen2 = b - 0xb7;
			let strLen = 0;
			for (let i = 0; i < lenOfLen2; i++) {
				strLen = (strLen << 8) | /** @type {number} */ (data[pos + 1 + i]);
			}
			items.push(
				data.subarray(pos + 1 + lenOfLen2, pos + 1 + lenOfLen2 + strLen),
			);
			pos += 1 + lenOfLen2 + strLen;
		} else if (b <= 0xf7) {
			const len = b - 0xc0;
			items.push(data.subarray(pos, pos + 1 + len));
			pos += 1 + len;
		} else {
			const lenOfLen3 = b - 0xf7;
			let listLen2 = 0;
			for (let i = 0; i < lenOfLen3; i++) {
				listLen2 = (listLen2 << 8) | /** @type {number} */ (data[pos + 1 + i]);
			}
			items.push(data.subarray(pos, pos + 1 + lenOfLen3 + listLen2));
			pos += 1 + lenOfLen3 + listLen2;
		}
	}

	return items;
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function bytesEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
