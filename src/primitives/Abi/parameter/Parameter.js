// @ts-nocheck
import * as BrandedParameter from "./BrandedParameter/index.ts";

/**
 * Factory function for creating Parameter instances
 */
export function Parameter(param) {
	return BrandedParameter.from(param);
}

// Static constructor
Parameter.from = (param) => {
	return BrandedParameter.from(param);
};
Parameter.from.prototype = Parameter.prototype;

// Static methods (these throw - not implemented, use Abi.encodeParameters/decodeParameters)
Parameter.encode = BrandedParameter.encode;
Parameter.decode = BrandedParameter.decode;

// Instance methods
Parameter.prototype.encode = BrandedParameter.encode.call.bind(
	BrandedParameter.encode,
);
Parameter.prototype.decode = BrandedParameter.decode.call.bind(
	BrandedParameter.decode,
);

Parameter.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
};

Parameter.prototype.toString = function () {
	return `Parameter(${this.type}${this.name ? ` ${this.name}` : ""})`;
};
