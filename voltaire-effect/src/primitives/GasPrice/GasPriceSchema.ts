/**
 * @fileoverview Effect Schema definitions for GasPrice primitive type.
 * Provides validation for gas prices in wei and gwei denominations.
 * @module GasPrice/GasPriceSchema
 * @since 0.0.1
 */

import { Gas } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing a gas price in wei.
 *
 * @description
 * Gas price is the cost per unit of gas, denominated in wei. This value
 * determines how much ETH is paid for transaction execution. Higher gas
 * prices incentivize miners/validators to include transactions faster.
 *
 * @example
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import { Effect } from 'effect'
 *
 * // 20 gwei gas price (common value)
 * const price = Effect.runSync(GasPrice.fromGwei(20))
 *
 * // Calculate transaction fee: gas * gasPrice
 * const gasUsed = 21000n
 * const fee = gasUsed * price // fee in wei
 * ```
 *
 * @see {@link BaseFeePerGas} for EIP-1559 base fee
 * @see {@link MaxFeePerGas} for maximum fee willing to pay
 * @since 0.0.1
 */
export type GasPriceType = Gas.GasPriceType

const GasPriceTypeSchema = S.declare<GasPriceType>(
  (u): u is GasPriceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasPrice' }
)

/**
 * Effect Schema for validating gas price values in wei.
 *
 * @description
 * Validates and transforms input to a branded GasPriceType in wei.
 * Use this when working with raw wei values directly.
 *
 * @param value - Gas price in wei as bigint, number, or string
 * @returns Branded GasPriceType value in wei
 *
 * @throws {ParseError} When input cannot be parsed as a valid gas price
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { GasPriceSchema } from 'voltaire-effect/primitives/GasPrice'
 *
 * // 1 gwei = 1,000,000,000 wei
 * const price = S.decodeSync(GasPriceSchema)(1000000000n)
 *
 * // From RPC response (string)
 * const priceFromRpc = S.decodeSync(GasPriceSchema)('0x3b9aca00')
 * ```
 *
 * @see {@link GasPriceFromGweiSchema} for gwei input
 * @since 0.0.1
 */
export const GasPriceSchema: S.Schema<GasPriceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasPriceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Gas.GasPrice.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasPrice) => ParseResult.succeed(gasPrice)
  }
).annotations({ identifier: 'GasPriceSchema' })

/**
 * Effect Schema for validating gas price values from gwei.
 *
 * @description
 * Converts gwei input to wei representation. This is the more ergonomic
 * schema for user-facing inputs since gas prices are typically expressed
 * in gwei (e.g., "20 gwei" instead of "20000000000 wei").
 *
 * @param value - Gas price in gwei as number or bigint
 * @returns Branded GasPriceType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { GasPriceFromGweiSchema } from 'voltaire-effect/primitives/GasPrice'
 *
 * // 20 gwei -> 20,000,000,000 wei
 * const price = S.decodeSync(GasPriceFromGweiSchema)(20)
 *
 * // Encoding converts back to gwei
 * const gwei = S.encodeSync(GasPriceFromGweiSchema)(price) // 20n
 * ```
 *
 * @see {@link GasPriceSchema} for wei input
 * @see {@link fromGwei} for Effect-based constructor
 * @since 0.0.1
 */
export const GasPriceFromGweiSchema: S.Schema<GasPriceType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  GasPriceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Gas.GasPrice.fromGwei(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasPrice) => ParseResult.succeed(Gas.GasPrice.toGwei(gasPrice))
  }
).annotations({ identifier: 'GasPriceFromGweiSchema' })
