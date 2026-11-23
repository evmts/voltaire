import { InvalidRangeError } from "../errors/index.js";
import { NAME_TO_HARDFORK, OSAKA } from "../Hardfork/constants.js";
import { isAtLeast } from "../Hardfork/isAtLeast.js";

/**
 * Normalize a hardfork name for blob fee market lookups.
 *
 * Matching is case-insensitive and accepts hardfork aliases (`paris`,
 * `glamsterdam`, ...) plus the EIP-7892 blob-parameter-only forks `bpo1` and
 * `bpo2`.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7892
 * @since 0.0.0
 * @param {string} hardfork - Hardfork name, any case
 * @returns {import('../Hardfork/HardforkType.js').HardforkType | "bpo1" | "bpo2"} Canonical lowercase fork name
 * @throws {InvalidRangeError} If the name is not a known hardfork or BPO fork
 * @example
 * ```javascript
 * normalizeBlobHardfork("Osaka"); // "osaka"
 * normalizeBlobHardfork("BPO2"); // "bpo2"
 * ```
 */
export function normalizeBlobHardfork(hardfork) {
	const normalized =
		typeof hardfork === "string" ? hardfork.toLowerCase() : undefined;
	if (normalized === "bpo1" || normalized === "bpo2") return normalized;
	if (
		normalized === undefined ||
		!Object.hasOwn(NAME_TO_HARDFORK, normalized)
	) {
		throw new InvalidRangeError(`Unknown hardfork: ${String(hardfork)}`, {
			value: hardfork,
			expected: "a known hardfork name or bpo1/bpo2",
			docsPath: "/primitives/feemarket",
		});
	}
	return NAME_TO_HARDFORK[
		/** @type {keyof typeof NAME_TO_HARDFORK} */ (normalized)
	];
}

/**
 * Whether a normalized blob fork is Osaka or later (EIP-7918 reserve price
 * active). `bpo1` and `bpo2` follow Osaka.
 *
 * @since 0.0.0
 * @param {import('../Hardfork/HardforkType.js').HardforkType | "bpo1" | "bpo2"} fork - Output of {@link normalizeBlobHardfork}
 * @returns {boolean} True on Osaka, BPO1, BPO2, and later forks
 */
export function isBlobForkAtLeastOsaka(fork) {
	if (fork === "bpo1" || fork === "bpo2") return true;
	return isAtLeast(fork, OSAKA);
}
