/**
 * Provider RPC Error
 *
 * Error class for EIP-1193 and JSON-RPC 2.0 errors.
 *
 * @module provider/events/ProviderRpcError
 */
/**
 * Provider RPC error
 *
 * Extends Error with numeric code and optional data.
 * Codes follow EIP-1193 and JSON-RPC 2.0 specifications.
 *
 * @example
 * ```typescript
 * // Standard EIP-1193 error
 * throw new ProviderRpcError(4001, 'User rejected request');
 *
 * // With additional data
 * throw new ProviderRpcError(
 *   4200,
 *   'Unsupported method',
 *   { method: 'eth_customMethod' }
 * );
 * ```
 */
export declare class ProviderRpcError extends Error {
    /** Numeric error code (EIP-1193 or JSON-RPC 2.0) */
    code: number;
    /** Optional error data */
    data?: unknown;
    constructor(code: number, message: string, data?: unknown);
}
/**
 * Standard EIP-1193 error codes
 */
export declare const EIP1193ErrorCode: {
    /** User rejected the request */
    readonly UserRejectedRequest: 4001;
    /** Method/account not authorized */
    readonly Unauthorized: 4100;
    /** Method not supported */
    readonly UnsupportedMethod: 4200;
    /** Provider disconnected from all chains */
    readonly Disconnected: 4900;
    /** Provider not connected to requested chain */
    readonly ChainDisconnected: 4901;
};
/**
 * JSON-RPC 2.0 error codes
 */
export declare const JsonRpcErrorCode: {
    /** Invalid JSON */
    readonly ParseError: -32700;
    /** Invalid request object */
    readonly InvalidRequest: -32600;
    /** Method not found */
    readonly MethodNotFound: -32601;
    /** Invalid parameters */
    readonly InvalidParams: -32602;
    /** Internal error */
    readonly InternalError: -32603;
};
//# sourceMappingURL=ProviderRpcError.d.ts.map