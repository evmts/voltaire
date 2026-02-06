/**
 * Withdrawal module for EIP-4895 beacon chain withdrawals.
 *
 * Withdrawals transfer ETH from the beacon chain (staking) back to execution layer addresses.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Withdrawal from 'voltaire-effect/primitives/Withdrawal'
 *
 * function processWithdrawal(withdrawal: Withdrawal.WithdrawalType) {
 *   // ...
 * }
 * ```
 *
 * @module Withdrawal
 * @since 0.0.1
 */

export { Schema, type WithdrawalType } from "./WithdrawalSchema.js";
