/**
 * WASM implementation of Ethereum Event Log primitives
 * Uses WebAssembly bindings to Zig implementation for log filtering
 */
// Re-export pure TypeScript implementation
export * from "./EventLog.js";
import * as loader from "../../wasm-loader/loader.js";
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
export function matchesAddressWasm(logAddress, filterAddresses) {
    // BrandedAddress is already Uint8Array, no conversion needed
    return loader.eventLogMatchesAddress(logAddress, filterAddresses);
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
export function matchesTopicWasm(logTopic, filterTopic) {
    return loader.eventLogMatchesTopic(logTopic, filterTopic ? filterTopic : null);
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
export function matchesTopicsWasm(logTopics, filterTopics) {
    return loader.eventLogMatchesTopics(logTopics.map((t) => t), filterTopics.map((t) => (t ? t : null)));
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
export function filterByAddressWasm(logs, filterAddresses) {
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
export function filterByTopicsWasm(logs, filterTopics) {
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
export function filterLogsWasm(logs, filterAddresses, filterTopics) {
    return logs.filter((log) => matchesAddressWasm(log.address, filterAddresses) &&
        matchesTopicsWasm(log.topics, filterTopics));
}
// ============================================================================
// Status Functions
// ============================================================================
/**
 * Check if WASM event log implementation is available
 * @returns true if WASM is loaded
 */
export function isWasmEventLogAvailable() {
    try {
        loader.getExports();
        return true;
    }
    catch {
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
