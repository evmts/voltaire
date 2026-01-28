/**
 * @fileoverview Free function to get the max priority fee per gas.
 *
 * @module Provider/functions/getMaxPriorityFeePerGas
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the suggested max priority fee per gas for EIP-1559 transactions.
 *
 * @returns Effect yielding the max priority fee as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getMaxPriorityFeePerGas, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const priorityFee = yield* getMaxPriorityFeePerGas()
 *   console.log('Priority fee:', priorityFee, 'wei')
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getMaxPriorityFeePerGas = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_maxPriorityFeePerGas").pipe(
			Effect.flatMap((response) =>
				parseHexToBigInt({ method: "eth_maxPriorityFeePerGas", response }),
			),
		),
	);
