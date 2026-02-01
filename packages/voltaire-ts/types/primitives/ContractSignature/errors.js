/**
 * Error thrown when EIP-1271 signature validation fails
 */
export class ContractSignatureError extends Error {
    constructor(message, context) {
        super(message);
        this.name = "ContractSignatureError";
        this.context = context;
    }
    context;
}
/**
 * Error thrown when contract call for signature validation fails
 */
export class ContractCallError extends Error {
    constructor(message, context) {
        super(message);
        this.name = "ContractCallError";
        this.context = context;
    }
    context;
}
