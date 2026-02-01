/**
 * @module size
 * @description Pure Base64 size calculation functions
 * @since 0.1.0
 */
import { Base64 } from "@tevm/voltaire/Base64";

/**
 * Calculate encoded size for given byte count
 */
export const calcEncodedSize = (byteCount: number): number => Base64.calcEncodedSize(byteCount);

/**
 * Calculate decoded size for given Base64 string length
 */
export const calcDecodedSize = (encodedLength: number): number => Base64.calcDecodedSize(encodedLength);
