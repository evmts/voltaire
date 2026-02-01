/**
 * @fileoverview Free function to estimate gas for a transaction.
 *
 * @module Provider/functions/estimateGas
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { BlockTag, CallRequest, EstimateGasError } from "../types.js";
import { formatCallRequest, parseHexToBigInt } from "../utils.js";

/**
 * Estimates gas for a transaction.
 *
 * @param request - The call request parameters
 * @param blockTag - Block to estimate against (default: "latest")
 * @returns Effect yielding the estimated gas as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { estimateGas, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const gas = yield* estimateGas({
 *     from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 *     to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     data: '0x...'
 *   })
 *   console.log(`Estimated gas: ${gas}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const estimateGas = (
	request: CallRequest,
	blockTag: BlockTag = "latest",
): Effect.Effect<bigint, EstimateGasError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<string>("eth_estimateGas", [formatCallRequest(request), blockTag])
			.pipe(
				Effect.flatMap((response) =>
					parseHexToBigInt({ method: "eth_estimateGas", response, params: [request, blockTag] }),
				),
			),
	);
