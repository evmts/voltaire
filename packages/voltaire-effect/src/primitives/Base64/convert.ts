/**
 * @module convert
 * @description Pure Base64 conversion functions
 * @since 0.1.0
 */
import { Base64, type BrandedBase64, type BrandedBase64Url } from "@tevm/voltaire/Base64";

/**
 * Convert Base64 to bytes
 */
export const toBytes = (b64: BrandedBase64): Uint8Array => Base64.toBytes(b64);

/**
 * Convert URL-safe Base64 to bytes
 */
export const toBytesUrlSafe = (b64: BrandedBase64Url): Uint8Array => Base64.toBytesUrlSafe(b64);

/**
 * Convert Base64 to UTF-8 string
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional API name
export const toString = (b64: BrandedBase64): string => Base64.toString(b64);

/**
 * Convert URL-safe Base64 to UTF-8 string
 */
export const toStringUrlSafe = (b64: BrandedBase64Url): string => Base64.toStringUrlSafe(b64);

/**
 * Convert standard Base64 to URL-safe Base64
 */
export const toBase64Url = (value: BrandedBase64): BrandedBase64Url => Base64.toBase64Url(value);

/**
 * Convert URL-safe Base64 to standard Base64
 */
export const toBase64 = (value: BrandedBase64Url): BrandedBase64 => Base64.toBase64(value);
