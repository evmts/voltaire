import { BrandedBlob as BlobNamespace } from '@tevm/voltaire'

/**
 * Checks if a Uint8Array is a valid blob (exactly 131072 bytes).
 * Pure function - never throws.
 * 
 * @param blob - The bytes to validate
 * @returns true if valid blob size, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * 
 * if (Blob.isValid(data)) {
 *   // data is 128KB
 * }
 * ```
 * 
 * @since 0.0.1
 */
export const isValid = (blob: Uint8Array): boolean => BlobNamespace.isValid(blob)
