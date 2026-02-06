/**
 * @typedef {import('./RelayDataType.js').RelayDataType} RelayDataType
 */
/**
 * Constructs API endpoint for a specific relay method
 *
 * @param {RelayDataType} relay - RelayData instance
 * @param {string} method - API method path (e.g., "/eth/v1/builder/header")
 * @returns {string} Full endpoint URL
 * @example
 * ```typescript
 * import * as RelayData from './RelayData/index.js';
 * const url = RelayData.getEndpoint(relay, "/eth/v1/builder/header");
 * console.log(url); // "https://relay.flashbots.net/eth/v1/builder/header"
 * ```
 */
export function getEndpoint(relay: RelayDataType, method: string): string;
export type RelayDataType = import("./RelayDataType.js").RelayDataType;
//# sourceMappingURL=getEndpoint.d.ts.map