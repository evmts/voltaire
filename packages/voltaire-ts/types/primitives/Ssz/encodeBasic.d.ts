/**
 * @description Encodes basic types using SSZ serialization
 * @param {number | bigint | boolean} value - Value to encode
 * @param {string} type - Type: 'uint8', 'uint16', 'uint32', 'uint64', 'uint256', 'bool'
 * @returns {Uint8Array} SSZ encoded bytes
 */
export function encodeBasic(value: number | bigint | boolean, type: string): Uint8Array;
/**
 * @description Decodes basic types from SSZ serialization
 * @param {Uint8Array} bytes - SSZ encoded bytes
 * @param {string} type - Type: 'uint8', 'uint16', 'uint32', 'uint64', 'uint256', 'bool'
 * @returns {number | bigint | boolean} Decoded value
 */
export function decodeBasic(bytes: Uint8Array, type: string): number | bigint | boolean;
//# sourceMappingURL=encodeBasic.d.ts.map