// @ts-nocheck
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { from } from "./from.js";

/**
 * Factory function for creating Parameter instances
 */
export function Parameter(param) {
	return from(param);
}

// Static constructor
Parameter.from = (param) => {
	return from(param);
};

// Static methods (these throw - not implemented, use Abi.encodeParameters/decodeParameters)
Parameter.encode = encode;
Parameter.decode = decode;

// Instance methods
Parameter.prototype.encode = encode.call.bind(encode);
Parameter.prototype.decode = decode.call.bind(decode);

Parameter.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
};

Parameter.prototype.toString = function () {
	return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
};
