/**
 * @fileoverview Decodes Ethereum function call data (calldata) using ABI definitions.
 * Provides Effect-based wrapper for parsing calldata into function name and parameters.
 *
 * @module Abi/decodeFunctionData
 * @since 0.0.1
 */

import {
	type AbiDecodingError,
	type AbiInvalidSelectorError,
	type AbiItemNotFoundError,
	type ItemType,
	decodeFunction,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input accepted by the decoder.
 * @internal
 */
type AbiInput = readonly ItemType[];

/**
 * Decodes function call data using the provided ABI.
 *
 * @description
 * Parses encoded calldata to extract the function name and decoded parameters.
 * The calldata consists of a 4-byte function selector followed by ABI-encoded
 * arguments. This function identifies the function by its selector and decodes
 * the arguments according to the function's input types.
 *
 * This function never throws exceptions. Instead, it returns an Effect that
 * may fail with one of several error types depending on what went wrong.
 *
 * @param {AbiInput} abi - The contract ABI containing function definitions.
 *   Can be a JSON ABI array or parsed ABI object.
 * @param {HexType | Uint8Array} data - The encoded function calldata as hex string or bytes.
 *   Must be at least 4 bytes (the selector).
 *
 * @returns {Effect.Effect<{ name: string; params: readonly unknown[] }, AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError>}
 *   Effect yielding an object with:
 *   - `name`: The name of the matched function
 *   - `params`: Array of decoded parameter values in order
 *   Or failing with one of:
 *   - `AbiItemNotFoundError`: No function matches the selector
 *   - `AbiInvalidSelectorError`: Invalid or malformed selector
 *   - `AbiDecodingError`: Failed to decode the parameters
 *
 * @throws {AbiItemNotFoundError} When no function in the ABI matches the calldata selector.
 * @throws {AbiInvalidSelectorError} When the calldata is too short or has invalid selector.
 * @throws {AbiDecodingError} When parameter decoding fails (wrong types, insufficient data).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeFunctionData } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'transfer',
 *     inputs: [
 *       { name: 'to', type: 'address' },
 *       { name: 'amount', type: 'uint256' }
 *     ],
 *     outputs: [{ type: 'bool' }]
 *   }
 * ]
 *
 * // Decode a transfer call
 * const result = await Effect.runPromise(
 *   decodeFunctionData(erc20Abi, '0xa9059cbb000000000000000000000000...')
 * )
 * console.log(result.name)   // 'transfer'
 * console.log(result.params) // ['0x...recipient', 1000000n]
 * ```
 *
 * @example
 * ```typescript
 * // Handle decoding errors
 * const decoded = await Effect.runPromise(
 *   decodeFunctionData(abi, calldata).pipe(
 *     Effect.catchTags({
 *       AbiItemNotFoundError: () => Effect.succeed({ name: 'unknown', params: [] }),
 *       AbiInvalidSelectorError: () => Effect.fail(new Error('Invalid calldata')),
 *       AbiDecodingError: (e) => Effect.fail(new Error(`Decode failed: ${e.message}`))
 *     })
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link encodeFunctionData} for encoding function calls
 * @see {@link getFunction} for retrieving function definitions by name
 */
export const decodeFunctionData = (
	abi: AbiInput,
	data: HexType | Uint8Array,
): Effect.Effect<
	{ name: string; params: readonly unknown[] },
	AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
> =>
	Effect.try({
		try: () => decodeFunction(abi, data),
		catch: (e) =>
			e as AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError,
	});
