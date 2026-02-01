import * as Hex from "../Hex/index.js";
/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 * @typedef {import('./StorageValueType.js').StorageValueLike} StorageValueLike
 */
/**
 * Creates a StorageValue from various input types.
 * Accepts bigint, hex strings, Uint8Array, or existing StorageValue instances.
 *
 * @param {StorageValueLike} value - The value to convert
 * @returns {StorageValueType} - A branded StorageValue
 *
 * @example
 * ```typescript
 * const val = StorageValue.from(123n);
 * const val2 = StorageValue.from("0x1234...");
 * const val3 = StorageValue.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
    // If already a StorageValue, return as-is
    if (value &&
        /** @type {any} */ (value)[Symbol.for("voltaire.brand")] === "StorageValue") {
        return /** @type {StorageValueType} */ (value);
    }
    let bytes;
    if (typeof value === "bigint") {
        // Convert bigint to 32-byte big-endian representation
        const hex = value.toString(16).padStart(64, "0");
        bytes = Hex.toBytes(`0x${hex}`);
    }
    else if (typeof value === "string") {
        // Handle hex string
        bytes = Hex.toBytes(value);
    }
    else if (value instanceof Uint8Array) {
        bytes = value;
    }
    else {
        throw new TypeError(`Cannot convert ${typeof value} to StorageValue. Expected bigint, string, or Uint8Array.`);
    }
    // Validate 32 bytes
    if (bytes.length !== 32) {
        throw new Error(`StorageValue must be exactly 32 bytes, got ${bytes.length}`);
    }
    // Create a new Uint8Array and brand it
    const result = new Uint8Array(bytes);
    Object.defineProperty(result, Symbol.for("voltaire.brand"), {
        value: "StorageValue",
        enumerable: false,
        writable: false,
        configurable: false,
    });
    return /** @type {StorageValueType} */ (result);
}
