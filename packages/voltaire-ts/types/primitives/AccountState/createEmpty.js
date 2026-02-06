import { from as weiFrom } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { from as nonceFrom } from "../Nonce/from.js";
import * as StateRoot from "../StateRoot/index.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 */
/**
 * Creates an empty AccountState representing an EOA (Externally Owned Account)
 * with zero balance and nonce.
 *
 * Empty accounts have:
 * - nonce: 0
 * - balance: 0 Wei
 * - storageRoot: empty trie hash
 * - codeHash: empty code hash
 *
 * @returns {AccountStateType} - An empty AccountState
 *
 * @example
 * ```typescript
 * const emptyAccount = AccountState.createEmpty();
 * ```
 */
export function createEmpty() {
    return Object.freeze({
        nonce: nonceFrom(0n),
        balance: weiFrom(0n),
        storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
        codeHash: Hash(EMPTY_CODE_HASH),
    });
}
