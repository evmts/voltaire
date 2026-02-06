import { InvalidTransactionHashLengthError } from "./errors.js";
/**
 * Create TransactionHash from bytes
 *
 * @param {Uint8Array} bytes
 * @returns {import('./TransactionHashType.js').TransactionHashType}
 * @throws {InvalidTransactionHashLengthError} If bytes length is not 32
 */
export function fromBytes(bytes) {
    if (bytes.length !== 32) {
        throw new InvalidTransactionHashLengthError(`TransactionHash must be 32 bytes, got ${bytes.length}`, {
            value: bytes,
            expected: "32 bytes",
            context: { actualLength: bytes.length },
        });
    }
    return /** @type {import('./TransactionHashType.js').TransactionHashType} */ (bytes);
}
