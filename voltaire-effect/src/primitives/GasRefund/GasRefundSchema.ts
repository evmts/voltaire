/**
 * @fileoverview Effect Schema definitions for GasRefund primitive type.
 * Provides validation for gas refund values from EVM execution.
 * @module GasRefund/GasRefundSchema
 * @since 0.0.1
 */

import { GasRefund } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing gas refund amounts.
 *
 * @description
 * Gas refunds are accumulated during EVM execution when storage slots are
 * cleared (set to zero). This incentivizes state cleanup. Per EIP-3529,
 * the maximum refund is capped at 20% of gas used to prevent abuse.
 *
 * Refund sources:
 * - SSTORE: 4,800 gas when clearing a non-zero slot
 * - SELFDESTRUCT: Removed in post-London
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import { Effect } from 'effect'
 *
 * // Track accumulated refund during execution
 * const refund = Effect.runSync(GasRefund.from(15000n))
 *
 * // Apply cap per EIP-3529 (max 20% of gasUsed)
 * const gasUsed = 100000n
 * const capped = Effect.runSync(GasRefund.cappedRefund(refund, gasUsed))
 * // capped = min(15000, 100000/5) = 15000n
 * ```
 *
 * @see {@link GasUsed} for consumed gas
 * @see {@link GasConstants} for SSTORE refund values
 * @since 0.0.1
 */
export type GasRefundType = ReturnType<typeof GasRefund.from>

const GasRefundTypeSchema = S.declare<GasRefundType>(
  (u): u is GasRefundType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasRefund' }
)

/**
 * Effect Schema for validating gas refund values.
 *
 * @description
 * Validates and transforms input to a branded GasRefundType.
 * Refund values must be non-negative.
 *
 * @param value - Gas refund amount as bigint, number, or string
 * @returns Branded GasRefundType value
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/GasRefund'
 *
 * // Parse refund amount
 * const refund = S.decodeSync(Schema)(15000n)
 *
 * // From execution trace
 * const fromTrace = S.decodeSync(Schema)('4800')
 * ```
 *
 * @see {@link from} for Effect-based constructor
 * @since 0.0.1
 */
export const Schema: S.Schema<GasRefundType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasRefundTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(GasRefund.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (g) => ParseResult.succeed(g)
  }
).annotations({ identifier: 'GasRefundSchema' })
