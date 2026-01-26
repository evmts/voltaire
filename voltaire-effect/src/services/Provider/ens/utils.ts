/**
 * @fileoverview ENS utility functions for encoding and hashing.
 * @module Provider/ens/utils
 * @since 0.0.1
 */

import { Ens, Hash } from "@tevm/voltaire";

/**
 * Converts bytes to hex string.
 */
export const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return hex as `0x${string}`;
};

/**
 * Converts hex string to bytes.
 */
export const hexToBytes = (hex: string): Uint8Array => {
	const h = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(h.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(h.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
};

/**
 * Encodes an ENS name to DNS wire format for Universal Resolver.
 *
 * @description
 * Converts an ENS name like "vitalik.eth" into DNS wire format bytes.
 * Each label is prefixed with its length byte, terminated with 0x00.
 *
 * Example: "vitalik.eth" -> [7, 'v', 'i', 't', 'a', 'l', 'i', 'k', 3, 'e', 't', 'h', 0]
 *
 * @param name - ENS name to encode
 * @returns DNS wire format encoded bytes
 */
export const dnsEncode = (name: string): Uint8Array => {
	const labels = name.split(".");
	const parts: number[] = [];

	for (const label of labels) {
		const encoded = new TextEncoder().encode(label);
		parts.push(encoded.length);
		parts.push(...encoded);
	}
	parts.push(0);

	return new Uint8Array(parts);
};

/**
 * Computes ENS namehash.
 *
 * @description
 * Uses voltaire's Ens.namehash for computing the EIP-137 namehash.
 *
 * @param name - ENS name to hash
 * @returns 32-byte namehash as hex string
 */
export const namehash = (name: string): `0x${string}` => {
	const hash = Ens.namehash(name);
	return bytesToHex(hash);
};

/**
 * Constructs reverse ENS name for address.
 *
 * @description
 * Converts an Ethereum address to its reverse ENS lookup name.
 * For example: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
 * becomes: d8da6bf26964af9d7eed9e03e53415d37aa96045.addr.reverse
 *
 * @param address - Ethereum address
 * @returns Reverse lookup ENS name
 */
export const toReverseName = (address: string): string => {
	const addr = address.toLowerCase().replace("0x", "");
	return `${addr}.addr.reverse`;
};

/**
 * Encodes function call data for addr(bytes32) resolver call.
 *
 * @param node - ENS namehash
 * @returns ABI-encoded function call
 */
export const encodeAddrCall = (node: `0x${string}`): `0x${string}` => {
	// addr(bytes32) selector = 0x3b3b57de
	const selector = "3b3b57de";
	const nodeHex = node.slice(2).padStart(64, "0");
	return `0x${selector}${nodeHex}`;
};

/**
 * Encodes function call data for text(bytes32,string) resolver call.
 *
 * @param node - ENS namehash
 * @param key - Text record key
 * @returns ABI-encoded function call
 */
export const encodeTextCall = (
	node: `0x${string}`,
	key: string,
): `0x${string}` => {
	// text(bytes32,string) selector = 0x59d1d43c
	const selector = "59d1d43c";
	const nodeHex = node.slice(2).padStart(64, "0");
	// String encoding: offset (0x40 = 64), length, data
	const keyBytes = new TextEncoder().encode(key);
	const keyLengthHex = keyBytes.length.toString(16).padStart(64, "0");
	const keyDataHex = bytesToHex(keyBytes).slice(2).padEnd(64, "0");
	const offset = "0000000000000000000000000000000000000000000000000000000000000040";
	return `0x${selector}${nodeHex}${offset}${keyLengthHex}${keyDataHex}`;
};

/**
 * Decodes an address from ABI-encoded return data.
 *
 * @param data - ABI-encoded return data
 * @returns Decoded address or null if empty
 */
export const decodeAddress = (data: `0x${string}`): `0x${string}` | null => {
	if (!data || data === "0x" || data.length < 66) {
		return null;
	}
	// Address is last 20 bytes of 32-byte word
	const addressHex = data.slice(26, 66);
	if (addressHex === "0000000000000000000000000000000000000000") {
		return null;
	}
	return `0x${addressHex}`;
};

/**
 * Decodes a string from ABI-encoded return data.
 *
 * @param data - ABI-encoded return data
 * @returns Decoded string or null if empty
 */
export const decodeString = (data: `0x${string}`): string | null => {
	if (!data || data === "0x" || data.length < 66) {
		return null;
	}
	// Skip selector if present, parse offset
	const hex = data.slice(2);
	// Offset to string data (should be 0x20 = 32)
	const offset = Number.parseInt(hex.slice(0, 64), 16);
	// String length at offset
	const lengthStart = offset * 2;
	const length = Number.parseInt(hex.slice(lengthStart, lengthStart + 64), 16);
	if (length === 0) return null;
	// String data
	const dataStart = lengthStart + 64;
	const stringHex = hex.slice(dataStart, dataStart + length * 2);
	const bytes = hexToBytes(stringHex);
	return new TextDecoder().decode(bytes);
};
