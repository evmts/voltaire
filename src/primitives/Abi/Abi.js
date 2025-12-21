import {
	DecodeParameters,
	Parameters,
	decodeParameters,
	encodeParameters,
} from "./Encoding.js";
import * as ItemNs from "./Item/index.js";
import * as ConstructorNs from "./constructor/index.js";
import { decode } from "./decode.js";
import { decodeData } from "./decodeData.js";
import { encode } from "./encode.js";
import * as ErrorNs from "./error/index.js";
import * as EventNs from "./event/index.js";
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import * as FunctionNs from "./function/index.js";
import { getItem } from "./getItem.js";
import { parseLogs } from "./parseLogs.js";

/**
 * Factory function for creating Abi instances
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {readonly import('./AbiType.js').Item[]} items - ABI items
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
/** @param {readonly import('./Item/ItemType.js').Item[]} items */
Abi.from = (items) => {
	const result = Array.from(items);
	Object.setPrototypeOf(result, Abi.prototype);
	return result;
};

// Static utility methods
Abi.getItem = getItem;
Abi.format = format;
Abi.formatWithArgs = formatWithArgs;
Abi.encode = encode;
Abi.decode = decode;
Abi.decodeData = decodeData;
Abi.parseLogs = parseLogs;

// Parameter encoding/decoding methods
Abi.encodeParameters = encodeParameters;
Abi.decodeParameters = decodeParameters;

// Constructor-style aliases (data-first pattern)
Abi.Parameters = Parameters;
Abi.DecodeParameters = DecodeParameters;

// Sub-namespaces
Abi.Function = FunctionNs.Function;
Abi.Event = EventNs.Event;
Abi.Error = ErrorNs.Error;
Abi.Constructor = ConstructorNs;
Abi.Item = ItemNs;

// Set up Abi.prototype to inherit from Array.prototype
Object.setPrototypeOf(Abi.prototype, Array.prototype);

// Instance methods for ABI operations
/** @param {string} name @param {string} [type] */
Abi.prototype.getItem = function (name, type) {
	return getItem(this, name, type);
};

Abi.prototype.format = function () {
	return this.map(/** @param {*} item */ (item) => format(item));
};

/** @param {Record<string, unknown[]>} args */
Abi.prototype.formatWithArgs = function (args) {
	return this.map(/** @param {*} item */ (item) => {
		if ("name" in item && item.name in args) {
			return formatWithArgs(item, args[item.name]);
		}
		return format(item);
	});
};

Abi.prototype.encode = function (functionName, args) {
	return encode.call(this, functionName, args);
};

Abi.prototype.decode = function (functionName, data) {
	return decode.call(this, functionName, data);
};

Abi.prototype.decodeData = function (data) {
	return decodeData.call(this, data);
};

Abi.prototype.parseLogs = function (logs) {
	return parseLogs.call(this, logs);
};

// Convenience methods for getting specific item types
Abi.prototype.getFunction = function (name) {
	return getItem(this, name, "function");
};

Abi.prototype.getEvent = function (name) {
	return getItem(this, name, "event");
};

Abi.prototype.getError = function (name) {
	return getItem(this, name, "error");
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
