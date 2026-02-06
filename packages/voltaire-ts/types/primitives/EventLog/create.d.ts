/**
 * Create event log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {Object} params - Event log parameters
 * @param {BrandedAddress} params.address - Contract address
 * @param {readonly HashType[]} params.topics - Event topics
 * @param {Uint8Array} params.data - Event data
 * @param {bigint} [params.blockNumber] - Block number
 * @param {HashType} [params.transactionHash] - Transaction hash
 * @param {number} [params.transactionIndex] - Transaction index
 * @param {HashType} [params.blockHash] - Block hash
 * @param {number} [params.logIndex] - Log index
 * @param {boolean} [params.removed] - Whether log was removed
 * @returns {BrandedEventLog} EventLog object
 * @throws {InvalidLengthError} If any topic is not exactly 32 bytes
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const log = EventLog.create({
 *   address: Address.from("0x..."),
 *   topics: [Hash.from("0x...")],
 *   data: new Uint8Array([1, 2, 3]),
 * });
 * ```
 */
export function create(params: {
    address: BrandedAddress;
    topics: readonly HashType[];
    data: Uint8Array;
    blockNumber?: bigint | undefined;
    transactionHash?: import("../Hash/HashType.js").HashType | undefined;
    transactionIndex?: number | undefined;
    blockHash?: import("../Hash/HashType.js").HashType | undefined;
    logIndex?: number | undefined;
    removed?: boolean | undefined;
}): BrandedEventLog;
export type BrandedAddress = import("../Address/AddressType.js").AddressType;
export type HashType = import("../Hash/HashType.js").HashType;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=create.d.ts.map