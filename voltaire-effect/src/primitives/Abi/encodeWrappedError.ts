/**
 * @fileoverview Encodes ERC-7751 wrapped error data.
 * Provides Effect-based wrapper for wrapped error encoding.
 *
 * @module Abi/encodeWrappedError
 * @since 0.0.1
 */

import {
	AbiEncodingError as AbiEncodingErrorClass,
	type AbiEncodingError,
	type WrappedErrorType,
	encodeWrappedError as _encodeWrappedError,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Wrapped error input structure (ERC-7751).
 */
export type WrappedErrorInput = WrappedErrorType;

/**
 * Encodes ERC-7751 wrapped error data.
 *
 * @description
 * Creates encoded error data following the ERC-7751 specification:
 * `error WrappedError(address target, bytes4 selector, bytes reason, bytes details)`
 *
 * @param {WrappedErrorInput} wrappedError - Wrapped error data.
 * @returns {Effect.Effect<Uint8Array, AbiEncodingError>}
 *   Effect yielding encoded error data (selector + ABI-encoded params).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeWrappedError } from 'voltaire-effect/primitives/Abi'
 * import * as Address from '@tevm/voltaire/Address'
 * import * as Selector from '@tevm/voltaire/Selector'
 *
 * const encoded = await Effect.runPromise(
 *   encodeWrappedError({
 *     target: Address.from('0x1234...'),
 *     selector: Selector.fromHex('0xabcd1234'),
 *     reason: new Uint8Array([...]),
 *     details: new Uint8Array([...])
 *   })
 * )
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @since 0.0.1
 */
export const encodeWrappedError = (
	wrappedError: WrappedErrorInput,
): Effect.Effect<Uint8Array, AbiEncodingError> =>
	Effect.try({
		try: () => _encodeWrappedError(wrappedError),
		catch: (e) =>
			e instanceof AbiEncodingErrorClass
				? e
				: new AbiEncodingErrorClass("Failed to encode wrapped error", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
