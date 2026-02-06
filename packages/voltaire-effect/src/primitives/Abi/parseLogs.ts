/**
 * @fileoverview Parses multiple event logs using ABI.
 * Provides Effect-based wrapper for batch log parsing.
 *
 * @module Abi/parseLogs
 * @since 0.0.1
 */

import { type Abi, type ItemType } from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

/**
 * Log input structure for parseLogs.
 */
export interface ParseLogsInput {
	data: Uint8Array | string;
	topics: readonly (Uint8Array | string)[];
}

/**
 * Parsed log result.
 */
export interface ParsedLog {
	eventName: string;
	args: Record<string, unknown>;
}

/**
 * Parses multiple event logs using ABI.
 *
 * @description
 * Parses an array of log entries, returning successfully decoded logs.
 * Logs that don't match any event in the ABI are silently filtered out.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {readonly ParseLogsInput[]} logs - Array of log objects.
 * @returns {Effect.Effect<readonly ParsedLog[], never>}
 *   Effect yielding array of parsed logs (never fails).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { parseLogs } from 'voltaire-effect/primitives/Abi'
 *
 * const parsed = await Effect.runPromise(
 *   parseLogs(abi, logs)
 * )
 * // [{ eventName: 'Transfer', args: { from, to, value } }]
 * ```
 *
 * @since 0.0.1
 */
export const parseLogs = (
	abi: AbiInput,
	logs: readonly ParseLogsInput[],
): Effect.Effect<readonly ParsedLog[], never> =>
	Effect.sync(() => toAbi(abi).parseLogs(logs));
