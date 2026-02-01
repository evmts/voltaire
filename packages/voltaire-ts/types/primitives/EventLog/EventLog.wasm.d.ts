/**
 * WASM implementation of Ethereum Event Log primitives
 * Uses WebAssembly bindings to Zig implementation for log filtering
 */
export * from "./EventLog.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
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
export declare function matchesAddressWasm(logAddress: BrandedAddress, filterAddresses: BrandedAddress[]): boolean;
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
export declare function matchesTopicWasm(logTopic: HashType, filterTopic: HashType | null): boolean;
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
export declare function matchesTopicsWasm(logTopics: HashType[], filterTopics: (HashType | null)[]): boolean;
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
export declare function filterByAddressWasm<T extends {
    address: BrandedAddress;
}>(logs: T[], filterAddresses: BrandedAddress[]): T[];
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
export declare function filterByTopicsWasm<T extends {
    topics: HashType[];
}>(logs: T[], filterTopics: (HashType | null)[]): T[];
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
export declare function filterLogsWasm<T extends {
    address: BrandedAddress;
    topics: HashType[];
}>(logs: T[], filterAddresses: BrandedAddress[], filterTopics: (HashType | null)[]): T[];
/**
 * Check if WASM event log implementation is available
 * @returns true if WASM is loaded
 */
export declare function isWasmEventLogAvailable(): boolean;
/**
 * Get implementation status
 * @returns Object with WASM availability status
 */
export declare function getImplementationStatus(): {
    wasmAvailable: boolean;
    primitives: {
        matchesAddress: boolean;
        matchesTopic: boolean;
        matchesTopics: boolean;
        filterByAddress: boolean;
        filterByTopics: boolean;
        filterLogs: boolean;
    };
};
//# sourceMappingURL=EventLog.wasm.d.ts.map