// @ts-nocheck
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
        throw new InvalidRelayDataError(`Expected ${expectedLength} bytes (${expectedLength * 2} hex chars), got ${clean.length / 2} bytes`, { value: hex });
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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation requires checking multiple fields
export function from(value) {
    if (!value || typeof value !== "object") {
        throw new InvalidRelayDataError("RelayData must be an object", { value });
    }
    // Validate relayUrl
    if (typeof value.relayUrl !== "string") {
        throw new InvalidRelayDataError("relayUrl must be a string", {
            value: value.relayUrl,
        });
    }
    if (!value.relayUrl.startsWith("http://") &&
        !value.relayUrl.startsWith("https://")) {
        throw new InvalidRelayDataError("relayUrl must be a valid HTTP(S) URL", {
            value: value.relayUrl,
        });
    }
    // Parse relayPubkey (48 bytes BLS)
    let relayPubkey;
    if (value.relayPubkey instanceof Uint8Array) {
        if (value.relayPubkey.length !== 48) {
            throw new InvalidRelayDataError("relayPubkey must be 48 bytes", {
                value: value.relayPubkey,
            });
        }
        relayPubkey = value.relayPubkey;
    }
    else if (typeof value.relayPubkey === "string") {
        relayPubkey = hexToBytes(value.relayPubkey, 48);
    }
    else {
        throw new InvalidRelayDataError("relayPubkey must be Uint8Array or hex string", { value: value.relayPubkey });
    }
    // Parse optional builderPubkey (48 bytes BLS)
    let builderPubkey;
    if (value.builderPubkey !== undefined) {
        if (value.builderPubkey instanceof Uint8Array) {
            if (value.builderPubkey.length !== 48) {
                throw new InvalidRelayDataError("builderPubkey must be 48 bytes", {
                    value: value.builderPubkey,
                });
            }
            builderPubkey = value.builderPubkey;
        }
        else if (typeof value.builderPubkey === "string") {
            builderPubkey = hexToBytes(value.builderPubkey, 48);
        }
        else {
            throw new InvalidRelayDataError("builderPubkey must be Uint8Array or hex string", { value: value.builderPubkey });
        }
    }
    // Parse slot
    const slot = toBigInt(value.slot);
    // Parse parentHash (32 bytes)
    let parentHash;
    if (value.parentHash instanceof Uint8Array) {
        if (value.parentHash.length !== 32) {
            throw new InvalidRelayDataError("parentHash must be 32 bytes", {
                value: value.parentHash,
            });
        }
        parentHash = value.parentHash;
    }
    else if (typeof value.parentHash === "string") {
        parentHash = hexToBytes(value.parentHash, 32);
    }
    else {
        throw new InvalidRelayDataError("parentHash must be Uint8Array or hex string", { value: value.parentHash });
    }
    // Parse proposerFeeRecipient (20 bytes)
    let proposerFeeRecipient;
    if (value.proposerFeeRecipient instanceof Uint8Array) {
        if (value.proposerFeeRecipient.length !== 20) {
            throw new InvalidRelayDataError("proposerFeeRecipient must be 20 bytes", {
                value: value.proposerFeeRecipient,
            });
        }
        proposerFeeRecipient = value.proposerFeeRecipient;
    }
    else if (typeof value.proposerFeeRecipient === "string") {
        proposerFeeRecipient = hexToBytes(value.proposerFeeRecipient, 20);
    }
    else {
        throw new InvalidRelayDataError("proposerFeeRecipient must be Uint8Array or hex string", { value: value.proposerFeeRecipient });
    }
    const result = {
        relayUrl: value.relayUrl,
        relayPubkey,
        slot,
        parentHash,
        proposerFeeRecipient,
    };
    if (builderPubkey !== undefined) {
        result.builderPubkey = builderPubkey;
    }
    return result;
}
