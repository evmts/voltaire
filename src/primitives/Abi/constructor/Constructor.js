import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";

/**
 * Factory function for creating Constructor instances
 * @template {import('../function/statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @param {Object} options
 * @param {'constructor'} [options.type]
 * @param {TStateMutability} options.stateMutability
 * @param {TInputs} options.inputs
 * @returns {import('./ConstructorType.js').ConstructorInstance<TStateMutability, TInputs>}
 */
export function Constructor({ type = "constructor", stateMutability, inputs }) {
	const result = /** @type {*} */ ({ type, stateMutability, inputs });
	Object.setPrototypeOf(result, Constructor.prototype);
	return result;
}

// Static methods
Constructor.encodeParams = encodeParams;
Constructor.decodeParams = decodeParams;

// Set up Constructor.prototype to inherit from Object.prototype
Object.setPrototypeOf(Constructor.prototype, Object.prototype);

// Instance methods
/** @param {unknown[]} args */
Constructor.prototype.encodeParams = function (args) {
	return encodeParams(/** @type {*} */ (this), args);
};

/** @param {Uint8Array} data */
Constructor.prototype.decodeParams = function (data) {
	return decodeParams(/** @type {*} */ (this), data);
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
