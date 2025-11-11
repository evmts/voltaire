import { encode } from "./encode.js";

/**
 * Create bytes Data from Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array to wrap
 * @returns {import('./BrandedRlp.js').BrandedRlp & { type: "bytes" }} RLP bytes data structure
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const data = Rlp.fromBytes(new Uint8Array([1, 2, 3]));
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 */
export function fromBytes(bytes) {
	return { type: "bytes", value: bytes };
}

/**
 * Create list Data from array
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp[]} items - Array of RLP data items
 * @returns {import('./BrandedRlp.js').BrandedRlp & { type: "list" }} RLP list data structure
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const data = Rlp.fromList([
 *   { type: 'bytes', value: new Uint8Array([1]) },
 *   { type: 'bytes', value: new Uint8Array([2]) }
 * ]);
 * // => { type: 'list', value: [...] }
 * ```
 */
export function fromList(items) {
	return { type: "list", value: items };
}

/**
 * Encode Data to RLP bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP data structure to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {Error} If data is invalid or encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const encoded = Rlp.encodeData(data);
 * // => Uint8Array([0x83, 1, 2, 3])
 * ```
 */
export function encodeData(data) {
	return encode(data);
}

/**
 * Convert Data to bytes value (if type is bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP data structure
 * @returns {Uint8Array | undefined} Byte array if data is bytes type, undefined otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const bytes = Rlp.toBytes(data);
 * // => Uint8Array([1, 2, 3])
 * ```
 */
export function toBytes(data) {
	return data.type === "bytes" ? data.value : undefined;
}

/**
 * Convert Data to list value (if type is list)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP data structure
 * @returns {import('./BrandedRlp.js').BrandedRlp[] | undefined} Array of RLP data if list type, undefined otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const data = { type: 'list', value: [{ type: 'bytes', value: new Uint8Array([1]) }] };
 * const list = Rlp.toList(data);
 * // => [{ type: 'bytes', value: Uint8Array([1]) }]
 * ```
 */
export function toList(data) {
	return data.type === "list" ? data.value : undefined;
}
