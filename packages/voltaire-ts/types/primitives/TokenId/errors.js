import { PrimitiveError, ValidationError } from "../errors/index.js";
export class TokenIdError extends PrimitiveError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/token-id",
            cause: options?.cause,
        });
        this.name = "TokenIdError";
    }
}
export class InvalidTokenIdError extends ValidationError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "valid TokenId",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/token-id",
            cause: options?.cause,
        });
        this.name = "InvalidTokenIdError";
    }
}
