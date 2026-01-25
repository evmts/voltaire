/**
 * @fileoverview Effect Schema definitions for Gas primitive type.
 * Provides validation and transformation for gas amounts in EVM operations.
 * @module Gas/GasSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing a gas amount.
 *
 * @description
 * Gas is the unit of computational effort in the Ethereum Virtual Machine.
 * Every operation costs a certain amount of gas, with the total limited by
 * the block gas limit. This branded type ensures type safety when working
 * with gas values, preventing accidental mixing with other numeric types.
 *
 * @example
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import { Effect } from 'effect'
 *
 * // Create a gas value for a simple transfer (21000 gas)
 * const transferGas = Effect.runSync(Gas.from(21000n))
 *
 * // Use with type safety - compiler prevents mixing with other bigints
 * function calculateFee(gas: Gas.GasType, pricePerUnit: bigint): bigint {
 *   return gas * pricePerUnit
 * }
 * ```
 *
 * @see {@link GasPrice} for price per gas unit
 * @see {@link GasEstimate} for estimated gas before execution
 * @see {@link GasUsed} for actual gas consumed
 * @since 0.0.1
 */
export type GasType = bigint & { readonly __tag: 'Gas' }

const GasTypeSchema = S.declare<GasType>(
  (u): u is GasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Gas' }
)

/**
 * Effect Schema for validating and transforming gas values.
 *
 * @description
 * Validates that input is a non-negative numeric value and transforms it
 * to the branded GasType. Accepts flexible input types for convenience.
 *
 * @param value - Gas amount as bigint, number, or string
 * @returns Branded GasType value
 *
 * @throws {ParseError} When input cannot be parsed as a valid gas amount
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { GasSchema } from 'voltaire-effect/primitives/Gas'
 *
 * // Parse from bigint
 * const gas1 = S.decodeSync(GasSchema)(21000n)
 *
 * // Parse from number
 * const gas2 = S.decodeSync(GasSchema)(21000)
 *
 * // Parse from string
 * const gas3 = S.decodeSync(GasSchema)('21000')
 *
 * // Validation in Effect pipeline
 * import { Effect, pipe } from 'effect'
 * const validated = pipe(
 *   S.decode(GasSchema)(userInput),
 *   Effect.map(gas => ({ gasLimit: gas }))
 * )
 * ```
 *
 * @see {@link from} for Effect-based constructor
 * @since 0.0.1
 */
export const GasSchema: S.Schema<GasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as GasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gas) => ParseResult.succeed(gas)
  }
).annotations({ identifier: 'GasSchema' })
