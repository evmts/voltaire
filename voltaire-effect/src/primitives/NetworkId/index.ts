/**
 * @fileoverview NetworkId module for working with Ethereum network identifiers in Effect.
 * Network IDs are used to identify different Ethereum networks at the P2P layer.
 *
 * @description
 * This module provides tools for working with Ethereum network IDs, which are
 * used at the networking layer to identify peers on the same network.
 *
 * **Network ID vs Chain ID:**
 * - Chain ID (EIP-155): Used in transaction signing to prevent replay attacks
 * - Network ID: Used in peer-to-peer networking to identify network peers
 *
 * For most networks these are the same, but they can differ (e.g., some private networks).
 *
 * Predefined constants are provided for common networks:
 * - MAINNET (1)
 * - SEPOLIA (11155111) - recommended testnet
 * - HOLESKY (17000) - staking testnet
 * - GOERLI (5) - deprecated
 *
 * @example
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a network ID
 * const networkId = Effect.runSync(NetworkId.from(1))
 *
 * // Use predefined constants
 * console.log(NetworkId.MAINNET)  // 1
 * console.log(NetworkId.SEPOLIA)  // 11155111
 *
 * // Using Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(NetworkId.NetworkIdSchema)(137)
 * ```
 *
 * @module NetworkId
 * @since 0.0.1
 * @see {@link NetworkIdSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
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
