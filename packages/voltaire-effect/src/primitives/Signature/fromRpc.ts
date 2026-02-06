/**
 * @fileoverview Creates Signature from RPC format with Effect error handling.
 * @module Signature/fromRpc
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from Ethereum RPC format.
 *
 * @param rpc - RPC signature object with r, s, and optionally yParity or v
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromRpc({
 *   r: '0x...',
 *   s: '0x...',
 *   yParity: '0x0'
 * }))
 * ```
 *
 * @since 0.0.1
 */
export const fromRpc = (rpc: {
	r: string;
	s: string;
	yParity?: string | number;
	v?: string | number;
}): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromRpc(rpc),
		catch: (e) => e as Error,
	});
