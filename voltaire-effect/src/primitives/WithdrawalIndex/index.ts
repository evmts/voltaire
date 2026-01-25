/**
 * WithdrawalIndex module for beacon chain withdrawal identification.
 * 
 * Withdrawal indices are 64-bit unsigned integers assigned sequentially
 * as withdrawals are processed from the beacon chain.
 * 
 * @module WithdrawalIndex
 * @since 0.0.1
 */
export { Schema, type WithdrawalIndexType } from './WithdrawalIndexSchema.js'
export { from, toBigInt, toNumber, equals, WithdrawalIndexError, UINT64_MAX } from './from.js'
