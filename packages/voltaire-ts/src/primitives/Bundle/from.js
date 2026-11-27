import { parseHexByte } from "../Hex/parseHexByte.js";
import { InvalidBundleError } from "./errors.js";

/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 * @typedef {import('./BundleType.js').BundleLike} BundleLike
 */

/**
 * Parse a bigint-like optional field
 * @param {bigint | number | string} input
 * @returns {bigint}
 */
function toBigInt(input) {
	if (typeof input === "bigint") return input;
	if (typeof input === "number") return BigInt(input);
	if (typeof input === "string") {
		const hex = input.startsWith("0x") ? input.slice(2) : input;
		return BigInt(`0x${hex}`);
	}
	return input;
}

/**
 * Parse bundle transaction entries from bytes or hex strings
 * @param {readonly (Uint8Array | string)[]} rawTxs
 * @returns {Uint8Array[]}
 */
function parseTransactions(rawTxs) {
	return rawTxs.map((tx, idx) => {
		if (tx instanceof Uint8Array) return tx;
		if (typeof tx === "string") {
			const hex = tx.startsWith("0x") ? tx.slice(2) : tx;
			if (hex.length % 2 !== 0) {
				throw new InvalidBundleError(
					`Transaction ${idx} has invalid hex length`,
					{ value: tx },
				);
			}
			const bytes = new Uint8Array(hex.length / 2);
			for (let i = 0; i < hex.length; i += 2) {
				bytes[i / 2] = parseHexByte(hex, i);
			}
			return bytes;
		}
		throw new InvalidBundleError(
			`Transaction ${idx} must be Uint8Array or hex string`,
			{ value: tx },
		);
	});
}

/**
 * Parse optional reverting transaction hashes (32 bytes each)
 * @param {readonly (import('../Hash/HashType.js').HashType | string)[]} rawHashes
 * @returns {import('../Hash/HashType.js').HashType[]}
 */
function parseRevertingHashes(rawHashes) {
	return rawHashes.map((hash, idx) => {
		if (hash instanceof Uint8Array) {
			if (hash.length !== 32) {
				throw new InvalidBundleError(`Reverting hash ${idx} must be 32 bytes`, {
					value: hash,
				});
			}
			return /** @type {import('../Hash/HashType.js').HashType} */ (hash);
		}
		if (typeof hash === "string") {
			const hex = hash.startsWith("0x") ? hash.slice(2) : hash;
			if (hex.length !== 64) {
				throw new InvalidBundleError(`Reverting hash ${idx} must be 32 bytes`, {
					value: hash,
				});
			}
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 64; i += 2) {
				bytes[i / 2] = parseHexByte(hex, i);
			}
			return /** @type {import('../Hash/HashType.js').HashType} */ (bytes);
		}
		throw new InvalidBundleError(
			`Reverting hash ${idx} must be Uint8Array or hex string`,
			{ value: hash },
		);
	});
}

/**
 * Creates a Bundle from various input types
 *
 * @param {BundleLike} value - Bundle input
 * @returns {BundleType} Bundle instance
 * @throws {InvalidBundleError} If bundle format is invalid
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const bundle = Bundle.from({
 *   transactions: [tx1, tx2],
 *   blockNumber: 123456n,
 * });
 * ```
 */
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new InvalidBundleError("Bundle must be an object", { value });
	}
	if (!Array.isArray(value.transactions)) {
		throw new InvalidBundleError("Bundle.transactions must be an array", {
			value,
		});
	}
	if (value.transactions.length === 0) {
		throw new InvalidBundleError(
			"Bundle must contain at least one transaction",
			{ value },
		);
	}

	const transactions = parseTransactions(value.transactions);
	const revertingTxHashes =
		value.revertingTxHashes !== undefined
			? (() => {
					if (!Array.isArray(value.revertingTxHashes)) {
						throw new InvalidBundleError(
							"Bundle.revertingTxHashes must be an array",
							{ value },
						);
					}
					return parseRevertingHashes(value.revertingTxHashes);
				})()
			: undefined;

	return {
		transactions,
		...(value.blockNumber !== undefined
			? {
					blockNumber:
						/** @type {import('../BlockNumber/BlockNumberType.js').BlockNumberType} */ (
							toBigInt(value.blockNumber)
						),
				}
			: {}),
		...(value.minTimestamp !== undefined
			? {
					minTimestamp:
						/** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
							toBigInt(value.minTimestamp)
						),
				}
			: {}),
		...(value.maxTimestamp !== undefined
			? {
					maxTimestamp:
						/** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
							toBigInt(value.maxTimestamp)
						),
				}
			: {}),
		...(revertingTxHashes !== undefined ? { revertingTxHashes } : {}),
	};
}
