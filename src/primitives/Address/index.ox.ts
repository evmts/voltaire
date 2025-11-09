/**
 * Address Module - Ox-based Implementation
 *
 * This module provides Ethereum address utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	from,
	fromPublicKey,
	checksum,
	// Validators
	validate,
	assert,
	// Comparison
	isEqual,
	// Types
	type Address,
} from "ox/Address";

// ============================================================================
// Voltaire Extensions (Functions missing in Ox)
// ============================================================================

export {
	isZero,
	toLowercase,
	toUppercase,
	toU256,
	toShortHex,
	sortAddresses,
	deduplicateAddresses,
	compare,
	lessThan,
	greaterThan,
	toBytes,
	fromBytes,
	fromPrivateKey,
	clone,
	calculateCreateAddress,
	calculateCreate2Address,
} from "./BrandedAddress/index.js";

// ============================================================================
// Compatibility Aliases (Minor naming differences)
// ============================================================================

// Ox uses `isEqual`, Voltaire historically used `equals`
export { isEqual as equals } from "ox/Address";

// Ox's `checksum` is Voltaire's `toChecksummed` - already exported from Ox
export { checksum as toChecksummed } from "ox/Address";

// ============================================================================
// Ox wrapper extensions for better compatibility
// ============================================================================

import * as OxAddressModule from "ox/Address";
import type { Address as AddressType } from "ox";

/**
 * Convert address to hex string (checksummed)
 * Alias for checksum() for compatibility
 */
export function toHex(address: AddressType): AddressType {
	return OxAddressModule.checksum(address);
}

/**
 * Check if address is valid
 * Returns boolean instead of throwing
 */
export function isValid(address: unknown): address is AddressType {
	if (typeof address !== "string") return false;
	try {
		OxAddressModule.validate(address);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if checksum is valid
 */
export function isValidChecksum(address: AddressType): boolean {
	try {
		OxAddressModule.validate(address);
		return address === OxAddressModule.checksum(address);
	} catch {
		return false;
	}
}
