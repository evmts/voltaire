// @ts-nocheck
import { InvalidBuilderBidError } from "./errors.js";

/**
 * @typedef {import('./BuilderBidType.js').BuilderBidType} BuilderBidType
 * @typedef {import('./BuilderBidType.js').BuilderBidLike} BuilderBidLike
 */

/**
 * Converts hex string to Uint8Array
 * @param {string} hex - Hex string
 * @param {number} expectedLength - Expected byte length
 * @returns {Uint8Array}
 */
function hexToBytes(hex, expectedLength) {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (clean.length !== expectedLength * 2) {
		throw new InvalidBuilderBidError(
			`Expected ${expectedLength} bytes (${expectedLength * 2} hex chars), got ${clean.length / 2} bytes`,
			{ value: hex },
		);
	}
	const bytes = new Uint8Array(expectedLength);
	for (let i = 0; i < clean.length; i += 2) {
		bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Converts value to bigint
 * @param {any} value
 * @returns {bigint}
 */
function toBigInt(value) {
	if (typeof value === "bigint") {
		return value;
	}
	if (typeof value === "number") {
		return BigInt(value);
	}
	if (typeof value === "string") {
		const hex = value.startsWith("0x") ? value.slice(2) : value;
		return BigInt(`0x${hex}`);
	}
	return value;
}

/**
 * Creates a BuilderBid from various input types
 *
 * @param {BuilderBidLike} value - BuilderBid input
 * @returns {BuilderBidType} BuilderBid instance
 * @throws {InvalidBuilderBidError} If bid format is invalid
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * const bid = BuilderBid.from({
 *   slot: 123456n,
 *   parentHash: "0x...",
 *   blockHash: "0x...",
 *   builderPubkey: builderKey,
 *   proposerPubkey: proposerKey,
 *   proposerFeeRecipient: feeRecipient,
 *   gasLimit: 30000000n,
 *   gasUsed: 25000000n,
 *   value: 1000000000000000000n,
 *   signature: signature,
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new InvalidBuilderBidError("BuilderBid must be an object", { value });
	}

	// Parse slot
	const slot = toBigInt(value.slot);

	// Parse parentHash
	let parentHash;
	if (value.parentHash instanceof Uint8Array) {
		if (value.parentHash.length !== 32) {
			throw new InvalidBuilderBidError("parentHash must be 32 bytes", {
				value: value.parentHash,
			});
		}
		parentHash = value.parentHash;
	} else if (typeof value.parentHash === "string") {
		parentHash = hexToBytes(value.parentHash, 32);
	} else {
		throw new InvalidBuilderBidError(
			"parentHash must be Uint8Array or hex string",
			{ value: value.parentHash },
		);
	}

	// Parse blockHash
	let blockHash;
	if (value.blockHash instanceof Uint8Array) {
		if (value.blockHash.length !== 32) {
			throw new InvalidBuilderBidError("blockHash must be 32 bytes", {
				value: value.blockHash,
			});
		}
		blockHash = value.blockHash;
	} else if (typeof value.blockHash === "string") {
		blockHash = hexToBytes(value.blockHash, 32);
	} else {
		throw new InvalidBuilderBidError(
			"blockHash must be Uint8Array or hex string",
			{ value: value.blockHash },
		);
	}

	// Parse builderPubkey (48 bytes BLS)
	let builderPubkey;
	if (value.builderPubkey instanceof Uint8Array) {
		if (value.builderPubkey.length !== 48) {
			throw new InvalidBuilderBidError("builderPubkey must be 48 bytes", {
				value: value.builderPubkey,
			});
		}
		builderPubkey = value.builderPubkey;
	} else if (typeof value.builderPubkey === "string") {
		builderPubkey = hexToBytes(value.builderPubkey, 48);
	} else {
		throw new InvalidBuilderBidError(
			"builderPubkey must be Uint8Array or hex string",
			{ value: value.builderPubkey },
		);
	}

	// Parse proposerPubkey (48 bytes BLS)
	let proposerPubkey;
	if (value.proposerPubkey instanceof Uint8Array) {
		if (value.proposerPubkey.length !== 48) {
			throw new InvalidBuilderBidError("proposerPubkey must be 48 bytes", {
				value: value.proposerPubkey,
			});
		}
		proposerPubkey = value.proposerPubkey;
	} else if (typeof value.proposerPubkey === "string") {
		proposerPubkey = hexToBytes(value.proposerPubkey, 48);
	} else {
		throw new InvalidBuilderBidError(
			"proposerPubkey must be Uint8Array or hex string",
			{ value: value.proposerPubkey },
		);
	}

	// Parse proposerFeeRecipient (20 bytes address)
	let proposerFeeRecipient;
	if (value.proposerFeeRecipient instanceof Uint8Array) {
		if (value.proposerFeeRecipient.length !== 20) {
			throw new InvalidBuilderBidError(
				"proposerFeeRecipient must be 20 bytes",
				{ value: value.proposerFeeRecipient },
			);
		}
		proposerFeeRecipient = value.proposerFeeRecipient;
	} else if (typeof value.proposerFeeRecipient === "string") {
		proposerFeeRecipient = hexToBytes(value.proposerFeeRecipient, 20);
	} else {
		throw new InvalidBuilderBidError(
			"proposerFeeRecipient must be Uint8Array or hex string",
			{ value: value.proposerFeeRecipient },
		);
	}

	// Parse gasLimit
	const gasLimit = toBigInt(value.gasLimit);

	// Parse gasUsed
	const gasUsed = toBigInt(value.gasUsed);

	// Parse value
	const bidValue = toBigInt(value.value);

	// Parse signature (96 bytes BLS)
	let signature;
	if (value.signature instanceof Uint8Array) {
		if (value.signature.length !== 96) {
			throw new InvalidBuilderBidError("signature must be 96 bytes", {
				value: value.signature,
			});
		}
		signature = value.signature;
	} else if (typeof value.signature === "string") {
		signature = hexToBytes(value.signature, 96);
	} else {
		throw new InvalidBuilderBidError(
			"signature must be Uint8Array or hex string",
			{ value: value.signature },
		);
	}

	return {
		slot,
		parentHash,
		blockHash,
		builderPubkey,
		proposerPubkey,
		proposerFeeRecipient,
		gasLimit,
		gasUsed,
		value: bidValue,
		signature,
	};
}
