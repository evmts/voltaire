import * as ConstructorNs from "./constructor/index.js";
import { decode } from "./decode.js";
import { decodeData } from "./decodeData.js";
import { DecodeParameters, decodeParameters, encodeParameters, Parameters, } from "./Encoding.js";
import { encode } from "./encode.js";
import * as ErrorNs from "./error/index.js";
import * as EventNs from "./event/index.js";
import { findSelectorCollisions, hasSelectorCollisions, } from "./findSelectorCollisions.js";
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import * as FunctionNs from "./function/index.js";
import { getItem } from "./getItem.js";
import * as ItemNs from "./Item/index.js";
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
    const result = /** @type {*} */ (Array.from(items));
    Object.setPrototypeOf(result, Abi.prototype);
    return result;
}
// Static constructor
/** @param {readonly import('./Item/ItemType.js').ItemType[]} items */
Abi.from = (items) => {
    const result = /** @type {*} */ (Array.from(items));
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
Abi.findSelectorCollisions = findSelectorCollisions;
Abi.hasSelectorCollisions = hasSelectorCollisions;
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
/** @param {string} name @param {"function" | "event" | "constructor" | "error" | "fallback" | "receive"} [type] */
Abi.prototype.getItem = function (name, type) {
    return getItem(/** @type {*} */ (this), name, type);
};
Abi.prototype.format = function () {
    return /** @type {*} */ (this).map(
    /** @param {*} item */ (item) => format(item));
};
/** @param {Record<string, unknown[]>} args */
Abi.prototype.formatWithArgs = function (args) {
    return /** @type {*} */ (this).map(
    /** @param {*} item */ (item) => {
        if ("name" in item && item.name in args) {
            return formatWithArgs(item, /** @type {*} */ (args[item.name]));
        }
        return format(item);
    });
};
/** @param {string} functionName @param {unknown[]} args */
Abi.prototype.encode = function (functionName, args) {
    return encode.call(/** @type {*} */ (this), functionName, args);
};
/** @param {string} functionName @param {Uint8Array} data */
Abi.prototype.decode = function (functionName, data) {
    return decode.call(/** @type {*} */ (this), functionName, data);
};
/** @param {Uint8Array} data */
Abi.prototype.decodeData = function (data) {
    return decodeData.call(/** @type {*} */ (this), data);
};
/** @param {readonly { data: string | Uint8Array; topics: readonly (string | Uint8Array)[] }[]} logs */
Abi.prototype.parseLogs = function (logs) {
    return parseLogs.call(/** @type {*} */ (this), logs);
};
// Convenience methods for getting specific item types
/** @param {string} name */
Abi.prototype.getFunction = function (name) {
    return getItem(/** @type {*} */ (this), name, "function");
};
/** @param {string} name */
Abi.prototype.getEvent = function (name) {
    return getItem(/** @type {*} */ (this), name, "event");
};
/** @param {string} name */
Abi.prototype.getError = function (name) {
    return getItem(/** @type {*} */ (this), name, "error");
};
Abi.prototype.getConstructor = function () {
    return /** @type {*} */ (this).find(
    /** @param {*} item */ (item) => item.type === "constructor");
};
Abi.prototype.getFallback = function () {
    return /** @type {*} */ (this).find(
    /** @param {*} item */ (item) => item.type === "fallback");
};
Abi.prototype.getReceive = function () {
    return /** @type {*} */ (this).find(
    /** @param {*} item */ (item) => item.type === "receive");
};
Abi.prototype.findSelectorCollisions = function () {
    return findSelectorCollisions(/** @type {*} */ (this));
};
Abi.prototype.hasSelectorCollisions = function () {
    return hasSelectorCollisions(/** @type {*} */ (this));
};
Abi.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
/** @type {number} */ _depth, 
/** @type {*} */ _options) {
    return `Abi(${ /** @type {*} */(this).length} items)`;
};
Abi.prototype.toString = function () {
    return `Abi([${
    /** @type {*} */ (this)
        .map(/** @param {*} item */ (item) => item.name || item.type)
        .join(", ")}])`;
};
