/**
 * @module GasRefund
 * @description Effect Schemas for EVM gas refund tracking.
 *
 * Gas refunds are accumulated during EVM execution when storage is cleared.
 * Per EIP-3529, refunds are capped at gasUsed/5 (20%) to prevent abuse.
 *
 * Refund sources:
 * - SSTORE: 4,800 gas when clearing a non-zero slot
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `GasRefund.BigInt` | bigint | GasRefundType |
 * | `GasRefund.Number` | number | GasRefundType |
 *
 * ## Pure Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `cappedRefund(refund, gasUsed)` | Apply EIP-3529 cap |
 *
 * ## Usage
 *
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import * as S from 'effect/Schema'
 *
 * const refund = S.decodeSync(GasRefund.BigInt)(15000n)
 * const capped = GasRefund.cappedRefund(refund, 100000n)
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type GasRefundType } from "./BigInt.js";
export { cappedRefund } from "./cappedRefund.js";
export { Number } from "./Number.js";
