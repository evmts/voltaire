/**
 * @fileoverview Retrieves function definitions from Ethereum ABI.
 * Provides Effect-based wrapper for looking up function ABI items by name.
 *
 * @module Abi/getFunction
 * @since 0.0.1
 */

import {
	type Function as AbiFunction,
	AbiItemNotFoundError,
	Item,
	type ItemType,
} from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input accepted by the lookup function.
 * @internal
 */
type AbiInput = readonly ItemType[];

/**
 * Retrieves a function definition from an ABI by name.
 *
 * @description
 * Looks up a function in the provided ABI by its name and returns the full
 * function definition including input parameters, output parameters, and
 * state mutability. This is useful for programmatically working with functions,
 * such as building transaction data or validating call parameters.
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with `AbiItemNotFoundError` if no function with the given
 * name exists in the ABI.
 *
 * @param {AbiInput} abi - The contract ABI containing function definitions.
 *   Can be a JSON ABI array or parsed ABI object.
 * @param {string} name - The name of the function to retrieve.
 *   Must exactly match a function name in the ABI (case-sensitive).
 *
 * @returns {Effect.Effect<AbiFunction.FunctionType, AbiItemNotFoundError>}
 *   Effect yielding the function definition object containing:
 *   - `type`: 'function'
 *   - `name`: The function name
 *   - `inputs`: Array of input parameter definitions
 *   - `outputs`: Array of output parameter definitions
 *   - `stateMutability`: 'pure' | 'view' | 'nonpayable' | 'payable'
 *   Or failing with `AbiItemNotFoundError` if function not found.
 *
 * @throws {AbiItemNotFoundError} When no function with the given name exists in the ABI.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getFunction } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'transfer',
 *     inputs: [
 *       { name: 'to', type: 'address' },
 *       { name: 'amount', type: 'uint256' }
 *     ],
 *     outputs: [{ type: 'bool' }],
 *     stateMutability: 'nonpayable'
 *   }
 * ]
 *
 * const transferFn = await Effect.runPromise(getFunction(erc20Abi, 'transfer'))
 * console.log(transferFn.inputs)  // [{ name: 'to', type: 'address' }, ...]
 * console.log(transferFn.outputs) // [{ type: 'bool' }]
 * ```
 *
 * @example
 * ```typescript
 * // Check if function is view/pure (read-only)
 * const fn = await Effect.runPromise(getFunction(abi, 'balanceOf'))
 * const isReadOnly = fn.stateMutability === 'view' || fn.stateMutability === 'pure'
 * ```
 *
 * @example
 * ```typescript
 * // Handle missing functions
 * const fn = await Effect.runPromise(
 *   getFunction(abi, 'maybeExists').pipe(
 *     Effect.catchTag('AbiItemNotFoundError', () =>
 *       Effect.succeed(null)
 *     )
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link encodeFunctionData} for encoding function calls
 * @see {@link decodeFunctionData} for decoding function calldata
 * @see {@link decodeFunctionResult} for decoding function return values
 * @see {@link getEvent} for retrieving event definitions
 */
export const getFunction = (
	abi: AbiInput,
	name: string,
): Effect.Effect<AbiFunction.FunctionType, AbiItemNotFoundError> =>
	Effect.try({
		try: () => {
			const item = Item.getItem(abi, name, "function");
			if (!item) {
				const error = new AbiItemNotFoundError(
					`Function "${name}" not found in ABI`,
					{
						value: name,
						expected: "valid function name in ABI",
						context: { name, abi },
					},
				);
				throw error;
			}
			return item as AbiFunction.FunctionType;
		},
		catch: (e) => e as AbiItemNotFoundError,
	});
