/**
 * @fileoverview Free function to get available accounts.
 *
 * @module Provider/functions/getAccounts
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the list of accounts owned by the node.
 *
 * @returns Effect yielding an array of account addresses
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getAccounts, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const accounts = yield* getAccounts()
 *   console.log('Accounts:', accounts)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const getAccounts = (): Effect.Effect<
	`0x${string}`[],
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`[]>("eth_accounts"),
	);
