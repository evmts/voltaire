import { Hash } from "../Hash/index.js";
import { EMPTY_CODE_HASH } from "./AccountStateType.js";

/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 */

/**
 * Checks if an AccountState represents an EOA (Externally Owned Account).
 *
 * An EOA is identified by having the empty code hash, meaning it has no
 * associated bytecode. EOAs can only send transactions and cannot execute code.
 *
 * @param {AccountStateType} state - The AccountState to check
 * @returns {boolean} - True if the account is an EOA
 *
 * @example
 * ```typescript
 * const isEOA = AccountState.isEOA(account);
 * ```
 */
export function isEOA(state) {
	const emptyHash = Hash(EMPTY_CODE_HASH);
	return Hash.equals(state.codeHash, emptyHash);
}
