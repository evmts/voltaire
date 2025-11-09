/**
 * Ens Module - Ox-based Implementation
 *
 * This module provides ENS (Ethereum Name Service) utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Hashing functions
	labelhash,
	namehash,
	// Normalization
	normalize,
	// Types
	type Ens,
} from "ox/Ens";

// ============================================================================
// Voltaire Extensions (Additional utilities not in Ox)
// ============================================================================

export { beautify, from, is, toString } from "./BrandedEns/index.js";
export type { BrandedEns } from "./BrandedEns/BrandedEns.js";

// ============================================================================
// Error Exports
// ============================================================================

export * from "./BrandedEns/errors.js";

// ============================================================================
// Namespace Export
// ============================================================================

// Provide all exports as a namespace for convenience
export * as BrandedEns from "./BrandedEns/index.js";
