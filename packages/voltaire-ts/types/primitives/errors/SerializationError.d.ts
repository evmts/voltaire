import { PrimitiveError } from "./PrimitiveError.js";
/**
 * Base serialization error
 *
 * @example
 * ```typescript
 * throw new SerializationError('Failed to serialize', {
 *   code: 'SERIALIZATION_ERROR',
 *   context: { data: [...] },
 *   docsPath: '/primitives/rlp/encode#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export declare class SerializationError extends PrimitiveError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Encoding error (e.g., RLP encoding failure)
 *
 * @throws {EncodingError}
 */
export declare class EncodingError extends SerializationError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Decoding error (e.g., RLP decoding failure)
 *
 * @throws {DecodingError}
 */
export declare class DecodingError extends SerializationError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=SerializationError.d.ts.map