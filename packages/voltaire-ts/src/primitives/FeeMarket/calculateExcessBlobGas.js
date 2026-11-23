import { InvalidRangeError } from "../errors/index.js";
import * as BlobSchedule from "./blobSchedule.js";
import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";
import { resolveBlobContext } from "./resolveBlobContext.js";

/**
 * Validate blob schedule invariants.
 * @param {import('./BlobScheduleType.js').BlobScheduleType} schedule
 */
function validateSchedule(schedule) {
	if (
		schedule.max <= 0n ||
		schedule.target < 0n ||
		schedule.target > schedule.max ||
		schedule.baseFeeUpdateFraction <= 0n
	) {
		throw new InvalidRangeError("Invalid blob schedule parameters", {
			value: schedule,
			expected: "0 <= target <= max, max > 0, baseFeeUpdateFraction > 0",
			docsPath: "/primitives/feemarket",
		});
	}
}

/**
 * Calculate excess blob gas using the exact EIP-7918 reserve-price formula (Osaka+).
 *
 * ```
 * targetBlobGas = GAS_PER_BLOB * schedule.target
 * if parentExcessBlobGas + parentBlobGasUsed < targetBlobGas: return 0n
 * if BLOB_BASE_COST * parentBaseFeePerGas > GAS_PER_BLOB * calculateBlobBaseFee(parentExcessBlobGas, schedule.baseFeeUpdateFraction):
 *     return parentExcessBlobGas + (parentBlobGasUsed * (schedule.max - schedule.target)) / schedule.max
 * return parentExcessBlobGas + parentBlobGasUsed - targetBlobGas
 * ```
 *
 * Uses exact integer ceiling threshold `ceil(BLOB_BASE_COST * parentBaseFeePerGas / GAS_PER_BLOB)`
 * so the Taylor series exits early once the blob base fee reaches the reserve bound,
 * remaining fast and consensus-exact even for extreme `parentExcessBlobGas` values.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7918
 * @since 0.0.0
 * @param {bigint} parentExcessBlobGas - Excess blob gas from parent block
 * @param {bigint} parentBlobGasUsed - Blob gas used in parent block
 * @param {bigint} parentBaseFeePerGas - Parent block execution base fee per gas (wei)
 * @param {import('./BlobScheduleType.js').BlobScheduleType} [schedule=BlobSchedule.OSAKA] - Active blob schedule
 * @returns {bigint} Excess blob gas for the next block
 * @throws {InvalidRangeError} If the blob schedule is invalid
 */
export function calculateExcessBlobGasEip7918(
	parentExcessBlobGas,
	parentBlobGasUsed,
	parentBaseFeePerGas,
	schedule = BlobSchedule.OSAKA,
) {
	validateSchedule(schedule);

	const targetBlobGas = BlobSchedule.GAS_PER_BLOB * schedule.target;
	const parentBlobGas = parentExcessBlobGas + parentBlobGasUsed;
	if (parentBlobGas < targetBlobGas) {
		return 0n;
	}

	if (parentBaseFeePerGas > 0n) {
		// Exact strict '>' equivalence for positive integers:
		// BLOB_BASE_COST * baseFee > GAS_PER_BLOB * fee
		//   <=> fee < ceil(BLOB_BASE_COST * baseFee / GAS_PER_BLOB)
		const reserve =
			(BlobSchedule.BLOB_BASE_COST * parentBaseFeePerGas +
				BlobSchedule.GAS_PER_BLOB -
				1n) /
			BlobSchedule.GAS_PER_BLOB;
		const blobBaseFee = calculateBlobBaseFee(
			parentExcessBlobGas,
			schedule.baseFeeUpdateFraction,
			reserve,
		);
		if (blobBaseFee < reserve) {
			return (
				parentExcessBlobGas +
				(parentBlobGasUsed * (schedule.max - schedule.target)) / schedule.max
			);
		}
	}

	return parentBlobGas - targetBlobGas;
}

/**
 * Calculate excess blob gas for the next block.
 *
 * - 2-argument call (backwards-compatible): Cancun EIP-4844 formula
 *   `max(0, parentExcessBlobGas + parentBlobGasUsed - 3 * GAS_PER_BLOB)`.
 * - 3-argument call with `options`: supports EIP-7691 (Prague), EIP-7892
 *   (BPO1/BPO2 by timestamp or `"bpo1"`/`"bpo2"`), custom `BlobSchedule`,
 *   and EIP-7918 execution-bounded reserve pricing (Osaka+).
 *
 * Schedule precedence: `options.schedule` > `timestamp` > `hardfork` > Cancun.
 * A defined `timestamp` wins over `hardfork` (e.g. `{ hardfork: "osaka",
 * timestamp: BPO2_TIMESTAMP }` uses the BPO2 schedule). Hardfork names are
 * case-insensitive; unknown names throw.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @see https://eips.ethereum.org/EIPS/eip-7691
 * @see https://eips.ethereum.org/EIPS/eip-7892
 * @see https://eips.ethereum.org/EIPS/eip-7918
 * @since 0.0.0
 * @param {bigint} parentExcessBlobGas - Excess blob gas from parent block
 * @param {bigint} parentBlobGasUsed - Blob gas used in parent block
 * @param {import('./BlobScheduleType.js').CalculateExcessBlobGasOptions} [options] - Optional fork, timestamp, schedule, and parent base fee
 * @returns {bigint} Excess blob gas for next block
 * @throws {InvalidRangeError} If EIP-7918 applies and `parentBaseFeePerGas` is omitted, or schedule/fork is invalid or unknown
 * @throws {InvalidFormatError} If a number timestamp is not a non-negative safe integer
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * // Cancun (default 2-arg form)
 * const excess1 = FeeMarket.calculateExcessBlobGas(0n, 131072n); // 0n
 * // Osaka (EIP-7918 reserve price active)
 * const excess2 = FeeMarket.calculateExcessBlobGas(0n, 1179648n, {
 *   hardfork: 'osaka',
 *   parentBaseFeePerGas: 1_000_000_000n,
 * }); // 393216n
 * ```
 */
export function calculateExcessBlobGas(
	parentExcessBlobGas,
	parentBlobGasUsed,
	options,
) {
	if (options === undefined) {
		const targetBlobGas =
			BlobSchedule.GAS_PER_BLOB * BlobSchedule.CANCUN.target;
		const total = parentExcessBlobGas + parentBlobGasUsed;
		return total < targetBlobGas ? 0n : total - targetBlobGas;
	}

	const { parentBaseFeePerGas } = options;

	// Schedule: explicit schedule > timestamp > hardfork > Cancun default.
	// EIP-7918: reservePrice > timestamp > hardfork > parentBaseFeePerGas given.
	const resolved = resolveBlobContext(options);
	const schedule = resolved.schedule;
	validateSchedule(schedule);
	const reservePrice =
		resolved.reservePrice ?? parentBaseFeePerGas !== undefined;

	if (reservePrice) {
		if (parentBaseFeePerGas === undefined) {
			throw new InvalidRangeError(
				"parentBaseFeePerGas is required to calculate excess blob gas from Osaka (EIP-7918)",
				{
					value: parentBaseFeePerGas,
					expected: "parent block base fee per gas (bigint)",
					docsPath: "/primitives/feemarket",
				},
			);
		}
		return calculateExcessBlobGasEip7918(
			parentExcessBlobGas,
			parentBlobGasUsed,
			parentBaseFeePerGas,
			schedule,
		);
	}

	const targetBlobGas = BlobSchedule.GAS_PER_BLOB * schedule.target;
	const total = parentExcessBlobGas + parentBlobGasUsed;
	return total < targetBlobGas ? 0n : total - targetBlobGas;
}
