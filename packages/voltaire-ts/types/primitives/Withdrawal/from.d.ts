/**
 * Create Withdrawal from components
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal for Withdrawal documentation
 * @since 0.0.0
 * @param {object} params - Withdrawal parameters
 * @param {import('../WithdrawalIndex/WithdrawalIndexType.js').WithdrawalIndexType | number | bigint | string} params.index - Global withdrawal counter
 * @param {import('../ValidatorIndex/ValidatorIndexType.js').ValidatorIndexType | number | bigint | string} params.validatorIndex - Validator index
 * @param {import('../Address/AddressType.js').AddressType | string | Uint8Array} params.address - Withdrawal recipient address
 * @param {import('../Denomination/GweiType.js').GweiType | number | bigint | string} params.amount - Amount in Gwei
 * @returns {import('./WithdrawalType.js').WithdrawalType} Withdrawal
 * @throws {Error} If any parameter is invalid
 * @example
 * ```javascript
 * import * as Withdrawal from './primitives/Withdrawal/index.js';
 * const withdrawal = Withdrawal.from({
 *   index: 1000000n,
 *   validatorIndex: 123456,
 *   address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   amount: 32000000000n, // 32 ETH in Gwei
 * });
 * ```
 */
export function from({ index, validatorIndex, address, amount }: {
    index: import("../WithdrawalIndex/WithdrawalIndexType.js").WithdrawalIndexType | number | bigint | string;
    validatorIndex: import("../ValidatorIndex/ValidatorIndexType.js").ValidatorIndexType | number | bigint | string;
    address: import("../Address/AddressType.js").AddressType | string | Uint8Array;
    amount: import("../Denomination/GweiType.js").GweiType | number | bigint | string;
}): import("./WithdrawalType.js").WithdrawalType;
//# sourceMappingURL=from.d.ts.map