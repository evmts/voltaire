/**
 * Authorization chain ID must be non-zero
 *
 * @throws {InvalidFormatError}
 */
export class InvalidChainIdError extends InvalidFormatError {
    /**
     * @param {bigint} chainId
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(chainId: bigint, options?: {
        cause?: Error | undefined;
    });
}
/**
 * Authorization address cannot be zero address
 *
 * @throws {InvalidFormatError}
 */
export class InvalidAddressError extends InvalidFormatError {
    /**
     * @param {Uint8Array} address
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(address: Uint8Array, options?: {
        cause?: Error | undefined;
    });
}
/**
 * Authorization yParity must be 0 or 1
 *
 * @throws {InvalidRangeError}
 */
export class InvalidYParityError extends InvalidRangeError {
    /**
     * @param {number} yParity
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(yParity: number, options?: {
        cause?: Error | undefined;
    });
}
/**
 * Authorization signature component cannot be zero
 *
 * @throws {InvalidSignatureError}
 */
export class InvalidSignatureComponentError extends InvalidSignatureError {
    /**
     * @param {string} component - 'r' or 's'
     * @param {bigint} value
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(component: string, value: bigint, options?: {
        cause?: Error | undefined;
    });
}
/**
 * Authorization signature r must be less than curve order
 *
 * @throws {InvalidRangeError}
 */
export class InvalidSignatureRangeError extends InvalidRangeError {
    /**
     * @param {bigint} value
     * @param {bigint} max
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(value: bigint, max: bigint, options?: {
        cause?: Error | undefined;
    });
}
/**
 * Authorization signature s too high (malleable signature)
 *
 * @throws {InvalidSignatureError}
 */
export class MalleableSignatureError extends InvalidSignatureError {
    /**
     * @param {bigint} s
     * @param {bigint} max
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(s: bigint, max: bigint, options?: {
        cause?: Error | undefined;
    });
}
import { InvalidFormatError } from "../errors/index.js";
import { InvalidRangeError } from "../errors/index.js";
import { InvalidSignatureError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map