import { PrimitiveError, ValidationError } from "../errors/index.js";
export class MultiTokenIdError extends PrimitiveError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/multi-token-id",
            cause: options?.cause,
        });
        this.name = "MultiTokenIdError";
    }
}
export class InvalidMultiTokenIdError extends ValidationError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "valid MultiTokenId",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/multi-token-id",
            cause: options?.cause,
        });
        this.name = "InvalidMultiTokenIdError";
    }
}
