/**
 * @fileoverview Free function to get logs matching a filter.
 *
 * @module Provider/functions/getLogs
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { LogFilter, LogType } from "../types.js";
import { formatLogFilterParams } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets logs matching the given filter.
 *
 * @param filter - Log filter (blockHash XOR fromBlock/toBlock, plus optional address/topics)
 * @returns Effect yielding array of matching logs
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getLogs, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const logs = yield* getLogs({
 *     fromBlock: '0x100000',
 *     toBlock: '0x100100',
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 *   })
 *   console.log(`Found ${logs.length} logs`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getLogs = (
	filter: LogFilter,
): Effect.Effect<LogType[], TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<LogType[]>("eth_getLogs", [formatLogFilterParams(filter)]),
	);
