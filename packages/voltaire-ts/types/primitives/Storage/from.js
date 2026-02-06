import * as Hex from "../Hex/index.js";
/**
 * Size of a storage slot in bytes
 */
const SIZE = 32;
/**
 * Create a StorageSlot from various input types.
 * Storage slots must be exactly 32 bytes.
 *
 * @param {bigint | number | string | Uint8Array} value - Value to convert
 * @returns {import('./StorageType.js').StorageSlotType} A branded StorageSlot (32 bytes)
 * @throws {Error} If input cannot be converted to 32 bytes
 *
 * @example
 * ```typescript
 * // From bigint
 * const slot1 = Storage.from(0n);
 *
 * // From number
 * const slot2 = Storage.from(0);
 *
 * // From hex string (must be 32 bytes / 64 hex chars)
 * const slot3 = Storage.from('0x' + '00'.repeat(32));
 *
 * // From Uint8Array (must be exactly 32 bytes)
 * const slot4 = Storage.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
    let bytes;
    if (typeof value === "bigint") {
        // Convert bigint to 32-byte big-endian representation
        if (value < 0n) {
            throw new Error("StorageSlot cannot be negative");
        }
        if (value >= 2n ** 256n) {
            throw new Error("StorageSlot value exceeds 256 bits");
        }
        const hex = value.toString(16).padStart(64, "0");
        bytes = Hex.toBytes(`0x${hex}`);
    }
    else if (typeof value === "number") {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error("StorageSlot must be a non-negative integer");
        }
        if (value > Number.MAX_SAFE_INTEGER) {
            throw new Error("StorageSlot number exceeds safe integer range, use bigint");
        }
        return from(BigInt(value));
    }
    else if (typeof value === "string") {
        // Handle hex string
        bytes = Hex.toBytes(value);
    }
    else if (value instanceof Uint8Array) {
        bytes = value;
    }
    else {
        throw new TypeError(`Cannot convert ${typeof value} to StorageSlot. Expected bigint, number, string, or Uint8Array.`);
    }
    // Validate exactly 32 bytes
    if (bytes.length !== SIZE) {
        throw new Error(`StorageSlot must be exactly ${SIZE} bytes, got ${bytes.length}`);
    }
    // Create a new Uint8Array and brand it
    const result = new Uint8Array(bytes);
    Object.defineProperty(result, Symbol.for("voltaire.brand"), {
        value: "StorageSlot",
        enumerable: false,
        writable: false,
        configurable: false,
    });
    return /** @type {import('./StorageType.js').StorageSlotType} */ (result);
}
