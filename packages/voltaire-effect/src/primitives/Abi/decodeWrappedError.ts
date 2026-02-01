/**
 * @fileoverview Decodes ERC-7751 wrapped error data.
 * Provides Effect-based wrapper for wrapped error decoding.
 *
 * @module Abi/decodeWrappedError
 * @since 0.0.1
 */

import {
	AbiDecodingError as AbiDecodingErrorClass,
	type AbiDecodingError,
	type AbiInvalidSelectorError,
	type WrappedErrorType,
	decodeWrappedError as _decodeWrappedError,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Decoded wrapped error structure (ERC-7751).
 */
export type WrappedErrorResult = WrappedErrorType;

type DecodeWrappedErrorType = AbiDecodingError | AbiInvalidSelectorError;

const isAbiError = (e: unknown): e is DecodeWrappedErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiDecodingError" || e.name === "AbiInvalidSelectorError");

/**
 * Decodes ERC-7751 wrapped error data.
 *
 * @description
 * Decodes a WrappedError from encoded bytes following the ERC-7751 specification.
 * Expects data to start with the WrappedError selector (0x90bfb865).
 *
 * @param {Uint8Array} data - Encoded error data (selector + ABI-encoded params).
 * @returns {Effect.Effect<WrappedErrorResult, AbiDecodingError | AbiInvalidSelectorError>}
 *   Effect yielding decoded wrapped error.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeWrappedError } from 'voltaire-effect/primitives/Abi'
 *
 * const decoded = await Effect.runPromise(
 *   decodeWrappedError(errorData)
 * )
 * console.log(decoded.target) // Address of failing contract
 * console.log(decoded.selector) // Function selector
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @since 0.0.1
 */
export const decodeWrappedError = (
	data: Uint8Array,
): Effect.Effect<WrappedErrorResult, AbiDecodingError | AbiInvalidSelectorError> =>
	Effect.try({
		try: () => _decodeWrappedError(data) as WrappedErrorResult,
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiDecodingErrorClass("Failed to decode wrapped error", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
