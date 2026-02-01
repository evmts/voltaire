import { AbstractError } from "./AbstractError.js";
/**
 * Base error for all primitive-related errors
 *
 * @example
 * ```typescript
 * throw new PrimitiveError('Invalid primitive value', {
 *   code: 'INVALID_PRIMITIVE',
 *   context: { value: '0x123' },
 *   docsPath: '/primitives/overview#errors'
 * })
 * ```
 */
export declare class PrimitiveError extends AbstractError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=PrimitiveError.d.ts.map