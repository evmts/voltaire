/**
 * @fileoverview Effect-wrapped toAddress for PublicKey.
 * @module toAddress
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import { _toAddress, type PublicKeyType } from "@tevm/voltaire/PublicKey";
import * as Effect from "effect/Effect";

/**
 * Derives Ethereum address from public key.
 *
 * @description
 * Takes last 20 bytes of keccak256(publicKey) to derive the address.
 *
 * @param publicKey - The public key
 * @returns Effect yielding AddressType (20 bytes)
 *
 * @example
 * ```typescript
 * const addr = Effect.runSync(PublicKey.toAddress(pk))
 * ```
 *
 * @since 0.0.1
 */
export const toAddress = (
	publicKey: PublicKeyType,
): Effect.Effect<AddressType> => Effect.sync(() => _toAddress.call(publicKey));
