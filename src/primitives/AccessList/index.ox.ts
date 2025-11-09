/**
 * AccessList Module - Ox-based Implementation
 *
 * This module provides EIP-2930 access list utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	fromTupleList,
	// Converters
	toTupleList,
	// Errors
	InvalidStorageKeySizeError,
	// Types
	type AccessList,
	type Item,
	type ItemTuple,
	type Tuple,
} from "ox/AccessList";

// ============================================================================
// Voltaire Extensions (Functions not in Ox)
// ============================================================================

// The following Voltaire AccessList functions are NOT in Ox and should be kept:
// - from() - Constructor from various formats
// - fromBytes() - Constructor from bytes
// - is() - Type guard
// - isItem() - Item type guard
// - create() - Factory function
// - merge() - Merge multiple access lists
// - gasCost() - Calculate gas cost
// - gasSavings() - Calculate gas savings
// - hasSavings() - Check if has savings
// - includesAddress() - Check if address is in list
// - includesStorageKey() - Check if storage key is in list
// - keysFor() - Get storage keys for address
// - assertValid() - Validate access list
// - toBytes() - Convert to bytes
// - addressCount() - Count addresses
// - storageKeyCount() - Count storage keys
// - isEmpty() - Check if empty
// - deduplicate() - Remove duplicates
// - withAddress() - Add address
// - withStorageKey() - Add storage key
// - Constants: ADDRESS_COST, STORAGE_KEY_COST, etc.

export {
	from,
	fromBytes,
	is,
	isItem,
	create,
	merge,
	gasCost,
	gasSavings,
	hasSavings,
	includesAddress,
	includesStorageKey,
	keysFor,
	assertValid,
	toBytes,
	addressCount,
	storageKeyCount,
	isEmpty,
	deduplicate,
	withAddress,
	withStorageKey,
	type BrandedAccessList,
} from "./BrandedAccessList/index.js";

export {
	ADDRESS_COST,
	STORAGE_KEY_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	WARM_STORAGE_ACCESS_COST,
} from "./BrandedAccessList/constants.js";
