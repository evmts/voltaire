/**
 * EIP-6963 Error Classes
 *
 * Hierarchical error types for EIP-6963 operations.
 *
 * @module provider/eip6963/errors
 */
import { PrimitiveError } from "../../primitives/errors/PrimitiveError.js";
/**
 * Base error for all EIP-6963 operations
 */
export declare class EIP6963Error extends PrimitiveError {
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Thrown when EIP-6963 is used in unsupported environment
 */
export declare class UnsupportedEnvironmentError extends EIP6963Error {
    readonly platform: string;
    constructor(platform: string);
}
/**
 * Thrown when UUID format is invalid
 */
export declare class InvalidUuidError extends EIP6963Error {
    readonly uuid: string;
    constructor(uuid: string);
}
/**
 * Thrown when RDNS format is invalid
 */
export declare class InvalidRdnsError extends EIP6963Error {
    readonly rdns: string;
    constructor(rdns: string);
}
/**
 * Thrown when icon format is invalid
 */
export declare class InvalidIconError extends EIP6963Error {
    readonly icon: string;
    constructor(icon: string);
}
/**
 * Thrown when required field is missing
 */
export declare class MissingFieldError extends EIP6963Error {
    readonly field: string;
    constructor(objectType: string, field: string);
}
/**
 * Thrown when field value is invalid (e.g., empty string)
 */
export declare class InvalidFieldError extends EIP6963Error {
    readonly field: string;
    constructor(objectType: string, field: string, reason: string);
}
/**
 * Thrown when provider is invalid (missing request method)
 */
export declare class InvalidProviderError extends EIP6963Error {
    constructor();
}
/**
 * Thrown when function argument is invalid
 */
export declare class InvalidArgumentError extends EIP6963Error {
    readonly argument: string;
    constructor(functionName: string, expected: string, got: string);
}
/**
 * Thrown when method is not yet implemented
 */
export declare class NotImplementedError extends EIP6963Error {
    constructor(methodName: string);
}
//# sourceMappingURL=errors.d.ts.map