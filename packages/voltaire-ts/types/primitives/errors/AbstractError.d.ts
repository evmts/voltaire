/**
 * Abstract base error for all Voltaire errors
 *
 * Provides standardized error handling with:
 * - Effect-compatible _tag for discriminated unions (catchTag)
 * - JSON-RPC style error codes
 * - Error cause chain for debugging
 * - Context object for additional metadata
 * - Documentation links for user guidance
 *
 * @example
 * ```typescript
 * class InvalidAddressError extends AbstractError {
 *   readonly _tag = "InvalidAddressError" as const
 *   constructor(address: string, options?: ErrorOptions) {
 *     super(
 *       `Invalid address format: ${address}`,
 *       {
 *         ...options,
 *         code: options?.code ?? -32602,
 *         docsPath: '/primitives/address/from-hex#error-handling'
 *       }
 *     )
 *     this.name = 'InvalidAddressError'
 *   }
 * }
 *
 * // Usage with Effect catchTag
 * Effect.catchTag("InvalidAddressError", (e) => ...)
 *
 * // Usage with cause chain
 * try {
 *   parseHex(input)
 * } catch (e) {
 *   throw new InvalidAddressError(input, { cause: e })
 * }
 * ```
 */
export declare abstract class AbstractError extends Error {
    /**
     * Effect-compatible discriminant for catchTag
     * Overridden by subclasses with a literal type
     * @example readonly _tag = "InvalidFormatError" as const
     */
    readonly _tag: string;
    /**
     * JSON-RPC style error code for programmatic handling
     * @see https://www.jsonrpc.org/specification#error_object
     * @example -32600 (Invalid Request), -32602 (Invalid params), "INVALID_FORMAT"
     */
    code: number | string;
    /**
     * Additional context metadata for debugging
     * @example { value: '0x123', expected: '20 bytes' }
     */
    context?: Record<string, unknown>;
    /**
     * Path to documentation for this error
     * @example '/primitives/address/from-hex#error-handling'
     */
    docsPath?: string;
    /**
     * Root cause of this error (for error chaining)
     */
    cause?: Error;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
    /**
     * Get full error chain as string for logging
     */
    getErrorChain(): string;
    /**
     * Serialize error to JSON for logging/telemetry
     */
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=AbstractError.d.ts.map