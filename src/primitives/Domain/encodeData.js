import { encodeType } from "./encodeType.js";
import { encodeValue } from "./encodeValue.js";
import { hashType } from "./hashType.js";

/**
 * @typedef {{ name: string; type: string }} EIP712Field
 * @typedef {Record<string, EIP712Field[]>} EIP712Types
 */

/**
 * Encode EIP-712 data structure
 *
 * encodeData(primaryType, data, types) = encodeType(primaryType, types) || encodeValue(data)
 *
 * @param {string} primaryType - Primary type name
 * @param {any} data - Data object
 * @param {EIP712Types} types - Type definitions
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded data
 */
export function encodeData(primaryType, data, types, crypto) {
	// Get the type definition
	const type = types[primaryType];
	if (!type) {
		throw new Error(`Type ${primaryType} not found in types`);
	}

	// Compute typeHash = keccak256(encodeType(primaryType, types))
	const typeString = encodeType(primaryType, types);
	const typeHash = crypto.keccak256(new TextEncoder().encode(typeString));

	// Encode all field values
	const encodedFields = [];
	for (const field of type) {
		const value = data[field.name];
		const encodedValue = encodeValue(field.type, value, types, crypto);
		encodedFields.push(encodedValue);
	}

	// Concatenate: typeHash || encodedField1 || encodedField2 || ...
	const totalLength = 32 + encodedFields.reduce((sum, f) => sum + f.length, 0);
	const result = new Uint8Array(totalLength);
	result.set(typeHash, 0);
	let offset = 32;
	for (const field of encodedFields) {
		result.set(field, offset);
		offset += field.length;
	}

	return result;
}
