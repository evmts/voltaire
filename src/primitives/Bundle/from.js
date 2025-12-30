// @ts-nocheck
import { InvalidBundleError } from "./errors.js";

/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 * @typedef {import('./BundleType.js').BundleLike} BundleLike
 */

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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
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
			{
				value,
			},
		);
	}

	// Import primitives lazily to avoid circular deps
	const transactions = value.transactions.map((tx, idx) => {
		if (tx instanceof Uint8Array) {
			return tx;
		}
		if (typeof tx === "string") {
			// Convert hex string to bytes
			const hex = tx.startsWith("0x") ? tx.slice(2) : tx;
			if (hex.length % 2 !== 0) {
				throw new InvalidBundleError(
					`Transaction ${idx} has invalid hex length`,
					{ value: tx },
				);
			}
			const bytes = new Uint8Array(hex.length / 2);
			for (let i = 0; i < hex.length; i += 2) {
				bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
			}
			return bytes;
		}
		throw new InvalidBundleError(
			`Transaction ${idx} must be Uint8Array or hex string`,
			{ value: tx },
		);
	});

	const bundle = {
		transactions,
	};

	// Optional: blockNumber
	if (value.blockNumber !== undefined) {
		if (typeof value.blockNumber === "bigint") {
			bundle.blockNumber = value.blockNumber;
		} else if (typeof value.blockNumber === "number") {
			bundle.blockNumber = BigInt(value.blockNumber);
		} else if (typeof value.blockNumber === "string") {
			const hex = value.blockNumber.startsWith("0x")
				? value.blockNumber.slice(2)
				: value.blockNumber;
			bundle.blockNumber = BigInt(`0x${hex}`);
		} else {
			bundle.blockNumber = value.blockNumber;
		}
	}

	// Optional: minTimestamp
	if (value.minTimestamp !== undefined) {
		if (typeof value.minTimestamp === "bigint") {
			bundle.minTimestamp = value.minTimestamp;
		} else if (typeof value.minTimestamp === "number") {
			bundle.minTimestamp = BigInt(value.minTimestamp);
		} else if (typeof value.minTimestamp === "string") {
			const hex = value.minTimestamp.startsWith("0x")
				? value.minTimestamp.slice(2)
				: value.minTimestamp;
			bundle.minTimestamp = BigInt(`0x${hex}`);
		} else {
			bundle.minTimestamp = value.minTimestamp;
		}
	}

	// Optional: maxTimestamp
	if (value.maxTimestamp !== undefined) {
		if (typeof value.maxTimestamp === "bigint") {
			bundle.maxTimestamp = value.maxTimestamp;
		} else if (typeof value.maxTimestamp === "number") {
			bundle.maxTimestamp = BigInt(value.maxTimestamp);
		} else if (typeof value.maxTimestamp === "string") {
			const hex = value.maxTimestamp.startsWith("0x")
				? value.maxTimestamp.slice(2)
				: value.maxTimestamp;
			bundle.maxTimestamp = BigInt(`0x${hex}`);
		} else {
			bundle.maxTimestamp = value.maxTimestamp;
		}
	}

	// Optional: revertingTxHashes
	if (value.revertingTxHashes !== undefined) {
		if (!Array.isArray(value.revertingTxHashes)) {
			throw new InvalidBundleError(
				"Bundle.revertingTxHashes must be an array",
				{ value },
			);
		}
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
		bundle.revertingTxHashes = value.revertingTxHashes.map((hash, idx) => {
			if (hash instanceof Uint8Array) {
				if (hash.length !== 32) {
					throw new InvalidBundleError(
						`Reverting hash ${idx} must be 32 bytes`,
						{ value: hash },
					);
				}
				return hash;
			}
			if (typeof hash === "string") {
				const hex = hash.startsWith("0x") ? hash.slice(2) : hash;
				if (hex.length !== 64) {
					throw new InvalidBundleError(
						`Reverting hash ${idx} must be 32 bytes`,
						{
							value: hash,
						},
					);
				}
				const bytes = new Uint8Array(32);
				for (let i = 0; i < 64; i += 2) {
					bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
				}
				return bytes;
			}
			throw new InvalidBundleError(
				`Reverting hash ${idx} must be Uint8Array or hex string`,
				{ value: hash },
			);
		});
	}

	return bundle;
}
