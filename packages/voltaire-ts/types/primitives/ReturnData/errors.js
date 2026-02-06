import { PrimitiveError } from "../errors/PrimitiveError.js";
/**
 * Error thrown when hex string format is invalid
 */
export class InvalidHexFormatError extends PrimitiveError {
    constructor(message, context) {
        super(message, { context });
        this.name = "InvalidHexFormatError";
    }
}
/**
 * Error thrown when value type is unsupported
 */
export class InvalidValueError extends PrimitiveError {
    constructor(message, context) {
        super(message, { context });
        this.name = "InvalidValueError";
    }
}
