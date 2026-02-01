/**
 * @module validation
 * @description Pure Base64 validation functions
 * @since 0.1.0
 */
import { Base64 } from "@tevm/voltaire/Base64";

/**
 * Check if string is valid standard Base64
 */
export const isValid = (value: string): boolean => Base64.isValid(value);

/**
 * Check if string is valid URL-safe Base64
 */
export const isValidUrlSafe = (value: string): boolean => Base64.isValidUrlSafe(value);
