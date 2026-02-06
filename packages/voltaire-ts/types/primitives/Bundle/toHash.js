import { MissingCryptoDependencyError } from "./errors.js";
/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 */
/**
 * Computes the bundle hash (keccak256 of bundle contents)
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 function
 * @returns {HashType} Bundle hash
 * @throws {MissingCryptoDependencyError} If keccak256 function is not provided
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * import { keccak256 } from './crypto/keccak256.js';
 * const hash = Bundle.toHash(bundle, { keccak256 });
 * ```
 */
export function toHash(bundle, crypto) {
    if (!crypto?.keccak256) {
        throw new MissingCryptoDependencyError("keccak256 not provided", {
            value: crypto,
            expected: "{ keccak256: (data: Uint8Array) => Uint8Array }",
        });
    }
    // Concatenate all transaction hashes
    const data = new Uint8Array(bundle.transactions.length * 32);
    let offset = 0;
    for (const tx of bundle.transactions) {
        const txHash = crypto.keccak256(tx);
        data.set(txHash, offset);
        offset += 32;
    }
    // Hash the concatenated hashes to get bundle hash
    return /** @type {HashType} */ (crypto.keccak256(data));
}
