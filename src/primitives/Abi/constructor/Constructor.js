// @ts-nocheck
import * as BrandedConstructor from "./BrandedConstructor/index.ts";

/**
 * Factory function for creating Constructor instances
 * @param {Object} options
 * @param {'constructor'} options.type
 * @param {import('../function/statemutability.js').StateMutability} options.stateMutability
 * @param {readonly import('../Parameter.js').Parameter[]} options.inputs
 */
export function Constructor({ type = "constructor", stateMutability, inputs }) {
	const result = { type, stateMutability, inputs };
	Object.setPrototypeOf(result, Constructor.prototype);
	return result;
}

// Static methods
Constructor.encodeParams = BrandedConstructor.encodeParams;
Constructor.decodeParams = BrandedConstructor.decodeParams;

// Set up Constructor.prototype to inherit from Object.prototype
Object.setPrototypeOf(Constructor.prototype, Object.prototype);

// Instance methods
Constructor.prototype.encodeParams = function (args) {
	return BrandedConstructor.encodeParams(this, args);
};

Constructor.prototype.decodeParams = function (data) {
	return BrandedConstructor.decodeParams(this, data);
};

Constructor.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `Constructor(stateMutability: ${this.stateMutability}, inputs: ${this.inputs.length})`;
};

Constructor.prototype.toString = function () {
	return `Constructor(stateMutability: ${this.stateMutability}, inputs: ${this.inputs.length})`;
};
