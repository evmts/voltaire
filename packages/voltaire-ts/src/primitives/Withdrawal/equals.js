import { equals as validatorIndexEquals } from "../ValidatorIndex/equals.js";
import { equals as withdrawalIndexEquals } from "../WithdrawalIndex/equals.js";

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
export function equals(a, b) {
	// Check withdrawal index
	if (!withdrawalIndexEquals(a.index, b.index)) return false;

	// Check validator index
	if (!validatorIndexEquals(a.validatorIndex, b.validatorIndex)) return false;

	// Check address bytewise
	if (a.address.length !== b.address.length) return false;
	for (let i = 0; i < a.address.length; i++) {
		if (a.address[i] !== b.address[i]) return false;
	}

	// Check amount
	if (a.amount !== b.amount) return false;

	return true;
}
