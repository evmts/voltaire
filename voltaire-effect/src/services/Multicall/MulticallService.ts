/**
 * @fileoverview Multicall service definition for batching contract reads.
 *
 * @module MulticallService
 * @since 0.0.1
 *
 * @description
 * The MulticallService provides a way to batch multiple contract reads into
 * a single RPC call using the Multicall3 contract. This significantly reduces
 * the number of RPC requests needed and improves performance.
 *
 * The service supports the aggregate3 function which allows per-call failure
 * handling through the allowFailure flag.
 *
 * @see {@link DefaultMulticall} - The live implementation layer
 * @see {@link ProviderService} - Required for making the eth_call
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Represents a single call to be batched in a multicall.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const call: MulticallCall = {
 *   target: '0x1234...',
 *   callData: '0xa9059cbb...', // encoded function call
 *   allowFailure: true
 * }
 * ```
 */
export interface MulticallCall {
	/** Target contract address to call */
	readonly target: `0x${string}`;
	/** ABI-encoded function call data */
	readonly callData: `0x${string}`;
	/** Whether this call is allowed to fail without reverting the batch */
	readonly allowFailure?: boolean;
}

/**
 * Result of a single call in a multicall batch.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const result: MulticallResult = {
 *   success: true,
 *   returnData: '0x000000000000000000000000000000000000000000000000000000000000001e'
 * }
 * ```
 */
export interface MulticallResult {
	/** Whether the call succeeded */
	readonly success: boolean;
	/** The return data from the call (empty if failed) */
	readonly returnData: `0x${string}`;
}

/**
 * Error thrown when a multicall operation fails.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const error = new MulticallError({
 *   message: 'Multicall failed: contract reverted',
 *   failedCalls: [1, 3],
 *   cause: originalError
 * })
 * ```
 */
export class MulticallError extends Data.TaggedError("MulticallError")<{
	/** Human-readable error message */
	readonly message: string;
	/** Indices of calls that failed (if applicable) */
	readonly failedCalls?: readonly number[];
	/** Underlying error that caused the failure */
	readonly cause?: unknown;
}> {}

/**
 * Shape of the multicall service.
 *
 * @since 0.0.1
 */
export type MulticallShape = {
	/**
	 * Executes multiple calls in a single RPC request using Multicall3 aggregate3.
	 *
	 * @param calls - Array of calls to execute
	 * @returns Array of results in the same order as input calls
	 */
	readonly aggregate3: (
		calls: readonly MulticallCall[],
	) => Effect.Effect<readonly MulticallResult[], MulticallError>;
};

/**
 * Multicall service for batching contract reads.
 *
 * @description
 * Provides methods for batching multiple contract calls into a single RPC request.
 * Uses the Multicall3 contract which is deployed at the same address on most EVM chains.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { MulticallService, DefaultMulticall, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const multicall = yield* MulticallService
 *
 *   const results = yield* multicall.aggregate3([
 *     { target: '0x...', callData: '0x...' },
 *     { target: '0x...', callData: '0x...' }
 *   ])
 *
 *   return results
 * }).pipe(
 *   Effect.provide(DefaultMulticall),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link DefaultMulticall} - The live implementation layer
 * @see {@link MulticallCall} - Call structure
 * @see {@link MulticallResult} - Result structure
 */
export class MulticallService extends Context.Tag("MulticallService")<
	MulticallService,
	MulticallShape
>() {}
