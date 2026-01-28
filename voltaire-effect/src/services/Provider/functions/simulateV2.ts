/**
 * @fileoverview Free function to simulate with eth_simulateV2.
 *
 * @module Provider/functions/simulateV2
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type {
	BlockTag,
	SimulateV2Payload,
	SimulateV2Result,
	SimulateV2Error,
} from "../types.js";

/**
 * Simulates using eth_simulateV2 (draft/evolving API).
 *
 * Note: This method is optional and not supported by all nodes.
 * The API is still evolving and may change.
 *
 * @param payload - The simulation payload (schema may evolve)
 * @param blockTag - Block to simulate from (default: "latest")
 * @returns Effect yielding the simulation results
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { simulateV2, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const results = yield* simulateV2({
 *     // payload format may evolve
 *   })
 *   console.log(results)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const simulateV2 = <TResult = SimulateV2Result>(
	payload: SimulateV2Payload,
	blockTag: BlockTag = "latest",
): Effect.Effect<TResult, SimulateV2Error, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<TResult>("eth_simulateV2", [payload, blockTag]),
	);
