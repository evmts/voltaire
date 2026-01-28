/**
 * @fileoverview Free function to create an access list for a transaction.
 *
 * @module Provider/functions/createAccessList
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { BlockTag, CallRequest, CreateAccessListError, AccessListType } from "../types.js";
import { formatCallRequest } from "../utils.js";

/**
 * Result from createAccessList containing access list and gas used.
 */
export interface CreateAccessListResult {
	readonly accessList: AccessListType["accessList"];
	readonly gasUsed: bigint;
}

/**
 * Creates an access list for a transaction.
 *
 * @param request - The call request parameters
 * @param blockTag - Block to analyze against (default: "latest")
 * @returns Effect yielding the access list and gas estimate
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createAccessList, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const { accessList, gasUsed } = yield* createAccessList({
 *     from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 *     to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     data: '0x...'
 *   })
 *   console.log(`Gas used: ${gasUsed}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const createAccessList = (
	request: CallRequest,
	blockTag: BlockTag = "latest",
): Effect.Effect<CreateAccessListResult, CreateAccessListError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<AccessListType>("eth_createAccessList", [formatCallRequest(request), blockTag])
			.pipe(
				Effect.map((result) => ({
					accessList: result.accessList,
					gasUsed: BigInt(result.gasUsed),
				})),
			),
	);
