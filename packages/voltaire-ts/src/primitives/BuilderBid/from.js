import { parseHexByte } from "../Hex/parseHexByte.js";
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
		bytes[i / 2] = parseHexByte(clean, i);
	}
	return bytes;
}

/**
 * Parse a fixed-length byte field from Uint8Array or hex string
 * @param {unknown} input
 * @param {number} expectedLength
 * @param {string} fieldName
 * @returns {Uint8Array}
 */
function parseFixedBytes(input, expectedLength, fieldName) {
	if (input instanceof Uint8Array) {
		if (input.length !== expectedLength) {
			throw new InvalidBuilderBidError(
				`${fieldName} must be ${expectedLength} bytes`,
				{ value: input },
			);
		}
		return input;
	}
	if (typeof input === "string") {
		return hexToBytes(input, expectedLength);
	}
	throw new InvalidBuilderBidError(
		`${fieldName} must be Uint8Array or hex string`,
		{ value: input },
	);
}

/**
 * Converts value to bigint
 * @param {bigint | number | string} value
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
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new InvalidBuilderBidError("BuilderBid must be an object", { value });
	}

	const slot = /** @type {import('../Slot/SlotType.js').SlotType} */ (
		toBigInt(value.slot)
	);
	const parentHash = /** @type {import('../Hash/HashType.js').HashType} */ (
		parseFixedBytes(value.parentHash, 32, "parentHash")
	);
	const blockHash = /** @type {import('../Hash/HashType.js').HashType} */ (
		parseFixedBytes(value.blockHash, 32, "blockHash")
	);
	const builderPubkey = parseFixedBytes(
		value.builderPubkey,
		48,
		"builderPubkey",
	);
	const proposerPubkey = parseFixedBytes(
		value.proposerPubkey,
		48,
		"proposerPubkey",
	);
	const proposerFeeRecipient =
		/** @type {import('../Address/AddressType.js').AddressType} */ (
			parseFixedBytes(value.proposerFeeRecipient, 20, "proposerFeeRecipient")
		);
	const gasLimit = /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
		toBigInt(value.gasLimit)
	);
	const gasUsed = /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
		toBigInt(value.gasUsed)
	);
	const bidValue = /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
		toBigInt(value.value)
	);
	const signature = parseFixedBytes(value.signature, 96, "signature");

	return {
		slot: /** @type {import('../Slot/SlotType.js').SlotType} */ (slot),
		parentHash: /** @type {import('../Hash/HashType.js').HashType} */ (
			parentHash
		),
		blockHash: /** @type {import('../Hash/HashType.js').HashType} */ (
			blockHash
		),
		builderPubkey,
		proposerPubkey,
		proposerFeeRecipient:
			/** @type {import('../Address/AddressType.js').AddressType} */ (
				proposerFeeRecipient
			),
		gasLimit: /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
			gasLimit
		),
		gasUsed: /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
			gasUsed
		),
		value: /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
			bidValue
		),
		signature,
	};
}
