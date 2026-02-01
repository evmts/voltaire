/**
 * @module AccessList
 * @description Effect Schemas and functions for EIP-2930 access lists.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * function buildTx(accessList: AccessList.BrandedAccessList) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `AccessList.Rpc` | JSON-RPC format | BrandedAccessList | Decodes from RPC format |
 *
 * ## Constructors
 *
 * ```typescript
 * AccessList.create()             // BrandedAccessList (pure)
 * AccessList.from(value)          // Effect<BrandedAccessList, Error>
 * AccessList.fromBytes(bytes)     // Effect<BrandedAccessList, Error>
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * AccessList.is(value)            // type guard
 * AccessList.isItem(value)        // type guard
 * AccessList.isEmpty(list)        // boolean
 * AccessList.addressCount(list)   // number
 * AccessList.storageKeyCount(list) // number
 * AccessList.includesAddress(list, addr) // boolean
 * AccessList.includesStorageKey(list, addr, key) // boolean
 * AccessList.keysFor(list, addr)  // readonly HashType[] | undefined
 * AccessList.gasCost(list)        // bigint
 * AccessList.gasSavings(list)     // bigint
 * AccessList.hasSavings(list)     // boolean
 * AccessList.deduplicate(list)    // BrandedAccessList
 * AccessList.merge(...lists)      // BrandedAccessList
 * AccessList.toBytes(list)        // Uint8Array
 * AccessList.withAddress(list, addr) // BrandedAccessList
 * AccessList.withStorageKey(list, addr, key) // BrandedAccessList
 * ```
 *
 * ## Effectful Functions
 *
 * ```typescript
 * AccessList.assertValid(list)    // Effect<void, AssertValidError>
 * ```
 *
 * @since 0.1.0
 */

// Re-export types from voltaire
export type { BrandedAccessList, Item } from "@tevm/voltaire/AccessList";
export { AccessListTypeSchema } from "./AccessListTypeSchema.js";

// Re-export errors from voltaire
export {
  InvalidFormatError,
  InvalidLengthError,
  DecodingError,
} from "@tevm/voltaire/errors";

// Schemas
export { Rpc, type AccessListInput, type AccessListItemInput } from "./Rpc.js";

// Constructors
export { create } from "./create.js";
export { from } from "./from.js";
export { fromBytes } from "./fromBytes.js";

// Pure functions - type guards
export { is } from "./is.js";
export { isItem } from "./isItem.js";

// Pure functions - queries
export { isEmpty } from "./isEmpty.js";
export { addressCount } from "./addressCount.js";
export { storageKeyCount } from "./storageKeyCount.js";
export { includesAddress } from "./includesAddress.js";
export { includesStorageKey } from "./includesStorageKey.js";
export { keysFor } from "./keysFor.js";

// Pure functions - gas calculations
export { gasCost } from "./gasCost.js";
export { gasSavings } from "./gasSavings.js";
export { hasSavings } from "./hasSavings.js";

// Pure functions - transformations
export { deduplicate } from "./deduplicate.js";
export { merge } from "./merge.js";
export { toBytes } from "./toBytes.js";
export { withAddress } from "./withAddress.js";
export { withStorageKey } from "./withStorageKey.js";

// Effectful functions
export { assertValid } from "./assertValid.js";

// Re-export constants from voltaire
export {
  ADDRESS_COST,
  STORAGE_KEY_COST,
  COLD_ACCOUNT_ACCESS_COST,
  COLD_STORAGE_ACCESS_COST,
  WARM_STORAGE_ACCESS_COST,
} from "@tevm/voltaire/AccessList";
