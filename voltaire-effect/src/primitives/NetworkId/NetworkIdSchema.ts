/**
 * @fileoverview Effect Schema definitions for Ethereum network ID validation.
 * Provides type-safe schemas for parsing and validating network identifiers.
 * @module NetworkId/NetworkIdSchema
 * @since 0.0.1
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum network ID.
 *
 * @description
 * Network IDs are used to identify different Ethereum networks at the
 * networking layer. While chain IDs are used for transaction signing
 * (EIP-155), network IDs are used for peer-to-peer networking.
 *
 * Note: For most networks, network ID equals chain ID, but they can differ.
 *
 * @example
 * ```typescript
 * import type { NetworkIdType } from 'voltaire-effect/primitives/NetworkId'
 *
 * const mainnet: NetworkIdType = 1 as NetworkIdType
 * ```
 *
 * @since 0.0.1
 */
export type NetworkIdType = number & { readonly __tag: 'NetworkId' }

/**
 * Internal schema declaration for NetworkId type validation.
 * Ensures the value is a non-negative integer.
 *
 * @internal
 */
const NetworkIdTypeSchema = S.declare<NetworkIdType>(
  (u): u is NetworkIdType => typeof u === 'number' && Number.isInteger(u) && u >= 0,
  { identifier: 'NetworkId' }
)

/**
 * Effect Schema for validating and parsing Ethereum network IDs.
 *
 * @description
 * Transforms numeric input into branded NetworkIdType values. Network IDs
 * must be non-negative integers.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NetworkIdSchema, MAINNET, SEPOLIA } from 'voltaire-effect/primitives/NetworkId'
 *
 * // Parse a network ID
 * const networkId = S.decodeSync(NetworkIdSchema)(1)
 *
 * // Use predefined constants
 * console.log(MAINNET) // 1
 * console.log(SEPOLIA) // 11155111
 *
 * // Encode back
 * const encoded = S.encodeSync(NetworkIdSchema)(networkId)
 * ```
 *
 * @throws ParseResult.Type - When the value is negative or not an integer
 * @see {@link from} for Effect-wrapped network ID creation
 * @since 0.0.1
 */
export const NetworkIdSchema: S.Schema<NetworkIdType, number> = S.transformOrFail(
  S.Number,
  NetworkIdTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      if (!Number.isInteger(value) || value < 0) {
        return ParseResult.fail(new ParseResult.Type(ast, value, 'Network ID must be a non-negative integer'))
      }
      return ParseResult.succeed(value as NetworkIdType)
    },
    encode: (networkId) => ParseResult.succeed(networkId)
  }
).annotations({ identifier: 'NetworkIdSchema' })

/**
 * Ethereum Mainnet network ID (1).
 *
 * @description
 * The primary Ethereum production network where real value transactions occur.
 *
 * @example
 * ```typescript
 * import { MAINNET } from 'voltaire-effect/primitives/NetworkId'
 * console.log(MAINNET) // 1
 * ```
 *
 * @since 0.0.1
 */
export const MAINNET = 1 as NetworkIdType

/**
 * Goerli testnet network ID (5).
 *
 * @description
 * A proof-of-authority testnet. **Deprecated** - use Sepolia or Holesky instead.
 *
 * @deprecated Use SEPOLIA or HOLESKY instead
 * @since 0.0.1
 */
export const GOERLI = 5 as NetworkIdType

/**
 * Sepolia testnet network ID (11155111).
 *
 * @description
 * The recommended testnet for dapp development and testing. Uses proof-of-stake.
 *
 * @example
 * ```typescript
 * import { SEPOLIA } from 'voltaire-effect/primitives/NetworkId'
 * console.log(SEPOLIA) // 11155111
 * ```
 *
 * @since 0.0.1
 */
export const SEPOLIA = 11155111 as NetworkIdType

/**
 * Holesky testnet network ID (17000).
 *
 * @description
 * A testnet designed for staking and infrastructure testing. Larger than Sepolia.
 *
 * @example
 * ```typescript
 * import { HOLESKY } from 'voltaire-effect/primitives/NetworkId'
 * console.log(HOLESKY) // 17000
 * ```
 *
 * @since 0.0.1
 */
export const HOLESKY = 17000 as NetworkIdType
