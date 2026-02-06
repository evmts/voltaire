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
export function splitKey(k: Uint8Array): {
    stem: Uint8Array;
    idx: number;
};
//# sourceMappingURL=splitKey.d.ts.map