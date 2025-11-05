/**
 * WASM implementation of Ethereum Event Log primitives
 * Uses WebAssembly bindings to Zig implementation for log filtering
 */

// Re-export pure TypeScript implementation
export * from "./EventLog.js";

import * as loader from "../../wasm-loader/loader.js";
import type { Address, BrandedAddress } from "../Address/index.js";
import type { BrandedHash } from "../Hash/index.js";

// ============================================================================
// WASM-Accelerated Functions
// ============================================================================

/**
 * Check if event log matches address filter using WASM
 * @param logAddress - Log emitter address
 * @param filterAddresses - Array of filter addresses (empty = match all)
 * @returns true if log matches filter
 *
 * @example
 * ```typescript
 * const matches = matchesAddressWasm(
 *   logAddress,
 *   [contractAddress1, contractAddress2]
 * );
 * ```
 */
export function matchesAddressWasm(
	logAddress: Address,
	filterAddresses: BrandedAddress[],
): boolean {
	const { Hex } = require("./hex.js");
	return loader.eventLogMatchesAddress(
		Hex.toBytes(logAddress),
		filterAddresses.map((a) => Hex.toBytes(a)),
	);
}

/**
 * Check if event log topic matches filter using WASM
 * @param logTopic - Log topic hash
 * @param filterTopic - Filter topic hash (null = match any)
 * @returns true if topic matches filter
 *
 * @example
 * ```typescript
 * const matches = matchesTopicWasm(topic0, eventSignatureHash);
 * ```
 */
export function matchesTopicWasm(
	logTopic: BrandedHash,
	filterTopic: BrandedHash | null,
): boolean {
	return loader.eventLogMatchesTopic(
		logTopic as Uint8Array,
		filterTopic ? (filterTopic as Uint8Array) : null,
	);
}

/**
 * Check if event log topics match filter array using WASM
 * @param logTopics - Array of log topics
 * @param filterTopics - Array of filter topics (null entries = match any)
 * @returns true if all topics match filter
 *
 * @example
 * ```typescript
 * const matches = matchesTopicsWasm(
 *   [topic0, topic1, topic2],
 *   [transferSig, fromAddress, null] // null = match any 'to' address
 * );
 * ```
 */
export function matchesTopicsWasm(
	logTopics: BrandedHash[],
	filterTopics: (BrandedHash | null)[],
): boolean {
	return loader.eventLogMatchesTopics(
		logTopics.map((t) => t as Uint8Array),
		filterTopics.map((t) => (t ? (t as Uint8Array) : null)),
	);
}

/**
 * Filter logs by address using WASM (batch operation)
 * @param logs - Array of event logs
 * @param filterAddresses - Array of filter addresses
 * @returns Filtered logs matching any address
 *
 * @example
 * ```typescript
 * const filtered = filterByAddressWasm(allLogs, [usdcAddress, daiAddress]);
 * ```
 */
export function filterByAddressWasm<T extends { address: BrandedAddress }>(
	logs: T[],
	filterAddresses: BrandedAddress[],
): T[] {
	if (filterAddresses.length === 0) {
		return logs; // No filter = return all
	}

	return logs.filter((log) => matchesAddressWasm(log.address, filterAddresses));
}

/**
 * Filter logs by topics using WASM (batch operation)
 * @param logs - Array of event logs
 * @param filterTopics - Array of filter topics (null = match any)
 * @returns Filtered logs matching all topics
 *
 * @example
 * ```typescript
 * const filtered = filterByTopicsWasm(allLogs, [
 *   transferEventSig,
 *   null, // from any
 *   userAddress // to user
 * ]);
 * ```
 */
export function filterByTopicsWasm<T extends { topics: BrandedHash[] }>(
	logs: T[],
	filterTopics: (BrandedHash | null)[],
): T[] {
	return logs.filter((log) => matchesTopicsWasm(log.topics, filterTopics));
}

/**
 * Filter logs by both address and topics using WASM
 * @param logs - Array of event logs
 * @param filterAddresses - Array of filter addresses (empty = match all)
 * @param filterTopics - Array of filter topics (null entries = match any)
 * @returns Filtered logs
 *
 * @example
 * ```typescript
 * const transfersToUser = filterLogsWasm(
 *   allLogs,
 *   [tokenAddress],
 *   [transferSig, null, userAddress]
 * );
 * ```
 */
export function filterLogsWasm<
	T extends { address: BrandedAddress; topics: BrandedHash[] },
>(
	logs: T[],
	filterAddresses: BrandedAddress[],
	filterTopics: (BrandedHash | null)[],
): T[] {
	return logs.filter(
		(log) =>
			matchesAddressWasm(log.address, filterAddresses) &&
			matchesTopicsWasm(log.topics, filterTopics),
	);
}

// ============================================================================
// Status Functions
// ============================================================================

/**
 * Check if WASM event log implementation is available
 * @returns true if WASM is loaded
 */
export function isWasmEventLogAvailable(): boolean {
	try {
		loader.getExports();
		return true;
	} catch {
		return false;
	}
}

/**
 * Get implementation status
 * @returns Object with WASM availability status
 */
export function getImplementationStatus() {
	return {
		wasmAvailable: isWasmEventLogAvailable(),
		primitives: {
			matchesAddress: true,
			matchesTopic: true,
			matchesTopics: true,
			filterByAddress: true,
			filterByTopics: true,
			filterLogs: true,
		},
	};
}
