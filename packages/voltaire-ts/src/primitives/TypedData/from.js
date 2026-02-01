import * as Domain from "../Domain/index.js";
import { InvalidTypedDataError } from "./errors.js";

/**
 * @typedef {{ name: string; type: string }} TypedDataField
 */

/**
 * Create TypedData from object
 *
 * @param {object} typedData - TypedData object
 * @param {Record<string, readonly TypedDataField[]>} typedData.types - Type definitions
 * @param {string} typedData.primaryType - Primary type name
 * @param {object} typedData.domain - Domain separator
 * @param {any} typedData.message - Message data
 * @returns {import('./TypedDataType.js').TypedDataType} TypedData
 * @throws {InvalidTypedDataError} If typedData is invalid
 * @example
 * ```javascript
 * import * as TypedData from './primitives/TypedData/index.js';
 * const typedData = TypedData.from({
 *   types: {
 *     EIP712Domain: [{ name: 'name', type: 'string' }],
 *     Person: [{ name: 'name', type: 'string' }]
 *   },
 *   primaryType: 'Person',
 *   domain: { name: 'MyDApp' },
 *   message: { name: 'Alice' }
 * });
 * ```
 */
export function from(typedData) {
	// Validate required fields
	if (!typedData.types) {
		throw new InvalidTypedDataError("TypedData must have types", {
			value: typedData,
		});
	}
	if (!typedData.primaryType) {
		throw new InvalidTypedDataError("TypedData must have primaryType", {
			value: typedData,
		});
	}
	if (!typedData.domain) {
		throw new InvalidTypedDataError("TypedData must have domain", {
			value: typedData,
		});
	}
	if (typedData.message === undefined) {
		throw new InvalidTypedDataError("TypedData must have message", {
			value: typedData,
		});
	}

	// Validate EIP712Domain exists in types
	if (!typedData.types.EIP712Domain) {
		throw new InvalidTypedDataError(
			"TypedData types must include EIP712Domain",
			{ value: typedData },
		);
	}

	// Validate primaryType exists in types
	if (!typedData.types[typedData.primaryType]) {
		throw new InvalidTypedDataError(
			`TypedData primaryType '${typedData.primaryType}' not found in types`,
			{ value: typedData },
		);
	}

	// Normalize domain using Domain.from
	const normalizedDomain = Domain.from(typedData.domain);

	return /** @type {import('./TypedDataType.js').TypedDataType} */ ({
		types: typedData.types,
		primaryType: typedData.primaryType,
		domain: normalizedDomain,
		message: typedData.message,
	});
}
