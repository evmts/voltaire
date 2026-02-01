import { DecodingError, EncodingError } from "../errors/SerializationError.js";
/**
 * RLP encoding error
 *
 * @example
 * ```typescript
 * throw new RlpEncodingError('Invalid encodable data type', {
 *   code: 'RLP_INVALID_TYPE',
 *   context: { type: typeof value },
 *   docsPath: '/primitives/rlp/encode#error-handling'
 * })
 * ```
 */
export declare class RlpEncodingError extends EncodingError {
    constructor(message: string, options?: {
        code?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * RLP decoding error
 *
 * @example
 * ```typescript
 * throw new RlpDecodingError('Invalid RLP structure', {
 *   code: 'RLP_INVALID_STRUCTURE',
 *   context: { prefix: '0xf8', position: 0 },
 *   docsPath: '/primitives/rlp/decode#error-handling'
 * })
 * ```
 */
export declare class RlpDecodingError extends DecodingError {
    constructor(message: string, options?: {
        code?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=RlpError.d.ts.map