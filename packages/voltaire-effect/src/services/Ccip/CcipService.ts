/**
 * @fileoverview CCIP (Cross-Chain Interoperability Protocol) service definition.
 *
 * @module CcipService
 * @since 0.0.1
 *
 * @description
 * Implements EIP-3668 (OffchainLookup) for fetching offchain data during contract calls.
 * When a contract reverts with OffchainLookup, this service fetches the required data
 * from offchain URLs and returns it for the callback.
 *
 * @see {@link DefaultCcip} - HTTP-based implementation
 * @see {@link NoopCcip} - Disabled implementation for restricted environments
 * @see https://eips.ethereum.org/EIPS/eip-3668
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Parameters for a CCIP offchain lookup request.
 *
 * @since 0.0.1
 */
export interface CcipRequest {
	/** The contract address that initiated the lookup */
	readonly sender: `0x${string}`;
	/** URLs to try for fetching offchain data (tried in order) */
	readonly urls: readonly string[];
	/** The calldata to send to the offchain gateway */
	readonly callData: `0x${string}`;
	/** The callback function selector on the contract */
	readonly callbackSelector: `0x${string}`;
	/** Extra data to pass through to the callback */
	readonly extraData: `0x${string}`;
}

/**
 * Error returned when CCIP lookup fails.
 *
 * @since 0.0.1
 */
export class CcipError extends Data.TaggedError("CcipError")<{
	/** The URLs that were attempted */
	readonly urls: readonly string[];
	/** Human-readable error message */
	readonly message: string;
	/** The underlying cause of the error */
	readonly cause?: unknown;
}> {}

/**
 * Shape of the CCIP service.
 *
 * @since 0.0.1
 */
export type CcipShape = {
	/**
	 * Performs a CCIP offchain lookup request.
	 *
	 * @param params - The CCIP request parameters
	 * @returns The offchain data as hex bytes
	 */
	readonly request: (
		params: CcipRequest,
	) => Effect.Effect<`0x${string}`, CcipError>;
};

/**
 * CCIP service for EIP-3668 offchain lookups.
 *
 * @description
 * Provides the ability to fetch offchain data during contract calls.
 * When a contract reverts with OffchainLookup, this service handles
 * fetching the data from the specified gateway URLs.
 *
 * @since 0.0.1
 *
 * @example Basic usage with DefaultCcip
 * ```typescript
 * import { Effect } from 'effect'
 * import { CcipService, DefaultCcip } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const ccip = yield* CcipService
 *   return yield* ccip.request({
 *     sender: '0x...',
 *     urls: ['https://gateway.example.com/{sender}/{data}'],
 *     callData: '0x...',
 *     callbackSelector: '0x...',
 *     extraData: '0x'
 *   })
 * }).pipe(
 *   Effect.provide(DefaultCcip)
 * )
 * ```
 *
 * @see {@link DefaultCcip} - HTTP-based implementation
 * @see {@link NoopCcip} - Disabled implementation
 * @see {@link CcipShape} - The service interface shape
 */
export class CcipService extends Context.Tag("CcipService")<
	CcipService,
	CcipShape
>() {}
