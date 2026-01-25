/**
 * @fileoverview Effect Schema definitions for FeeMarket primitive type.
 * Provides validation for EIP-1559/EIP-4844 fee market state.
 * @module FeeMarket/FeeMarketSchema
 * @since 0.0.1
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { FeeMarket } from '@tevm/voltaire'

/**
 * Represents EIP-1559 and EIP-4844 fee market state.
 *
 * @description
 * Contains all parameters needed for fee market calculations:
 * - Gas usage and limits for EIP-1559 base fee adjustment
 * - Blob gas metrics for EIP-4844 blob pricing
 *
 * The state is used to:
 * 1. Calculate the next block's base fee
 * 2. Calculate blob base fee for data availability
 * 3. Validate transaction fee parameters
 *
 * @example
 * ```typescript
 * import * as FeeMarket from 'voltaire-effect/primitives/FeeMarket'
 * import { Effect } from 'effect'
 *
 * // Current block state
 * const state = Effect.runSync(FeeMarket.from({
 *   gasUsed: 15_000_000n,      // 50% of limit (target)
 *   gasLimit: 30_000_000n,
 *   baseFee: 20_000_000_000n,  // 20 gwei
 *   excessBlobGas: 0n,
 *   blobGasUsed: 0n
 * }))
 *
 * // Calculate next block's base fee
 * const nextBaseFee = Effect.runSync(
 *   FeeMarket.BaseFee(state.gasUsed, state.gasLimit, state.baseFee)
 * )
 * ```
 *
 * @see {@link BaseFeePerGas} for base fee type
 * @see {@link Blob} for blob data handling
 * @since 0.0.1
 */
export type FeeMarketType = {
  gasUsed: bigint
  gasLimit: bigint
  baseFee: bigint
  excessBlobGas: bigint
  blobGasUsed: bigint
}

const FeeMarketTypeSchema = S.declare<FeeMarketType>(
  (u): u is FeeMarketType =>
    u !== null &&
    typeof u === 'object' &&
    'gasUsed' in u &&
    'gasLimit' in u &&
    'baseFee' in u,
  { identifier: 'FeeMarket' }
)

/**
 * Input type for creating FeeMarket state.
 *
 * @description
 * Accepts flexible numeric types (bigint, number, string) for all fields,
 * which are normalized to bigint during construction.
 *
 * @see {@link FeeMarketType} for the validated output type
 * @since 0.0.1
 */
export type FeeMarketInput = {
  readonly gasUsed: bigint | number | string
  readonly gasLimit: bigint | number | string
  readonly baseFee: bigint | number | string
  readonly excessBlobGas: bigint | number | string
  readonly blobGasUsed: bigint | number | string
}

/**
 * Effect Schema for validating and transforming FeeMarket state.
 *
 * @description
 * Converts flexible input types to normalized bigint values. Validates
 * that all required fields are present and can be converted to bigint.
 *
 * @param input - FeeMarketInput with flexible numeric types
 * @returns FeeMarketType with normalized bigint values
 *
 * @throws {ParseError} When any field cannot be converted to bigint
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { FeeMarketSchema } from 'voltaire-effect/primitives/FeeMarket'
 *
 * // Decode block state
 * const state = S.decodeSync(FeeMarketSchema)({
 *   gasUsed: 15000000n,
 *   gasLimit: 30000000n,
 *   baseFee: 20000000000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 0n
 * })
 *
 * // Works with mixed types
 * const stateFromMixed = S.decodeSync(FeeMarketSchema)({
 *   gasUsed: '15000000',
 *   gasLimit: 30000000,
 *   baseFee: 20000000000n,
 *   excessBlobGas: 0,
 *   blobGasUsed: '0'
 * })
 * ```
 *
 * @see {@link from} for Effect-based constructor
 * @since 0.0.1
 */
export const FeeMarketSchema: S.Schema<FeeMarketType, FeeMarketInput> = S.transformOrFail(
  S.Struct({
    gasUsed: S.Union(S.BigIntFromSelf, S.Number, S.String),
    gasLimit: S.Union(S.BigIntFromSelf, S.Number, S.String),
    baseFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
    excessBlobGas: S.Union(S.BigIntFromSelf, S.Number, S.String),
    blobGasUsed: S.Union(S.BigIntFromSelf, S.Number, S.String),
  }),
  FeeMarketTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        const state: FeeMarketType = {
          gasUsed: BigInt(input.gasUsed),
          gasLimit: BigInt(input.gasLimit),
          baseFee: BigInt(input.baseFee),
          excessBlobGas: BigInt(input.excessBlobGas),
          blobGasUsed: BigInt(input.blobGasUsed),
        }
        return ParseResult.succeed(state)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (state) => ParseResult.succeed({
      gasUsed: state.gasUsed,
      gasLimit: state.gasLimit,
      baseFee: state.baseFee,
      excessBlobGas: state.excessBlobGas,
      blobGasUsed: state.blobGasUsed,
    })
  }
).annotations({ identifier: 'FeeMarketSchema' })
