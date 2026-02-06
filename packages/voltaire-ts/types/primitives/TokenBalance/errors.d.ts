import { PrimitiveError, ValidationError } from "../errors/index.js";
export declare class TokenBalanceError extends PrimitiveError {
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
export declare class InvalidTokenBalanceError extends ValidationError {
    constructor(message: string, options?: {
        code?: number;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
export declare class TokenBalanceOverflowError extends ValidationError {
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