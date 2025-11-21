import { Hash } from "../Hash/index.js";
import * as StateRoot from "../StateRoot/index.js";
// @ts-nocheck
import { equals as uintEquals } from "../Uint/equals.js";

/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 */

/**
 * Compares two AccountStates for equality.
 * All four fields must match for accounts to be considered equal.
 *
 * @param {AccountStateType} a - First AccountState
 * @param {AccountStateType} b - Second AccountState
 * @returns {boolean} - True if all fields are equal
 *
 * @example
 * ```typescript
 * const isEqual = AccountState.equals(state1, state2);
 * ```
 */
export function equals(a, b) {
	return (
		uintEquals(a.nonce, b.nonce) &&
		uintEquals(a.balance, b.balance) &&
		StateRoot.equals(a.storageRoot, b.storageRoot) &&
		Hash.equals(a.codeHash, b.codeHash)
	);
}
