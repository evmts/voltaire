import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { FeeMarket } from '@tevm/voltaire'

/**
 * Represents EIP-1559 and EIP-4844 fee market state.
 * Contains gas usage metrics and base fee information for dynamic fee calculation.
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
 * Accepts flexible numeric types for all fields.
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
 * Converts flexible input types to normalized bigint values.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { FeeMarketSchema } from 'voltaire-effect/primitives/FeeMarket'
 *
 * const result = S.decodeSync(FeeMarketSchema)({
 *   gasUsed: 15000000n,
 *   gasLimit: 30000000n,
 *   baseFee: 1000000000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 0n
 * })
 * ```
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
