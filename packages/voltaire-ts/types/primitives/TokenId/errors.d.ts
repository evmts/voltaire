import { PrimitiveError, ValidationError } from "../errors/index.js";
export declare class TokenIdError extends PrimitiveError {
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
export declare class InvalidTokenIdError extends ValidationError {
    constructor(message: string, options?: {
        code?: number;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map