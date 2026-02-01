/**
 * @module encode
 * @description Pure Base64 encode operations
 * @since 0.1.0
 */
import { Base64, type BrandedBase64, type BrandedBase64Url } from "@tevm/voltaire/Base64";

/**
 * Encode bytes to standard Base64 string
 *
 * @param data - Bytes to encode
 * @returns Base64 encoded string
 * @example
 * ```typescript
 * const b64 = Base64.encode(new Uint8Array([72, 101, 108, 108, 111]))
 * ```
 */
export const encode = (data: Uint8Array): BrandedBase64 => Base64.encode(data);

/**
 * Encode UTF-8 string to standard Base64
 *
 * @param str - String to encode
 * @returns Base64 encoded string
 */
export const encodeString = (str: string): string => Base64.encodeString(str);

/**
 * Encode bytes to URL-safe Base64 string
 *
 * @param data - Bytes to encode
 * @returns URL-safe Base64 encoded string
 */
export const encodeUrlSafe = (data: Uint8Array): BrandedBase64Url => Base64.encodeUrlSafe(data);

/**
 * Encode UTF-8 string to URL-safe Base64
 *
 * @param str - String to encode
 * @returns URL-safe Base64 encoded string
 */
export const encodeStringUrlSafe = (str: string): BrandedBase64Url => Base64.encodeStringUrlSafe(str);
