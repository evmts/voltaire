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
export function from(typedData: {
    types: Record<string, readonly TypedDataField[]>;
    primaryType: string;
    domain: object;
    message: any;
}): import("./TypedDataType.js").TypedDataType;
export type TypedDataField = {
    name: string;
    type: string;
};
//# sourceMappingURL=from.d.ts.map