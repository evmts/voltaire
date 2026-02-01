/**
 * Check if Withdrawal values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal for Withdrawal documentation
 * @since 0.0.0
 * @param {import('./WithdrawalType.js').WithdrawalType} a - First withdrawal
 * @param {import('./WithdrawalType.js').WithdrawalType} b - Second withdrawal
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Withdrawal from './primitives/Withdrawal/index.js';
 * const a = Withdrawal.from({ index: 1n, validatorIndex: 1, address: "0x...", amount: 100n });
 * const b = Withdrawal.from({ index: 1n, validatorIndex: 1, address: "0x...", amount: 100n });
 * const result = Withdrawal.equals(a, b); // true
 * ```
 */
export function equals(a: import("./WithdrawalType.js").WithdrawalType, b: import("./WithdrawalType.js").WithdrawalType): boolean;
//# sourceMappingURL=equals.d.ts.map