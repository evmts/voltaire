/**
 * Resolve the blob schedule and EIP-7918 activation for fork context options.
 *
 * Precedence:
 * - schedule: `options.schedule` > `timestamp` > `hardfork` > Cancun
 * - reserve price: `options.reservePrice` > `timestamp` (>= Osaka) >
 *   `hardfork` (Osaka, BPO1, BPO2, or later) > `undefined` (caller decides)
 *
 * A `hardfork` is always validated, even when `timestamp` or `schedule` wins.
 *
 * @since 0.0.0
 * @param {import('./BlobScheduleType.js').BlobForkContext} options - Fork context
 * @returns {{ schedule: Readonly<import('./BlobScheduleType.js').BlobScheduleType>, reservePrice: boolean | undefined }}
 * @throws {InvalidRangeError} If the hardfork is unknown or predates Cancun, or the timestamp predates Cancun
 * @throws {InvalidFormatError} If a number timestamp is not a non-negative safe integer
 */
export function resolveBlobContext(options: import("./BlobScheduleType.js").BlobForkContext): {
    schedule: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    reservePrice: boolean | undefined;
};
//# sourceMappingURL=resolveBlobContext.d.ts.map