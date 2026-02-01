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
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32000,
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
    platform;
    constructor(platform) {
        super(`EIP6963 requires browser. Detected: ${platform}`, {
            code: -32000,
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
    uuid;
    constructor(uuid) {
        super(`Invalid uuid: expected UUIDv4 format, got "${uuid}"`, {
            code: -32602,
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
    rdns;
    constructor(rdns) {
        super(`Invalid rdns: expected reverse DNS format (e.g., "io.metamask"), got "${rdns}"`, {
            code: -32602,
            context: { rdns },
        });
        this.name = "InvalidRdnsError";
        this.rdns = rdns;
    }
}
/**
 * Thrown when icon format is invalid
 */
export class InvalidIconError extends EIP6963Error {
    icon;
    constructor(icon) {
        const preview = icon.length > 30 ? `${icon.slice(0, 30)}...` : icon;
        super(`Invalid icon: expected data URI (data:image/...), got "${preview}"`, {
            code: -32602,
            context: { icon: preview },
        });
        this.name = "InvalidIconError";
        this.icon = icon;
    }
}
/**
 * Thrown when required field is missing
 */
export class MissingFieldError extends EIP6963Error {
    field;
    constructor(objectType, field) {
        super(`${objectType} missing required field: ${field}`, {
            code: -32602,
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
    field;
    constructor(objectType, field, reason) {
        super(`${objectType}.${field} ${reason}`, {
            code: -32602,
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
            code: -32602,
        });
        this.name = "InvalidProviderError";
    }
}
/**
 * Thrown when function argument is invalid
 */
export class InvalidArgumentError extends EIP6963Error {
    argument;
    constructor(functionName, expected, got) {
        super(`${functionName}() requires ${expected}, got ${got}`, {
            code: -32602,
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
    constructor(methodName) {
        super(`EIP6963.${methodName} is not yet implemented`, {
            code: -32000,
            context: { methodName },
        });
        this.name = "NotImplementedError";
    }
}
