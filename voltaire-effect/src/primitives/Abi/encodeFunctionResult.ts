/**
 * @fileoverview Encodes function return values.
 * Provides Effect-based wrapper for encoding function output data.
 *
 * @module Abi/encodeFunctionResult
 * @since 0.0.1
 */

import {
	type AbiEncodingError,
	AbiEncodingError as AbiEncodingErrorClass,
	Function as AbiFunction,
	AbiItemNotFoundError,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Hex from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type AbiErrorType = AbiItemNotFoundError | AbiEncodingError;

const isAbiError = (e: unknown): e is AbiErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" || e.name === "AbiEncodingError");

/**
 * Represents a single ABI item.
 * @internal
 */
type AbiItem = { type: string; name?: string };

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = readonly AbiItem[];

/**
 * Encodes function return values.
 *
 * @description
 * Encodes values as function return data according to the function's
 * output specification in the ABI.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} functionName - The function name.
 * @param {readonly unknown[]} values - The values to encode.
 * @returns {Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding the encoded return data.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeFunctionResult } from 'voltaire-effect/primitives/Abi'
 *
 * const encoded = await Effect.runPromise(
 *   encodeFunctionResult(abi, 'balanceOf', [1000n])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encodeFunctionResult = (
	abi: AbiInput,
	functionName: string,
	values: readonly unknown[],
): Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError> =>
	Effect.try({
		try: () => {
			const fn = abi.find(
				(item) => item.type === "function" && item.name === functionName,
			);
			if (!fn) {
				throw new AbiItemNotFoundError(
					`Function "${functionName}" not found in ABI`,
					{
						value: functionName,
						expected: "valid function name in ABI",
						context: { functionName, abi },
					},
				);
			}
			const encoded = AbiFunction.encodeResult(
				fn as AbiFunction.FunctionType,
				values as never,
			);
			return Hex.fromBytes(encoded);
		},
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiEncodingErrorClass("Failed to encode function result", { cause: e instanceof Error ? e : undefined }),
	});
