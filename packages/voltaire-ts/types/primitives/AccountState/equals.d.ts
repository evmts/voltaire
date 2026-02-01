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
export function equals(a: AccountStateType, b: AccountStateType): boolean;
export type AccountStateType = import("./AccountStateType.js").AccountStateType;
//# sourceMappingURL=equals.d.ts.map