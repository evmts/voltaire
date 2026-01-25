/**
 * @fileoverview Effect Schema definitions for BaseFeePerGas primitive type.
 * Provides validation for EIP-1559 base fee values.
 * @module BaseFeePerGas/BaseFeePerGasSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing EIP-1559 base fee per gas in wei.
 *
 * @description
 * The base fee is the minimum price per gas unit for transaction inclusion.
 * It's set by the protocol and adjusts based on block utilization:
 *
 * - Target: 50% block utilization (15M gas for 30M limit)
 * - Above target: Base fee increases up to 12.5%
 * - Below target: Base fee decreases up to 12.5%
 * - Minimum: 7 wei (but practically higher due to market)
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Current base fee from block header
 * const baseFee = Effect.runSync(BaseFeePerGas.fromGwei(20))
 *
 * // Convert to gwei for display
 * const gwei = BaseFeePerGas.toGwei(baseFee) // 20n
 * ```
 *
 * @see {@link MaxFeePerGas} for max fee user is willing to pay
 * @see {@link FeeMarket} for fee market calculations
 * @since 0.0.1
 */
export type BaseFeePerGasType = bigint & { readonly __tag: 'BaseFeePerGas' }

const BaseFeePerGasTypeSchema = S.declare<BaseFeePerGasType>(
  (u): u is BaseFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'BaseFeePerGas' }
)

/**
 * Effect Schema for validating base fee values in wei.
 *
 * @description
 * Validates and transforms input to a branded BaseFeePerGasType in wei.
 * Use when parsing base fees from block headers or RPC responses.
 *
 * @param value - Base fee in wei as bigint, number, or string
 * @returns Branded BaseFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { BaseFeePerGasSchema } from 'voltaire-effect/primitives/BaseFeePerGas'
 *
 * // From block header (wei)
 * const baseFee = S.decodeSync(BaseFeePerGasSchema)(20000000000n)
 *
 * // From hex RPC response
 * const fromHex = S.decodeSync(BaseFeePerGasSchema)('0x4a817c800')
 * ```
 *
 * @see {@link BaseFeePerGasFromGweiSchema} for gwei input
 * @since 0.0.1
 */
export const BaseFeePerGasSchema: S.Schema<BaseFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  BaseFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as BaseFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (baseFee) => ParseResult.succeed(baseFee)
  }
).annotations({ identifier: 'BaseFeePerGasSchema' })

const GWEI = 1_000_000_000n

/**
 * Effect Schema for validating base fee values from gwei.
 *
 * @description
 * Converts gwei input to wei representation. More ergonomic for user
 * interfaces since base fees are typically displayed in gwei.
 *
 * @param value - Base fee in gwei as number or bigint
 * @returns Branded BaseFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { BaseFeePerGasFromGweiSchema } from 'voltaire-effect/primitives/BaseFeePerGas'
 *
 * // 20 gwei -> 20,000,000,000 wei
 * const baseFee = S.decodeSync(BaseFeePerGasFromGweiSchema)(20)
 *
 * // Encoding converts back to gwei
 * const gwei = S.encodeSync(BaseFeePerGasFromGweiSchema)(baseFee) // 20n
 * ```
 *
 * @see {@link BaseFeePerGasSchema} for wei input
 * @since 0.0.1
 */
export const BaseFeePerGasFromGweiSchema: S.Schema<BaseFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  BaseFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'BaseFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as BaseFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (baseFee) => ParseResult.succeed(baseFee / GWEI)
  }
).annotations({ identifier: 'BaseFeePerGasFromGweiSchema' })
