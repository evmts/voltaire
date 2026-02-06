/**
 * Error thrown when encoding function data fails
 */
export class FunctionEncodingError extends AbiEncodingError {
}
/**
 * Error thrown when decoding function data fails
 */
export class FunctionDecodingError extends AbiDecodingError {
}
/**
 * Error thrown when function selector doesn't match
 */
export class FunctionInvalidSelectorError extends AbiInvalidSelectorError {
}
import { AbiEncodingError } from "../Errors.js";
import { AbiDecodingError } from "../Errors.js";
import { AbiInvalidSelectorError } from "../Errors.js";
//# sourceMappingURL=errors.d.ts.map