/**
 * @fileoverview Effect Schema definitions for GasUsed primitive type.
 * Provides validation for gas consumption values from transaction receipts.
 * @module GasUsed/GasUsedSchema
 * @since 0.0.1
 */

import { GasUsed } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing gas consumed during execution.
 *
 * @description
 * GasUsed is the actual amount of gas consumed by a transaction. This value
 * appears in transaction receipts after execution. It's always less than or
 * equal to the gas limit set in the transaction.
 *
 * Key facts:
 * - gasUsed ≤ gasLimit (always)
 * - Unused gas (gasLimit - gasUsed) is refunded
 * - Fee paid = gasUsed × effectiveGasPrice
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import { Effect } from 'effect'
 *
 * // From transaction receipt
 * const used = Effect.runSync(GasUsed.from(21000n))
 *
 * // Calculate actual fee paid
 * const effectiveGasPrice = 20_000_000_000n // 20 gwei
 * const fee = Effect.runSync(GasUsed.calculateCost(used, effectiveGasPrice))
 * // fee = 420,000 gwei = 0.00042 ETH
 * ```
 *
 * @see {@link GasEstimate} for pre-execution estimates
 * @see {@link GasRefund} for storage clearing refunds
 * @since 0.0.1
 */
export type GasUsedType = ReturnType<typeof GasUsed.from>

const GasUsedTypeSchema = S.declare<GasUsedType>(
  (u): u is GasUsedType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasUsed' }
)

/**
 * Effect Schema for validating gas used values.
 *
 * @description
 * Validates and transforms input to a branded GasUsedType.
 * Use when parsing gas used from transaction receipts or RPC responses.
 *
 * @param value - Gas used amount as bigint, number, or string
 * @returns Branded GasUsedType value
 *
 * @throws {ParseError} When input cannot be parsed as a valid gas amount
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/GasUsed'
 *
 * // Parse from receipt
 * const used = S.decodeSync(Schema)(21000n)
 *
 * // Parse from hex (RPC response)
 * const fromHex = S.decodeSync(Schema)('0x5208')
 * ```
 *
 * @see {@link from} for Effect-based constructor
 * @since 0.0.1
 */
export const Schema: S.Schema<GasUsedType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasUsedTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(GasUsed.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (g) => ParseResult.succeed(g)
  }
).annotations({ identifier: 'GasUsedSchema' })
