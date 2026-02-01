/**
 * Hash of empty EVM bytecode (Keccak256 of empty bytes).
 *
 * This is a well-known constant in Ethereum representing the Keccak256 hash
 * of an empty byte array. It's used to identify accounts with no associated
 * contract code.
 *
 * Value: Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @type {import('../Hash/index.js').HashType}
 * @example
 * ```javascript
 * import { EMPTY_CODE_HASH } from './primitives/State/index.js';
 * if (codeHash.equals(EMPTY_CODE_HASH)) {
 *   // Account has no code
 * }
 * ```
 */
export const EMPTY_CODE_HASH: import("../Hash/index.js").HashType;
/**
 * Root hash of an empty Merkle Patricia Trie.
 *
 * This is the root hash of an empty trie structure in Ethereum, used as
 * the initial value for account storage roots and state roots when they
 * contain no data.
 *
 * Value: Keccak256(RLP(null)) = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @type {import('../Hash/index.js').HashType}
 * @example
 * ```javascript
 * import { EMPTY_TRIE_ROOT } from './primitives/State/index.js';
 * if (storageRoot.equals(EMPTY_TRIE_ROOT)) {
 *   // Account has no storage
 * }
 * ```
 */
export const EMPTY_TRIE_ROOT: import("../Hash/index.js").HashType;
//# sourceMappingURL=constants.d.ts.map