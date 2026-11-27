/**
 * @typedef {{
 *   code?: number | string;
 *   context?: Record<string, unknown>;
 *   docsPath?: string;
 *   cause?: unknown;
 * }} StealthAddressErrorOptions
 */
/**
 * Base error for StealthAddress operations
 */
export class StealthAddressError extends PrimitiveError {
    /**
     * @param {string} message
     * @param {StealthAddressErrorOptions} [options]
     */
    constructor(message: string, options?: StealthAddressErrorOptions);
}
/**
 * Invalid stealth meta-address format or length
 */
export class InvalidStealthMetaAddressError extends StealthAddressError {
}
/**
 * Invalid public key format or length
 */
export class InvalidPublicKeyError extends StealthAddressError {
}
/**
 * Invalid ephemeral public key
 */
export class InvalidEphemeralPublicKeyError extends StealthAddressError {
}
/**
 * Invalid announcement format
 */
export class InvalidAnnouncementError extends StealthAddressError {
}
/**
 * Stealth address generation failed
 */
export class StealthAddressGenerationError extends StealthAddressError {
}
export type StealthAddressErrorOptions = {
    code?: number | string;
    context?: Record<string, unknown>;
    docsPath?: string;
    cause?: unknown;
};
import { PrimitiveError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map