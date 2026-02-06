/**
 * Error thrown when EIP-1271 signature validation fails
 */
export declare class ContractSignatureError extends Error {
    constructor(message: string, context?: unknown);
    context?: unknown;
}
/**
 * Error thrown when contract call for signature validation fails
 */
export declare class ContractCallError extends Error {
    constructor(message: string, context?: unknown);
    context?: unknown;
}
//# sourceMappingURL=errors.d.ts.map