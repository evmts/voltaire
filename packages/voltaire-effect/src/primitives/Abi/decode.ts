/**
 * @fileoverview Decodes function return values from ABI by function name.
 * Provides Effect-based wrapper around the branded ABI decode method.
 *
 * @module Abi/decode
 * @since 0.0.1
 */

import {
	type Abi,
	AbiDecodingError as AbiDecodingErrorClass,
	type AbiDecodingError,
	type AbiItemNotFoundError,
	type ItemType,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

type DecodeErrorType = AbiItemNotFoundError | AbiDecodingError;

const isAbiError = (e: unknown): e is DecodeErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" || e.name === "AbiDecodingError");

/**
 * Decodes function return values from ABI by function name.
 *
 * @description
 * Decodes the return data from a contract call using the function's output types.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} functionName - The function name whose outputs to decode.
 * @param {Uint8Array} data - The encoded return data.
 * @returns {Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError>}
 *   Effect yielding decoded return values.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decode } from 'voltaire-effect/primitives/Abi'
 *
 * const result = await Effect.runPromise(
 *   decode(abi, 'balanceOf', returnData)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const decode = (
	abi: AbiInput,
	functionName: string,
	data: Uint8Array,
): Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError> =>
	Effect.try({
		try: () => toAbi(abi).decode(functionName, data),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiDecodingErrorClass("Failed to decode function result", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
