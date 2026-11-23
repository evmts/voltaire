import { InvalidFormatError } from "../errors/index.js";
import * as BlobSchedule from "./blobSchedule.js";
import {
	blobScheduleForHardfork,
	blobScheduleForTimestamp,
} from "./getBlobSchedule.js";
import {
	isBlobForkAtLeastOsaka,
	normalizeBlobHardfork,
} from "./normalizeBlobHardfork.js";

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
export function resolveBlobContext(options) {
	const { hardfork, timestamp } = options;
	const fork =
		hardfork === undefined ? undefined : normalizeBlobHardfork(hardfork);

	/** @type {bigint | undefined} */
	let ts;
	if (timestamp !== undefined) {
		if (
			typeof timestamp === "number" &&
			(!Number.isSafeInteger(timestamp) || timestamp < 0)
		) {
			throw new InvalidFormatError(
				`Invalid block timestamp: ${String(timestamp)}`,
				{
					value: timestamp,
					expected: "non-negative safe integer timestamp in seconds",
					docsPath: "/primitives/feemarket",
				},
			);
		}
		ts = BigInt(timestamp);
	}

	const schedule =
		options.schedule ??
		(ts !== undefined
			? blobScheduleForTimestamp(ts)
			: fork !== undefined
				? blobScheduleForHardfork(fork)
				: BlobSchedule.CANCUN);

	/** @type {boolean | undefined} */
	let reservePrice = options.reservePrice;
	if (reservePrice === undefined) {
		if (ts !== undefined) {
			reservePrice = ts >= BlobSchedule.OSAKA_TIMESTAMP;
		} else if (fork !== undefined) {
			reservePrice = isBlobForkAtLeastOsaka(fork);
		}
	}

	return { schedule, reservePrice };
}
