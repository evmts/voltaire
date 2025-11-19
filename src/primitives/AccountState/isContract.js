// @ts-nocheck
import { Hash } from "../Hash/index.js";
import { EMPTY_CODE_HASH } from "./AccountStateType.js";

/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 */

/**
 * Checks if an AccountState represents a contract account.
 *
 * A contract account is identified by having a non-empty code hash, meaning
 * it has associated bytecode that can be executed.
 *
 * @param {AccountStateType} state - The AccountState to check
 * @returns {boolean} - True if the account is a contract
 *
 * @example
 * ```typescript
 * const isContract = AccountState.isContract(account);
 * ```
 */
export function isContract(state) {
	const emptyHash = Hash(EMPTY_CODE_HASH);
	return !Hash.equals(state.codeHash, emptyHash);
}
