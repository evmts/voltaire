import { BeaconBlockRoot } from '@tevm/voltaire'

type BeaconBlockRootType = BeaconBlockRoot.BeaconBlockRootType

/**
 * Converts a BeaconBlockRoot to hex string.
 * Pure function - never throws.
 * 
 * @param root - The beacon block root to convert
 * @returns 66-character hex string (0x + 64 hex chars)
 * 
 * @example
 * ```typescript
 * import * as BeaconBlockRoot from 'voltaire-effect/primitives/BeaconBlockRoot'
 * 
 * const hex = BeaconBlockRoot.toHex(root)
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (root: BeaconBlockRootType): string => BeaconBlockRoot.toHex(root)
