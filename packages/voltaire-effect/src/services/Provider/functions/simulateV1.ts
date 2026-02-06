/**
 * @fileoverview Free function to simulate multiple blocks and calls with eth_simulateV1.
 *
 * @module Provider/functions/simulateV1
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type {
	BlockTag,
	SimulateV1Payload,
	SimulateV1Result,
	SimulateV1Error,
} from "../types.js";
import { formatCallRequest, toAddressHex } from "../utils.js";

/**
 * Formats a SimulateV1Payload for JSON-RPC submission.
 */
const formatSimulateV1Payload = (payload: SimulateV1Payload): unknown => {
	return {
		blockStateCalls: payload.blockStateCalls.map((block) => ({
			...(block.blockOverrides && {
				blockOverrides: {
					...(block.blockOverrides.number !== undefined && {
						number: `0x${block.blockOverrides.number.toString(16)}`,
					}),
					...(block.blockOverrides.difficulty !== undefined && {
						difficulty: `0x${block.blockOverrides.difficulty.toString(16)}`,
					}),
					...(block.blockOverrides.time !== undefined && {
						time: `0x${block.blockOverrides.time.toString(16)}`,
					}),
					...(block.blockOverrides.gasLimit !== undefined && {
						gasLimit: `0x${block.blockOverrides.gasLimit.toString(16)}`,
					}),
					...(block.blockOverrides.coinbase !== undefined && {
						coinbase: toAddressHex(block.blockOverrides.coinbase),
					}),
					...(block.blockOverrides.baseFee !== undefined && {
						baseFee: `0x${block.blockOverrides.baseFee.toString(16)}`,
					}),
				},
			}),
			...(block.stateOverrides && { stateOverrides: block.stateOverrides }),
			calls: block.calls.map(formatCallRequest),
		})),
		...(payload.traceTransfers !== undefined && { traceTransfers: payload.traceTransfers }),
		...(payload.validation !== undefined && { validation: payload.validation }),
		...(payload.returnFullTransactions !== undefined && {
			returnFullTransactions: payload.returnFullTransactions,
		}),
	};
};

/**
 * Simulates multiple blocks and calls using eth_simulateV1.
 *
 * Note: This method is optional and not supported by all nodes.
 *
 * @param payload - The simulation payload
 * @param blockTag - Block to simulate from (default: "latest")
 * @returns Effect yielding the simulation results
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { simulateV1, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const results = yield* simulateV1({
 *     blockStateCalls: [{
 *       calls: [{
 *         to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *         data: '0x...'
 *       }]
 *     }]
 *   })
 *   console.log(results)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const simulateV1 = (
	payload: SimulateV1Payload,
	blockTag: BlockTag = "latest",
): Effect.Effect<SimulateV1Result, SimulateV1Error, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<SimulateV1Result>("eth_simulateV1", [formatSimulateV1Payload(payload), blockTag]),
	);
