import { SIZE } from "./constants.js";
import { InvalidBytes32HexError, InvalidBytes32LengthError } from "./errors.js";
/**
 * Create Bytes32 from hex string (with or without 0x prefix)
 *
 * @param {string} hex - Hex string (64 chars, with or without 0x prefix)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32LengthError} If hex length is not 64 characters
 * @throws {InvalidBytes32HexError} If hex contains invalid characters
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromHex('0x' + 'ab'.repeat(32));
 * const b32Alt = Bytes32.fromHex('ab'.repeat(32));
 * ```
 */
export function fromHex(hex) {
    const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (normalized.length !== SIZE * 2) {
        throw new InvalidBytes32LengthError(`Bytes32 hex must be ${SIZE * 2} characters, got ${normalized.length}`, {
            value: hex,
            context: { actualLength: normalized.length },
        });
    }
    const result = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
        const byte = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) {
            throw new InvalidBytes32HexError("Invalid hex string", {
                value: hex,
                context: { position: i * 2 },
            });
        }
        result[i] = byte;
    }
    return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (result);
}
