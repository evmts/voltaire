/**
 * Incremental hasher for streaming data
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {{ update: (data: Uint8Array) => void, digest: () => Uint8Array }} Hasher instance
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hasher = SHA256.create();
 * hasher.update(new Uint8Array([1, 2, 3]));
 * hasher.update(new Uint8Array([4, 5, 6]));
 * const hash = hasher.digest();
 * ```
 */
export function create(): {
    update: (data: Uint8Array) => void;
    digest: () => Uint8Array;
};
//# sourceMappingURL=create.d.ts.map