/**
 * @fileoverview Recovers ABI from EVM bytecode using static analysis.
 * Uses WhatsABI to analyze bytecode and extract function/event signatures.
 *
 * @module Abi/fromBytecode
 * @since 0.0.1
 */

import { abiFromBytecode as whatsabiFromBytecode } from "@shazow/whatsabi";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

/**
 * Error thrown when bytecode analysis fails.
 */
export class AbiBytecodeError extends Data.TaggedError("AbiBytecodeError")<{
	readonly message: string;
	readonly bytecode?: string;
	readonly cause?: unknown;
}> {}

/**
 * Recovered ABI item from bytecode analysis.
 * Note: Names may be missing or placeholder values since they're not in bytecode.
 */
export type RecoveredAbiItem = {
	readonly type: "function" | "event";
	readonly selector?: string;
	readonly name?: string;
	readonly inputs?: ReadonlyArray<{ type: string; name: string }>;
	readonly outputs?: ReadonlyArray<{ type: string; name: string }>;
	readonly stateMutability?: "nonpayable" | "payable" | "view" | "pure";
};

/**
 * Recovers an ABI from EVM bytecode using static analysis.
 *
 * @description
 * Analyzes EVM bytecode to extract function selectors and attempt to
 * recover function/event signatures. This is useful when source code
 * is not available or the contract is not verified on any block explorer.
 *
 * Note that recovered ABIs may be incomplete:
 * - Function/event names may be missing (only selectors available)
 * - Parameter names are typically placeholders
 * - Some functions may not be detected
 *
 * @param {string} bytecode - The EVM bytecode as hex string (with or without 0x prefix).
 * @returns {Effect.Effect<ReadonlyArray<RecoveredAbiItem>, AbiBytecodeError>}
 *   Effect yielding the recovered ABI items.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBytecode } from 'voltaire-effect/primitives/Abi'
 *
 * const bytecode = '0x608060405234801561001057...'
 * const abi = await Effect.runPromise(fromBytecode(bytecode))
 * // => [{ type: 'function', selector: '0xa9059cbb', ... }]
 * ```
 *
 * @since 0.0.1
 */
export const fromBytecode = (
	bytecode: string,
): Effect.Effect<ReadonlyArray<RecoveredAbiItem>, AbiBytecodeError> =>
	Effect.try({
		try: () => {
			if (!bytecode || bytecode === "0x" || bytecode === "0x0") {
				return [] as ReadonlyArray<RecoveredAbiItem>;
			}
			const result = whatsabiFromBytecode(bytecode);
			return result as unknown as ReadonlyArray<RecoveredAbiItem>;
		},
		catch: (e) =>
			new AbiBytecodeError({
				message: `Failed to recover ABI from bytecode: ${e instanceof Error ? e.message : String(e)}`,
				bytecode: bytecode.slice(0, 100) + (bytecode.length > 100 ? "..." : ""),
				cause: e,
			}),
	});
