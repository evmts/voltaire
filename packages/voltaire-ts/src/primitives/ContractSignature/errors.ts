/**
 * Error thrown when EIP-1271 signature validation fails
 */
export class ContractSignatureError extends Error {
	constructor(message: string, context?: unknown) {
		super(message);
		this.name = "ContractSignatureError";
		this.context = context;
	}

	context?: unknown;
}

/**
 * Error thrown when contract call for signature validation fails
 */
export class ContractCallError extends Error {
	constructor(message: string, context?: unknown) {
		super(message);
		this.name = "ContractCallError";
		this.context = context;
	}

	context?: unknown;
}
