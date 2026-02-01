/**
 * @fileoverview Free function to get the protocol version.
 *
 * @module Provider/functions/getProtocolVersion
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the Ethereum protocol version.
 *
 * @returns Effect yielding the protocol version as string
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getProtocolVersion, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const version = yield* getProtocolVersion()
 *   console.log('Protocol version:', version)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getProtocolVersion = (): Effect.Effect<
	string,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_protocolVersion"),
	);
