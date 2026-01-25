/**
 * NetworkId module for working with Ethereum network identifiers in Effect.
 * Network IDs are used to identify different Ethereum networks and prevent
 * replay attacks across networks.
 *
 * @example
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/NetworkId'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a network ID
 * const networkId = Effect.runSync(NetworkId.from(1))
 *
 * // Use predefined constants
 * console.log(NetworkId.MAINNET)  // 1
 * console.log(NetworkId.SEPOLIA)  // 11155111
 * ```
 *
 * @since 0.0.1
 * @module
 */
export {
  NetworkIdSchema,
  NetworkIdSchema as Schema,
  type NetworkIdType,
  MAINNET,
  GOERLI,
  SEPOLIA,
  HOLESKY
} from './NetworkIdSchema.js'
export { from, InvalidNetworkIdError } from './from.js'
