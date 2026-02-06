/**
 * Creates RelayData from various input types
 *
 * @param {RelayDataLike} value - RelayData input
 * @returns {RelayDataType} RelayData instance
 * @throws {InvalidRelayDataError} If format is invalid
 * @example
 * ```typescript
 * import * as RelayData from './RelayData/index.js';
 * const relay = RelayData.from({
 *   relayUrl: "https://relay.flashbots.net",
 *   relayPubkey: relayKey,
 *   slot: 123456n,
 *   parentHash: parentHash,
 *   proposerFeeRecipient: feeRecipient,
 * });
 * ```
 */
export function from(value: RelayDataLike): RelayDataType;
export type RelayDataType = import("./RelayDataType.js").RelayDataType;
export type RelayDataLike = import("./RelayDataType.js").RelayDataLike;
//# sourceMappingURL=from.d.ts.map