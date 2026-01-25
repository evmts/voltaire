/**
 * @fileoverview Encodes function call data from ABI by function name.
 * Provides Effect-based wrapper for creating encoded calldata.
 *
 * @module Abi/encodeFunction
 * @since 0.0.1
 */

import {
	encodeFunction as _encodeFunction,
	type AbiEncodingError,
	type AbiItemNotFoundError,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = Parameters<typeof _encodeFunction>[0];

/**
 * Encodes function call data from ABI by function name.
 *
 * @description
 * Creates encoded calldata for invoking a contract function. The result
 * is a hex string consisting of a 4-byte function selector followed by
 * ABI-encoded arguments.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} functionName - The function name to encode.
 * @param {readonly unknown[]} args - The function arguments.
 * @returns {Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding encoded calldata as hex string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeFunction } from 'voltaire-effect/primitives/Abi'
 *
 * const calldata = await Effect.runPromise(
 *   encodeFunction(abi, 'transfer', [to, amount])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encodeFunction = (
	abi: AbiInput,
	functionName: string,
	args: readonly unknown[],
): Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError> =>
	Effect.try({
		try: () => _encodeFunction(abi, functionName, args),
		catch: (e) => e as AbiItemNotFoundError | AbiEncodingError,
	});
