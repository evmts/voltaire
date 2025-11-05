import { encodeValue } from "./encodeValue.js";
import {
	Eip712InvalidMessageError,
	Eip712TypeNotFoundError,
} from "./errors.js";
import { hashType } from "./hashType.js";

/**
 * Encode struct data
 *
 * @param {string} primaryType - Type name
 * @param {import('./BrandedEIP712.js').Message} data - Message data
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions
 * @returns {Uint8Array} Encoded data
 *
 * @example
 * ```typescript
 * const encoded = EIP712.encodeData('Person', { name: 'Alice', wallet: '0x...' }, types);
 * ```
 */
export function encodeData(primaryType, data, types) {
	const typeProps = types[primaryType];
	if (!typeProps) {
		throw new Eip712TypeNotFoundError(`Type '${primaryType}' not found`);
	}

	// Type hash + encoded values
	const typeHash = hashType(primaryType, types);
	/** @type {Uint8Array[]} */
	const encodedValues = [typeHash];

	for (const prop of typeProps) {
		const value = data[prop.name];
		if (value === undefined) {
			throw new Eip712InvalidMessageError(
				`Missing field '${prop.name}' in message`,
			);
		}
		encodedValues.push(encodeValue(prop.type, value, types));
	}

	// Concatenate all
	const totalLength = encodedValues.reduce((sum, v) => sum + v.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const encoded of encodedValues) {
		result.set(encoded, offset);
		offset += encoded.length;
	}

	return result;
}
