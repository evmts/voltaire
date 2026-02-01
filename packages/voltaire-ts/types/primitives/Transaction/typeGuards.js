import { InvalidFormatError, InvalidTransactionTypeError, } from "../errors/index.js";
import { Type, } from "./types.js";
/**
 * Check if transaction is Legacy type
 */
export function isLegacy(tx) {
    return tx.type === Type.Legacy;
}
/**
 * Check if transaction is EIP-2930 type
 */
export function isEIP2930(tx) {
    return tx.type === Type.EIP2930;
}
/**
 * Check if transaction is EIP-1559 type
 */
export function isEIP1559(tx) {
    return tx.type === Type.EIP1559;
}
/**
 * Check if transaction is EIP-4844 type
 */
export function isEIP4844(tx) {
    return tx.type === Type.EIP4844;
}
/**
 * Check if transaction is EIP-7702 type
 */
export function isEIP7702(tx) {
    return tx.type === Type.EIP7702;
}
/**
 * Detect transaction type from serialized data
 *
 * @throws {InvalidFormatError} If transaction data is empty
 * @throws {InvalidTransactionTypeError} If transaction type byte is unknown
 */
export function detectType(data) {
    if (data.length === 0) {
        throw new InvalidFormatError("Empty transaction data", {
            code: -32602,
            value: data,
            expected: "Non-empty transaction data",
            docsPath: "/primitives/transaction/type-guards#error-handling",
        });
    }
    // biome-ignore lint/style/noNonNullAssertion: array is non-empty per check above
    const firstByte = data[0];
    // Legacy transactions start with RLP list prefix (0xc0-0xff)
    if (firstByte >= 0xc0) {
        return Type.Legacy;
    }
    // Typed transactions start with type byte
    switch (firstByte) {
        case Type.EIP2930:
            return Type.EIP2930;
        case Type.EIP1559:
            return Type.EIP1559;
        case Type.EIP4844:
            return Type.EIP4844;
        case Type.EIP7702:
            return Type.EIP7702;
        default:
            throw new InvalidTransactionTypeError(`Unknown transaction type: 0x${firstByte.toString(16)}`, {
                code: -32602,
                context: { typeByte: `0x${firstByte.toString(16)}` },
                docsPath: "/primitives/transaction/type-guards#error-handling",
            });
    }
}
