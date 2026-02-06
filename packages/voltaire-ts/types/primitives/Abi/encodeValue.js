// @ts-check
/** @import { AddressType as BrandedAddress } from "../Address/AddressType.js" */
/** @import { Parameter } from "./Parameter.js" */
import { Address } from "../Address/index.js";
import * as Hex from "../Hex/index.js";
import * as Uint from "../Uint/index.js";
import { AbiEncodingError } from "./Errors.js";
import { encodeParameters } from "./encodeParameters.js";
import { isDynamicType } from "./isDynamicType.js";
/**
 * @param {bigint} value
 * @returns {Uint8Array}
 */
export function encodeUint256(value) {
    return Uint.toAbiEncoded(Uint.from(value));
}
/**
 * @param {bigint | number} value
 * @param {number} bits
 * @returns {Uint8Array}
 */
function encodeUint(value, bits) {
    const bigintValue = typeof value === "number" ? BigInt(value) : value;
    const max = (1n << BigInt(bits)) - 1n;
    if (bigintValue < 0n || bigintValue > max) {
        throw new AbiEncodingError(`Value ${bigintValue} out of range for uint${bits}`);
    }
    return encodeUint256(bigintValue);
}
/**
 * @param {bigint | number} value
 * @param {number} bits
 * @returns {Uint8Array}
 */
function encodeInt(value, bits) {
    const bigintValue = typeof value === "number" ? BigInt(value) : value;
    const min = -(1n << (BigInt(bits) - 1n));
    const max = (1n << (BigInt(bits) - 1n)) - 1n;
    if (bigintValue < min || bigintValue > max) {
        throw new AbiEncodingError(`Value ${bigintValue} out of range for int${bits}`);
    }
    const unsigned = bigintValue < 0n ? (1n << 256n) + bigintValue : bigintValue;
    return encodeUint256(unsigned);
}
/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function padRight(data) {
    const paddedLength = Math.ceil(data.length / 32) * 32;
    if (paddedLength === data.length)
        return data;
    const result = new Uint8Array(paddedLength);
    result.set(data, 0);
    return result;
}
/**
 * @param {Parameter["type"]} type
 * @param {unknown} value
 * @param {readonly Parameter[]=} components
 * @returns {{ encoded: Uint8Array; isDynamic: boolean }}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ABI encoding requires handling many type variants in one function
export function encodeValue(type, value, components) {
    // Handle tuples FIRST
    if (type === "tuple" && components) {
        const tuple = /** @type {unknown[]} */ (value);
        const encoded = encodeParameters(
        /** @type {any} */ (components), 
        /** @type {any} */ (tuple));
        const isDynamic = isDynamicType(type, components);
        return { encoded, isDynamic };
    }
    // Check for arrays FIRST before other types
    // Dynamic arrays: uint256[], address[], etc.
    if (type.endsWith("[]")) {
        const elementType = /** @type {Parameter["type"]} */ (type.slice(0, -2));
        const array = /** @type {unknown[]} */ (value);
        const length = encodeUint256(BigInt(array.length));
        const elementParams = array.map(() => ({
            type: elementType,
            components,
        }));
        const encodedElements = encodeParameters(
        /** @type {any} */ (elementParams), 
        /** @type {any} */ (array));
        const result = new Uint8Array(length.length + encodedElements.length);
        result.set(length, 0);
        result.set(encodedElements, length.length);
        return { encoded: result, isDynamic: true };
    }
    // Fixed arrays: uint256[3], address[2], etc.
    // MUST check before uint/int to avoid matching "uint256[3]" as "uint"
    const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
    if (fixedArrayMatch?.[1] && fixedArrayMatch[2]) {
        const elementType = /** @type {Parameter["type"]} */ (fixedArrayMatch[1]);
        const arraySize = Number.parseInt(fixedArrayMatch[2], 10);
        const array = /** @type {unknown[]} */ (value);
        if (array.length !== arraySize) {
            throw new AbiEncodingError(`Array length mismatch: expected ${arraySize}, got ${array.length}`);
        }
        const elementParams = array.map(() => ({
            type: elementType,
            components,
        }));
        const encoded = encodeParameters(
        /** @type {any} */ (elementParams), 
        /** @type {any} */ (array));
        const isDynamic = isDynamicType(elementType, components);
        return { encoded, isDynamic };
    }
    if (type.startsWith("uint")) {
        const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4), 10);
        const encoded = encodeUint(/** @type {bigint | number} */ (value), bits);
        return { encoded, isDynamic: false };
    }
    if (type.startsWith("int")) {
        const bits = type === "int" ? 256 : Number.parseInt(type.slice(3), 10);
        const encoded = encodeInt(/** @type {bigint | number} */ (value), bits);
        return { encoded, isDynamic: false };
    }
    if (type === "address") {
        const addr = /** @type {BrandedAddress | string} */ (value);
        if (typeof addr === "string") {
            const addressValue = Address.fromHex(addr);
            return {
                encoded: Address.toAbiEncoded(addressValue),
                isDynamic: false,
            };
        }
        return { encoded: Address.toAbiEncoded(addr), isDynamic: false };
    }
    if (type === "bool") {
        const result = new Uint8Array(32);
        result[31] = value ? 1 : 0;
        return { encoded: result, isDynamic: false };
    }
    if (type.startsWith("bytes") && type.length > 5) {
        const size = Number.parseInt(type.slice(5), 10);
        if (size >= 1 && size <= 32) {
            let bytes;
            if (typeof value === "string") {
                bytes = Hex.toBytes(/** @type {any} */ (value));
            }
            else {
                bytes = /** @type {Uint8Array} */ (value);
            }
            if (bytes.length !== size) {
                throw new AbiEncodingError(`Invalid ${type} length: expected ${size}, got ${bytes.length}`);
            }
            const result = new Uint8Array(32);
            result.set(bytes, 0);
            return { encoded: result, isDynamic: false };
        }
    }
    if (type === "bytes") {
        const bytes = typeof value === "string"
            ? Hex.toBytes(/** @type {any} */ (value))
            : /** @type {Uint8Array} */ (value);
        const length = encodeUint256(BigInt(bytes.length));
        const data = padRight(bytes);
        const result = new Uint8Array(length.length + data.length);
        result.set(length, 0);
        result.set(data, length.length);
        return { encoded: result, isDynamic: true };
    }
    if (type === "string") {
        const str = /** @type {string} */ (value);
        const bytes = new TextEncoder().encode(str);
        const length = encodeUint256(BigInt(bytes.length));
        const data = padRight(bytes);
        const result = new Uint8Array(length.length + data.length);
        result.set(length, 0);
        result.set(data, length.length);
        return { encoded: result, isDynamic: true };
    }
    throw new AbiEncodingError(`Unsupported type: ${type}`);
}
