/**
 * @fileoverview Free function to execute eth_call.
 *
 * @module Provider/functions/call
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { BlockTag, CallRequest, CallError } from "../types.js";
import { formatCallRequest } from "../utils.js";

/**
 * Executes a call without sending a transaction.
 *
 * @param request - The call request parameters
 * @param blockTag - Block to execute against (default: "latest")
 * @returns Effect yielding the call result as hex string
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { call, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const result = yield* call({
 *     to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     data: '0x70a08231000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *   })
 *   console.log(`Result: ${result}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const call = (
	request: CallRequest,
	blockTag: BlockTag = "latest",
): Effect.Effect<`0x${string}`, CallError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_call", [formatCallRequest(request), blockTag]),
	);
