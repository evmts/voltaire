/**
 * Base64 Extensions - Voltaire-specific functionality not in Ox
 *
 * These functions extend the core Ox Base64 API with additional utilities:
 * - URL-safe variants (no padding, RFC 4648 Section 5)
 * - Validation functions
 * - Size calculation utilities
 */
export { calcDecodedSize, 
// Size utilities
calcEncodedSize, decodeUrlSafe, decodeUrlSafeToString, encodeStringUrlSafe, 
// URL-safe encoding (no padding, RFC 4648 Section 5)
encodeUrlSafe, 
// Validation
isValid, isValidUrlSafe, } from "../index.js";
