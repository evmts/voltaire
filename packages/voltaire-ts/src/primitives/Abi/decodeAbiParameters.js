// @ts-check

import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
import { From as ChecksumFrom } from "../Address/ChecksumAddress.js";
import { fromBytes as hexFromBytes } from "../Hex/fromBytes.js";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { decodeParameters } from "./decodeParameters.js";

/**
 * Factory: decode ABI parameters with viem `decodeAbiParameters` output semantics
 *
 * `Abi.decodeParameters` returns Voltaire-native values: lowercase address
 * strings, `Uint8Array` for `bytes`/`bytesN`, `bigint` for every integer, and
 * arrays for every tuple. The function this factory returns decodes the same
 * data and returns what viem returns:
 *
 * - `address`: EIP-55 checksummed string
 * - `bytes`, `bytesN`: `0x` hex string
 * - `uintN`, `intN` with N <= 48: `number`; wider integers: `bigint`
 * - `tuple` whose components all have names: object keyed by component name
 * - `tuple` with any unnamed component, or no components: array
 * - `bool`, `string`: unchanged
 *
 * The result is always an array with one entry per parameter, including for a
 * single parameter and for an empty parameter list.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function, used for EIP-55 checksums
 * @returns {<const TParams extends readonly import('abitype').AbiParameter[]>(params: TParams, data: Uint8Array | `0x${string}`) => import('abitype').AbiParametersToPrimitiveTypes<TParams>}
 * @example
 * ```javascript
 * import { DecodeAbiParameters } from './primitives/Abi/decodeAbiParameters.js';
 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
 *
 * const decodeAbiParameters = DecodeAbiParameters({ keccak256 });
 * const [owner, nonce] = decodeAbiParameters(
 *   [{ type: 'address' }, { type: 'uint32' }],
 *   data,
 * );
 * // owner: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", nonce: 7
 * ```
 */
export function DecodeAbiParameters({ keccak256 }) {
	const checksum = ChecksumFrom({ keccak256 });

	/**
	 * Convert a decoded non-array, non-tuple value.
	 *
	 * @param {string} type
	 * @param {unknown} value
	 * @returns {unknown}
	 */
	function scalarToViem(type, value) {
		if (type === "address") {
			return checksum(/** @type {string} */ (value));
		}
		if (type.startsWith("bytes")) {
			return hexFromBytes(/** @type {Uint8Array} */ (value));
		}
		const integer = type.match(/^u?int(\d*)$/);
		if (integer) {
			const bits = integer[1] ? Number.parseInt(integer[1], 10) : 256;
			return bits > 48 ? value : Number(value);
		}
		return value;
	}

	/**
	 * Convert one Voltaire-native decoded value to its viem representation.
	 *
	 * @param {string} type
	 * @param {readonly import('abitype').AbiParameter[] | undefined} components
	 * @param {unknown} value
	 * @returns {unknown}
	 */
	function toViem(type, components, value) {
		const array = type.match(/^(.+)\[\d*\]$/);
		if (array?.[1]) {
			const elementType = array[1];
			return /** @type {unknown[]} */ (value).map((element) =>
				toViem(elementType, components, element),
			);
		}
		if (type === "tuple") {
			return tupleToViem(components ?? [], /** @type {unknown[]} */ (value));
		}
		return scalarToViem(type, value);
	}

	/**
	 * Convert a decoded tuple: object when every component is named, else array.
	 *
	 * @param {readonly import('abitype').AbiParameter[]} fields
	 * @param {unknown[]} tuple
	 * @returns {unknown}
	 */
	function tupleToViem(fields, tuple) {
		const values = tuple.map((element, i) => {
			const field = /** @type {import('abitype').AbiParameter} */ (fields[i]);
			return toViem(
				field.type,
				/** @type {{ components?: readonly import('abitype').AbiParameter[] }} */ (
					field
				).components,
				element,
			);
		});
		// viem returns an array for an empty tuple or any unnamed component.
		if (fields.length === 0 || fields.some((field) => !field.name)) {
			return values;
		}
		/** @type {Record<string, unknown>} */
		const object = {};
		for (let i = 0; i < fields.length; i++) {
			// defineProperty, not assignment: a component named "__proto__"
			// must become an own property, not replace the object's prototype.
			Object.defineProperty(object, /** @type {string} */ (fields[i]?.name), {
				value: values[i],
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		return object;
	}

	return function decodeAbiParameters(params, data) {
		const bytes = typeof data === "string" ? hexToBytes(data) : data;
		const native = /** @type {unknown[]} */ (
			decodeParameters(/** @type {any} */ (params), bytes)
		);
		return /** @type {any} */ (
			native.map((value, i) => {
				const param = /** @type {import('abitype').AbiParameter} */ (params[i]);
				return toViem(
					param.type,
					/** @type {{ components?: readonly import('abitype').AbiParameter[] }} */ (
						param
					).components,
					value,
				);
			})
		);
	};
}

/**
 * Decode ABI parameters with viem `decodeAbiParameters` output semantics
 *
 * Same argument order and return shape as viem. See {@link DecodeAbiParameters}
 * for the full mapping. Use `Abi.decodeParameters` for Voltaire-native values.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @throws {import('./Errors.js').AbiDecodingError} If the data is too short or malformed for the parameters
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 *
 * const [balance] = Abi.decodeAbiParameters([{ type: 'uint256' }], data);
 * const [point] = Abi.decodeAbiParameters(
 *   [{ type: 'tuple', components: [{ name: 'x', type: 'uint8' }, { name: 'y', type: 'uint8' }] }],
 *   data,
 * );
 * // point: { x: 1, y: 2 }
 * ```
 */
export const decodeAbiParameters = DecodeAbiParameters({
	keccak256: keccak256Impl,
});
