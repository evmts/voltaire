/**
 * @fileoverview Effect Schema definitions for Gwei denomination values.
 * Provides type-safe schemas for parsing and validating Gwei amounts.
 * @module Denomination/GweiSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing Gwei (10^9 Wei, commonly used for gas prices).
 *
 * @description
 * Gwei (gigawei) is the most common unit for expressing gas prices in Ethereum.
 * - 1 Gwei = 10^9 Wei = 0.000000001 ETH
 * - Typical gas prices range from 1-500 Gwei
 *
 * @example
 * ```typescript
 * import type { GweiType } from 'voltaire-effect/primitives/Denomination'
 *
 * const gasPrice: GweiType = 30n as GweiType // 30 Gwei gas price
 * ```
 *
 * @since 0.0.1
 */
export type GweiType = bigint & { readonly __tag: 'Gwei' }

/**
 * Internal schema declaration for validating GweiType instances.
 * Ensures the value is a non-negative bigint.
 *
 * @internal
 */
const GweiTypeSchema = S.declare<GweiType>(
  (u): u is GweiType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Gwei' }
)

/**
 * Effect Schema for validating Gwei values.
 *
 * @description
 * Transforms bigint, number, or string inputs into branded GweiType values.
 * Gwei is primarily used for gas prices and fee calculations.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse a gas price of 30 Gwei
 * const gwei = Schema.decodeSync(Denomination.GweiSchema)(30n)
 *
 * // From string
 * const fromStr = Schema.decodeSync(Denomination.GweiSchema)('50')
 *
 * // Encode back
 * const encoded = Schema.encodeSync(Denomination.GweiSchema)(gwei)
 * ```
 *
 * @throws ParseResult.Type - When the input is negative or cannot be converted
 * @see {@link WeiSchema} for base unit values
 * @see {@link EtherSchema} for human-readable amounts
 * @since 0.0.1
 */
export const GweiSchema: S.Schema<GweiType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GweiTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as GweiType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gwei) => ParseResult.succeed(gwei)
  }
).annotations({ identifier: 'GweiSchema' })
