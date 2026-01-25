/**
 * @fileoverview GasRefund primitive module for EVM gas refund tracking.
 *
 * @description
 * Gas refunds are accumulated during EVM execution when storage is cleared
 * (SSTORE to zero). Per EIP-3529, refunds are capped at gasUsed/5 (20%)
 * to prevent refund abuse and gas token exploits.
 *
 * Key facts:
 * - Refunds occur when: SSTORE sets storage to zero, SELFDESTRUCT
 * - Max refund = gasUsed / 5 (post EIP-3529)
 * - Refunds reduce the effective gas cost but cannot create negative cost
 *
 * @module GasRefund
 * @since 0.0.1
 * @see {@link GasUsed} for consumed gas
 * @see {@link GasConstants} for refund values
 */

export { Schema, type GasRefundType } from './GasRefundSchema.js'
export { from, cappedRefund, GasRefundError } from './from.js'
