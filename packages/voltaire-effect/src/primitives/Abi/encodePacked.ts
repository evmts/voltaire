/**
 * @fileoverview ABI encodePacked - compact encoding without padding.
 * Provides Effect-based wrapper for packed encoding.
 *
 * @module Abi/encodePacked
 * @since 0.0.1
 */

import {
	AbiEncodingError as AbiEncodingErrorClass,
	type AbiEncodingError,
	type AbiParameterMismatchError,
	encodePacked as _encodePacked,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type EncodePackedErrorType = AbiParameterMismatchError | AbiEncodingError;

const isAbiError = (e: unknown): e is EncodePackedErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiParameterMismatchError" || e.name === "AbiEncodingError");

/**
 * Encodes values in packed format (no padding).
 *
 * @description
 * Performs ABI encoding without padding, used for creating hashes
 * where standard ABI encoding would waste space.
 *
 * @param {readonly string[]} types - Array of Solidity type strings.
 * @param {readonly unknown[]} values - Array of values to encode.
 * @returns {Effect.Effect<HexType, AbiParameterMismatchError | AbiEncodingError>}
 *   Effect yielding encoded hex string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodePacked } from 'voltaire-effect/primitives/Abi'
 *
 * const encoded = await Effect.runPromise(
 *   encodePacked(['address', 'uint256'], [address, amount])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encodePacked = (
	types: readonly string[],
	values: readonly unknown[],
): Effect.Effect<HexType, AbiParameterMismatchError | AbiEncodingError> =>
	Effect.try({
		try: () => _encodePacked(types, values),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiEncodingErrorClass("Failed to encode packed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
