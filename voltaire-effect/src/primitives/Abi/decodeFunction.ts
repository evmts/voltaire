/**
 * @fileoverview Decodes function call data using ABI.
 * Provides Effect-based wrapper for parsing encoded calldata.
 *
 * @module Abi/decodeFunction
 * @since 0.0.1
 */

import {
	decodeFunction as _decodeFunction,
	type AbiInvalidSelectorError,
	type AbiItemNotFoundError,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = Parameters<typeof _decodeFunction>[0];

/**
 * Decodes function call data using ABI.
 *
 * @description
 * Parses encoded calldata to extract the function name and decoded parameters.
 * The data must start with a 4-byte function selector.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {HexType | Uint8Array} data - The encoded function call data.
 * @returns {Effect.Effect<{ name: string; params: readonly unknown[] }, AbiItemNotFoundError | AbiInvalidSelectorError>}
 *   Effect yielding the function name and decoded parameters.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeFunction } from 'voltaire-effect/primitives/Abi'
 *
 * const decoded = await Effect.runPromise(
 *   decodeFunction(abi, '0xa9059cbb...')
 * )
 * console.log(decoded.name) // 'transfer'
 * console.log(decoded.params) // ['0x...', 100n]
 * ```
 *
 * @since 0.0.1
 */
export const decodeFunction = (
	abi: AbiInput,
	data: HexType | Uint8Array,
): Effect.Effect<
	{ name: string; params: readonly unknown[] },
	AbiItemNotFoundError | AbiInvalidSelectorError
> =>
	Effect.try({
		try: () => _decodeFunction(abi, data),
		catch: (e) => e as AbiItemNotFoundError | AbiInvalidSelectorError,
	});
