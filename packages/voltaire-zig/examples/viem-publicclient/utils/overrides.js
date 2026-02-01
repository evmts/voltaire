/**
 * Override Formatting Utilities
 *
 * Formats state and block overrides for JSON-RPC requests.
 *
 * @module examples/viem-publicclient/utils/overrides
 */

import { normalizeAddress, numberToHex, toHex } from "./encoding.js";

/**
 * @typedef {import('../PublicClientType.js').StateOverride} StateOverride
 * @typedef {import('../PublicClientType.js').BlockOverrides} BlockOverrides
 */

/**
 * Format state overrides for JSON-RPC
 *
 * @param {StateOverride | undefined} stateOverride
 * @returns {Record<string, Record<string, unknown>> | undefined}
 */
export function formatStateOverride(stateOverride) {
	if (stateOverride == null) return undefined;

	/** @type {Record<string, Record<string, unknown>>} */
	const formatted = {};

	for (const [address, override] of Object.entries(stateOverride)) {
		if (!override) continue;

		/** @type {Record<string, unknown>} */
		const entry = {};

		if (override.balance != null) {
			entry.balance = numberToHex(
				typeof override.balance === "bigint"
					? override.balance
					: BigInt(override.balance),
			);
		}
		if (override.nonce != null) {
			entry.nonce = numberToHex(
				typeof override.nonce === "bigint"
					? override.nonce
					: BigInt(override.nonce),
			);
		}
		if (override.code != null) {
			entry.code = toHex(override.code);
		}
		if (override.state != null) {
			entry.state = formatStateMapping(override.state);
		}
		if (override.stateDiff != null) {
			entry.stateDiff = formatStateMapping(override.stateDiff);
		}

		formatted[normalizeAddress(address)] = entry;
	}

	return formatted;
}

/**
 * Format block overrides for JSON-RPC
 *
 * @param {BlockOverrides | undefined} blockOverrides
 * @returns {Record<string, string> | undefined}
 */
export function formatBlockOverrides(blockOverrides) {
	if (blockOverrides == null) return undefined;

	/** @type {Record<string, string>} */
	const formatted = {};

	if (blockOverrides.number != null) {
		formatted.number = numberToHex(
			typeof blockOverrides.number === "bigint"
				? blockOverrides.number
				: BigInt(blockOverrides.number),
		);
	}
	if (blockOverrides.time != null) {
		formatted.time = numberToHex(
			typeof blockOverrides.time === "bigint"
				? blockOverrides.time
				: BigInt(blockOverrides.time),
		);
	}
	if (blockOverrides.gasLimit != null) {
		formatted.gasLimit = numberToHex(
			typeof blockOverrides.gasLimit === "bigint"
				? blockOverrides.gasLimit
				: BigInt(blockOverrides.gasLimit),
		);
	}
	if (blockOverrides.baseFee != null) {
		formatted.baseFee = numberToHex(
			typeof blockOverrides.baseFee === "bigint"
				? blockOverrides.baseFee
				: BigInt(blockOverrides.baseFee),
		);
	}
	if (blockOverrides.blobBaseFee != null) {
		formatted.blobBaseFee = numberToHex(
			typeof blockOverrides.blobBaseFee === "bigint"
				? blockOverrides.blobBaseFee
				: BigInt(blockOverrides.blobBaseFee),
		);
	}

	return formatted;
}

/**
 * @param {Record<string, unknown>} mapping
 * @returns {Record<string, string>}
 */
function formatStateMapping(mapping) {
	/** @type {Record<string, string>} */
	const formatted = {};

	for (const [slot, value] of Object.entries(mapping)) {
		if (value == null) continue;
		if (typeof value === "bigint") {
			formatted[slot] = numberToHex(value);
		} else {
			formatted[slot] = toHex(/** @type {string | Uint8Array} */ (value));
		}
	}

	return formatted;
}
