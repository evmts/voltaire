/**
 * HMAC (Hash-based Message Authentication Code) module for Effect.
 * Provides keyed hash authentication for data integrity.
 * @module
 * @since 0.0.1
 */
export { HMACService, HMACLive, HMACTest, type HMACServiceShape } from './HMACService.js'
export { hmacSha256, hmacSha512 } from './operations.js'
