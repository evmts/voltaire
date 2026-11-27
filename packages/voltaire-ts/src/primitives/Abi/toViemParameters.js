// @ts-check

import { From as ChecksumFrom } from "../Address/ChecksumAddress.js";
import { fromBytes as hexFromBytes } from "../Hex/fromBytes.js";

/**
 * @typedef {{
 *   readonly type: string;
 *   readonly name?: string;
 *   readonly components?: readonly ViemAbiParam[];
 * }} ViemAbiParam
 */

/**
 * Factory: convert Voltaire-native decoded ABI parameter values into viem output shape.
 *
 * - `address` -> EIP-55 checksummed string
 * - `bytes` / `bytesN` / `function` -> `0x` lowercase hex string
 * - `uintN` / `intN` with N <= 48 -> JS `number`; wider or bare `uint`/`int` -> `bigint`
 * - `tuple` with all named components -> object keyed by component name
 * - `tuple` with any unnamed component or no components -> array
 * - `bool` / `string` -> unchanged
 *
 * @param {{ keccak256: (data: Uint8Array) => Uint8Array }} deps
 * @returns {(params: readonly ViemAbiParam[], values: readonly unknown[]) => unknown[]}
 */
export function CreateViemParameterConverter({ keccak256 }) {
	const checksum = ChecksumFrom({ keccak256 });

	/**
	 * Convert a decoded scalar value to its viem representation.
	 *
	 * @param {string} type
	 * @param {unknown} value
	 * @returns {unknown}
	 */
	function scalarToViem(type, value) {
		if (type === "address") {
			return checksum(/** @type {string} */ (value));
		}
		if (type === "function" || type.startsWith("bytes")) {
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
	 * Convert a decoded tuple: object when every component is named, else array.
	 *
	 * @param {readonly ViemAbiParam[]} fields
	 * @param {readonly unknown[]} tuple
	 * @returns {unknown}
	 */
	function tupleToViem(fields, tuple) {
		const values = tuple.map((element, i) => {
			const field = /** @type {ViemAbiParam} */ (fields[i]);
			return toViem(field.type, field.components, element);
		});
		if (fields.length === 0 || fields.some((field) => !field.name)) {
			return values;
		}
		/** @type {Record<string, unknown>} */
		const object = {};
		for (let i = 0; i < fields.length; i++) {
			// defineProperty avoids prototype mutation for components named "__proto__".
			Object.defineProperty(object, /** @type {string} */ (fields[i]?.name), {
				value: values[i],
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		return object;
	}

	/**
	 * Convert one Voltaire-native decoded value to its viem representation.
	 *
	 * @param {string} type
	 * @param {readonly ViemAbiParam[] | undefined} components
	 * @param {unknown} value
	 * @returns {unknown}
	 */
	function toViem(type, components, value) {
		const array = type.match(/^(.+)\[\d*\]$/);
		if (array?.[1]) {
			const elementType = array[1];
			return /** @type {readonly unknown[]} */ (value).map((element) =>
				toViem(elementType, components, element),
			);
		}
		if (type === "tuple") {
			return tupleToViem(
				components ?? [],
				/** @type {readonly unknown[]} */ (value),
			);
		}
		return scalarToViem(type, value);
	}

	return function convertToViem(params, values) {
		return values.map((value, i) => {
			const param = /** @type {ViemAbiParam} */ (params[i]);
			return toViem(param.type, param.components, value);
		});
	};
}
