/**
 * Blob schedules (EIP-7840 / EIP-7691 / EIP-7892) and EIP-7918 reserve price constants.
 *
 * Values match `ethereum/execution-specs` and the Ethereum mainnet BPO1/BPO2 schedule.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7691
 * @see https://eips.ethereum.org/EIPS/eip-7892
 * @see https://eips.ethereum.org/EIPS/eip-7918
 * @since 0.0.0
 */

/**
 * Gas consumed by one blob (2^17 = 131,072)
 * @type {131072n}
 */
export const GAS_PER_BLOB = 131_072n;

/**
 * Minimum blob base fee in wei per blob gas (EIP-4844)
 * @type {1n}
 */
export const MIN_BLOB_BASE_FEE = 1n;

/**
 * EIP-7918 execution cost bound per blob, in units of base fee (2^13 = 8,192)
 * @type {8192n}
 */
export const BLOB_BASE_COST = 8_192n;

/**
 * Cancun (EIP-4844): target 3, max 6, updateFraction 3,338,477
 * @type {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 */
export const CANCUN = Object.freeze({
	target: 3n,
	max: 6n,
	baseFeeUpdateFraction: 3_338_477n,
});

/**
 * Prague (EIP-7691): target 6, max 9, updateFraction 5,007,716
 * @type {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 */
export const PRAGUE = Object.freeze({
	target: 6n,
	max: 9n,
	baseFeeUpdateFraction: 5_007_716n,
});

/**
 * Osaka / Fusaka initial schedule (prior to BPO1): same parameters as Prague;
 * EIP-7918 changes the excess blob gas reserve price formula at Osaka.
 * @type {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 */
export const OSAKA = PRAGUE;

/**
 * BPO1 (EIP-7892): target 10, max 15, updateFraction 8,346,193
 * @type {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 */
export const BPO1 = Object.freeze({
	target: 10n,
	max: 15n,
	baseFeeUpdateFraction: 8_346_193n,
});

/**
 * BPO2 (EIP-7892): target 14, max 21, updateFraction 11,684,671
 * @type {Readonly<import('./BlobScheduleType.js').BlobScheduleType>}
 */
export const BPO2 = Object.freeze({
	target: 14n,
	max: 21n,
	baseFeeUpdateFraction: 11_684_671n,
});

/** Named alias for {@link CANCUN} */
export const CANCUN_BLOB_SCHEDULE = CANCUN;
/** Named alias for {@link PRAGUE} */
export const PRAGUE_BLOB_SCHEDULE = PRAGUE;
/** Named alias for {@link OSAKA} */
export const OSAKA_BLOB_SCHEDULE = OSAKA;
/** Named alias for {@link BPO1} */
export const BPO1_BLOB_SCHEDULE = BPO1;
/** Named alias for {@link BPO2} */
export const BPO2_BLOB_SCHEDULE = BPO2;

/**
 * Mainnet Cancun activation timestamp (2024-03-13 13:55:35 UTC)
 * @type {1710338135n}
 */
export const CANCUN_TIMESTAMP = 1_710_338_135n;

/**
 * Mainnet Prague activation timestamp (2025-05-07 10:05:11 UTC)
 * @type {1746612311n}
 */
export const PRAGUE_TIMESTAMP = 1_746_612_311n;

/**
 * Mainnet Osaka activation timestamp (2025-12-03 21:49:11 UTC)
 * @type {1764798551n}
 */
export const OSAKA_TIMESTAMP = 1_764_798_551n;

/**
 * Mainnet EIP-7892 BPO1 activation timestamp (2025-12-09 14:21:11 UTC)
 * @type {1765290071n}
 */
export const BPO1_TIMESTAMP = 1_765_290_071n;

/**
 * Mainnet EIP-7892 BPO2 activation timestamp (2026-01-07 01:01:11 UTC)
 * @type {1767747671n}
 */
export const BPO2_TIMESTAMP = 1_767_747_671n;
