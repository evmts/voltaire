import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { from } from "./from.js";

/**
 * @typedef {import('./ParameterType.js').ParameterType} ParameterType
 * @typedef {ParameterType | { type: string; name?: string; internalType?: string; indexed?: boolean; components?: readonly unknown[] }} ParameterInput
 */

/**
 * Factory function for creating Parameter instances
 * @param {ParameterInput} param
 * @returns {ParameterType}
 */
export function Parameter(param) {
	return from(/** @type {ParameterType} */ (param));
}

// Static constructor
/**
 * @param {ParameterInput} param
 * @returns {ParameterType}
 */
Parameter.from = (param) => {
	return from(/** @type {ParameterType} */ (param));
};

// Static methods (these throw - not implemented, use Abi.encodeParameters/decodeParameters)
Parameter.encode = encode;
Parameter.decode = decode;

// Instance methods
Parameter.prototype.encode = /** @param {unknown} value */ function (value) {
	return encode.call(
		/** @type {ParameterType} */ (/** @type {unknown} */ (this)),
		value,
	);
};
Parameter.prototype.decode = /** @param {Uint8Array} data */ function (data) {
	return decode.call(
		/** @type {ParameterType} */ (/** @type {unknown} */ (this)),
		data,
	);
};

Parameter.prototype[Symbol.for("nodejs.util.inspect.custom")] =
	/**
	 * @this {ParameterType}
	 * @param {number} _depth
	 * @param {unknown} _options
	 */
	function (_depth, _options) {
		return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
	};

Parameter.prototype.toString = /** @this {ParameterType} */ function () {
	return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
};
