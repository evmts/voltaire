/**
 * Resolve the blob schedule for a hardfork name (or `"bpo1"` / `"bpo2"`).
 *
 * Names are case-insensitive and accept aliases (`paris`, `glamsterdam`).
 *
 * - `cancun` -> Cancun (3/6)
 * - `prague` -> Prague (6/9)
 * - `osaka` -> Osaka initial (6/9)
 * - `bpo1` / `bpo2` -> EIP-7892 BPO1 (10/15) / BPO2 (14/21)
 * - Any hardfork after Osaka (e.g. `amsterdam`) -> BPO2 (14/21)
 *
 * @param {import('./BlobScheduleType.js').BlobHardforkName} hardfork
 * @returns {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 * @throws {InvalidRangeError} If the hardfork predates Cancun or is unknown
 */
export function blobScheduleForHardfork(hardfork: import("./BlobScheduleType.js").BlobHardforkName): Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
/**
 * Resolve the Ethereum mainnet blob schedule active at a Unix timestamp (seconds),
 * including EIP-7892 BPO1 (`1765290071`) and BPO2 (`1767747671`).
 *
 * @param {bigint | number} timestamp - Mainnet block timestamp in Unix seconds
 * @returns {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 * @throws {InvalidFormatError} If a number timestamp is not a non-negative safe integer
 * @throws {InvalidRangeError} If the timestamp predates Cancun (`1710338135`)
 */
export function blobScheduleForTimestamp(timestamp: bigint | number): Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
/**
 * Get the blob schedule (target, max, base fee update fraction) for a hardfork
 * name or a mainnet block timestamp (seconds).
 *
 * @see https://eips.ethereum.org/EIPS/eip-7892
 * @since 0.0.0
 * @param {import('./BlobScheduleType.js').BlobHardforkName | bigint | number} hardforkOrTimestamp
 * @returns {Readonly<import('./BlobScheduleType.js').BlobScheduleType>} Active blob schedule
 * @throws {InvalidRangeError} If the fork or timestamp predates Cancun or is unknown
 * @throws {InvalidFormatError} If a number timestamp is not a non-negative safe integer
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * FeeMarket.getBlobSchedule('prague'); // { target: 6n, max: 9n, baseFeeUpdateFraction: 5007716n }
 * FeeMarket.getBlobSchedule(1765290071n); // BPO1: { target: 10n, max: 15n, baseFeeUpdateFraction: 8346193n }
 * ```
 */
export function getBlobSchedule(hardforkOrTimestamp: import("./BlobScheduleType.js").BlobHardforkName | bigint | number): Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
//# sourceMappingURL=getBlobSchedule.d.ts.map