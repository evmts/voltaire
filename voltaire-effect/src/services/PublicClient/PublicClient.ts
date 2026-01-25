/**
 * @fileoverview Live implementation of PublicClientService.
 * 
 * @module PublicClient
 * @since 0.0.1
 * 
 * @description
 * Provides the live implementation layer for PublicClientService. This layer
 * translates the high-level PublicClientService methods into JSON-RPC calls
 * via the TransportService.
 * 
 * The layer requires a TransportService to be provided (HttpTransport,
 * WebSocketTransport, BrowserTransport, or TestTransport).
 * 
 * @see {@link PublicClientService} - The service interface
 * @see {@link TransportService} - Required dependency
 * @see {@link HttpTransport} - Common transport for RPC calls
 */

import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { TransportService } from '../Transport/TransportService.js'
import {
  PublicClientService,
  PublicClientError,
  type CallRequest,
  type LogFilter,
  type BlockTag,
  type BlockType,
  type TransactionType,
  type ReceiptType,
  type LogType,
  type AccessListType,
  type FeeHistoryType
} from './PublicClientService.js'

/**
 * Formats a CallRequest for JSON-RPC submission.
 * 
 * @description
 * Converts bigint values to hex strings and filters out undefined fields
 * to create a valid JSON-RPC call object.
 * 
 * @param tx - The call request to format
 * @returns Formatted object with hex-encoded values
 * 
 * @internal
 */
const formatCallRequest = (tx: CallRequest): Record<string, string> => {
  const formatted: Record<string, string> = {}
  if (tx.from) formatted.from = tx.from
  if (tx.to) formatted.to = tx.to
  if (tx.data) formatted.data = tx.data
  if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`
  if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`
  return formatted
}

/**
 * Live implementation of the public client layer.
 * 
 * @description
 * Provides a concrete implementation of PublicClientService that translates
 * method calls to JSON-RPC requests via TransportService.
 * 
 * This layer:
 * - Converts method parameters to JSON-RPC format
 * - Handles response parsing (hex to bigint, etc.)
 * - Maps transport errors to PublicClientError
 * 
 * Requires TransportService in context.
 * 
 * @since 0.0.1
 * 
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClient, PublicClientService, HttpTransport } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   const blockNum = yield* client.getBlockNumber()
 *   return blockNum
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * await Effect.runPromise(program)
 * ```
 * 
 * @example Composing with other layers
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { 
 *   PublicClient, 
 *   PublicClientService, 
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * 
 * // Create a composed layer for reuse
 * const MainnetClient = PublicClient.pipe(
 *   Layer.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getBlockNumber()
 * }).pipe(Effect.provide(MainnetClient))
 * ```
 * 
 * @example Testing with TestTransport
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClient, PublicClientService, TestTransport } from 'voltaire-effect/services'
 * 
 * const testTransport = TestTransport({
 *   'eth_blockNumber': '0x1234',
 *   'eth_chainId': '0x1'
 * })
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getBlockNumber()
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(testTransport)
 * )
 * 
 * const result = await Effect.runPromise(program)
 * expect(result).toBe(0x1234n)
 * ```
 * 
 * @see {@link PublicClientService} - The service interface
 * @see {@link TransportService} - Required transport dependency
 * @see {@link HttpTransport} - HTTP transport implementation
 * @see {@link TestTransport} - Mock transport for testing
 */
export const PublicClient: Layer.Layer<PublicClientService, never, TransportService> = Layer.effect(
  PublicClientService,
  Effect.gen(function* () {
    const transport = yield* TransportService

    const request = <T>(method: string, params?: unknown[]) =>
      transport.request<T>(method, params).pipe(
        Effect.mapError((e) => new PublicClientError({ method, params }, e.message))
      )

    return {
      getBlockNumber: () =>
        request<string>('eth_blockNumber').pipe(
          Effect.map((hex) => BigInt(hex))
        ),

      getBlock: (args?: { blockTag?: BlockTag; blockHash?: string; includeTransactions?: boolean }) => {
        const method = args?.blockHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber'
        const params = args?.blockHash
          ? [args.blockHash, args?.includeTransactions ?? false]
          : [args?.blockTag ?? 'latest', args?.includeTransactions ?? false]
        return request<BlockType>(method, params)
      },

      getBlockTransactionCount: (args: { blockTag?: BlockTag; blockHash?: string }) => {
        const method = args.blockHash ? 'eth_getBlockTransactionCountByHash' : 'eth_getBlockTransactionCountByNumber'
        const params = args.blockHash ? [args.blockHash] : [args.blockTag ?? 'latest']
        return request<string>(method, params).pipe(
          Effect.map((hex) => Number(hex))
        )
      },

      getBalance: (address: string, blockTag: BlockTag = 'latest') =>
        request<string>('eth_getBalance', [address, blockTag]).pipe(
          Effect.map((hex) => BigInt(hex))
        ),

      getTransactionCount: (address: string, blockTag: BlockTag = 'latest') =>
        request<string>('eth_getTransactionCount', [address, blockTag]).pipe(
          Effect.map((hex) => Number(hex))
        ),

      getCode: (address: string, blockTag: BlockTag = 'latest') =>
        request<string>('eth_getCode', [address, blockTag]),

      getStorageAt: (address: string, slot: string, blockTag: BlockTag = 'latest') =>
        request<string>('eth_getStorageAt', [address, slot, blockTag]),

      getTransaction: (hash: string) =>
        request<TransactionType>('eth_getTransactionByHash', [hash]),

      getTransactionReceipt: (hash: string) =>
        request<ReceiptType>('eth_getTransactionReceipt', [hash]),

      waitForTransactionReceipt: (hash: string, opts?: { confirmations?: number; timeout?: number }) =>
        Effect.gen(function* () {
          const timeout = opts?.timeout ?? 60000
          const confirmations = opts?.confirmations ?? 1
          const startTime = Date.now()

          while (Date.now() - startTime < timeout) {
            const receipt = yield* request<ReceiptType | null>('eth_getTransactionReceipt', [hash])
            if (receipt) {
              const currentBlock = yield* request<string>('eth_blockNumber')
              const receiptBlock = BigInt(receipt.blockNumber)
              if (BigInt(currentBlock) - receiptBlock >= BigInt(confirmations - 1)) {
                return receipt
              }
            }
            yield* Effect.sleep(1000)
          }
          return yield* Effect.fail(new PublicClientError(hash, 'Transaction receipt timeout'))
        }),

      call: (tx: CallRequest, blockTag: BlockTag = 'latest') =>
        request<string>('eth_call', [formatCallRequest(tx), blockTag]),

      estimateGas: (tx: CallRequest) =>
        request<string>('eth_estimateGas', [formatCallRequest(tx)]).pipe(
          Effect.map((hex) => BigInt(hex))
        ),

      createAccessList: (tx: CallRequest) =>
        request<AccessListType>('eth_createAccessList', [formatCallRequest(tx)]),

      getLogs: (filter: LogFilter) => {
        const params: Record<string, unknown> = {}
        if (filter.address) params.address = filter.address
        if (filter.topics) params.topics = filter.topics
        if (filter.fromBlock) params.fromBlock = filter.fromBlock
        if (filter.toBlock) params.toBlock = filter.toBlock
        if (filter.blockHash) params.blockHash = filter.blockHash
        return request<LogType[]>('eth_getLogs', [params])
      },

      getChainId: () =>
        request<string>('eth_chainId').pipe(
          Effect.map((hex) => Number(hex))
        ),

      getGasPrice: () =>
        request<string>('eth_gasPrice').pipe(
          Effect.map((hex) => BigInt(hex))
        ),

      getMaxPriorityFeePerGas: () =>
        request<string>('eth_maxPriorityFeePerGas').pipe(
          Effect.map((hex) => BigInt(hex))
        ),

      getFeeHistory: (blockCount: number, newestBlock: BlockTag, rewardPercentiles: number[]) =>
        request<FeeHistoryType>('eth_feeHistory', [`0x${blockCount.toString(16)}`, newestBlock, rewardPercentiles])
    }
  })
)
