/**
 * @fileoverview Encodes function call data from ABI by function name.
 * Provides Effect-based wrapper around the branded ABI encode method.
 *
 * @module Abi/encode
 * @since 0.0.1
 */

import {
	type Abi,
	AbiEncodingError as AbiEncodingErrorClass,
	type AbiEncodingError,
	type AbiItemNotFoundError,
	type ItemType,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

type EncodeErrorType = AbiItemNotFoundError | AbiEncodingError;

const isAbiError = (e: unknown): e is EncodeErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" || e.name === "AbiEncodingError");

/**
 * Encodes function call data from ABI by function name.
 *
 * @description
 * Creates encoded calldata for invoking a contract function.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} functionName - The function name to encode.
 * @param {readonly unknown[]} args - The function arguments.
 * @returns {Effect.Effect<Uint8Array, AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding encoded calldata as bytes.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encode } from 'voltaire-effect/primitives/Abi'
 *
 * const calldata = await Effect.runPromise(
 *   encode(abi, 'transfer', [to, amount])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encode = (
	abi: AbiInput,
	functionName: string,
	args: readonly unknown[],
): Effect.Effect<Uint8Array, AbiItemNotFoundError | AbiEncodingError> =>
	Effect.try({
		try: () => toAbi(abi).encode(functionName, [...args]),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiEncodingErrorClass("Failed to encode function", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
