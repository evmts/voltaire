/**
 * Create BlockBody from components
 *
 * @param {object} params - BlockBody parameters
 * @param {readonly import('../Transaction/types.js').Any[]} params.transactions - Transactions
 * @param {readonly import('../Uncle/UncleType.js').UncleType[]} params.ommers - Ommers/uncles
 * @param {readonly import('../Withdrawal/WithdrawalType.js').WithdrawalType[]} [params.withdrawals] - Withdrawals (optional, post-Shanghai)
 * @returns {import('./BlockBodyType.js').BlockBodyType} BlockBody
 *
 * @example
 * ```typescript
 * const body = BlockBody.from({
 *   transactions: [tx1, tx2],
 *   ommers: [],
 *   withdrawals: [withdrawal1, withdrawal2] // Optional
 * });
 * ```
 */
export function from({ transactions, ommers, withdrawals }: {
    transactions: readonly import("../Transaction/types.js").Any[];
    ommers: readonly import("../Uncle/UncleType.js").UncleType[];
    withdrawals?: readonly import("../Withdrawal/WithdrawalType.js").WithdrawalType[] | undefined;
}): import("./BlockBodyType.js").BlockBodyType;
//# sourceMappingURL=from.d.ts.map