import { encodeValue } from "./encodeValue.js";
import {
	Eip712InvalidMessageError,
	Eip712TypeNotFoundError,
} from "./errors.js";
import { hashType } from "./hashType.js";

/**
 * Encode struct data according to EIP-712.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} primaryType - Type name to encode
 * @param {import('./BrandedEIP712.js').Message} data - Message data to encode
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions mapping
 * @returns {Uint8Array} Encoded data bytes (type hash concatenated with encoded values)
 * @throws {Eip712TypeNotFoundError} If primaryType is not found in types
 * @throws {Eip712InvalidMessageError} If required field is missing from data
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const types = { Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }] };
 * const encoded = EIP712.encodeData('Person', { name: 'Alice', wallet: '0x...' }, types);
 * ```
 */
export function encodeData(primaryType, data, types) {
	const typeProps = types[primaryType];
	if (!typeProps) {
		throw new Eip712TypeNotFoundError(`Type '${primaryType}' not found`, {
			code: "EIP712_TYPE_NOT_FOUND",
			context: { primaryType, availableTypes: Object.keys(types) },
			docsPath: "/crypto/eip712/encode-data#error-handling",
		});
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
				{
					code: "EIP712_MISSING_FIELD",
					context: { field: prop.name, type: primaryType, data },
					docsPath: "/crypto/eip712/encode-data#error-handling",
				},
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
