/**
 * @fileoverview PublicClient module exports for read-only blockchain operations.
 * 
 * @module PublicClient
 * @since 0.0.1
 * 
 * @description
 * This module provides the public client service for querying Ethereum
 * blockchain data. It includes the service definition, layer implementation,
 * and all related types.
 * 
 * Main exports:
 * - {@link PublicClientService} - The service tag/interface
 * - {@link PublicClient} - The live implementation layer
 * - {@link PublicClientError} - Error type for failed operations
 * 
 * Type exports:
 * - {@link BlockTag} - Block identifier type
 * - {@link BlockType} - Block data structure
 * - {@link TransactionType} - Transaction data structure
 * - {@link ReceiptType} - Transaction receipt structure
 * - {@link LogType} - Event log structure
 * - {@link CallRequest} - eth_call parameters
 * - {@link LogFilter} - eth_getLogs parameters
 * 
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { 
 *   PublicClientService, 
 *   PublicClient, 
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getBlockNumber()
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 * 
 * @see {@link TransportService} - Required dependency for RPC communication
 */

export {
  PublicClientService,
  PublicClientError,
  type PublicClientShape,
  type BlockTag,
  type BlockType,
  type TransactionType,
  type ReceiptType,
  type LogType,
  type AccessListType,
  type FeeHistoryType,
  type CallRequest,
  type LogFilter,
  type AddressInput,
  type HashInput
} from './PublicClientService.js'
export { PublicClient } from './PublicClient.js'
