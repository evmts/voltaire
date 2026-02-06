import { PrimitiveError } from "../errors/PrimitiveError.js";
/**
 * Error thrown when hex string format is invalid
 */
export declare class InvalidHexFormatError extends PrimitiveError {
    constructor(message: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when value type is unsupported
 */
export declare class InvalidValueError extends PrimitiveError {
    constructor(message: string, context?: Record<string, unknown>);
}
//# sourceMappingURL=errors.d.ts.map