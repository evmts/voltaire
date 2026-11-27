import { parseHexByte } from "../Hex/parseHexByte.js";
import { InvalidRelayDataError } from "./errors.js";

/**
 * @typedef {import('./RelayDataType.js').RelayDataType} RelayDataType
 * @typedef {import('./RelayDataType.js').RelayDataLike} RelayDataLike
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
		throw new InvalidRelayDataError(
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
			throw new InvalidRelayDataError(
				`${fieldName} must be ${expectedLength} bytes`,
				{ value: input },
			);
		}
		return input;
	}
	if (typeof input === "string") {
		return hexToBytes(input, expectedLength);
	}
	throw new InvalidRelayDataError(
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
 * Creates RelayData from various input types
 *
 * @param {RelayDataLike} value - RelayData input
 * @returns {RelayDataType} RelayData instance
 * @throws {InvalidRelayDataError} If format is invalid
 * @example
 * ```typescript
 * import * as RelayData from './RelayData/index.js';
 * const relay = RelayData.from({
 *   relayUrl: "https://relay.flashbots.net",
 *   relayPubkey: relayKey,
 *   slot: 123456n,
 *   parentHash: parentHash,
 *   proposerFeeRecipient: feeRecipient,
 * });
 * ```
 */
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new InvalidRelayDataError("RelayData must be an object", { value });
	}
	if (typeof value.relayUrl !== "string") {
		throw new InvalidRelayDataError("relayUrl must be a string", {
			value: value.relayUrl,
		});
	}
	if (
		!value.relayUrl.startsWith("http://") &&
		!value.relayUrl.startsWith("https://")
	) {
		throw new InvalidRelayDataError("relayUrl must be a valid HTTP(S) URL", {
			value: value.relayUrl,
		});
	}

	const relayPubkey = parseFixedBytes(value.relayPubkey, 48, "relayPubkey");
	const builderPubkey =
		value.builderPubkey !== undefined
			? parseFixedBytes(value.builderPubkey, 48, "builderPubkey")
			: undefined;
	const slot = /** @type {import('../Slot/SlotType.js').SlotType} */ (
		toBigInt(value.slot)
	);
	const parentHash = /** @type {import('../Hash/HashType.js').HashType} */ (
		parseFixedBytes(value.parentHash, 32, "parentHash")
	);
	const proposerFeeRecipient =
		/** @type {import('../Address/AddressType.js').AddressType} */ (
			parseFixedBytes(value.proposerFeeRecipient, 20, "proposerFeeRecipient")
		);

	/** @type {RelayDataType} */
	const result = {
		relayUrl: value.relayUrl,
		relayPubkey,
		slot,
		parentHash,
		proposerFeeRecipient,
		...(builderPubkey !== undefined ? { builderPubkey } : {}),
	};

	return result;
}
