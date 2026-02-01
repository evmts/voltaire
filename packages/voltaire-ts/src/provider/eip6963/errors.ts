/**
 * EIP-6963 Error Classes
 *
 * Hierarchical error types for EIP-6963 operations.
 *
 * @module provider/eip6963/errors
 */

import { PrimitiveError } from "../../primitives/errors/PrimitiveError.js";

/**
 * Base error for all EIP-6963 operations
 */
export class EIP6963Error extends PrimitiveError {
	constructor(
		message: string,
		options?: {
			code?: number | string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "EIP6963_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/jsonrpc-provider/eip6963",
			cause: options?.cause,
		});
		this.name = "EIP6963Error";
	}
}

/**
 * Thrown when EIP-6963 is used in unsupported environment
 */
export class UnsupportedEnvironmentError extends EIP6963Error {
	readonly platform: string;

	constructor(platform: string) {
		super(`EIP6963 requires browser. Detected: ${platform}`, {
			code: "UNSUPPORTED_ENVIRONMENT",
			context: { platform },
		});
		this.name = "UnsupportedEnvironmentError";
		this.platform = platform;
	}
}

/**
 * Thrown when UUID format is invalid
 */
export class InvalidUuidError extends EIP6963Error {
	readonly uuid: string;

	constructor(uuid: string) {
		super(`Invalid uuid: expected UUIDv4 format, got "${uuid}"`, {
			code: "INVALID_UUID",
			context: { uuid },
		});
		this.name = "InvalidUuidError";
		this.uuid = uuid;
	}
}

/**
 * Thrown when RDNS format is invalid
 */
export class InvalidRdnsError extends EIP6963Error {
	readonly rdns: string;

	constructor(rdns: string) {
		super(
			`Invalid rdns: expected reverse DNS format (e.g., "io.metamask"), got "${rdns}"`,
			{
				code: "INVALID_RDNS",
				context: { rdns },
			},
		);
		this.name = "InvalidRdnsError";
		this.rdns = rdns;
	}
}

/**
 * Thrown when icon format is invalid
 */
export class InvalidIconError extends EIP6963Error {
	readonly icon: string;

	constructor(icon: string) {
		const preview = icon.length > 30 ? `${icon.slice(0, 30)}...` : icon;
		super(
			`Invalid icon: expected data URI (data:image/...), got "${preview}"`,
			{
				code: "INVALID_ICON",
				context: { icon: preview },
			},
		);
		this.name = "InvalidIconError";
		this.icon = icon;
	}
}

/**
 * Thrown when required field is missing
 */
export class MissingFieldError extends EIP6963Error {
	readonly field: string;

	constructor(objectType: string, field: string) {
		super(`${objectType} missing required field: ${field}`, {
			code: "MISSING_FIELD",
			context: { objectType, field },
		});
		this.name = "MissingFieldError";
		this.field = field;
	}
}

/**
 * Thrown when field value is invalid (e.g., empty string)
 */
export class InvalidFieldError extends EIP6963Error {
	readonly field: string;

	constructor(objectType: string, field: string, reason: string) {
		super(`${objectType}.${field} ${reason}`, {
			code: "INVALID_FIELD",
			context: { objectType, field, reason },
		});
		this.name = "InvalidFieldError";
		this.field = field;
	}
}

/**
 * Thrown when provider is invalid (missing request method)
 */
export class InvalidProviderError extends EIP6963Error {
	constructor() {
		super("Invalid provider: expected EIP1193 provider with request() method", {
			code: "INVALID_PROVIDER",
		});
		this.name = "InvalidProviderError";
	}
}

/**
 * Thrown when function argument is invalid
 */
export class InvalidArgumentError extends EIP6963Error {
	readonly argument: string;

	constructor(functionName: string, expected: string, got: string) {
		super(`${functionName}() requires ${expected}, got ${got}`, {
			code: "INVALID_ARGUMENT",
			context: { functionName, expected, got },
		});
		this.name = "InvalidArgumentError";
		this.argument = expected;
	}
}

/**
 * Thrown when method is not yet implemented
 */
export class NotImplementedError extends EIP6963Error {
	constructor(methodName: string) {
		super(`EIP6963.${methodName} is not yet implemented`, {
			code: "NOT_IMPLEMENTED",
			context: { methodName },
		});
		this.name = "NotImplementedError";
	}
}
