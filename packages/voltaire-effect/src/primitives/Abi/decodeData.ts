/**
 * @fileoverview Decodes function call data and identifies the function.
 * Provides Effect-based wrapper around the branded ABI decodeData method.
 *
 * @module Abi/decodeData
 * @since 0.0.1
 */

import {
	type Abi,
	AbiDecodingError as AbiDecodingErrorClass,
	type AbiDecodingError,
	type AbiInvalidSelectorError,
	type AbiItemNotFoundError,
	type ItemType,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

type DecodeDataErrorType =
	| AbiItemNotFoundError
	| AbiInvalidSelectorError
	| AbiDecodingError;

const isAbiError = (e: unknown): e is DecodeDataErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" ||
		e.name === "AbiInvalidSelectorError" ||
		e.name === "AbiDecodingError");

/**
 * Decodes function call data and identifies the function.
 *
 * @description
 * Parses encoded calldata to extract the function name and decoded arguments.
 * The data must start with a 4-byte function selector.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {Uint8Array} data - The encoded function call data.
 * @returns {Effect.Effect<{ functionName: string; args: readonly unknown[] }, AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError>}
 *   Effect yielding the function name and decoded arguments.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeData } from 'voltaire-effect/primitives/Abi'
 *
 * const decoded = await Effect.runPromise(
 *   decodeData(abi, calldata)
 * )
 * console.log(decoded.functionName) // 'transfer'
 * console.log(decoded.args) // ['0x...', 100n]
 * ```
 *
 * @since 0.0.1
 */
export const decodeData = (
	abi: AbiInput,
	data: Uint8Array,
): Effect.Effect<
	{ functionName: string; args: readonly unknown[] },
	AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
> =>
	Effect.try({
		try: () => toAbi(abi).decodeData(data),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiDecodingErrorClass("Failed to decode function data", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
