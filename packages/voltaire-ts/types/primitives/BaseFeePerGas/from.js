import { InvalidFormatError } from "../errors/ValidationError.js";
/**
 * Create BaseFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Base fee in Wei
 * @returns {import("./BaseFeePerGasType.js").BaseFeePerGasType} Branded base fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n); // 25 Gwei
 * const baseFee2 = BaseFeePerGas.from("0x5d21dba00");
 * ```
 */
export function from(value) {
    let result;
    if (typeof value === "bigint") {
        result = value;
    }
    else if (typeof value === "number") {
        if (!Number.isInteger(value)) {
            throw new InvalidFormatError(`BaseFeePerGas must be an integer, got ${value}`, {
                value,
                expected: "Integer",
                code: -32602,
                docsPath: "/primitives/base-fee-per-gas/from#error-handling",
            });
        }
        result = BigInt(value);
    }
    else if (typeof value === "string") {
        if (value.startsWith("0x")) {
            result = BigInt(value);
        }
        else {
            throw new InvalidFormatError(`BaseFeePerGas string must be hex with 0x prefix, got ${value}`, {
                value,
                expected: "Hex string with 0x prefix",
                code: -32602,
                docsPath: "/primitives/base-fee-per-gas/from#error-handling",
            });
        }
    }
    else {
        throw new InvalidFormatError(`BaseFeePerGas must be bigint, number, or hex string, got ${typeof value}`, {
            value,
            expected: "bigint | number | string",
            code: -32602,
            docsPath: "/primitives/base-fee-per-gas/from#error-handling",
        });
    }
    if (result < 0n) {
        throw new InvalidFormatError(`BaseFeePerGas cannot be negative, got ${result}`, {
            value: result,
            expected: "Non-negative value",
            code: -32602,
            docsPath: "/primitives/base-fee-per-gas/from#error-handling",
        });
    }
    return /** @type {import("./BaseFeePerGasType.js").BaseFeePerGasType} */ (result);
}
