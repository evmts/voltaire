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
export class RlpEncodingError extends EncodingError {
    constructor(message, options) {
        super(message, {
            code: -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/rlp/encode#error-handling",
            cause: options?.cause,
        });
        this.name = "RlpEncodingError";
    }
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
export class RlpDecodingError extends DecodingError {
    constructor(message, options) {
        super(message, {
            code: -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/rlp/decode#error-handling",
            cause: options?.cause,
        });
        this.name = "RlpDecodingError";
    }
}
