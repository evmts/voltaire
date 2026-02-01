import { InvalidKeyLengthError } from "./errors.js";

/**
 * Split 32-byte key into stem (31 bytes) and subindex (1 byte)
 *
 * @param {Uint8Array} k - 32-byte key
 * @returns {{ stem: Uint8Array; idx: number }} Stem and subindex
 * @throws {InvalidKeyLengthError} If key is not 32 bytes
 *
 * @example
 * ```typescript
 * const key = new Uint8Array(32);
 * key[31] = 0x42;
 * const { stem, idx } = BinaryTree.splitKey(key);
 * console.log(idx); // 0x42
 * console.log(stem.length); // 31
 * ```
 */
export function splitKey(k) {
	if (k.length !== 32) {
		throw new InvalidKeyLengthError("Key must be 32 bytes", {
			value: k.length,
			expected: "32 bytes",
			docsPath: "/primitives/binary-tree/split-key#error-handling",
		});
	}
	return {
		stem: k.slice(0, 31),
		idx: k[31] ?? 0,
	};
}
