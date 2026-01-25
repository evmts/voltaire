/**
 * @fileoverview Effect Schema definitions for GasEstimate primitive type.
 * Provides validation for gas estimation values from eth_estimateGas calls.
 * @module GasEstimate/GasEstimateSchema
 * @since 0.0.1
 */

import { GasEstimate as VoltaireGasEstimate } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing an estimated gas amount.
 *
 * @description
 * Gas estimates predict the computational cost of a transaction before
 * execution. The Ethereum `eth_estimateGas` RPC method returns this value.
 * Estimates are typically used to set the transaction's gas limit, usually
 * with a safety buffer added.
 *
 * Important considerations:
 * - Estimates can change if blockchain state changes before execution
 * - Always add a buffer (10-20%) for safety
 * - Estimate may be lower than actual if state changes between calls
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import { Effect } from 'effect'
 *
 * // Get estimate from RPC
 * const estimate = Effect.runSync(GasEstimate.from(52000n))
 *
 * // Add 20% buffer for safety
 * const buffered = Effect.runSync(GasEstimate.withBuffer(estimate, 20))
 *
 * // Convert to gas limit for transaction
 * const gasLimit = Effect.runSync(GasEstimate.toGasLimit(buffered))
 * ```
 *
 * @see {@link Gas} for raw gas values
 * @see {@link GasUsed} for actual consumed gas
 * @since 0.0.1
 */
export type GasEstimateType = VoltaireGasEstimate.GasEstimateType

const GasEstimateTypeSchema = S.declare<GasEstimateType>(
  (u): u is GasEstimateType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasEstimate' }
)

/**
 * Effect Schema for validating gas estimate values.
 *
 * @description
 * Validates and transforms input to a branded GasEstimateType.
 * Use this when parsing gas estimates from RPC responses or user input.
 *
 * @param value - Gas estimate as bigint, number, or string
 * @returns Branded GasEstimateType value
 *
 * @throws {ParseError} When input cannot be parsed as a valid estimate
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { GasEstimateSchema } from 'voltaire-effect/primitives/GasEstimate'
 *
 * // Parse from eth_estimateGas result
 * const estimate = S.decodeSync(GasEstimateSchema)(52000n)
 *
 * // Parse from hex string (RPC response)
 * const fromHex = S.decodeSync(GasEstimateSchema)('0xcb20')
 * ```
 *
 * @see {@link from} for Effect-based constructor
 * @since 0.0.1
 */
export const GasEstimateSchema: S.Schema<GasEstimateType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasEstimateTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(VoltaireGasEstimate.GasEstimate.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasEstimate) => ParseResult.succeed(gasEstimate)
  }
).annotations({ identifier: 'GasEstimateSchema' })
