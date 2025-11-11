// @ts-nocheck
import * as BrandedAbi from "./BrandedAbi/index.js";

/**
 * Factory function for creating Abi instances
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {readonly import('./BrandedAbi/BrandedAbi.js').Item[]} items - ABI items
 * @returns {import('./AbiConstructor.js').Abi} Abi instance
 * @throws {never}
 * @example
 * ```javascript
 * import { Abi } from './primitives/Abi/index.js';
 * const abi = Abi([
 *   { type: 'function', name: 'transfer', inputs: [...], outputs: [...] }
 * ]);
 * ```
 */
export function Abi(items) {
	const result = Array.from(items);
	Object.setPrototypeOf(result, Abi.prototype);
	return result;
}

// Static constructor
Abi.from = (items) => {
	const result = Array.from(items);
	Object.setPrototypeOf(result, Abi.prototype);
	return result;
};

// Static utility methods
Abi.getItem = BrandedAbi.getItem;
Abi.format = BrandedAbi.format;
Abi.formatWithArgs = BrandedAbi.formatWithArgs;
Abi.encode = BrandedAbi.encode;
Abi.decode = BrandedAbi.decode;
Abi.decodeData = BrandedAbi.decodeData;
Abi.parseLogs = BrandedAbi.parseLogs;

// Sub-namespaces
Abi.Function = BrandedAbi.Function;
Abi.Event = BrandedAbi.Event;
Abi.Error = BrandedAbi.Error;
Abi.Constructor = BrandedAbi.Constructor;
Abi.Item = BrandedAbi.Item;

// Set up Abi.prototype to inherit from Array.prototype
Object.setPrototypeOf(Abi.prototype, Array.prototype);

// Instance methods for ABI operations
Abi.prototype.getItem = function (name, type) {
	return BrandedAbi.getItem(this, name, type);
};

Abi.prototype.format = function () {
	return BrandedAbi.format(this);
};

Abi.prototype.formatWithArgs = function (args) {
	return BrandedAbi.formatWithArgs(this, args);
};

Abi.prototype.encode = function (functionName, args) {
	return BrandedAbi.encode(this, functionName, args);
};

Abi.prototype.decode = function (functionName, data) {
	return BrandedAbi.decode(this, functionName, data);
};

Abi.prototype.decodeData = function (data) {
	return BrandedAbi.decodeData(this, data);
};

Abi.prototype.parseLogs = function (logs) {
	return BrandedAbi.parseLogs(this, logs);
};

// Convenience methods for getting specific item types
Abi.prototype.getFunction = function (name) {
	return BrandedAbi.getItem(this, name, "function");
};

Abi.prototype.getEvent = function (name) {
	return BrandedAbi.getItem(this, name, "event");
};

Abi.prototype.getError = function (name) {
	return BrandedAbi.getItem(this, name, "error");
};

Abi.prototype.getConstructor = function () {
	return this.find((item) => item.type === "constructor");
};

Abi.prototype.getFallback = function () {
	return this.find((item) => item.type === "fallback");
};

Abi.prototype.getReceive = function () {
	return this.find((item) => item.type === "receive");
};

Abi.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `Abi(${this.length} items)`;
};

Abi.prototype.toString = function () {
	return `Abi([${this.map((item) => item.name || item.type).join(", ")}])`;
};
