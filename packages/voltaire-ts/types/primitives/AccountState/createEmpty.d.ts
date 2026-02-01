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
export function createEmpty(): AccountStateType;
export type AccountStateType = import("./AccountStateType.js").AccountStateType;
//# sourceMappingURL=createEmpty.d.ts.map