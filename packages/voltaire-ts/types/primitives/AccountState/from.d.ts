/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 * @typedef {import('./AccountStateType.js').AccountStateLike} AccountStateLike
 */
/**
 * Creates an AccountState from an object with the required fields.
 *
 * @param {AccountStateLike} state - Object containing nonce, balance, storageRoot, and codeHash
 * @returns {AccountStateType} - A validated AccountState
 *
 * @example
 * ```typescript
 * const state = AccountState.from({
 *   nonce: Nonce.from(5n),
 *   balance: Wei.from(1000000000000000000n), // 1 ETH
 *   storageRoot: StateRoot.from("0x56e8..."),
 *   codeHash: Hash.from("0xc5d2..."),
 * });
 * ```
 */
export function from(state: AccountStateLike): AccountStateType;
export type AccountStateType = import("./AccountStateType.js").AccountStateType;
export type AccountStateLike = import("./AccountStateType.js").AccountStateLike;
//# sourceMappingURL=from.d.ts.map