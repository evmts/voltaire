/**
 * @fileoverview Test transport implementation for mocking JSON-RPC responses.
 * 
 * @module TestTransport
 * @since 0.0.1
 * 
 * @description
 * Provides a mock transport layer for unit testing without making actual
 * network calls. Allows defining predefined responses for JSON-RPC methods,
 * including error responses.
 * 
 * Features:
 * - Define mock responses per method
 * - Simulate errors with TransportError
 * - No network dependencies
 * - Deterministic test behavior
 * 
 * Use TestTransport when:
 * - Writing unit tests for code that uses TransportService
 * - Need deterministic responses without network variability
 * - Want to test error handling paths
 * 
 * @see {@link TransportService} - The service interface this implements
 * @see {@link HttpTransport} - Production HTTP transport
 */

import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { TransportService } from './TransportService.js'
import { TransportError } from './TransportError.js'

/**
 * Creates a test transport layer with predefined responses.
 * 
 * @description
 * Provides a mock implementation of TransportService for testing purposes.
 * Allows you to define exact responses for each JSON-RPC method, including
 * error responses using TransportError instances.
 * 
 * The transport:
 * - Returns predefined responses for known methods
 * - Throws "Method not found" error for unknown methods
 * - Supports both Map and object for response configuration
 * - Ignores request parameters (matches by method name only)
 * 
 * @param responses - Map or object of method names to their mock responses.
 *                    Use TransportError instances to simulate failures.
 * @returns Layer providing TransportService
 * 
 * @throws {TransportError} When the requested method is not in the response map (code: -32601)
 * @throws {TransportError} When the response is a TransportError instance (simulated error)
 * 
 * @since 0.0.1
 * 
 * @example Basic mock responses
 * ```typescript
 * import { Effect } from 'effect'
 * import { TestTransport, TransportService } from 'voltaire-effect/services'
 * 
 * const transport = TestTransport({
 *   'eth_blockNumber': '0x1234',
 *   'eth_chainId': '0x1',
 *   'eth_getBalance': '0xde0b6b3a7640000' // 1 ETH
 * })
 * 
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   const blockNumber = yield* t.request<string>('eth_blockNumber')
 *   return BigInt(blockNumber) // 4660n
 * }).pipe(Effect.provide(transport))
 * ```
 * 
 * @example With PublicClient for testing
 * ```typescript
 * import { Effect } from 'effect'
 * import { TestTransport, PublicClient, PublicClientService } from 'voltaire-effect/services'
 * 
 * const transport = TestTransport({
 *   'eth_blockNumber': '0x1234',
 *   'eth_getBalance': '0x0',
 *   'eth_chainId': '0x1'
 * })
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   const blockNumber = yield* client.getBlockNumber()
 *   return blockNumber
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(transport)
 * )
 * 
 * const result = await Effect.runPromise(program)
 * expect(result).toBe(0x1234n)
 * ```
 * 
 * @example Simulating errors
 * ```typescript
 * import { Effect } from 'effect'
 * import { TestTransport, TransportService, TransportError } from 'voltaire-effect/services'
 * 
 * const transport = TestTransport({
 *   'eth_blockNumber': '0x1234',
 *   'eth_call': new TransportError({
 *     code: -32000,
 *     message: 'execution reverted',
 *     data: '0x08c379a0...'
 *   }),
 *   'eth_sendTransaction': new TransportError({
 *     code: -32603,
 *     message: 'insufficient funds'
 *   })
 * })
 * 
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   // This will succeed
 *   const block = yield* t.request<string>('eth_blockNumber')
 *   // This will fail with the mocked error
 *   const result = yield* t.request<string>('eth_call', [...])
 *   return result
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.catchTag('TransportError', (e) => {
 *     expect(e.message).toBe('execution reverted')
 *     return Effect.succeed('handled')
 *   })
 * )
 * ```
 * 
 * @example Using Map for responses
 * ```typescript
 * import { Effect } from 'effect'
 * import { TestTransport, TransportService } from 'voltaire-effect/services'
 * 
 * const responses = new Map<string, unknown>([
 *   ['eth_blockNumber', '0x1234'],
 *   ['eth_chainId', '0x1'],
 * ])
 * 
 * const transport = TestTransport(responses)
 * ```
 * 
 * @see {@link TransportService} - The service interface
 * @see {@link TransportError} - Error type for simulating failures
 * @see {@link HttpTransport} - Production transport implementation
 */
export const TestTransport = (
  responses: Map<string, unknown> | Record<string, unknown>
): Layer.Layer<TransportService> => {
  const responseMap = responses instanceof Map
    ? responses
    : new Map(Object.entries(responses))

  return Layer.succeed(TransportService, {
    request: <T>(method: string, _params: unknown[] = []) =>
      Effect.gen(function* () {
        if (!responseMap.has(method)) {
          return yield* Effect.fail(
            new TransportError({
              code: -32601,
              message: `Method not found: ${method}`,
            })
          )
        }

        const response = responseMap.get(method)

        if (response instanceof TransportError) {
          return yield* Effect.fail(response)
        }

        return response as T
      }),
  })
}
