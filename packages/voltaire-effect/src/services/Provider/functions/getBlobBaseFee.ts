/**
 * @fileoverview Free function to get the blob base fee.
 *
 * @module Provider/functions/getBlobBaseFee
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the current blob base fee (EIP-4844).
 *
 * @returns Effect yielding the blob base fee as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getBlobBaseFee, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blobFee = yield* getBlobBaseFee()
 *   console.log('Blob base fee:', blobFee, 'wei')
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getBlobBaseFee = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_blobBaseFee").pipe(
			Effect.flatMap((response) =>
				parseHexToBigInt({ method: "eth_blobBaseFee", response }),
			),
		),
	);
