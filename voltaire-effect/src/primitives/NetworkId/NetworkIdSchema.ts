import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum network ID.
 * Network IDs are used to identify different Ethereum networks.
 * @since 0.0.1
 */
export type NetworkIdType = number & { readonly __tag: 'NetworkId' }

/**
 * Internal schema declaration for NetworkId type validation.
 * @internal
 */
const NetworkIdTypeSchema = S.declare<NetworkIdType>(
  (u): u is NetworkIdType => typeof u === 'number' && Number.isInteger(u) && u >= 0,
  { identifier: 'NetworkId' }
)

/**
 * Effect Schema for validating and parsing Ethereum network IDs.
 * Network IDs must be non-negative integers.
 *
 * @param input - A number representing the network ID
 * @returns The validated NetworkIdType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NetworkIdSchema, MAINNET, SEPOLIA } from 'voltaire-effect/NetworkId'
 *
 * // Parse a network ID
 * const networkId = S.decodeSync(NetworkIdSchema)(1)
 *
 * // Use predefined constants
 * console.log(MAINNET) // 1
 * console.log(SEPOLIA) // 11155111
 * ```
 *
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
 * @since 0.0.1
 */
export const MAINNET = 1 as NetworkIdType

/**
 * Goerli testnet network ID (5). Deprecated.
 * @since 0.0.1
 */
export const GOERLI = 5 as NetworkIdType

/**
 * Sepolia testnet network ID (11155111).
 * @since 0.0.1
 */
export const SEPOLIA = 11155111 as NetworkIdType

/**
 * Holesky testnet network ID (17000).
 * @since 0.0.1
 */
export const HOLESKY = 17000 as NetworkIdType
