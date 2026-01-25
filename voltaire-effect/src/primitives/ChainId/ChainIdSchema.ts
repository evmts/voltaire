/**
 * @fileoverview Effect Schema definitions for Ethereum chain ID validation.
 * Provides type-safe schemas for parsing and validating network identifiers.
 * @module ChainId/ChainIdSchema
 * @since 0.0.1
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum chain ID.
 *
 * @description
 * Chain IDs are positive integers that uniquely identify an Ethereum network.
 * They are defined in EIP-155 and used to prevent replay attacks across chains.
 *
 * Common chain IDs:
 * - 1: Ethereum Mainnet
 * - 11155111: Sepolia Testnet
 * - 137: Polygon
 * - 42161: Arbitrum One
 *
 * @example
 * ```typescript
 * import type { ChainIdType } from 'voltaire-effect/primitives/ChainId'
 *
 * const mainnet: ChainIdType = 1 as ChainIdType
 * ```
 *
 * @since 0.0.1
 */
export type ChainIdType = number & { readonly __tag: 'ChainId' }

/**
 * Internal schema declaration for validating ChainIdType instances.
 * Ensures the value is a positive integer.
 *
 * @internal
 */
const ChainIdTypeSchema = S.declare<ChainIdType>(
  (u): u is ChainIdType => typeof u === 'number' && Number.isInteger(u) && u > 0,
  { identifier: 'ChainId' }
)

/**
 * Effect Schema for validating Ethereum chain IDs.
 *
 * @description
 * Transforms numeric input into branded ChainIdType values. Validates
 * that the value is a positive integer.
 *
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as Schema from 'effect/Schema'
 *
 * // Ethereum mainnet
 * const mainnet = Schema.decodeSync(ChainId.ChainIdSchema)(1)
 *
 * // Sepolia testnet
 * const sepolia = Schema.decodeSync(ChainId.ChainIdSchema)(11155111)
 *
 * // Encode back
 * const encoded = Schema.encodeSync(ChainId.ChainIdSchema)(mainnet)
 * ```
 *
 * @throws ParseResult.Type - When the value is not a positive integer
 * @see {@link from} for Effect-wrapped chain ID creation
 * @since 0.0.1
 */
export const ChainIdSchema: S.Schema<ChainIdType, number> = S.transformOrFail(
  S.Number,
  ChainIdTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      if (!Number.isInteger(value) || value <= 0) {
        return ParseResult.fail(new ParseResult.Type(ast, value, 'Chain ID must be a positive integer'))
      }
      return ParseResult.succeed(value as ChainIdType)
    },
    encode: (chainId) => ParseResult.succeed(chainId)
  }
).annotations({ identifier: 'ChainIdSchema' })
